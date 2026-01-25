import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'
import { generateId, generateSalaryDeclarations, generateSalaryPayments } from '@/utils/mock'
import type { SalaryDeclaration, SalaryPayment } from '@/types'

export const useSalaryStore = defineStore('salary', () => {
  const declarations = ref<SalaryDeclaration[]>(storage.get<SalaryDeclaration[]>('salary_declarations') || [])
  const payments = ref<SalaryPayment[]>(storage.get<SalaryPayment[]>('salary_payments') || [])

  function saveDeclarations(): void {
    storage.set('salary_declarations', declarations.value)
  }

  function savePayments(): void {
    storage.set('salary_payments', payments.value)
  }

  const allDeclarations = computed(() => declarations.value)

  const allPayments = computed(() => payments.value)

  function getDeclarationById(id: string): SalaryDeclaration | undefined {
    return declarations.value.find(dec => dec.id === id)
  }

  function addDeclaration(declaration: Omit<SalaryDeclaration, 'id' | 'createTime'>): void {
    const newDeclaration: SalaryDeclaration = {
      ...declaration,
      id: generateId(),
      createTime: new Date().toISOString()
    }
    declarations.value.push(newDeclaration)
    saveDeclarations()
  }

  function updateDeclaration(id: string, updates: Partial<SalaryDeclaration>): void {
    const index = declarations.value.findIndex(dec => dec.id === id)
    if (index !== -1) {
      declarations.value[index] = { ...declarations.value[index], ...updates }
      saveDeclarations()
    }
  }

  function deleteDeclaration(id: string): void {
    const index = declarations.value.findIndex(dec => dec.id === id)
    if (index !== -1) {
      declarations.value.splice(index, 1)
      saveDeclarations()
    }
  }

  function addPayment(declarationId: string): void {
    const declaration = declarations.value.find(dec => dec.id === declarationId)
    if (declaration) {
      const payment: SalaryPayment = {
        id: generateId(),
        declarationId,
        month: declaration.month,
        totalAmount: declaration.totalAmount,
        employeeCount: declaration.employees.length,
        status: '待发放'
      }
      payments.value.push(payment)
      declaration.status = '已通过'
      savePayments()
      saveDeclarations()
    }
  }

  function confirmPayment(id: string): void {
    const payment = payments.value.find(p => p.id === id)
    if (payment) {
      payment.status = '已发放'
      payment.paymentTime = new Date().toISOString()
      const declaration = declarations.value.find(dec => dec.id === payment.declarationId)
      if (declaration) {
        declaration.status = '已发放'
      }
      savePayments()
      saveDeclarations()
    }
  }

  function approveDeclaration(id: string): void {
    const declaration = declarations.value.find(dec => dec.id === id)
    if (declaration) {
      declaration.status = '已通过'
      saveDeclarations()
      // 自动创建发放记录
      addPayment(id)
    }
  }

  function rejectDeclaration(id: string, reason: string): void {
    const declaration = declarations.value.find(dec => dec.id === id)
    if (declaration) {
      declaration.status = '待审核' // 保持待审核状态，实际项目可添加"已驳回"状态
      // 可以在这里记录驳回原因
      saveDeclarations()
    }
  }

  function initSalary(): void {
    const savedDeclarations = storage.get<SalaryDeclaration[]>('salary_declarations')
    const savedPayments = storage.get<SalaryPayment[]>('salary_payments')
    
    if (!savedDeclarations || savedDeclarations.length === 0) {
      // 生成初始 mock 数据
      declarations.value = generateSalaryDeclarations()
      payments.value = generateSalaryPayments(declarations.value)
      saveDeclarations()
      savePayments()
    } else {
      declarations.value = savedDeclarations
      payments.value = savedPayments || []
    }
  }

  return {
    declarations,
    payments,
    allDeclarations,
    allPayments,
    getDeclarationById,
    addDeclaration,
    updateDeclaration,
    deleteDeclaration,
    addPayment,
    confirmPayment,
    approveDeclaration,
    rejectDeclaration,
    initSalary
  }
})
