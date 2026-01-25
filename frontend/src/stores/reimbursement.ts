import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'
import { generateId } from '@/utils/mock'
import dayjs from 'dayjs'
import type { Reimbursement, ApprovalRecord } from '@/types'

export const useReimbursementStore = defineStore('reimbursement', () => {
  const reimbursements = ref<Reimbursement[]>(storage.get<Reimbursement[]>('reimbursements') || [])

  function saveReimbursements(): void {
    storage.set('reimbursements', reimbursements.value)
  }

  const allReimbursements = computed(() => reimbursements.value)

  const pendingReimbursements = computed(() =>
    reimbursements.value.filter(rem => rem.status === '待审核')
  )

  function getReimbursementById(id: string): Reimbursement | undefined {
    return reimbursements.value.find(rem => rem.id === id)
  }

  function addReimbursement(reimbursement: Omit<Reimbursement, 'id' | 'reimbursementNumber' | 'createTime' | 'approvalHistory' | 'status'>): void {
    const newReimbursement: Reimbursement = {
      ...reimbursement,
      id: generateId(),
      reimbursementNumber: `REIM${dayjs().format('YYYYMMDD')}${String(reimbursements.value.length + 1).padStart(4, '0')}`,
      createTime: new Date().toISOString(),
      status: '待审核',
      approvalHistory: []
    }
    reimbursements.value.push(newReimbursement)
    saveReimbursements()
  }

  function updateReimbursement(id: string, updates: Partial<Reimbursement>): void {
    const index = reimbursements.value.findIndex(rem => rem.id === id)
    if (index !== -1) {
      reimbursements.value[index] = { ...reimbursements.value[index], ...updates }
      saveReimbursements()
    }
  }

  function deleteReimbursement(id: string): void {
    const index = reimbursements.value.findIndex(rem => rem.id === id)
    if (index !== -1) {
      reimbursements.value.splice(index, 1)
      saveReimbursements()
    }
  }

  function approveReimbursement(id: string, approver: string, role: string, action: '通过' | '驳回', comment: string): void {
    const reimbursement = reimbursements.value.find(rem => rem.id === id)
    if (reimbursement) {
      const approvalRecord: ApprovalRecord = {
        id: generateId(),
        approver,
        role,
        action,
        comment,
        time: new Date().toISOString()
      }
      reimbursement.approvalHistory.push(approvalRecord)
      
      if (action === '通过') {
        // 多级审批逻辑
        const approvalCount = reimbursement.approvalHistory.filter(r => r.action === '通过').length
        if (approvalCount >= 3) {
          reimbursement.status = '已通过'
        }
      } else {
        reimbursement.status = '已驳回'
      }
      saveReimbursements()
    }
  }

  function initReimbursements(): void {
    const saved = storage.get<Reimbursement[]>('reimbursements')
    if (saved) {
      reimbursements.value = saved
    }
  }

  return {
    reimbursements,
    allReimbursements,
    pendingReimbursements,
    getReimbursementById,
    addReimbursement,
    updateReimbursement,
    deleteReimbursement,
    approveReimbursement,
    initReimbursements
  }
})
