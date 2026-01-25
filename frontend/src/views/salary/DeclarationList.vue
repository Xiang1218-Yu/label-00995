<template>
  <div class="declaration-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>薪酬申报管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增申报
          </el-button>
        </div>
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
              <el-option label="待审核" value="待审核" />
              <el-option label="已通过" value="已通过" />
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
        <el-table-column prop="declarant" label="申报人" min-width="120" />
        <el-table-column prop="totalAmount" label="总金额" min-width="150" sortable>
          <template #default="{ row }">
            ¥{{ row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="员工数" min-width="100">
          <template #default="{ row }">
            {{ row.employees.length }}人
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="300" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === '待审核'"
              type="success"
              link
              size="small"
              @click="handleApprove(row)"
            >
              审批通过
            </el-button>
            <el-button
              v-if="row.status === '待审核'"
              type="danger"
              link
              size="small"
              @click="handleReject(row)"
            >
              驳回
            </el-button>
            <el-button
              v-if="row.status === '待审核'"
              type="primary"
              link
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button type="info" link size="small" @click="handleView(row)">
              查看明细
            </el-button>
            <el-button type="warning" link size="small" @click="handleExport(row)">
              导出
            </el-button>
            <el-button
              v-if="row.status === '待审核'"
              type="danger"
              link
              size="small"
              @click="handleDelete(row)"
            >
              删除
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown } from '@element-plus/icons-vue'
import { useSalaryStore } from '@/stores/salary'
import type { SalaryDeclaration } from '@/types'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { exportToCSV } from '@/utils/export'

const router = useRouter()
const salaryStore = useSalaryStore()

const loading = ref(false)

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
  let data = salaryStore.allDeclarations

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

function getStatusTagType(status: string): string {
  const map: Record<string, string> = {
    待审核: 'warning',
    已通过: 'success',
    已发放: 'info'
  }
  return map[status] || 'info'
}

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
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

function handleAdd(): void {
  router.push('/salary/declaration/add')
}

function handleEdit(row: SalaryDeclaration): void {
  router.push(`/salary/declaration/edit/${row.id}`)
}

function handleView(row: SalaryDeclaration): void {
  // 显示明细对话框
  ElMessageBox.alert(
    `<div style="max-height: 400px; overflow-y: auto;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f5f7fa;">
            <th style="padding: 8px; border: 1px solid #dcdfe6;">姓名</th>
            <th style="padding: 8px; border: 1px solid #dcdfe6;">部门</th>
            <th style="padding: 8px; border: 1px solid #dcdfe6;">基本工资</th>
            <th style="padding: 8px; border: 1px solid #dcdfe6;">绩效</th>
            <th style="padding: 8px; border: 1px solid #dcdfe6;">扣款</th>
            <th style="padding: 8px; border: 1px solid #dcdfe6;">合计</th>
          </tr>
        </thead>
        <tbody>
          ${row.employees.map(emp => `
            <tr>
              <td style="padding: 8px; border: 1px solid #dcdfe6;">${emp.name}</td>
              <td style="padding: 8px; border: 1px solid #dcdfe6;">${emp.department}</td>
              <td style="padding: 8px; border: 1px solid #dcdfe6;">¥${emp.baseSalary.toFixed(2)}</td>
              <td style="padding: 8px; border: 1px solid #dcdfe6;">¥${emp.performance.toFixed(2)}</td>
              <td style="padding: 8px; border: 1px solid #dcdfe6;">¥${emp.deduction.toFixed(2)}</td>
              <td style="padding: 8px; border: 1px solid #dcdfe6;">¥${emp.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`,
    '薪酬明细',
    {
      dangerouslyUseHTMLString: true,
      customStyle: { width: '800px' }
    }
  )
}

function handleExport(row: SalaryDeclaration): void {
  const data = row.employees.map(emp => ({
    姓名: emp.name,
    部门: emp.department,
    基本工资: emp.baseSalary,
    绩效: emp.performance,
    扣款: emp.deduction,
    合计: emp.total
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '薪酬明细')
  XLSX.writeFile(wb, `薪酬申报_${row.month}_${new Date().getTime()}.xlsx`)
  ElMessage.success('导出成功')
}

function handleDelete(row: SalaryDeclaration): void {
  ElMessageBox.confirm('确定要删除这条申报记录吗？', '提示', {
    type: 'warning'
  }).then(() => {
    salaryStore.deleteDeclaration(row.id)
    ElMessage.success('删除成功')
    handleSearch()
  }).catch(() => {})
}

function handleApprove(row: SalaryDeclaration): void {
  ElMessageBox.confirm(
    `确定要审批通过该薪酬申报吗？<br/>月份：${row.month}<br/>总金额：¥${row.totalAmount.toFixed(2)}<br/>员工数：${row.employees.length}人`,
    '审批确认',
    {
      type: 'warning',
      dangerouslyUseHTMLString: true
    }
  ).then(() => {
    salaryStore.approveDeclaration(row.id)
    ElMessage.success('审批通过，已生成发放记录')
    pagination.total = filteredData.value.length
  }).catch(() => {})
}

function handleReject(row: SalaryDeclaration): void {
  ElMessageBox.prompt('请输入驳回原因', '驳回申报', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '请输入驳回原因'
  }).then(({ value }) => {
    salaryStore.rejectDeclaration(row.id, value)
    ElMessage.success('已驳回')
    pagination.total = filteredData.value.length
  }).catch(() => {})
}

function handleExportAll(type: string): void {
  const data = filteredData.value.map(item => ({
    月份: item.month,
    申报人: item.declarant,
    总金额: item.totalAmount,
    员工数: item.employees.length,
    状态: item.status,
    创建时间: formatDate(item.createTime)
  }))

  if (type === 'csv') {
    exportToCSV(data, '薪酬申报列表')
    ElMessage.success('CSV导出成功')
  } else {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '薪酬申报')
    XLSX.writeFile(wb, `薪酬申报列表_${new Date().getTime()}.xlsx`)
    ElMessage.success('Excel导出成功')
  }
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
  pagination.total = filteredData.value.length
})
</script>

<style scoped lang="css">
.declaration-list {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
