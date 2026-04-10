<template>
  <div class="reimbursement-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>报销管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增报销
          </el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="单号">
            <el-input
              v-model="searchForm.reimbursementNumber"
              placeholder="请输入单号"
              clearable
            />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="searchForm.type" placeholder="请选择" clearable style="width: 180px">
              <el-option label="普通报销" value="普通报销" />
              <el-option label="汇款报销" value="汇款报销" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 180px">
              <el-option label="待审核" value="待审核" />
              <el-option label="已通过" value="已通过" />
              <el-option label="已驳回" value="已驳回" />
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
                  <el-dropdown-item command="monthlySummary">月度支出汇总导出</el-dropdown-item>
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
        <el-table-column prop="reimbursementNumber" label="单号" min-width="180" />
        <el-table-column prop="applicant" label="申请人" min-width="120" />
        <el-table-column prop="type" label="类型" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === '普通报销' ? 'primary' : 'success'">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" min-width="150" sortable>
          <template #default="{ row }">
            ¥{{ row.amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="projectId" label="关联项目" min-width="150">
          <template #default="{ row }">
            {{ getProjectName(row.projectId) }}
          </template>
        </el-table-column>
        <el-table-column label="审批进度" min-width="150">
          <template #default="{ row }">
            {{ row.approvalHistory.length }}/3
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status === '待审核'"
              type="success"
              link
              size="small"
              @click="handleApprove(row)"
            >
              审批
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
import { useReimbursementStore } from '@/stores/reimbursement'
import { useProjectStore } from '@/stores/project'
import type { Reimbursement } from '@/types'
import dayjs from 'dayjs'
import { exportToCSV, exportToExcelWithSheets } from '@/utils/export'

const router = useRouter()
const reimbursementStore = useReimbursementStore()
const projectStore = useProjectStore()

const loading = ref(false)

const searchForm = reactive({
  reimbursementNumber: '',
  type: '',
  status: ''
})

const appliedSearch = reactive({
  reimbursementNumber: '',
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const filteredData = computed(() => {
  let data = reimbursementStore.allReimbursements

  if (appliedSearch.reimbursementNumber) {
    data = data.filter(item =>
      item.reimbursementNumber.includes(appliedSearch.reimbursementNumber)
    )
  }

  if (appliedSearch.type) {
    data = data.filter(item => item.type === appliedSearch.type)
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
    已驳回: 'danger'
  }
  return map[status] || 'info'
}

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
  searchForm.reimbursementNumber = ''
  searchForm.type = ''
  searchForm.status = ''
  appliedSearch.reimbursementNumber = ''
  appliedSearch.type = ''
  appliedSearch.status = ''
  pagination.page = 1
  pagination.total = filteredData.value.length
}

function handleAdd(): void {
  router.push('/reimbursement/add')
}

function handleDetail(row: Reimbursement): void {
  router.push(`/reimbursement/detail/${row.id}`)
}

function handleApprove(row: Reimbursement): void {
  router.push(`/reimbursement/detail/${row.id}`)
}

function handleDelete(row: Reimbursement): void {
  ElMessageBox.confirm('确定要删除这条报销记录吗？', '提示', {
    type: 'warning'
  }).then(() => {
    reimbursementStore.deleteReimbursement(row.id)
    ElMessage.success('删除成功')
    handleSearch()
  }).catch(() => {})
}

function handleSizeChange(size: number): void {
  pagination.size = size
  pagination.page = 1
}

function handlePageChange(page: number): void {
  pagination.page = page
}

function calculateMonthlySummary(): Record<string, any>[] {
  const monthlyData: Record<string, { total: number; count: number }> = {}

  reimbursementStore.allReimbursements.forEach(item => {
    const month = dayjs(item.createTime).format('YYYY-MM')
    if (!monthlyData[month]) {
      monthlyData[month] = { total: 0, count: 0 }
    }
    monthlyData[month].total += item.amount
    monthlyData[month].count += 1
  })

  return Object.entries(monthlyData)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, data]) => ({
      月份: month,
      报销笔数: data.count,
      支出总额: data.total.toFixed(2)
    }))
}

function calculateCategorySummary(): Record<string, any>[] {
  const categoryData: Record<string, Record<string, number>> = {}

  reimbursementStore.allReimbursements.forEach(item => {
    const month = dayjs(item.createTime).format('YYYY-MM')
    const type = item.type
    if (!categoryData[month]) {
      categoryData[month] = {}
    }
    if (!categoryData[month][type]) {
      categoryData[month][type] = 0
    }
    categoryData[month][type] += item.amount
  })

  const allTypes = [...new Set(reimbursementStore.allReimbursements.map(item => item.type))]

  return Object.entries(categoryData)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, types]) => {
      const row: Record<string, any> = { 月份: month }
      allTypes.forEach(type => {
        row[type] = types[type]?.toFixed(2) || '0.00'
      })
      return row
    })
}

function handleExport(type: string): void {
  if (type === 'monthlySummary') {
    const monthlySummary = calculateMonthlySummary()
    const categorySummary = calculateCategorySummary()

    exportToExcelWithSheets(
      [
        { name: '月度支出汇总', data: monthlySummary },
        { name: '按类型分类月度汇总', data: categorySummary }
      ],
      '月度支出汇总报表'
    )
    ElMessage.success('月度汇总报表导出成功')
    return
  }

  const data = filteredData.value.map(item => ({
    单号: item.reimbursementNumber,
    申请人: item.applicant,
    类型: item.type,
    金额: item.amount,
    状态: item.status,
    关联项目: getProjectName(item.projectId),
    说明: item.description
  }))

  if (type === 'csv') {
    exportToCSV(data, '报销列表')
    ElMessage.success('CSV导出成功')
  } else {
    exportToExcelWithSheets([{ name: '报销列表', data }], '报销列表')
    ElMessage.success('Excel导出成功')
  }
}

onMounted(() => {
  reimbursementStore.initReimbursements()
  projectStore.initProjects()
  pagination.total = filteredData.value.length
})
</script>

<style scoped lang="css">
.reimbursement-list {
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

  .reimbursement-list :deep(.el-card__body) {
    padding: 12px;
    overflow-x: auto;
  }

  .reimbursement-list :deep(.el-table) {
    font-size: 13px;
    min-width: 600px;
  }
}

@media screen and (max-width: 480px) {
  .reimbursement-list :deep(.el-card__body) {
    padding: 10px;
  }

  .reimbursement-list :deep(.el-table) {
    font-size: 12px;
    min-width: 500px;
  }
}
</style>
