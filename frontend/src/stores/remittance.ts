import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'
import { generateId, generateRemittances } from '@/utils/mock'
import type { Remittance } from '@/types'

export const useRemittanceStore = defineStore('remittance', () => {
  const remittances = ref<Remittance[]>(storage.get<Remittance[]>('remittances') || generateRemittances())

  function saveRemittances(): void {
    storage.set('remittances', remittances.value)
  }

  const allRemittances = computed(() => remittances.value)

  const unreimbursedRemittances = computed(() =>
    remittances.value.filter(rem => rem.status === '待报销')
  )

  function getRemittanceById(id: string): Remittance | undefined {
    return remittances.value.find(rem => rem.id === id)
  }

  function addRemittance(remittance: Omit<Remittance, 'id' | 'createTime'>): void {
    const newRemittance: Remittance = {
      ...remittance,
      id: generateId(),
      createTime: new Date().toISOString()
    }
    remittances.value.push(newRemittance)
    saveRemittances()
  }

  function updateRemittance(id: string, updates: Partial<Remittance>): void {
    const index = remittances.value.findIndex(rem => rem.id === id)
    if (index !== -1) {
      remittances.value[index] = { ...remittances.value[index], ...updates }
      saveRemittances()
    }
  }

  function deleteRemittance(id: string): void {
    const index = remittances.value.findIndex(rem => rem.id === id)
    if (index !== -1) {
      remittances.value.splice(index, 1)
      saveRemittances()
    }
  }

  function updateRemittanceStatus(id: string, status: '待报销' | '已报销'): void {
    const remittance = remittances.value.find(rem => rem.id === id)
    if (remittance) {
      remittance.status = status
      saveRemittances()
    }
  }

  function initRemittances(): void {
    const saved = storage.get<Remittance[]>('remittances')
    if (!saved || saved.length === 0) {
      remittances.value = generateRemittances()
      saveRemittances()
    } else {
      remittances.value = saved
    }
  }

  return {
    remittances,
    allRemittances,
    unreimbursedRemittances,
    getRemittanceById,
    addRemittance,
    updateRemittance,
    deleteRemittance,
    updateRemittanceStatus,
    initRemittances
  }
})
