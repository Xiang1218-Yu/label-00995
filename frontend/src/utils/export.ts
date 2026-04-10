import * as XLSX from 'xlsx'
import dayjs from 'dayjs'

/**
 * 导出工具函数
 */

/**
 * 月度支出汇总项
 */
interface MonthlySummary {
  月份: string
  总支出: number
  笔数: number
  平均单笔金额: number
  最大单笔金额: number
}

/**
 * 分类月度汇总项
 */
interface CategoryMonthlySummary {
  支出类型: string
  月份: string
  金额: number
  笔数: number
}

/**
 * 导出数据为 CSV 文件
 * @param data 数据数组
 * @param filename 文件名（不含扩展名）
 */
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // 处理包含逗号、引号或换行的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      }).join(',')
    )
  ].join('\n')

  // 添加 BOM 以支持中文
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().getTime()}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export interface ExpenseItem {
  amount: number
  category: string
  date: string
  status?: string
}

export function exportMonthlyExpenseSummary(expenses: ExpenseItem[], filename: string = '月度支出汇总'): void {
  if (expenses.length === 0) {
    return
  }

  const monthlyData: Record<string, MonthlySummary> = {}
  const categoryMonthlyData: Record<string, CategoryMonthlySummary & { _category: string; _month: string }> = {}

  expenses.forEach(expense => {
    const month = dayjs(expense.date).format('YYYY-MM')
    const category = expense.category
    const amount = expense.amount

    if (!monthlyData[month]) {
      monthlyData[month] = {
        月份: month,
        总支出: 0,
        笔数: 0,
        平均单笔金额: 0,
        最大单笔金额: 0
      }
    }
    monthlyData[month].总支出 += amount
    monthlyData[month].笔数 += 1
    if (amount > monthlyData[month].最大单笔金额) {
      monthlyData[month].最大单笔金额 = amount
    }

    const categoryKey = `${category}_${month}`
    if (!categoryMonthlyData[categoryKey]) {
      categoryMonthlyData[categoryKey] = {
        _category: category,
        _month: month,
        支出类型: category,
        月份: month,
        金额: 0,
        笔数: 0
      }
    }
    categoryMonthlyData[categoryKey].金额 += amount
    categoryMonthlyData[categoryKey].笔数 += 1
  })

  Object.keys(monthlyData).forEach(month => {
    monthlyData[month].平均单笔金额 = monthlyData[month].总支出 / monthlyData[month].笔数
  })

  const monthlySummarySheetData = Object.values(monthlyData).sort((a, b) => b.月份.localeCompare(a.月份)).map(item => ({
    月份: item.月份,
    总支出: Number(item.总支出.toFixed(2)),
    笔数: item.笔数,
    平均单笔金额: Number(item.平均单笔金额.toFixed(2)),
    最大单笔金额: Number(item.最大单笔金额.toFixed(2))
  }))

  const categoryMonthlySheetData = Object.values(categoryMonthlyData)
    .sort((a, b) => b.月份.localeCompare(a.月份) || a.支出类型.localeCompare(b.支出类型))
    .map(item => ({
      支出类型: item.支出类型,
      月份: item.月份,
      金额: Number(item.金额.toFixed(2)),
      笔数: item.笔数
    }))

  const ws1 = XLSX.utils.json_to_sheet(monthlySummarySheetData)
  const ws2 = XLSX.utils.json_to_sheet(categoryMonthlySheetData)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws1, '月度支出汇总')
  XLSX.utils.book_append_sheet(wb, ws2, '按支出类型分类汇总')

  const colWidths1 = [{ wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }]
  const colWidths2 = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 }]
  ws1['!cols'] = colWidths1
  ws2['!cols'] = colWidths2

  XLSX.writeFile(wb, `${filename}_${new Date().getTime()}.xlsx`)
}
