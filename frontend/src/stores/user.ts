import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '@/utils/storage'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(storage.get<User>('user') || null)
  const token = ref<string>(storage.get<string>('token') || '')

  // 登录
  function login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      // 模拟登录验证
      if (username === 'admin' && password === '123456') {
        const userData: User = {
          id: '1',
          username: 'admin',
          name: '管理员',
          role: 'admin',
          department: '财务部'
        }
        user.value = userData
        token.value = 'mock_token_' + Date.now()
        storage.set('user', userData)
        storage.set('token', token.value)
        resolve(true)
      } else if (username === 'user' && password === '123456') {
        const userData: User = {
          id: '2',
          username: 'user',
          name: '普通用户',
          role: 'user',
          department: '技术部'
        }
        user.value = userData
        token.value = 'mock_token_' + Date.now()
        storage.set('user', userData)
        storage.set('token', token.value)
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }

  // 登出
  function logout(): void {
    user.value = null
    token.value = ''
    storage.remove('user')
    storage.remove('token')
  }

  // 初始化用户信息
  function initUser(): void {
    const savedUser = storage.get<User>('user')
    const savedToken = storage.get<string>('token')
    if (savedUser && savedToken) {
      user.value = savedUser
      token.value = savedToken
    }
  }

  return {
    user,
    token,
    login,
    logout,
    initUser
  }
})
