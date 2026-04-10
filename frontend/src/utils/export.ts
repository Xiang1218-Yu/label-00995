/**
 * 导出工具函数
 * 提供CSV、Excel等多种格式的导出能力
 */
import * as XLSX from 'xlsx'

/**
 * 导出数据为 CSV 文件
 * @param data - 要导出的数据数组
 * @param filename - 文件名前缀（不含扩展名）
 */
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().getTime()}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * 导出单工作表 Excel 文件
 * @param data - 要导出的数据数组
 * @param sheetName - 工作表名称
 * @param filename - 文件名前缀（不含扩展名）
 */
export function exportToExcel(
  data: Record<string, any>[],
  sheetName: string,
  filename: string
): void {
  if (data.length === 0) return

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}_${new Date().getTime()}.xlsx`)
}

/**
 * 导出多工作表 Excel 文件
 * 支持在一个Excel文件中包含多个工作表，适用于汇总类导出
 * @param sheets - 工作表配置数组，包含名称和对应数据
 * @param sheets[].name - 工作表名称
 * @param sheets[].data - 工作表数据
 * @param filename - 文件名前缀（不含扩展名）
 */
export function exportToExcelWithSheets(
  sheets: { name: string; data: Record<string, any>[] }[],
  filename: string
): void {
  const wb = XLSX.utils.book_new()
  
  sheets.forEach(sheet => {
    if (sheet.data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(sheet.data)
      XLSX.utils.book_append_sheet(wb, ws, sheet.name)
    }
  })
  
  XLSX.writeFile(wb, `${filename}_${new Date().getTime()}.xlsx`)
}

/**
 * 月度汇总数据项类型
 */
export interface MonthlySummaryItem {
  月份: string
  汇款次数: number
  总金额: string
  关联项目数: number
}

/**
 * 项目月度汇总数据项类型
 */
export interface ProjectMonthlySummaryItem {
  月份: string
  项目名称: string
  汇款次数: number
  项目金额: string
}

/**
 * 计算并生成月度汇总数据
 * 按月份维度统计汇款数据，同时统计各项目的月度汇款情况
 * @param remittanceList - 汇款数据列表
 * @param getProjectNameFn - 获取项目名称的函数
 * @returns 包含月度汇总和项目月度汇总的数据对象
 */
export function calculateMonthlySummary<T extends { date: string; projectId: string; amount: number }>(
  remittanceList: T[],
  getProjectNameFn: (projectId: string) => string
): {
  monthlySummary: MonthlySummaryItem[]
  projectMonthlySummary: ProjectMonthlySummaryItem[]
} {
  const monthlyDataMap = new Map<string, {
    totalAmount: number
    count: number
    projects: Map<string, { amount: number; count: number; name: string }>
  }>()

  remittanceList.forEach(item => {
    const month = item.date.substring(0, 7)
    const projectName = getProjectNameFn(item.projectId)

    if (!monthlyDataMap.has(month)) {
      monthlyDataMap.set(month, {
        totalAmount: 0,
        count: 0,
        projects: new Map()
      })
    }

    const monthData = monthlyDataMap.get(month)!
    monthData.totalAmount += item.amount
    monthData.count += 1

    if (!monthData.projects.has(item.projectId)) {
      monthData.projects.set(item.projectId, {
        amount: 0,
        count: 0,
        name: projectName
      })
    }

    const projectData = monthData.projects.get(item.projectId)!
    projectData.amount += item.amount
    projectData.count += 1
  })

  const monthlySummary = Array.from(monthlyDataMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, data]) => ({
      月份: month,
      汇款次数: data.count,
      总金额: data.totalAmount.toFixed(2),
      关联项目数: data.projects.size
    }))

  const projectMonthlySummary: ProjectMonthlySummaryItem[] = []
  monthlyDataMap.forEach((data, month) => {
    data.projects.forEach((projectData) => {
      projectMonthlySummary.push({
        月份: month,
        项目名称: projectData.name,
        汇款次数: projectData.count,
        项目金额: projectData.amount.toFixed(2)
      })
    })
  })

  projectMonthlySummary.sort((a, b) => {
    if (b.月份 !== a.月份) {
      return b.月份.localeCompare(a.月份)
    }
    return Number(b.项目金额) - Number(a.项目金额)
  })

  return { monthlySummary, projectMonthlySummary }
}
