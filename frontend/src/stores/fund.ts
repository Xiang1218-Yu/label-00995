import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'
import { generateId, generateFunds } from '@/utils/mock'
import type { Fund, FundRecord } from '@/types'

export const useFundStore = defineStore('fund', () => {
  const funds = ref<Fund[]>(storage.get<Fund[]>('funds') || generateFunds())

  function saveFunds(): void {
    storage.set('funds', funds.value)
  }

  const allFunds = computed(() => funds.value)

  const totalFunds = computed(() => {
    return funds.value.reduce((sum, fund) => sum + fund.totalAmount, 0)
  })

  const totalReceived = computed(() => {
    return funds.value.reduce((sum, fund) => sum + fund.receivedAmount, 0)
  })

  const totalUsed = computed(() => {
    return funds.value.reduce((sum, fund) => sum + fund.usedAmount, 0)
  })

  const totalRemaining = computed(() => {
    return funds.value.reduce((sum, fund) => sum + fund.remainingAmount, 0)
  })

  function getFundById(id: string): Fund | undefined {
    return funds.value.find(fund => fund.id === id)
  }

  function addFund(fund: Omit<Fund, 'id' | 'records'>): void {
    funds.value.push({
      ...fund,
      id: generateId(),
      records: []
    })
    saveFunds()
  }

  function updateFund(id: string, updates: Partial<Fund>): void {
    const index = funds.value.findIndex(fund => fund.id === id)
    if (index !== -1) {
      funds.value[index] = { ...funds.value[index], ...updates }
      saveFunds()
    }
  }

  function addFundRecord(fundId: string, record: Omit<FundRecord, 'id' | 'time'>): void {
    const fund = funds.value.find(f => f.id === fundId)
    if (fund) {
      const newRecord: FundRecord = {
        ...record,
        id: generateId(),
        time: new Date().toISOString()
      }
      fund.records.push(newRecord)
      fund.usedAmount += record.amount
      fund.remainingAmount = fund.receivedAmount - fund.usedAmount
      saveFunds()
    }
  }

  function initFunds(): void {
    const saved = storage.get<Fund[]>('funds')
    if (!saved || saved.length === 0) {
      funds.value = generateFunds()
      saveFunds()
    } else {
      funds.value = saved
    }
  }

  return {
    funds,
    allFunds,
    totalFunds,
    totalReceived,
    totalUsed,
    totalRemaining,
    getFundById,
    addFund,
    updateFund,
    addFundRecord,
    initFunds
  }
})
