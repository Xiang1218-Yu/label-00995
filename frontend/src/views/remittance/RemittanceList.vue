<template>
  <div class="remittance-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>汇款申请管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增汇款
          </el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="汇款单位">
            <el-input
              v-model="searchForm.company"
              placeholder="请输入汇款单位"
              clearable
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 180px">
              <el-option label="待报销" value="待报销" />
              <el-option label="已报销" value="已报销" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-dropdown @command="handleExport" style="margin-left: 12px">
              <el-button>
                导出<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="excel">导出 Excel</el-dropdown-item>
                  <el-dropdown-item command="csv">导出 CSV</el-dropdown-item>
                  <el-dropdown-item command="monthlySummary">月度支出汇总</el-dropdown-item>
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
        <el-table-column prop="company" label="汇款单位" min-width="200" />
        <el-table-column prop="amount" label="金额" min-width="150" sortable>
          <template #default="{ row }">
            ¥{{ row.amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="purpose" label="用途" min-width="200" />
        <el-table-column prop="date" label="日期" min-width="120" sortable />
        <el-table-column prop="projectId" label="关联项目" min-width="150">
          <template #default="{ row }">
            {{ getProjectName(row.projectId) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已报销' ? 'success' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              type="success"
              link
              size="small"
              :disabled="row.status === '已报销'"
              @click="handleReimburse(row)"
            >
              用于报销
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
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
import { useRemittanceStore } from '@/stores/remittance'
import { useProjectStore } from '@/stores/project'
import type { Remittance } from '@/types'
import * as XLSX from 'xlsx'
import { exportToCSV } from '@/utils/export'

const router = useRouter()
const remittanceStore = useRemittanceStore()
const projectStore = useProjectStore()

const loading = ref(false)

const searchForm = reactive({
  company: '',
  status: ''
})

const appliedSearch = reactive({
  company: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const filteredData = computed(() => {
  let data = remittanceStore.allRemittances

  if (appliedSearch.company) {
    data = data.filter(item =>
      item.company.includes(appliedSearch.company)
    )
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

function getProjectName(projectId: string): string {
  const project = projectStore.getProjectById(projectId)
  return project?.name || projectId
}

function handleSearch(): void {
  Object.assign(appliedSearch, searchForm)
  pagination.page = 1
  pagination.total = filteredData.value.length
}

function handleReset(): void {
  searchForm.company = ''
  searchForm.status = ''
  appliedSearch.company = ''
  appliedSearch.status = ''
  pagination.page = 1
  pagination.total = filteredData.value.length
}

function handleAdd(): void {
  router.push('/remittance/add')
}

function handleEdit(row: Remittance): void {
  router.push(`/remittance/edit/${row.id}`)
}

function handleDelete(row: Remittance): void {
  ElMessageBox.confirm('确定要删除这条汇款记录吗？', '提示', {
    type: 'warning'
  }).then(() => {
    remittanceStore.deleteRemittance(row.id)
    ElMessage.success('删除成功')
    handleSearch()
  }).catch(() => {})
}

function handleReimburse(row: Remittance): void {
  router.push({
    path: '/reimbursement/add',
    query: { remittanceId: row.id, type: '汇款报销' }
  })
}

function handleSizeChange(size: number): void {
  pagination.size = size
  pagination.page = 1
}

function handlePageChange(page: number): void {
  pagination.page = page
}

function handleExport(type: string): void {
  const data = filteredData.value.map(item => ({
    汇款单位: item.company,
    金额: item.amount,
    用途: item.purpose,
    日期: item.date,
    关联项目: getProjectName(item.projectId),
    状态: item.status
  }))

  if (type === 'csv') {
    exportToCSV(data, '汇款列表')
    ElMessage.success('CSV导出成功')
  } else if (type === 'monthlySummary') {
    exportMonthlySummary()
  } else {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '汇款列表')
    XLSX.writeFile(wb, `汇款列表_${new Date().getTime()}.xlsx`)
    ElMessage.success('Excel导出成功')
  }
}

function exportMonthlySummary(): void {
  const monthlyData = aggregateByMonth(filteredData.value)
  const projectMonthlyData = aggregateByProjectAndMonth(filteredData.value)
  
  const ws1 = XLSX.utils.json_to_sheet(monthlyData)
  const ws2 = XLSX.utils.json_to_sheet(projectMonthlyData)
  const wb = XLSX.utils.book_new()
  
  XLSX.utils.book_append_sheet(wb, ws1, '月度支出汇总')
  XLSX.utils.book_append_sheet(wb, ws2, '项目月度汇总')
  XLSX.writeFile(wb, `月度支出汇总_${new Date().getTime()}.xlsx`)
  
  ElMessage.success('月度支出汇总导出成功')
}

function aggregateByMonth(data: Remittance[]): Array<{ 月份: string, 汇款笔数: number, 总支出: number, 已报销笔数: number, 已报销: number, 待报销笔数: number, 待报销: number }> {
  const monthMap = new Map<string, { count: number, total: number, reimbursedCount: number, reimbursed: number, pendingCount: number, pending: number }>()
  
  data.forEach(item => {
    const month = item.date.substring(0, 7)
    const existing = monthMap.get(month) || { count: 0, total: 0, reimbursedCount: 0, reimbursed: 0, pendingCount: 0, pending: 0 }
    
    existing.count++
    existing.total += item.amount
    if (item.status === '已报销') {
      existing.reimbursedCount++
      existing.reimbursed += item.amount
    } else {
      existing.pendingCount++
      existing.pending += item.amount
    }
    
    monthMap.set(month, existing)
  })
  
  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, stats]) => ({
      月份: month,
      汇款笔数: stats.count,
      总支出: parseFloat(stats.total.toFixed(2)),
      已报销笔数: stats.reimbursedCount,
      已报销: parseFloat(stats.reimbursed.toFixed(2)),
      待报销笔数: stats.pendingCount,
      待报销: parseFloat(stats.pending.toFixed(2))
    }))
}

function aggregateByProjectAndMonth(data: Remittance[]): Array<{ 项目名称: string, 月份: string, 汇款笔数: number, 总支出: number, 已报销笔数: number, 已报销: number, 待报销笔数: number, 待报销: number }> {
  const projMonthMap = new Map<string, { projectName: string, month: string, count: number, total: number, reimbursedCount: number, reimbursed: number, pendingCount: number, pending: number }>()
  
  data.forEach(item => {
    const projectName = getProjectName(item.projectId)
    const month = item.date.substring(0, 7)
    const key = `${projectName}_${month}`
    const existing = projMonthMap.get(key) || { 
      projectName, 
      month, 
      count: 0,
      total: 0, 
      reimbursedCount: 0,
      reimbursed: 0, 
      pendingCount: 0,
      pending: 0 
    }
    
    existing.count++
    existing.total += item.amount
    if (item.status === '已报销') {
      existing.reimbursedCount++
      existing.reimbursed += item.amount
    } else {
      existing.pendingCount++
      existing.pending += item.amount
    }
    
    projMonthMap.set(key, existing)
  })
  
  return Array.from(projMonthMap.values())
    .sort((a, b) => a.projectName.localeCompare(b.projectName) || a.month.localeCompare(b.month))
    .map(item => ({
      项目名称: item.projectName,
      月份: item.month,
      汇款笔数: item.count,
      总支出: parseFloat(item.total.toFixed(2)),
      已报销笔数: item.reimbursedCount,
      已报销: parseFloat(item.reimbursed.toFixed(2)),
      待报销笔数: item.pendingCount,
      待报销: parseFloat(item.pending.toFixed(2))
    }))
}

onMounted(() => {
  remittanceStore.initRemittances()
  projectStore.initProjects()
  pagination.total = filteredData.value.length
})
</script>

<style scoped lang="css">
.remittance-list {
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

/* 响应式样式 */
@media screen and (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .card-header .el-button {
    width: 100%;
  }

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

  .remittance-list :deep(.el-card__body) {
    padding: 12px;
    overflow-x: auto;
  }

  .remittance-list :deep(.el-table) {
    font-size: 13px;
    min-width: 600px;
  }
}

@media screen and (max-width: 480px) {
  .remittance-list :deep(.el-card__body) {
    padding: 10px;
  }

  .remittance-list :deep(.el-table) {
    font-size: 12px;
    min-width: 500px;
  }
}
</style>
