import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '@/utils/storage'
import { generateId, generateAllowancePersons, generateAllowanceRules } from '@/utils/mock'
import dayjs from 'dayjs'
import type { AllowancePerson, AllowanceRecord, AllowanceRule, AllowanceRuleConfig } from '@/types'

export const useAllowanceStore = defineStore('allowance', () => {
  const persons = ref<AllowancePerson[]>(storage.get<AllowancePerson[]>('allowance_persons') || generateAllowancePersons())
  const records = ref<AllowanceRecord[]>(storage.get<AllowanceRecord[]>('allowance_records') || [])
  const rules = ref<AllowanceRule[]>(storage.get<AllowanceRule[]>('allowance_rules') || [])

  function savePersons(): void {
    storage.set('allowance_persons', persons.value)
  }

  function saveRecords(): void {
    storage.set('allowance_records', records.value)
  }

  function saveRules(): void {
    storage.set('allowance_rules', rules.value)
  }

  function addPerson(person: Omit<AllowancePerson, 'id'>): void {
    persons.value.push({
      ...person,
      id: generateId()
    })
    savePersons()
  }

  function updatePerson(id: string, updates: Partial<AllowancePerson>): void {
    const index = persons.value.findIndex(p => p.id === id)
    if (index !== -1) {
      persons.value[index] = { ...persons.value[index], ...updates }
      savePersons()
    }
  }

  function deletePerson(id: string): void {
    const index = persons.value.findIndex(p => p.id === id)
    if (index !== -1) {
      persons.value.splice(index, 1)
      savePersons()
    }
  }

  function addRecord(record: Omit<AllowanceRecord, 'id' | 'time'>): void {
    const person = persons.value.find(p => p.id === record.personId)
    records.value.push({
      ...record,
      id: generateId(),
      time: new Date().toISOString(),
      personName: person?.name || '',
      department: person?.department || ''
    })
    saveRecords()
  }

  function batchAddRecords(personIds: string[], method: string, allowanceType: string): void {
    personIds.forEach(personId => {
      const person = persons.value.find(p => p.id === personId)
      if (person) {
        // 尝试根据规则计算金额
        const calculatedAmount = calculateAllowanceByRule(person, allowanceType)
        addRecord({
          personId,
          personName: person.name,
          department: person.department,
          amount: calculatedAmount,
          method,
          allowanceType: person.allowanceType || allowanceType
        })
      }
    })
  }

  // 根据规则计算津贴金额
  function calculateAllowanceByRule(person: AllowancePerson, allowanceType: string): number {
    // 查找适用的规则
    const applicableRule = rules.value.find(rule => 
      rule.enabled && 
      rule.allowanceType === allowanceType &&
      rule.config &&
      (rule.config.departments?.length === 0 || 
       !rule.config.departments || 
       rule.config.departments.includes(person.department))
    )

    if (!applicableRule) {
      return person.standardAmount
    }

    let amount = person.standardAmount

    switch (applicableRule.type) {
      case 'fixed':
        amount = applicableRule.config.fixedAmount || person.standardAmount
        break
      case 'project':
        const multiplier = applicableRule.config.projectMultiplier || 1
        amount = (applicableRule.config.baseAmount || person.standardAmount) * multiplier
        break
      case 'performance':
        const ratio = (applicableRule.config.performanceRatio || 100) / 100
        amount = (applicableRule.config.baseAmount || person.standardAmount) * ratio
        break
      case 'attendance':
        const days = applicableRule.config.attendanceDays || 22
        const perDay = applicableRule.config.perDayAmount || (person.standardAmount / 22)
        amount = days * perDay
        break
    }

    // 应用最大最小值限制
    if (applicableRule.config.maxAmount && amount > applicableRule.config.maxAmount) {
      amount = applicableRule.config.maxAmount
    }
    if (applicableRule.config.minAmount && amount < applicableRule.config.minAmount) {
      amount = applicableRule.config.minAmount
    }

    return amount
  }

  // 添加规则
  function addRule(rule: Omit<AllowanceRule, 'id' | 'createTime' | 'updateTime'>): void {
    const now = new Date().toISOString()
    rules.value.push({
      ...rule,
      id: generateId(),
      createTime: now,
      updateTime: now
    })
    saveRules()
  }

  // 更新规则
  function updateRule(id: string, updates: Partial<AllowanceRule>): void {
    const index = rules.value.findIndex(r => r.id === id)
    if (index !== -1) {
      const updatedRule = { 
        ...rules.value[index], 
        ...updates,
        updateTime: new Date().toISOString()
      }
      // 确保config属性存在
      if (!updatedRule.config) {
        updatedRule.config = {
          fixedAmount: 500,
          minAmount: 0,
          effectiveDate: dayjs().format('YYYY-MM-DD'),
          departments: []
        }
      }
      rules.value[index] = updatedRule
      saveRules()
    }
  }

  // 删除规则
  function deleteRule(id: string): void {
    const index = rules.value.findIndex(r => r.id === id)
    if (index !== -1) {
      rules.value.splice(index, 1)
      saveRules()
    }
  }

  // 切换规则启用状态
  function toggleRuleEnabled(id: string): void {
    const rule = rules.value.find(r => r.id === id)
    if (rule) {
      rule.enabled = !rule.enabled
      rule.updateTime = new Date().toISOString()
      saveRules()
    }
  }

  // 确保规则有默认配置
  function ensureRuleConfig(rule: AllowanceRule): AllowanceRule {
    if (!rule.config) {
      rule.config = {
        fixedAmount: 500,
        minAmount: 0,
        effectiveDate: dayjs().format('YYYY-MM-DD'),
        departments: []
      }
    }
    return rule
  }

  function initAllowance(): void {
    const savedPersons = storage.get<AllowancePerson[]>('allowance_persons')
    const savedRecords = storage.get<AllowanceRecord[]>('allowance_records')
    const savedRules = storage.get<AllowanceRule[]>('allowance_rules')

    if (!savedPersons || savedPersons.length === 0) {
      persons.value = generateAllowancePersons()
      savePersons()
    } else {
      persons.value = savedPersons
    }

    if (savedRecords) {
      records.value = savedRecords
    }

    if (!savedRules || savedRules.length === 0) {
      rules.value = generateAllowanceRules()
      saveRules()
    } else {
      // 确保所有规则都有config属性
      rules.value = savedRules.map(ensureRuleConfig)
      saveRules()
    }
  }

  return {
    persons,
    records,
    rules,
    addPerson,
    updatePerson,
    deletePerson,
    addRecord,
    batchAddRecords,
    addRule,
    updateRule,
    deleteRule,
    toggleRuleEnabled,
    calculateAllowanceByRule,
    initAllowance
  }
})
