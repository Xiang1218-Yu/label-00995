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
import { useSalaryStore } from '@/stores/salary'
import type { SalaryPayment } from '@/types'
import dayjs from 'dayjs'

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
  ElMessage.success('打印功能已模拟，实际项目中需要调用打印接口')
  // 实际项目中可以打开新窗口打印
  // window.print()
}

function handleSizeChange(size: number): void {
  pagination.size = size
  pagination.page = 1
}

function handlePageChange(page: number): void {
  pagination.page = page
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
</style>
