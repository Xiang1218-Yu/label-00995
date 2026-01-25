<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <span v-if="!isCollapse">智慧财务系统</span>
        <span v-else>财务</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item
          v-for="route in menuRoutes"
          :key="route.path"
          :index="route.path"
        >
          <el-icon v-if="route.meta?.icon">
            <component :is="iconMap[route.meta.icon as string]" />
          </el-icon>
          <template #title>{{ route.meta?.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-icon" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta?.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-switch
            v-model="isDark"
            inline-prompt
            active-text="暗"
            inactive-text="亮"
            @change="toggleDark"
          />
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userStore.user?.name }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Fold, Expand, User, ArrowDown, Odometer, Document, Money, CreditCard, Wallet, Coin, TrendCharts } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const isDark = ref(false)

// 图标映射
const iconMap: Record<string, any> = {
  Odometer,
  Document,
  Money,
  CreditCard,
  Wallet,
  User,
  Coin,
  TrendCharts
}

const currentRoute = computed(() => route)
const activeMenu = computed(() => route.path)

// 菜单路由（过滤掉隐藏的路由和无权限的路由）
const menuRoutes = computed(() => {
  const routes = router.getRoutes()
  const userRole = userStore.user?.role || ''
  return routes.filter(r => {
    // 过滤基础条件
    if (r.path === '/' || r.path === '/login' || r.meta?.hidden) return false
    if (r.path.split('/').length !== 2) return false
    
    // 权限过滤
    const roles = r.meta?.roles as string[] | undefined
    if (roles && !roles.includes(userRole)) return false
    
    return true
  })
})

function toggleCollapse(): void {
  isCollapse.value = !isCollapse.value
}

function toggleDark(val: boolean): void {
  if (val) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

function handleCommand(command: string): void {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}

onMounted(() => {
  // 初始化暗黑模式
  const savedDark = localStorage.getItem('dark_mode')
  if (savedDark === 'true') {
    isDark.value = true
    toggleDark(true)
  }
})
</script>

<style scoped lang="css">
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #2b3a4a;
}

.el-menu {
  border-right: none;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

.header {
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.dark .header {
  background-color: #1f1f1f;
  color: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-icon {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.dark .collapse-icon {
  color: #bfcbd9;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.dark .user-info {
  color: #bfcbd9;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.dark .main-content {
  background-color: #141414;
}
</style>
