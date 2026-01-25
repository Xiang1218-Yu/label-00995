<template>
  <div class="invoice-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>发票夹管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增发票
          </el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="发票号码">
            <el-input
              v-model="searchForm.invoiceNumber"
              placeholder="请输入发票号码"
              clearable
            />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="searchForm.type" placeholder="请选择" clearable style="width: 180px">
              <el-option label="住宿" value="住宿" />
              <el-option label="餐饮" value="餐饮" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 180px">
              <el-option label="未报销" value="未报销" />
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
        @selection-change="handleSelectionChange"
        table-layout="auto"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="invoiceNumber" label="发票号码" min-width="150" sortable />
        <el-table-column prop="invoiceDate" label="开票日期" min-width="120" sortable />
        <el-table-column prop="amount" label="金额" min-width="120" sortable>
          <template #default="{ row }">
            ¥{{ row.amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uploader" label="上传人" min-width="100" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已报销' ? 'success' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="250" fixed="right">
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
              发起报销
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
import { useInvoiceStore } from '@/stores/invoice'
import type { Invoice } from '@/types'
import * as XLSX from 'xlsx'
import { exportToCSV } from '@/utils/export'

const router = useRouter()
const invoiceStore = useInvoiceStore()

const loading = ref(false)
const selectedRows = ref<Invoice[]>([])

const searchForm = reactive({
  invoiceNumber: '',
  type: '',
  status: ''
})

const appliedSearch = reactive({
  invoiceNumber: '',
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const filteredData = computed(() => {
  let data = invoiceStore.allInvoices

  if (appliedSearch.invoiceNumber) {
    data = data.filter(item =>
      item.invoiceNumber.includes(appliedSearch.invoiceNumber)
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

function getTypeTagType(type: string): string {
  const map: Record<string, string> = {
    住宿: 'primary',
    餐饮: 'success',
    其他: 'info'
  }
  return map[type] || 'info'
}

function handleSearch(): void {
  Object.assign(appliedSearch, searchForm)
  pagination.page = 1
  pagination.total = filteredData.value.length
}

function handleReset(): void {
  searchForm.invoiceNumber = ''
  searchForm.type = ''
  searchForm.status = ''
  appliedSearch.invoiceNumber = ''
  appliedSearch.type = ''
  appliedSearch.status = ''
  pagination.page = 1
  pagination.total = filteredData.value.length
}

function handleAdd(): void {
  router.push('/invoice/add')
}

function handleEdit(row: Invoice): void {
  router.push(`/invoice/edit/${row.id}`)
}

function handleDelete(row: Invoice): void {
  ElMessageBox.confirm('确定要删除这条发票记录吗？', '提示', {
    type: 'warning'
  }).then(() => {
    invoiceStore.deleteInvoice(row.id)
    ElMessage.success('删除成功')
    handleSearch()
  }).catch(() => {})
}

function handleReimburse(row: Invoice): void {
  router.push({
    path: '/reimbursement/add',
    query: { invoiceIds: row.id }
  })
}

function handleSelectionChange(selection: Invoice[]): void {
  selectedRows.value = selection
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
    发票号码: item.invoiceNumber,
    开票日期: item.invoiceDate,
    金额: item.amount,
    类型: item.type,
    上传人: item.uploader,
    状态: item.status
  }))

  if (type === 'csv') {
    exportToCSV(data, '发票列表')
    ElMessage.success('CSV导出成功')
  } else {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '发票列表')
    XLSX.writeFile(wb, `发票列表_${new Date().getTime()}.xlsx`)
    ElMessage.success('Excel导出成功')
  }
}

onMounted(() => {
  invoiceStore.initInvoices()
  pagination.total = filteredData.value.length
})
</script>

<style scoped lang="css">
.invoice-list {
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
