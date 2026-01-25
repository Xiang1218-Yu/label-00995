<template>
  <div class="reimbursement-form">
    <el-card>
      <template #header>
        <span>新增报销</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="报销类型" prop="type">
          <el-radio-group v-model="form.type" @change="handleTypeChange">
            <el-radio label="普通报销">普通报销</el-radio>
            <el-radio label="汇款报销">汇款报销</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 普通报销：选择发票 -->
        <template v-if="form.type === '普通报销'">
          <el-form-item label="选择发票" prop="invoiceIds">
            <div class="invoice-selector">
              <el-button type="primary" @click="handleSelectInvoice">
                <el-icon><Plus /></el-icon>
                选择发票
              </el-button>
              <div v-if="selectedInvoices.length > 0" class="selected-invoices">
                <div class="selected-summary">
                  <span class="summary-text">
                    已选择 <strong>{{ selectedInvoices.length }}</strong> 张发票
                  </span>
                  <span class="summary-amount">
                    合计：<strong>¥{{ totalAmount.toFixed(2) }}</strong>
                  </span>
                </div>
                <div class="invoice-list">
                  <div
                    v-for="invoice in selectedInvoices"
                    :key="invoice.id"
                    class="invoice-item"
                  >
                    <div class="invoice-content">
                      <div class="invoice-main">
                        <span class="invoice-number">{{ invoice.invoiceNumber }}</span>
                        <el-tag :type="getInvoiceTypeTag(invoice.type)" size="small" effect="plain">
                          {{ invoice.type }}
                        </el-tag>
                      </div>
                      <div class="invoice-meta">
                        <span class="invoice-date">{{ invoice.invoiceDate }}</span>
                        <span class="invoice-amount">¥{{ invoice.amount.toFixed(2) }}</span>
                      </div>
                    </div>
                    <el-button
                      type="danger"
                      :icon="Close"
                      circle
                      size="small"
                      class="remove-btn"
                      @click="removeInvoice(invoice.id)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </el-form-item>
        </template>

        <!-- 汇款报销：选择汇款 -->
        <template v-if="form.type === '汇款报销'">
          <el-form-item label="选择汇款" prop="remittanceId">
            <el-select
              v-model="form.remittanceId"
              placeholder="请选择汇款记录"
              style="width: 100%"
              @change="handleRemittanceChange"
            >
              <el-option
                v-for="remittance in unreimbursedRemittances"
                :key="remittance.id"
                :label="`${remittance.company} - ¥${remittance.amount.toFixed(2)}`"
                :value="remittance.id"
              />
            </el-select>
            <div v-if="selectedRemittance" class="selected-info">
              <p>汇款单位：{{ selectedRemittance.company }}</p>
              <p>金额：¥{{ selectedRemittance.amount.toFixed(2) }}</p>
              <p>用途：{{ selectedRemittance.purpose }}</p>
            </div>
          </el-form-item>
        </template>

        <el-form-item label="关联项目" prop="projectId">
          <el-select v-model="form.projectId" placeholder="请选择项目" style="width: 100%">
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="说明" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入报销说明"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 发票选择对话框 -->
    <el-dialog
      v-model="showInvoiceDialog"
      title="选择发票"
      width="800px"
      @closed="handleInvoiceDialogClosed"
    >
      <el-table
        :data="unreimbursedInvoices"
        @selection-change="handleInvoiceSelectionChange"
        table-layout="auto"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="invoiceNumber" label="发票号码" min-width="150" />
        <el-table-column prop="invoiceDate" label="开票日期" min-width="120" />
        <el-table-column prop="amount" label="金额" min-width="120">
          <template #default="{ row }">
            ¥{{ row.amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" min-width="100" />
        <el-table-column prop="uploader" label="上传人" min-width="100" />
      </el-table>
      <template #footer>
        <el-button @click="showInvoiceDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmInvoiceSelection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Close } from '@element-plus/icons-vue'
import { useReimbursementStore } from '@/stores/reimbursement'
import { useInvoiceStore } from '@/stores/invoice'
import { useRemittanceStore } from '@/stores/remittance'
import { useProjectStore } from '@/stores/project'
import { useUserStore } from '@/stores/user'
import type { Invoice, Remittance } from '@/types'

const route = useRoute()
const router = useRouter()
const reimbursementStore = useReimbursementStore()
const invoiceStore = useInvoiceStore()
const remittanceStore = useRemittanceStore()
const projectStore = useProjectStore()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const showInvoiceDialog = ref(false)
const selectedInvoices = ref<Invoice[]>([])
const tempSelectedInvoiceIds = ref<string[]>([])
const selectedRemittance = ref<Remittance | null>(null)
const projects = ref(projectStore.getAllProjects())

const form = reactive({
  type: '普通报销' as '普通报销' | '汇款报销',
  invoiceIds: [] as string[],
  remittanceId: '',
  projectId: '',
  description: ''
})

const rules: FormRules = {
  type: [
    { required: true, message: '请选择报销类型', trigger: 'change' }
  ],
  invoiceIds: [
    {
      validator: (rule, value, callback) => {
        if (form.type === '普通报销' && form.invoiceIds.length === 0) {
          callback(new Error('请至少选择一张发票'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  remittanceId: [
    {
      validator: (rule, value, callback) => {
        if (form.type === '汇款报销' && !form.remittanceId) {
          callback(new Error('请选择汇款记录'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  projectId: [
    { required: true, message: '请选择关联项目', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入说明', trigger: 'blur' }
  ]
}

const unreimbursedInvoices = computed(() => invoiceStore.unreimbursedInvoices)
const unreimbursedRemittances = computed(() => remittanceStore.unreimbursedRemittances)

const totalAmount = computed(() => {
  if (form.type === '普通报销') {
    return selectedInvoices.value.reduce((sum, inv) => sum + inv.amount, 0)
  } else if (selectedRemittance.value) {
    return selectedRemittance.value.amount
  }
  return 0
})

function handleTypeChange(): void {
  form.invoiceIds = []
  form.remittanceId = ''
  selectedInvoices.value = []
  selectedRemittance.value = null
}

function handleSelectInvoice(): void {
  // 恢复已选中的发票到临时选择列表
  tempSelectedInvoiceIds.value = selectedInvoices.value.map(inv => inv.id)
  showInvoiceDialog.value = true
}

function handleInvoiceDialogClosed(): void {
  // 对话框关闭时，如果用户取消了选择，恢复临时选择列表
  tempSelectedInvoiceIds.value = selectedInvoices.value.map(inv => inv.id)
}

function handleInvoiceSelectionChange(selection: Invoice[]): void {
  tempSelectedInvoiceIds.value = selection.map(inv => inv.id)
}

function confirmInvoiceSelection(): void {
  selectedInvoices.value = unreimbursedInvoices.value.filter(inv =>
    tempSelectedInvoiceIds.value.includes(inv.id)
  )
  form.invoiceIds = selectedInvoices.value.map(inv => inv.id)
  showInvoiceDialog.value = false
}

function removeInvoice(id: string): void {
  selectedInvoices.value = selectedInvoices.value.filter(inv => inv.id !== id)
  form.invoiceIds = selectedInvoices.value.map(inv => inv.id)
}

function getInvoiceTypeTag(type: string): string {
  const map: Record<string, string> = {
    住宿: 'primary',
    餐饮: 'success',
    其他: 'info'
  }
  return map[type] || 'info'
}

function handleRemittanceChange(value: string): void {
  selectedRemittance.value = remittanceStore.getRemittanceById(value) || null
}

function handleSubmit(): void {
  if (!formRef.value) return

  formRef.value.validate((valid) => {
    if (valid) {
      const amount = totalAmount.value
      
      reimbursementStore.addReimbursement({
        applicant: userStore.user?.name || '',
        type: form.type,
        amount,
        projectId: form.projectId,
        description: form.description,
        invoiceIds: form.type === '普通报销' ? form.invoiceIds : undefined,
        remittanceId: form.type === '汇款报销' ? form.remittanceId : undefined
      })

      // 更新发票状态
      if (form.type === '普通报销' && form.invoiceIds.length > 0) {
        invoiceStore.updateInvoiceStatus(form.invoiceIds, '已报销')
      }

      // 更新汇款状态
      if (form.type === '汇款报销' && form.remittanceId) {
        remittanceStore.updateRemittanceStatus(form.remittanceId, '已报销')
      }

      ElMessage.success('提交成功')
      router.push('/reimbursement')
    }
  })
}

function handleCancel(): void {
  router.back()
}

onMounted(() => {
  invoiceStore.initInvoices()
  remittanceStore.initRemittances()
  projectStore.initProjects()
  projects.value = projectStore.getAllProjects()

  // 从路由参数获取预选的发票或汇款
  if (route.query.invoiceIds) {
    const ids = Array.isArray(route.query.invoiceIds)
      ? route.query.invoiceIds
      : [route.query.invoiceIds]
    selectedInvoices.value = ids
      .map(id => invoiceStore.getInvoiceById(id as string))
      .filter(Boolean) as Invoice[]
    form.invoiceIds = selectedInvoices.value.map(inv => inv.id)
  }

  if (route.query.remittanceId) {
    form.type = '汇款报销'
    form.remittanceId = route.query.remittanceId as string
    handleRemittanceChange(form.remittanceId)
  }

  if (route.query.type) {
    form.type = route.query.type as '普通报销' | '汇款报销'
  }
})
</script>

<style scoped lang="css">
.reimbursement-form {
  padding: 0;
}

.invoice-selector {
  width: 100%;
}

.selected-invoices {
  margin-top: 16px;
}

.selected-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 3px solid #409eff;
}

.summary-text {
  font-size: 14px;
  color: #606266;
}

.summary-text strong {
  color: #409eff;
  font-weight: 600;
}

.summary-amount {
  font-size: 16px;
  color: #303133;
}

.summary-amount strong {
  color: #409eff;
  font-size: 18px;
  font-weight: 700;
}

.invoice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.invoice-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.invoice-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  transform: translateY(-1px);
}

.invoice-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invoice-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.invoice-number {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.invoice-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
}

.invoice-date {
  color: #909399;
}

.invoice-amount {
  color: #409eff;
  font-weight: 600;
  font-size: 14px;
}

.remove-btn {
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.remove-btn:hover {
  opacity: 1;
}

.selected-info {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.selected-info p {
  margin: 5px 0;
}
</style>
