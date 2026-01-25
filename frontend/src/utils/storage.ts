/**
 * localStorage 工具函数
 */
const STORAGE_PREFIX = 'finance_system_'

export const storage = {
  set(key: string, value: any): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch (error) {
      console.error('Storage set error:', error)
    }
  },

  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key)
      if (item === null) {
        return defaultValue
      }
      return JSON.parse(item) as T
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key)
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  },

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('Storage clear error:', error)
    }
  }
}
