import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '@/utils/storage'
import { generateId, generateAllowancePersons } from '@/utils/mock'
import dayjs from 'dayjs'
import type { AllowancePerson, AllowanceRecord } from '@/types'

export const useAllowanceStore = defineStore('allowance', () => {
  const persons = ref<AllowancePerson[]>(storage.get<AllowancePerson[]>('allowance_persons') || generateAllowancePersons())
  const records = ref<AllowanceRecord[]>(storage.get<AllowanceRecord[]>('allowance_records') || [])

  function savePersons(): void {
    storage.set('allowance_persons', persons.value)
  }

  function saveRecords(): void {
    storage.set('allowance_records', records.value)
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
        addRecord({
          personId,
          personName: person.name,
          department: person.department,
          amount: person.standardAmount,
          method,
          allowanceType: person.allowanceType || allowanceType
        })
      }
    })
  }

  function initAllowance(): void {
    const savedPersons = storage.get<AllowancePerson[]>('allowance_persons')
    const savedRecords = storage.get<AllowanceRecord[]>('allowance_records')
    if (!savedPersons || savedPersons.length === 0) {
      persons.value = generateAllowancePersons()
      savePersons()
    } else {
      persons.value = savedPersons
    }
    if (savedRecords) {
      records.value = savedRecords
    }
  }

  return {
    persons,
    records,
    addPerson,
    updatePerson,
    deletePerson,
    addRecord,
    batchAddRecords,
    initAllowance
  }
})
