/**
 * 导出工具函数
 */

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
