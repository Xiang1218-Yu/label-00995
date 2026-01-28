<template>
  <div class="payment-list">
    <el-card>
      <template #header>
        <span>薪酬发放管理</span>
      </template>

      <div class="search-bar">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="月份">
            <el-date-picker
              v-model="searchForm.month"
              type="month"
              placeholder="请选择月份"
              value-format="YYYY-MM"
              clearable
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 180px">
              <el-option label="待发放" value="待发放" />
              <el-option label="已发放" value="已发放" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-dropdown @command="handleExportAll" style="margin-left: 12px">
              <el-button>
                导出<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="excel">导出 Excel</el-dropdown-item>
                  <el-dropdown-item command="csv">导出 CSV</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        :data="tableData"
        style="width: 100%"
        v-loading="loading"
        table-layout="auto"
      >
        <el-table-column prop="month" label="月份" min-width="120" />
        <el-table-column prop="totalAmount" label="总金额" min-width="150" sortable>
          <template #default="{ row }">
            ¥{{ row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="employeeCount" label="员工数" min-width="100" />
        <el-table-column prop="status" label="状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '已发放' ? 'success' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentTime" label="发放时间" min-width="180">
          <template #default="{ row }">
            {{ row.paymentTime ? formatDate(row.paymentTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="250" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === '待发放'"
              type="primary"
              link
              size="small"
              @click="handleConfirm(row)"
            >
              确认发放
            </el-button>
            <el-button type="success" link size="small" @click="handleView(row)">
              查看明细
            </el-button>
            <el-button type="warning" link size="small" @click="handlePrint(row)">
              打印工资条
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 工资条详情对话框 -->
    <el-dialog
      v-model="showSalaryDialog"
      title="工资条详情"
      width="800px"
    >
      <div v-if="selectedPayment && declaration">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="月份">{{ declaration.month }}</el-descriptions-item>
          <el-descriptions-item label="总金额">¥{{ declaration.totalAmount.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="员工数">{{ declaration.employees.length }}人</el-descriptions-item>
          <el-descriptions-item label="发放时间">
            {{ selectedPayment.paymentTime ? formatDate(selectedPayment.paymentTime) : '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-table :data="declaration.employees" style="width: 100%; margin-top: 20px" table-layout="auto">
          <el-table-column prop="name" label="姓名" min-width="120" />
          <el-table-column prop="department" label="部门" min-width="150" />
          <el-table-column prop="baseSalary" label="基本工资" min-width="150">
            <template #default="{ row }">
              ¥{{ row.baseSalary.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="performance" label="绩效" min-width="150">
            <template #default="{ row }">
              ¥{{ row.performance.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="deduction" label="扣款" min-width="150">
            <template #default="{ row }">
              ¥{{ row.deduction.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="total" label="合计" min-width="150">
            <template #default="{ row }">
              <span style="font-weight: bold">¥{{ row.total.toFixed(2) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useSalaryStore } from '@/stores/salary'
import type { SalaryPayment } from '@/types'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { exportToCSV } from '@/utils/export'

const salaryStore = useSalaryStore()

const loading = ref(false)
const showSalaryDialog = ref(false)
const selectedPayment = ref<SalaryPayment | null>(null)

const searchForm = reactive({
  month: '',
  status: ''
})

const appliedSearch = reactive({
  month: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const filteredData = computed(() => {
  let data = salaryStore.allPayments

  if (appliedSearch.month) {
    data = data.filter(item => item.month === appliedSearch.month)
  }

  if (appliedSearch.status) {
    data = data.filter(item => item.status === appliedSearch.status)
  }

  return data
})

const tableData = computed(() => {
  const start = (pagination.page - 1) * pagination.size
  const end = start + pagination.size
  return filteredData.value.slice(start, end)
})

const declaration = computed(() => {
  if (selectedPayment.value) {
    return salaryStore.getDeclarationById(selectedPayment.value.declarationId)
  }
  return null
})

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

function handleSearch(): void {
  Object.assign(appliedSearch, searchForm)
  pagination.page = 1
  pagination.total = filteredData.value.length
}

function handleReset(): void {
  searchForm.month = ''
  searchForm.status = ''
  appliedSearch.month = ''
  appliedSearch.status = ''
  pagination.page = 1
  pagination.total = filteredData.value.length
}

function handleConfirm(row: SalaryPayment): void {
  ElMessageBox.confirm('确定要确认发放这笔薪酬吗？', '提示', {
    type: 'warning'
  }).then(() => {
    salaryStore.confirmPayment(row.id)
    ElMessage.success('发放成功')
    handleSearch()
  }).catch(() => {})
}

function handleView(row: SalaryPayment): void {
  selectedPayment.value = row
  showSalaryDialog.value = true
}

function handlePrint(row: SalaryPayment): void {
  const dec = salaryStore.getDeclarationById(row.declarationId)
  if (!dec) {
    ElMessage.error('未找到申报数据')
    return
  }

  // 生成打印内容
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>工资条 - ${dec.month}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #333; }
        .info { margin-bottom: 20px; }
        .info p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f5f7fa; }
        .total { font-weight: bold; }
        .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #999; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>工资条</h1>
      <div class="info">
        <p><strong>月份：</strong>${dec.month}</p>
        <p><strong>总金额：</strong>¥${dec.totalAmount.toFixed(2)}</p>
        <p><strong>员工数：</strong>${dec.employees.length}人</p>
        <p><strong>发放时间：</strong>${row.paymentTime ? formatDate(row.paymentTime) : '待发放'}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>部门</th>
            <th>基本工资</th>
            <th>绩效</th>
            <th>扣款</th>
            <th>合计</th>
          </tr>
        </thead>
        <tbody>
          ${dec.employees.map(emp => `
            <tr>
              <td>${emp.name}</td>
              <td>${emp.department}</td>
              <td>¥${emp.baseSalary.toFixed(2)}</td>
              <td>¥${emp.performance.toFixed(2)}</td>
              <td>¥${emp.deduction.toFixed(2)}</td>
              <td class="total">¥${emp.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        打印时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}
      </div>
    </body>
    </html>
  `

  // 打开新窗口打印
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  } else {
    ElMessage.error('无法打开打印窗口，请检查浏览器设置')
  }
}

function handleSizeChange(size: number): void {
  pagination.size = size
  pagination.page = 1
}

function handlePageChange(page: number): void {
  pagination.page = page
}

function handleExportAll(type: string): void {
  const data = filteredData.value.map(item => ({
    月份: item.month,
    总金额: item.totalAmount,
    员工数: item.employeeCount,
    状态: item.status,
    发放时间: item.paymentTime ? formatDate(item.paymentTime) : '-'
  }))

  if (type === 'csv') {
    exportToCSV(data, '薪酬发放列表')
    ElMessage.success('CSV导出成功')
  } else {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '薪酬发放')
    XLSX.writeFile(wb, `薪酬发放列表_${new Date().getTime()}.xlsx`)
    ElMessage.success('Excel导出成功')
  }
}

onMounted(() => {
  salaryStore.initSalary()
  
  // 自动为已通过的申报创建发放记录
  const declarations = salaryStore.allDeclarations.filter(
    dec => dec.status === '已通过'
  )
  declarations.forEach(dec => {
    const existingPayment = salaryStore.allPayments.find(
      p => p.declarationId === dec.id
    )
    if (!existingPayment) {
      salaryStore.addPayment(dec.id)
    }
  })
  
  pagination.total = filteredData.value.length
})
</script>

<style scoped lang="css">
.payment-list {
  padding: 0;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 响应式样式 */
@media screen and (max-width: 768px) {
  .search-bar :deep(.el-form--inline) {
    display: flex;
    flex-direction: column;
  }

  .search-bar :deep(.el-form--inline .el-form-item) {
    width: 100%;
    margin-right: 0;
    margin-bottom: 12px;
  }

  .search-bar :deep(.el-form-item__content) {
    width: 100%;
  }

  .search-bar :deep(.el-input),
  .search-bar :deep(.el-select) {
    width: 100% !important;
  }

  .search-bar :deep(.el-form-item:last-child) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pagination {
    justify-content: center;
  }

  .pagination :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }

  .payment-list :deep(.el-card__body) {
    padding: 12px;
    overflow-x: auto;
  }

  .payment-list :deep(.el-table) {
    font-size: 13px;
    min-width: 600px;
  }
}

@media screen and (max-width: 480px) {
  .payment-list :deep(.el-card__body) {
    padding: 10px;
  }

  .payment-list :deep(.el-table) {
    font-size: 12px;
    min-width: 500px;
  }
}
</style>
