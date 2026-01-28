<template>
  <div class="allowance-list">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 人员名单维护 -->
      <el-tab-pane label="人员名单维护" name="persons">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>人员名单</span>
          <el-button type="primary" @click="openAddPersonDialog">
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

      <!-- 发放规则配置 -->
      <el-tab-pane label="发放规则配置" name="rules">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>发放规则配置</span>
              <el-button type="primary" @click="handleAddRule">
                <el-icon><Plus /></el-icon>
                新增规则
              </el-button>
            </div>
          </template>

          <!-- 规则列表 -->
          <el-table :data="rulesTableData" style="width: 100%" table-layout="auto">
            <el-table-column prop="name" label="规则名称" min-width="180">
              <template #default="{ row }">
                <div class="rule-name-cell">
                  <el-icon :class="getRuleTypeClass(row.type)">
                    <component :is="getRuleTypeIcon(row.type)" />
                  </el-icon>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="allowanceType" label="适用津贴类型" width="140">
              <template #default="{ row }">
                <el-tag :type="getAllowanceTypeTag(row.allowanceType)" size="small">
                  {{ row.allowanceType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="规则类型" width="130">
              <template #default="{ row }">
                {{ getRuleTypeName(row.type) }}
              </template>
            </el-table-column>
            <el-table-column label="计算方式" min-width="200">
              <template #default="{ row }">
                <span class="calculation-desc">{{ getCalculationDesc(row) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="适用部门" min-width="160">
              <template #default="{ row }">
                <template v-if="row.config && row.config.departments && row.config.departments.length > 0">
                  <el-tag
                    v-for="dept in row.config.departments.slice(0, 2)"
                    :key="dept"
                    size="small"
                    type="info"
                    class="dept-tag"
                  >
                    {{ dept }}
                  </el-tag>
                  <el-tooltip
                    v-if="row.config.departments.length > 2"
                    :content="row.config.departments.slice(2).join('、')"
                    placement="top"
                  >
                    <el-tag size="small" type="info">+{{ row.config.departments.length - 2 }}</el-tag>
                  </el-tooltip>
                </template>
                <span v-else class="all-dept">全部部门</span>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="状态" width="100">
              <template #default="{ row }">
                <el-switch
                  v-model="row.enabled"
                  :active-text="''"
                  :inactive-text="''"
                  @change="handleToggleRuleEnabled(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleEditRule(row)">
                  编辑
                </el-button>
                <el-popconfirm
                  title="确定要删除这条规则吗？"
                  @confirm="handleDeleteRule(row)"
                >
                  <template #reference>
                    <el-button type="danger" link size="small">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="rulesPagination.page"
              v-model:page-size="rulesPagination.size"
              :total="rulesPagination.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              @size-change="handleRulesSizeChange"
              @current-change="handleRulesPageChange"
            />
          </div>
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

    <!-- 规则对话框 -->
    <el-dialog
      v-model="showRuleDialog"
      :title="editingRule ? '编辑规则' : '新增规则'"
      width="680px"
      @closed="handleRuleDialogClosed"
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="ruleFormRules"
        label-width="120px"
        class="rule-form"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="ruleForm.name" placeholder="请输入规则名称" maxlength="50" />
        </el-form-item>

        <el-form-item label="适用津贴类型" prop="allowanceType">
          <el-select v-model="ruleForm.allowanceType" placeholder="请选择津贴类型" style="width: 100%">
            <el-option label="交通补贴" value="交通补贴" />
            <el-option label="餐补" value="餐补" />
            <el-option label="通讯补贴" value="通讯补贴" />
            <el-option label="住房补贴" value="住房补贴" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="规则类型" prop="type">
          <el-radio-group v-model="ruleForm.type" @change="handleRuleTypeChange">
            <el-radio-button value="fixed">固定金额</el-radio-button>
            <el-radio-button value="attendance">出勤关联</el-radio-button>
            <el-radio-button value="project">项目系数</el-radio-button>
            <el-radio-button value="performance">绩效关联</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 固定金额配置 -->
        <template v-if="ruleForm.type === 'fixed'">
          <el-form-item label="固定金额">
            <el-input-number
              v-model="ruleForm.config.fixedAmount"
              :precision="2"
              :min="0"
              :max="100000"
              style="width: 100%"
            />
          </el-form-item>
        </template>

        <!-- 出勤关联配置 -->
        <template v-if="ruleForm.type === 'attendance'">
          <el-form-item label="每日金额">
            <el-input-number
              v-model="ruleForm.config.perDayAmount"
              :precision="2"
              :min="0"
              :max="1000"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="标准出勤天数">
            <el-input-number
              v-model="ruleForm.config.attendanceDays"
              :min="1"
              :max="31"
              style="width: 100%"
            />
          </el-form-item>
        </template>

        <!-- 项目系数配置 -->
        <template v-if="ruleForm.type === 'project'">
          <el-form-item label="基础金额">
            <el-input-number
              v-model="ruleForm.config.baseAmount"
              :precision="2"
              :min="0"
              :max="100000"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="项目系数">
            <el-input-number
              v-model="ruleForm.config.projectMultiplier"
              :precision="2"
              :min="0.1"
              :max="10"
              :step="0.1"
              style="width: 100%"
            />
          </el-form-item>
        </template>

        <!-- 绩效关联配置 -->
        <template v-if="ruleForm.type === 'performance'">
          <el-form-item label="基础金额">
            <el-input-number
              v-model="ruleForm.config.baseAmount"
              :precision="2"
              :min="0"
              :max="100000"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="绩效比例(%)">
            <el-slider
              v-model="ruleForm.config.performanceRatio"
              :min="0"
              :max="200"
              :format-tooltip="(val: number) => `${val}%`"
              show-input
            />
          </el-form-item>
        </template>

        <el-divider content-position="left">金额限制</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最小金额" prop="config.minAmount">
              <el-input-number
                v-model="ruleForm.config.minAmount"
                :precision="2"
                :min="0"
                style="width: 100%"
                @change="handleMinAmountChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大金额" prop="config.maxAmount">
              <el-input-number
                v-model="ruleForm.config.maxAmount"
                :precision="2"
                :min="0"
                style="width: 100%"
                @change="handleMaxAmountChange"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">生效设置</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生效日期" prop="config.effectiveDate">
              <el-date-picker
                v-model="ruleForm.config.effectiveDate"
                type="date"
                placeholder="选择生效日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="handleEffectiveDateChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="失效日期" prop="config.expiryDate">
              <el-date-picker
                v-model="ruleForm.config.expiryDate"
                type="date"
                placeholder="选择失效日期（可选）"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="handleExpiryDateChange"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="适用部门">
          <el-select
            v-model="ruleForm.config.departments"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="留空表示适用全部部门"
            style="width: 100%"
          >
            <el-option label="技术部" value="技术部" />
            <el-option label="市场部" value="市场部" />
            <el-option label="财务部" value="财务部" />
            <el-option label="人事部" value="人事部" />
            <el-option label="运营部" value="运营部" />
            <el-option label="研发部" value="研发部" />
          </el-select>
        </el-form-item>

        <el-form-item label="规则说明" prop="description">
          <el-input
            v-model="ruleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入规则说明"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="是否启用">
          <el-switch v-model="ruleForm.enabled" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showRuleDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown, Coin, Calendar, TrendCharts, DataAnalysis } from '@element-plus/icons-vue'
import { useAllowanceStore } from '@/stores/allowance'
import type { AllowancePerson, AllowanceRule, AllowanceRuleConfig } from '@/types'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { exportToCSV } from '@/utils/export'

const allowanceStore = useAllowanceStore()

const activeTab = ref('persons')
const showPersonDialog = ref(false)
const showRecordDialog = ref(false)
const showPersonSelectDialog = ref(false)
const showRuleDialog = ref(false)
const editingPerson = ref<AllowancePerson | null>(null)
const editingRule = ref<AllowanceRule | null>(null)
const selectedPersons = ref<AllowancePerson[]>([])
const tempSelectedPersonIds = ref<string[]>([])
const ruleFormRef = ref<FormInstance>()

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

// 规则分页
const rulesPagination = reactive({
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

// 规则表单默认配置
const getDefaultRuleConfig = (): AllowanceRuleConfig => ({
  fixedAmount: 500,
  projectMultiplier: 1.0,
  performanceRatio: 100,
  baseAmount: 500,
  minAmount: 0,
  maxAmount: undefined,
  attendanceDays: 22,
  perDayAmount: 25,
  effectiveDate: dayjs().format('YYYY-MM-DD'),
  expiryDate: undefined,
  departments: []
})

// 规则表单
const ruleForm = reactive({
  name: '',
  type: 'fixed' as 'fixed' | 'project' | 'performance' | 'attendance',
  allowanceType: '交通补贴',
  description: '',
  enabled: true,
  config: getDefaultRuleConfig()
})

// 规则表单验证
const ruleFormRules: FormRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 2, max: 50, message: '规则名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  allowanceType: [
    { required: true, message: '请选择适用津贴类型', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择规则类型', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入规则说明', trigger: 'blur' }
  ],
  'config.minAmount': [
    {
      validator: (rule: any, value: number | undefined, callback: Function) => {
        if (value === undefined || value === null) {
          callback()
          return
        }
        if (value < 0) {
          callback(new Error('最小金额不能小于0'))
          return
        }
        const maxAmount = ruleForm.config.maxAmount
        if (maxAmount !== undefined && maxAmount !== null && value > maxAmount) {
          callback(new Error('最小金额不能大于最大金额'))
          return
        }
        callback()
      },
      trigger: ['blur', 'change']
    }
  ],
  'config.maxAmount': [
    {
      validator: (rule: any, value: number | undefined, callback: Function) => {
        if (value === undefined || value === null) {
          callback()
          return
        }
        if (value < 0) {
          callback(new Error('最大金额不能小于0'))
          return
        }
        const minAmount = ruleForm.config.minAmount
        if (minAmount !== undefined && minAmount !== null && value < minAmount) {
          callback(new Error('最大金额不能小于最小金额'))
          return
        }
        callback()
      },
      trigger: ['blur', 'change']
    }
  ],
  'config.effectiveDate': [
    {
      required: true,
      message: '请选择生效日期',
      trigger: ['blur', 'change']
    },
    {
      validator: (rule: any, value: string | undefined, callback: Function) => {
        if (!value) {
          callback(new Error('请选择生效日期'))
          return
        }
        const expiryDate = ruleForm.config.expiryDate
        if (expiryDate && dayjs(value).isAfter(dayjs(expiryDate))) {
          callback(new Error('生效日期不能晚于失效日期'))
          return
        }
        callback()
      },
      trigger: ['blur', 'change']
    }
  ],
  'config.expiryDate': [
    {
      validator: (rule: any, value: string | undefined, callback: Function) => {
        // 失效日期是可选的，如果为空则通过验证
        if (!value) {
          callback()
          return
        }
        const effectiveDate = ruleForm.config.effectiveDate
        if (effectiveDate && dayjs(value).isBefore(dayjs(effectiveDate))) {
          callback(new Error('失效日期不能早于生效日期'))
          return
        }
        callback()
      },
      trigger: ['blur', 'change']
    }
  ]
}

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

// 规则表格数据
const rulesTableData = computed(() => {
  const start = (rulesPagination.page - 1) * rulesPagination.size
  const end = start + rulesPagination.size
  return allowanceStore.rules.slice(start, end)
})

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// Tab切换处理
function handleTabChange(tab: string): void {
  if (tab === 'rules') {
    rulesPagination.total = allowanceStore.rules.length
  }
}

// 规则类型名称
function getRuleTypeName(type: string): string {
  const map: Record<string, string> = {
    fixed: '固定金额',
    project: '按项目计算',
    performance: '绩效关联',
    attendance: '出勤关联'
  }
  return map[type] || type
}

// 规则类型图标
function getRuleTypeIcon(type: string) {
  const map: Record<string, any> = {
    fixed: Coin,
    project: TrendCharts,
    performance: DataAnalysis,
    attendance: Calendar
  }
  return map[type] || Coin
}

// 规则类型样式
function getRuleTypeClass(type: string): string {
  const map: Record<string, string> = {
    fixed: 'icon-fixed',
    project: 'icon-project',
    performance: 'icon-performance',
    attendance: 'icon-attendance'
  }
  return map[type] || ''
}

// 津贴类型标签
function getAllowanceTypeTag(type: string): string {
  const map: Record<string, string> = {
    '交通补贴': '',
    '餐补': 'success',
    '通讯补贴': 'warning',
    '住房补贴': 'danger',
    '其他': 'info'
  }
  return map[type] || 'info'
}

// 计算方式描述
function getCalculationDesc(rule: AllowanceRule): string {
  const { config } = rule
  switch (rule.type) {
    case 'fixed':
      return `固定发放 ¥${config.fixedAmount?.toFixed(2) || '0.00'}`
    case 'attendance':
      return `每日 ¥${config.perDayAmount?.toFixed(2) || '0.00'}，最多 ${config.attendanceDays || 22} 天`
    case 'project':
      return `基础 ¥${config.baseAmount?.toFixed(2) || '0.00'} × 项目系数 ${config.projectMultiplier || 1}`
    case 'performance':
      return `基础 ¥${config.baseAmount?.toFixed(2) || '0.00'} × 绩效 ${config.performanceRatio || 100}%`
    default:
      return '—'
  }
}

// 规则分页
function handleRulesSizeChange(size: number): void {
  rulesPagination.size = size
  rulesPagination.page = 1
}

function handleRulesPageChange(page: number): void {
  rulesPagination.page = page
}

// 新增规则
function handleAddRule(): void {
  editingRule.value = null
  Object.assign(ruleForm, {
    name: '',
    type: 'fixed',
    allowanceType: '交通补贴',
    description: '',
    enabled: true,
    config: getDefaultRuleConfig()
  })
  showRuleDialog.value = true
}

// 编辑规则
function handleEditRule(rule: AllowanceRule): void {
  editingRule.value = rule
  Object.assign(ruleForm, {
    name: rule.name,
    type: rule.type,
    allowanceType: rule.allowanceType,
    description: rule.description,
    enabled: rule.enabled,
    config: { ...getDefaultRuleConfig(), ...rule.config }
  })
  showRuleDialog.value = true
}

// 删除规则
function handleDeleteRule(rule: AllowanceRule): void {
  allowanceStore.deleteRule(rule.id)
  ElMessage.success('删除成功')
  rulesPagination.total = allowanceStore.rules.length
}

// 切换规则启用状态
function handleToggleRuleEnabled(rule: AllowanceRule): void {
  allowanceStore.toggleRuleEnabled(rule.id)
  ElMessage.success(rule.enabled ? '规则已启用' : '规则已禁用')
}

// 规则类型切换
function handleRuleTypeChange(): void {
  const baseConfig = getDefaultRuleConfig()
  ruleForm.config = {
    ...baseConfig,
    effectiveDate: ruleForm.config.effectiveDate,
    expiryDate: ruleForm.config.expiryDate,
    departments: ruleForm.config.departments,
    minAmount: ruleForm.config.minAmount,
    maxAmount: ruleForm.config.maxAmount
  }
}

// 最小金额变化时验证最大金额
function handleMinAmountChange(): void {
  if (ruleFormRef.value) {
    ruleFormRef.value.validateField('config.maxAmount')
  }
}

// 最大金额变化时验证最小金额
function handleMaxAmountChange(): void {
  if (ruleFormRef.value) {
    ruleFormRef.value.validateField('config.minAmount')
  }
}

// 生效日期变化时验证失效日期
function handleEffectiveDateChange(): void {
  if (ruleFormRef.value) {
    ruleFormRef.value.validateField('config.expiryDate')
  }
}

// 失效日期变化时验证生效日期
function handleExpiryDateChange(): void {
  if (ruleFormRef.value) {
    ruleFormRef.value.validateField('config.effectiveDate')
  }
}

// 保存规则
async function handleSaveRule(): Promise<void> {
  if (!ruleFormRef.value) return

  try {
    await ruleFormRef.value.validate()

    const ruleData = {
      name: ruleForm.name,
      type: ruleForm.type,
      allowanceType: ruleForm.allowanceType,
      description: ruleForm.description,
      enabled: ruleForm.enabled,
      config: { ...ruleForm.config }
    }

    if (editingRule.value) {
      allowanceStore.updateRule(editingRule.value.id, ruleData)
      ElMessage.success('更新成功')
    } else {
      allowanceStore.addRule(ruleData)
      ElMessage.success('添加成功')
    }

    showRuleDialog.value = false
    rulesPagination.total = allowanceStore.rules.length
  } catch (error) {
    // 表单验证失败
  }
}

// 规则对话框关闭
function handleRuleDialogClosed(): void {
  editingRule.value = null
  ruleFormRef.value?.resetFields()
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

function openAddPersonDialog(): void {
  editingPerson.value = null
  Object.assign(personForm, {
    name: '',
    department: '',
    allowanceType: '交通补贴',
    standardAmount: 0
  })
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
  rulesPagination.total = allowanceStore.rules.length
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

/* 规则相关样式 */
.rule-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-name-cell .el-icon {
  font-size: 18px;
}

.icon-fixed {
  color: #409eff;
}

.icon-project {
  color: #67c23a;
}

.icon-performance {
  color: #e6a23c;
}

.icon-attendance {
  color: #909399;
}

.calculation-desc {
  color: #666;
  font-size: 13px;
}

.dept-tag {
  margin-right: 4px;
  margin-bottom: 2px;
}

.all-dept {
  color: #909399;
  font-size: 13px;
}

.rule-form :deep(.el-divider__text) {
  font-size: 13px;
  color: #909399;
}

.rule-form :deep(.el-radio-button__inner) {
  padding: 8px 16px;
}
</style>
