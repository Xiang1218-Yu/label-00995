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
  } else {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '汇款列表')
    XLSX.writeFile(wb, `汇款列表_${new Date().getTime()}.xlsx`)
    ElMessage.success('Excel导出成功')
  }
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
</style>
