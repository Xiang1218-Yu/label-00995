<template>
  <div class="allowance-rules">
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

      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="规则名称">
            <el-input
              v-model="searchForm.name"
              placeholder="请输入规则名称"
              clearable
              style="width: 180px"
            />
          </el-form-item>
          <el-form-item label="津贴类型">
            <el-select
              v-model="searchForm.allowanceType"
              placeholder="全部"
              clearable
              style="width: 150px"
            >
              <el-option label="交通补贴" value="交通补贴" />
              <el-option label="餐补" value="餐补" />
              <el-option label="通讯补贴" value="通讯补贴" />
              <el-option label="住房补贴" value="住房补贴" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="规则类型">
            <el-select
              v-model="searchForm.type"
              placeholder="全部"
              clearable
              style="width: 150px"
            >
              <el-option label="固定金额" value="fixed" />
              <el-option label="按项目计算" value="project" />
              <el-option label="绩效关联" value="performance" />
              <el-option label="出勤关联" value="attendance" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.enabled"
              placeholder="全部"
              clearable
              style="width: 120px"
            >
              <el-option label="启用" :value="true" />
              <el-option label="禁用" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 规则列表 -->
      <el-table :data="tableData" style="width: 100%" table-layout="auto" row-key="id">
        <el-table-column prop="name" label="规则名称" min-width="180">
          <template #default="{ row }">
            <div class="rule-name">
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
            <template v-if="row.config.departments && row.config.departments.length > 0">
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
              @change="handleToggleEnabled(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="生效时间" width="200">
          <template #default="{ row }">
            <div class="date-range">
              <span>{{ row.config.effectiveDate || '—' }}</span>
              <span v-if="row.config.expiryDate"> 至 {{ row.config.expiryDate }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewRule(row)">
              详情
            </el-button>
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

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑规则对话框 -->
    <el-dialog
      v-model="showRuleDialog"
      :title="editingRule ? '编辑规则' : '新增规则'"
      width="680px"
      @closed="handleDialogClosed"
    >
      <el-form
        ref="ruleFormRef"
        :model="ruleForm"
        :rules="formRules"
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
          <el-radio-group v-model="ruleForm.type" @change="handleTypeChange">
            <el-radio-button value="fixed">固定金额</el-radio-button>
            <el-radio-button value="attendance">出勤关联</el-radio-button>
            <el-radio-button value="project">项目系数</el-radio-button>
            <el-radio-button value="performance">绩效关联</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 固定金额配置 -->
        <template v-if="ruleForm.type === 'fixed'">
          <el-form-item label="固定金额" prop="config.fixedAmount">
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
          <el-form-item label="每日金额" prop="config.perDayAmount">
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
          <el-form-item label="基础金额" prop="config.baseAmount">
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
          <el-form-item label="基础金额" prop="config.baseAmount">
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
            <el-form-item label="最小金额">
              <el-input-number
                v-model="ruleForm.config.minAmount"
                :precision="2"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大金额">
              <el-input-number
                v-model="ruleForm.config.maxAmount"
                :precision="2"
                :min="0"
                style="width: 100%"
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
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="失效日期">
              <el-date-picker
                v-model="ruleForm.config.expiryDate"
                type="date"
                placeholder="选择失效日期（可选）"
                value-format="YYYY-MM-DD"
                style="width: 100%"
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

    <!-- 规则详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="规则详情"
      width="600px"
    >
      <template v-if="detailRule">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="规则名称" :span="2">
            {{ detailRule.name }}
          </el-descriptions-item>
          <el-descriptions-item label="适用津贴类型">
            <el-tag :type="getAllowanceTypeTag(detailRule.allowanceType)">
              {{ detailRule.allowanceType }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="规则类型">
            {{ getRuleTypeName(detailRule.type) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="detailRule.enabled ? 'success' : 'info'">
              {{ detailRule.enabled ? '已启用' : '已禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="计算方式">
            {{ getCalculationDesc(detailRule) }}
          </el-descriptions-item>
          <el-descriptions-item label="金额限制" :span="2">
            最小: ¥{{ detailRule.config.minAmount?.toFixed(2) || '0.00' }}，
            最大: ¥{{ detailRule.config.maxAmount?.toFixed(2) || '无限制' }}
          </el-descriptions-item>
          <el-descriptions-item label="适用部门" :span="2">
            <template v-if="detailRule.config.departments && detailRule.config.departments.length > 0">
              <el-tag
                v-for="dept in detailRule.config.departments"
                :key="dept"
                size="small"
                type="info"
                class="dept-tag"
              >
                {{ dept }}
              </el-tag>
            </template>
            <span v-else>全部部门</span>
          </el-descriptions-item>
          <el-descriptions-item label="生效日期">
            {{ detailRule.config.effectiveDate || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="失效日期">
            {{ detailRule.config.expiryDate || '无限期' }}
          </el-descriptions-item>
          <el-descriptions-item label="规则说明" :span="2">
            {{ detailRule.description || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(detailRule.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(detailRule.updateTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Coin, Calendar, TrendCharts, DataAnalysis } from '@element-plus/icons-vue'
import { useAllowanceStore } from '@/stores/allowance'
import type { AllowanceRule, AllowanceRuleConfig } from '@/types'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'

const allowanceStore = useAllowanceStore()

// 对话框状态
const showRuleDialog = ref(false)
const showDetailDialog = ref(false)
const editingRule = ref<AllowanceRule | null>(null)
const detailRule = ref<AllowanceRule | null>(null)
const ruleFormRef = ref<FormInstance>()

// 搜索表单
const searchForm = reactive({
  name: '',
  allowanceType: '',
  type: '' as '' | 'fixed' | 'project' | 'performance' | 'attendance',
  enabled: undefined as boolean | undefined
})

const appliedSearch = reactive({
  name: '',
  allowanceType: '',
  type: '' as '' | 'fixed' | 'project' | 'performance' | 'attendance',
  enabled: undefined as boolean | undefined
})

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 规则表单
const getDefaultConfig = (): AllowanceRuleConfig => ({
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

const ruleForm = reactive({
  name: '',
  type: 'fixed' as 'fixed' | 'project' | 'performance' | 'attendance',
  allowanceType: '交通补贴',
  description: '',
  enabled: true,
  config: getDefaultConfig()
})

// 表单验证规则
const formRules: FormRules = {
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
  'config.effectiveDate': [
    { required: true, message: '请选择生效日期', trigger: 'change' }
  ],
  'config.fixedAmount': [
    { required: true, message: '请输入固定金额', trigger: 'blur', type: 'number' }
  ],
  'config.perDayAmount': [
    { required: true, message: '请输入每日金额', trigger: 'blur', type: 'number' }
  ],
  'config.baseAmount': [
    { required: true, message: '请输入基础金额', trigger: 'blur', type: 'number' }
  ]
}

// 过滤后的数据
const filteredData = computed(() => {
  let data = [...allowanceStore.rules]

  if (appliedSearch.name) {
    data = data.filter(item => item.name.includes(appliedSearch.name))
  }
  if (appliedSearch.allowanceType) {
    data = data.filter(item => item.allowanceType === appliedSearch.allowanceType)
  }
  if (appliedSearch.type) {
    data = data.filter(item => item.type === appliedSearch.type)
  }
  if (appliedSearch.enabled !== undefined) {
    data = data.filter(item => item.enabled === appliedSearch.enabled)
  }

  return data
})

// 表格数据（分页）
const tableData = computed(() => {
  const start = (pagination.page - 1) * pagination.size
  const end = start + pagination.size
  return filteredData.value.slice(start, end)
})

// 工具函数
function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function getRuleTypeName(type: string): string {
  const map: Record<string, string> = {
    fixed: '固定金额',
    project: '按项目计算',
    performance: '绩效关联',
    attendance: '出勤关联'
  }
  return map[type] || type
}

function getRuleTypeIcon(type: string) {
  const map: Record<string, any> = {
    fixed: Coin,
    project: TrendCharts,
    performance: DataAnalysis,
    attendance: Calendar
  }
  return map[type] || Coin
}

function getRuleTypeClass(type: string): string {
  const map: Record<string, string> = {
    fixed: 'icon-fixed',
    project: 'icon-project',
    performance: 'icon-performance',
    attendance: 'icon-attendance'
  }
  return map[type] || ''
}

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

// 搜索相关
function handleSearch(): void {
  Object.assign(appliedSearch, searchForm)
  pagination.page = 1
  pagination.total = filteredData.value.length
}

function handleReset(): void {
  searchForm.name = ''
  searchForm.allowanceType = ''
  searchForm.type = ''
  searchForm.enabled = undefined
  Object.assign(appliedSearch, searchForm)
  pagination.page = 1
  pagination.total = filteredData.value.length
}

// 分页相关
function handleSizeChange(size: number): void {
  pagination.size = size
  pagination.page = 1
}

function handlePageChange(page: number): void {
  pagination.page = page
}

// 规则操作
function handleAddRule(): void {
  editingRule.value = null
  Object.assign(ruleForm, {
    name: '',
    type: 'fixed',
    allowanceType: '交通补贴',
    description: '',
    enabled: true,
    config: getDefaultConfig()
  })
  showRuleDialog.value = true
}

function handleEditRule(rule: AllowanceRule): void {
  editingRule.value = rule
  Object.assign(ruleForm, {
    name: rule.name,
    type: rule.type,
    allowanceType: rule.allowanceType,
    description: rule.description,
    enabled: rule.enabled,
    config: { ...getDefaultConfig(), ...rule.config }
  })
  showRuleDialog.value = true
}

function handleViewRule(rule: AllowanceRule): void {
  detailRule.value = rule
  showDetailDialog.value = true
}

function handleEditFromDetail(): void {
  if (detailRule.value) {
    showDetailDialog.value = false
    handleEditRule(detailRule.value)
  }
}

function handleDeleteRule(rule: AllowanceRule): void {
  allowanceStore.deleteRule(rule.id)
  ElMessage.success('删除成功')
  pagination.total = filteredData.value.length
}

function handleToggleEnabled(rule: AllowanceRule): void {
  allowanceStore.toggleRuleEnabled(rule.id)
  ElMessage.success(rule.enabled ? '规则已启用' : '规则已禁用')
}

function handleTypeChange(): void {
  // 切换类型时重置配置
  const baseConfig = getDefaultConfig()
  ruleForm.config = {
    ...baseConfig,
    effectiveDate: ruleForm.config.effectiveDate,
    expiryDate: ruleForm.config.expiryDate,
    departments: ruleForm.config.departments,
    minAmount: ruleForm.config.minAmount,
    maxAmount: ruleForm.config.maxAmount
  }
}

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
    pagination.total = filteredData.value.length
  } catch (error) {
    // 表单验证失败
  }
}

function handleDialogClosed(): void {
  editingRule.value = null
  ruleFormRef.value?.resetFields()
}

onMounted(() => {
  allowanceStore.initAllowance()
  pagination.total = filteredData.value.length
})
</script>

<style scoped lang="css">
.allowance-rules {
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

.rule-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-name .el-icon {
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

.date-range {
  font-size: 13px;
  color: #666;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.rule-form :deep(.el-divider__text) {
  font-size: 13px;
  color: #909399;
}

.rule-form :deep(.el-radio-button__inner) {
  padding: 8px 16px;
}
</style>
