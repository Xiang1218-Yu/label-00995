<template>
  <div class="reimbursement-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>报销详情</span>
          <el-button v-if="reimbursement?.status === '待审核'" type="primary" @click="handleApproveClick">
            审批
          </el-button>
        </div>
      </template>

      <div v-if="reimbursement" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="单号">{{ reimbursement.reimbursementNumber }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ reimbursement.applicant }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="reimbursement.type === '普通报销' ? 'primary' : 'success'">
              {{ reimbursement.type }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="金额">
            <span class="amount">¥{{ reimbursement.amount.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(reimbursement.status)">
              {{ reimbursement.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="关联项目">
            {{ getProjectName(reimbursement.projectId) }}
          </el-descriptions-item>
          <el-descriptions-item label="说明" :span="2">
            {{ reimbursement.description }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ formatDate(reimbursement.createTime) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 关联发票 -->
        <div v-if="reimbursement.type === '普通报销' && reimbursement.invoiceIds" class="related-section">
          <h3>关联发票</h3>
          <el-table :data="relatedInvoices" style="width: 100%" table-layout="auto">
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
        </div>

        <!-- 关联汇款 -->
        <div v-if="reimbursement.type === '汇款报销' && reimbursement.remittanceId" class="related-section">
          <h3>关联汇款</h3>
          <el-descriptions :column="2" border v-if="relatedRemittance">
            <el-descriptions-item label="汇款单位">{{ relatedRemittance.company }}</el-descriptions-item>
            <el-descriptions-item label="金额">¥{{ relatedRemittance.amount.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="用途" :span="2">{{ relatedRemittance.purpose }}</el-descriptions-item>
            <el-descriptions-item label="日期">{{ relatedRemittance.date }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 审批历史 -->
        <div class="approval-section">
          <h3>审批历史</h3>
          <el-timeline>
            <el-timeline-item
              v-for="record in reimbursement.approvalHistory"
              :key="record.id"
              :timestamp="formatDate(record.time)"
              placement="top"
            >
              <el-card>
                <h4>{{ record.approver }} ({{ record.role }})</h4>
                <p>
                  <el-tag :type="record.action === '通过' ? 'success' : 'danger'">
                    {{ record.action }}
                  </el-tag>
                </p>
                <p v-if="record.comment">审批意见：{{ record.comment }}</p>
              </el-card>
            </el-timeline-item>
            <el-timeline-item v-if="reimbursement.approvalHistory.length === 0" timestamp="暂无审批记录">
              <p>暂无审批记录</p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-card>

    <!-- 审批对话框 -->
    <el-dialog
      v-model="showApproveDialog"
      title="审批报销"
      width="500px"
      @closed="handleApproveDialogClosed"
    >
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="审批操作">
          <el-radio-group v-model="approveForm.action">
            <el-radio label="通过">通过</el-radio>
            <el-radio label="驳回">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input
            v-model="approveForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入审批意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApproveDialog = false">取消</el-button>
        <el-button type="primary" @click="handleApprove">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useReimbursementStore } from '@/stores/reimbursement'
import { useInvoiceStore } from '@/stores/invoice'
import { useRemittanceStore } from '@/stores/remittance'
import { useProjectStore } from '@/stores/project'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const reimbursementStore = useReimbursementStore()
const invoiceStore = useInvoiceStore()
const remittanceStore = useRemittanceStore()
const projectStore = useProjectStore()
const userStore = useUserStore()

const showApproveDialog = ref(false)
const approveForm = reactive({
  action: '通过' as '通过' | '驳回',
  comment: ''
})

const reimbursement = computed(() => {
  if (route.params.id) {
    return reimbursementStore.getReimbursementById(route.params.id as string)
  }
  return null
})

const relatedInvoices = computed(() => {
  if (reimbursement.value?.invoiceIds) {
    return reimbursement.value.invoiceIds
      .map(id => invoiceStore.getInvoiceById(id))
      .filter(Boolean)
  }
  return []
})

const relatedRemittance = computed(() => {
  if (reimbursement.value?.remittanceId) {
    return remittanceStore.getRemittanceById(reimbursement.value.remittanceId)
  }
  return null
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

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

function handleApproveClick(): void {
  Object.assign(approveForm, {
    action: '通过' as '通过' | '驳回',
    comment: ''
  })
  showApproveDialog.value = true
}

function handleApproveDialogClosed(): void {
  Object.assign(approveForm, {
    action: '通过' as '通过' | '驳回',
    comment: ''
  })
}

function handleApprove(): void {
  if (!reimbursement.value) return

  // 根据审批历史确定当前审批角色
  const approvalCount = reimbursement.value.approvalHistory.length
  let role = '部门负责人'
  if (approvalCount === 1) {
    role = '财务'
  } else if (approvalCount === 2) {
    role = '园区领导'
  }

  reimbursementStore.approveReimbursement(
    reimbursement.value.id,
    userStore.user?.name || '审批人',
    role,
    approveForm.action,
    approveForm.comment
  )

  ElMessage.success('审批成功')
  showApproveDialog.value = false
  Object.assign(approveForm, {
    action: '通过' as '通过' | '驳回',
    comment: ''
  })
}

onMounted(() => {
  reimbursementStore.initReimbursements()
  invoiceStore.initInvoices()
  remittanceStore.initRemittances()
  projectStore.initProjects()
})
</script>

<style scoped lang="css">
.reimbursement-detail {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-content {
  padding: 20px 0;
}

.amount {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.related-section {
  margin-top: 30px;
}

.related-section h3 {
  margin-bottom: 15px;
  color: #303133;
}

.approval-section {
  margin-top: 30px;
}

.approval-section h3 {
  margin-bottom: 15px;
  color: #303133;
}
</style>
