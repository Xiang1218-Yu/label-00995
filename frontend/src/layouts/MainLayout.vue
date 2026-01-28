<template>
  <el-container class="layout-container">
    <!-- 移动端遮罩层 -->
    <div v-if="isMobile && drawerVisible" class="drawer-mask" @click="closeDrawer"></div>
    
    <!-- 侧边栏 -->
    <el-aside 
      :width="sidebarWidth" 
      class="sidebar"
      :class="{ 'sidebar-mobile': isMobile, 'sidebar-visible': isMobile && drawerVisible }"
    >
      <div class="logo">
        <span v-if="!isCollapse && !isMobile">智慧财务系统</span>
        <span v-else>财务</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse || isMobile"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        @select="handleMenuSelect"
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
          <el-icon class="collapse-icon" @click="handleMenuToggle">
            <Menu v-if="isMobile" />
            <Fold v-else-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/" class="breadcrumb">
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
            class="dark-switch"
          />
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              <span class="user-name">{{ userStore.user?.name }}</span>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Fold, Expand, User, ArrowDown, Menu, Odometer, Document, Money, CreditCard, Wallet, Coin, TrendCharts } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const isDark = ref(false)
const drawerVisible = ref(false)
const isMobile = ref(false)

// 检测屏幕尺寸
function checkMobile(): void {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    drawerVisible.value = false
  }
}

// 菜单切换
function handleMenuToggle(): void {
  if (isMobile.value) {
    drawerVisible.value = !drawerVisible.value
  } else {
    toggleCollapse()
  }
}

// 关闭抽屉
function closeDrawer(): void {
  drawerVisible.value = false
}

// 菜单选择后关闭抽屉
function handleMenuSelect(): void {
  if (isMobile.value) {
    drawerVisible.value = false
  }
}

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

// 侧边栏宽度
const sidebarWidth = computed(() => {
  if (isMobile.value) {
    return '64px'
  }
  return isCollapse.value ? '64px' : '200px'
})

// 菜单顺序
const menuOrder = [
  '/dashboard',
  '/invoice',
  '/remittance',
  '/reimbursement',
  '/allowance',
  '/salary/declaration',
  '/salary/payment',
  '/fund'
]

// 菜单路由（过滤掉隐藏的路由和无权限的路由）
const menuRoutes = computed(() => {
  const routes = router.getRoutes()
  const userRole = userStore.user?.role || ''
  const filtered = routes.filter(r => {
    // 过滤基础条件
    if (r.path === '/' || r.path === '/login' || r.meta?.hidden) return false
    // 只显示有图标的菜单项（即主菜单）
    if (!r.meta?.icon) return false
    
    // 权限过滤
    const roles = r.meta?.roles as string[] | undefined
    if (roles && !roles.includes(userRole)) return false
    
    return true
  })
  
  // 按预定义顺序排序
  return filtered.sort((a, b) => {
    const indexA = menuOrder.indexOf(a.path)
    const indexB = menuOrder.indexOf(b.path)
    return indexA - indexB
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
  
  // 检测屏幕尺寸
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped lang="css">
.layout-container {
  height: 100vh;
  position: relative;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s, transform 0.3s;
  overflow: hidden;
  z-index: 1000;
}

.sidebar-mobile {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1001;
  transform: translateX(-100%);
  width: 64px !important;
}

.sidebar-mobile.sidebar-visible {
  transform: translateX(0);
}

.sidebar-mobile .logo {
  font-size: 14px;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-mobile :deep(.el-menu--collapse) {
  width: 64px;
}

.sidebar-mobile :deep(.el-menu-item) {
  padding: 0 20px !important;
}

.sidebar-mobile :deep(.el-tooltip__trigger) {
  display: flex !important;
  align-items: center;
  justify-content: center;
}

.drawer-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  transition: opacity 0.3s;
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
  z-index: 999;
}

.dark .header {
  background-color: #1f1f1f;
  color: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 0;
}

.collapse-icon {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
  flex-shrink: 0;
}

.dark .collapse-icon {
  color: #bfcbd9;
}

.breadcrumb {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
  white-space: nowrap;
}

.dark .user-info {
  color: #bfcbd9;
}

.user-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.dark .main-content {
  background-color: #141414;
}

/* 移动端响应式 */
@media screen and (max-width: 768px) {
  .header {
    padding: 0 12px;
  }

  .header-left {
    gap: 12px;
  }

  .header-right {
    gap: 8px;
  }

  .user-name {
    display: none;
  }

  .dark-switch {
    display: none;
  }

  .breadcrumb {
    font-size: 12px;
  }

  .main-content {
    padding: 12px;
  }
}

@media screen and (max-width: 480px) {
  .header {
    padding: 0 8px;
  }

  .header-left {
    gap: 8px;
  }

  .breadcrumb :deep(.el-breadcrumb__item) {
    font-size: 12px;
  }

  .main-content {
    padding: 8px;
  }
}
</style>
