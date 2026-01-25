import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'
import { generateId, generateInvoices } from '@/utils/mock'
import type { Invoice } from '@/types'

export const useInvoiceStore = defineStore('invoice', () => {
  const invoices = ref<Invoice[]>(storage.get<Invoice[]>('invoices') || generateInvoices())

  // 保存到localStorage
  function saveInvoices(): void {
    storage.set('invoices', invoices.value)
  }

  // 获取所有发票
  const allInvoices = computed(() => invoices.value)

  // 获取未报销发票
  const unreimbursedInvoices = computed(() => 
    invoices.value.filter(inv => inv.status === '未报销')
  )

  // 根据ID获取发票
  function getInvoiceById(id: string): Invoice | undefined {
    return invoices.value.find(inv => inv.id === id)
  }

  // 添加发票
  function addInvoice(invoice: Omit<Invoice, 'id' | 'createTime'>): void {
    const newInvoice: Invoice = {
      ...invoice,
      id: generateId(),
      createTime: new Date().toISOString()
    }
    invoices.value.push(newInvoice)
    saveInvoices()
  }

  // 更新发票
  function updateInvoice(id: string, updates: Partial<Invoice>): void {
    const index = invoices.value.findIndex(inv => inv.id === id)
    if (index !== -1) {
      invoices.value[index] = { ...invoices.value[index], ...updates }
      saveInvoices()
    }
  }

  // 删除发票
  function deleteInvoice(id: string): void {
    const index = invoices.value.findIndex(inv => inv.id === id)
    if (index !== -1) {
      invoices.value.splice(index, 1)
      saveInvoices()
    }
  }

  // 批量更新发票状态
  function updateInvoiceStatus(ids: string[], status: '未报销' | '已报销'): void {
    ids.forEach(id => {
      const invoice = invoices.value.find(inv => inv.id === id)
      if (invoice) {
        invoice.status = status
      }
    })
    saveInvoices()
  }

  // 初始化数据
  function initInvoices(): void {
    const saved = storage.get<Invoice[]>('invoices')
    if (!saved || saved.length === 0) {
      invoices.value = generateInvoices()
      saveInvoices()
    } else {
      invoices.value = saved
    }
  }

  return {
    invoices,
    allInvoices,
    unreimbursedInvoices,
    getInvoiceById,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    initInvoices
  }
})
