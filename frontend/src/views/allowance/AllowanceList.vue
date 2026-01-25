<template>
  <div class="allowance-list">
    <el-tabs v-model="activeTab">
      <!-- 人员名单维护 -->
      <el-tab-pane label="人员名单维护" name="persons">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>人员名单</span>
          <el-button type="primary" @click="handleAddPerson">
            <el-icon><Plus /></el-icon>
            新增人员
          </el-button>
            </div>
          </template>

          <el-table :data="allowanceStore.persons" style="width: 100%" table-layout="auto">
            <el-table-column prop="name" label="姓名" min-width="120" />
            <el-table-column prop="department" label="部门" min-width="150" />
            <el-table-column prop="allowanceType" label="津贴类型" min-width="150" />
            <el-table-column prop="standardAmount" label="标准金额" min-width="150">
              <template #default="{ row }">
                ¥{{ row.standardAmount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleEditPerson(row)">
                  编辑
                </el-button>
                <el-button type="danger" link size="small" @click="handleDeletePerson(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 发放记录 -->
      <el-tab-pane label="发放记录" name="records">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>发放记录</span>
              <el-button type="primary" @click="handleAddRecord">
                <el-icon><Plus /></el-icon>
                新增发放
              </el-button>
            </div>
          </template>

          <div class="search-bar">
            <el-form :inline="true" :model="searchForm">
              <el-form-item label="姓名">
                <el-input
                  v-model="searchForm.personName"
                  placeholder="请输入姓名"
                  clearable
                />
              </el-form-item>
              <el-form-item label="部门">
                <el-input
                  v-model="searchForm.department"
                  placeholder="请输入部门"
                  clearable
                />
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

          <el-table :data="tableData" style="width: 100%" table-layout="auto">
            <el-table-column prop="personName" label="姓名" min-width="120" />
            <el-table-column prop="department" label="部门" min-width="150" />
            <el-table-column prop="allowanceType" label="津贴类型" min-width="150" />
            <el-table-column prop="amount" label="金额" min-width="150" sortable>
              <template #default="{ row }">
                ¥{{ row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="method" label="发放方式" min-width="150" />
            <el-table-column prop="time" label="发放时间" width="250" sortable>
              <template #default="{ row }">
                {{ formatDate(row.time) }}
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
      </el-tab-pane>
    </el-tabs>

    <!-- 人员对话框 -->
    <el-dialog
      v-model="showPersonDialog"
      :title="editingPerson ? '编辑人员' : '新增人员'"
      width="500px"
      @closed="handlePersonDialogClosed"
    >
      <el-form :model="personForm" label-width="100px">
        <el-form-item label="姓名">
          <el-input v-model="personForm.name" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="personForm.department" />
        </el-form-item>
        <el-form-item label="津贴类型">
          <el-select v-model="personForm.allowanceType" style="width: 100%">
            <el-option label="交通补贴" value="交通补贴" />
            <el-option label="餐补" value="餐补" />
            <el-option label="通讯补贴" value="通讯补贴" />
            <el-option label="住房补贴" value="住房补贴" />
          </el-select>
        </el-form-item>
        <el-form-item label="标准金额">
          <el-input-number
            v-model="personForm.standardAmount"
            :precision="2"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPersonDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSavePerson">保存</el-button>
      </template>
    </el-dialog>

    <!-- 发放对话框 -->
    <el-dialog
      v-model="showRecordDialog"
      title="新增发放"
      width="600px"
      @closed="handleRecordDialogClosed"
    >
      <el-form :model="recordForm" label-width="100px">
        <el-form-item label="发放方式">
          <el-select v-model="recordForm.method" style="width: 100%">
            <el-option label="银行转账" value="银行转账" />
            <el-option label="现金" value="现金" />
            <el-option label="支付宝" value="支付宝" />
            <el-option label="微信" value="微信" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择人员">
          <el-button @click="showPersonSelectDialog = true">选择人员</el-button>
          <div v-if="selectedPersons.length > 0" class="selected-persons">
            <el-tag
              v-for="person in selectedPersons"
              :key="person.id"
              closable
              @close="removePerson(person.id)"
              class="person-tag"
            >
              {{ person.name }} - ¥{{ person.standardAmount.toFixed(2) }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecordDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRecord">保存</el-button>
      </template>
    </el-dialog>

    <!-- 人员选择对话框 -->
    <el-dialog
      v-model="showPersonSelectDialog"
      title="选择人员"
      width="700px"
    >
      <el-table
        :data="allowanceStore.persons"
        @selection-change="handlePersonSelectionChange"
        table-layout="auto"
        max-height="400"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column prop="department" label="部门" min-width="150" />
        <el-table-column prop="allowanceType" label="津贴类型" min-width="150" />
        <el-table-column prop="standardAmount" label="标准金额" min-width="150">
          <template #default="{ row }">
            ¥{{ row.standardAmount.toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showPersonSelectDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmPersonSelection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown } from '@element-plus/icons-vue'
import { useAllowanceStore } from '@/stores/allowance'
import type { AllowancePerson } from '@/types'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { exportToCSV } from '@/utils/export'

const allowanceStore = useAllowanceStore()

const activeTab = ref('persons')
const showPersonDialog = ref(false)
const showRecordDialog = ref(false)
const showPersonSelectDialog = ref(false)
const editingPerson = ref<AllowancePerson | null>(null)
const selectedPersons = ref<AllowancePerson[]>([])
const tempSelectedPersonIds = ref<string[]>([])

const searchForm = reactive({
  personName: '',
  department: ''
})

const appliedSearch = reactive({
  personName: '',
  department: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const personForm = reactive({
  name: '',
  department: '',
  allowanceType: '交通补贴',
  standardAmount: 0
})

const recordForm = reactive({
  method: '银行转账'
})

const filteredData = computed(() => {
  let data = allowanceStore.records

  if (appliedSearch.personName) {
    data = data.filter(item =>
      item.personName.includes(appliedSearch.personName)
    )
  }

  if (appliedSearch.department) {
    data = data.filter(item =>
      item.department.includes(appliedSearch.department)
    )
  }

  return data
})

const tableData = computed(() => {
  const start = (pagination.page - 1) * pagination.size
  const end = start + pagination.size
  return filteredData.value.slice(start, end)
})

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

function handleSearch(): void {
  appliedSearch.personName = searchForm.personName
  appliedSearch.department = searchForm.department
  pagination.page = 1
  pagination.total = filteredData.value.length
}

function handleReset(): void {
  searchForm.personName = ''
  searchForm.department = ''
  appliedSearch.personName = ''
  appliedSearch.department = ''
  pagination.page = 1
  pagination.total = filteredData.value.length
}

function handleEditPerson(row: AllowancePerson): void {
  editingPerson.value = row
  Object.assign(personForm, row)
  showPersonDialog.value = true
}

function handleDeletePerson(row: AllowancePerson): void {
  ElMessageBox.confirm('确定要删除这个人员吗？', '提示', {
    type: 'warning'
  }).then(() => {
    allowanceStore.deletePerson(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function handleSavePerson(): void {
  if (editingPerson.value) {
    allowanceStore.updatePerson(editingPerson.value.id, personForm)
    ElMessage.success('更新成功')
  } else {
    allowanceStore.addPerson(personForm)
    ElMessage.success('添加成功')
  }
  showPersonDialog.value = false
  editingPerson.value = null
  Object.assign(personForm, {
    name: '',
    department: '',
    allowanceType: '交通补贴',
    standardAmount: 0
  })
}

function handlePersonSelectionChange(selection: AllowancePerson[]): void {
  tempSelectedPersonIds.value = selection.map(p => p.id)
}

function confirmPersonSelection(): void {
  selectedPersons.value = allowanceStore.persons.filter(p =>
    tempSelectedPersonIds.value.includes(p.id)
  )
  showPersonSelectDialog.value = false
}

function removePerson(id: string): void {
  selectedPersons.value = selectedPersons.value.filter(p => p.id !== id)
}

function handleAddRecord(): void {
  selectedPersons.value = []
  recordForm.method = '银行转账'
  showRecordDialog.value = true
}

function handlePersonDialogClosed(): void {
  if (!editingPerson.value) {
    Object.assign(personForm, {
      name: '',
      department: '',
      allowanceType: '交通补贴',
      standardAmount: 0
    })
  }
}

function handleRecordDialogClosed(): void {
  selectedPersons.value = []
  recordForm.method = '银行转账'
}

function handleSaveRecord(): void {
  if (selectedPersons.value.length === 0) {
    ElMessage.warning('请至少选择一个人员')
    return
  }

  const personIds = selectedPersons.value.map(p => p.id)
  const allowanceType = selectedPersons.value[0]?.allowanceType || '交通补贴'
  
  allowanceStore.batchAddRecords(personIds, recordForm.method, allowanceType)
  ElMessage.success('发放成功')
  
  showRecordDialog.value = false
  selectedPersons.value = []
  recordForm.method = '银行转账'
  handleSearch()
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
    姓名: item.personName,
    部门: item.department,
    津贴类型: item.allowanceType,
    金额: item.amount,
    发放方式: item.method,
    发放时间: formatDate(item.time)
  }))

  if (type === 'csv') {
    exportToCSV(data, '津贴发放记录')
    ElMessage.success('CSV导出成功')
  } else {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '发放记录')
    XLSX.writeFile(wb, `津贴发放记录_${new Date().getTime()}.xlsx`)
    ElMessage.success('Excel导出成功')
  }
}

onMounted(() => {
  allowanceStore.initAllowance()
  pagination.total = filteredData.value.length
})
</script>

<style scoped lang="css">
.allowance-list {
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

.selected-persons {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.person-tag {
  width: fit-content;
  display: inline-block;
}
</style>
