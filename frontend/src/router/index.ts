import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'Odometer', roles: ['admin', 'user'] }
      },
      {
        path: 'invoice',
        name: 'Invoice',
        component: () => import('@/views/invoice/InvoiceList.vue'),
        meta: { title: '发票夹管理', icon: 'Document', roles: ['admin', 'user'] }
      },
      {
        path: 'invoice/add',
        name: 'InvoiceAdd',
        component: () => import('@/views/invoice/InvoiceForm.vue'),
        meta: { title: '新增发票', hidden: true, roles: ['admin', 'user'] }
      },
      {
        path: 'invoice/edit/:id',
        name: 'InvoiceEdit',
        component: () => import('@/views/invoice/InvoiceForm.vue'),
        meta: { title: '编辑发票', hidden: true, roles: ['admin', 'user'] }
      },
      {
        path: 'remittance',
        name: 'Remittance',
        component: () => import('@/views/remittance/RemittanceList.vue'),
        meta: { title: '汇款申请管理', icon: 'Money', roles: ['admin', 'user'] }
      },
      {
        path: 'remittance/add',
        name: 'RemittanceAdd',
        component: () => import('@/views/remittance/RemittanceForm.vue'),
        meta: { title: '新增汇款', hidden: true, roles: ['admin', 'user'] }
      },
      {
        path: 'remittance/edit/:id',
        name: 'RemittanceEdit',
        component: () => import('@/views/remittance/RemittanceForm.vue'),
        meta: { title: '编辑汇款', hidden: true, roles: ['admin', 'user'] }
      },
      {
        path: 'reimbursement',
        name: 'Reimbursement',
        component: () => import('@/views/reimbursement/ReimbursementList.vue'),
        meta: { title: '报销管理', icon: 'CreditCard', roles: ['admin', 'user'] }
      },
      {
        path: 'reimbursement/add',
        name: 'ReimbursementAdd',
        component: () => import('@/views/reimbursement/ReimbursementForm.vue'),
        meta: { title: '新增报销', hidden: true, roles: ['admin', 'user'] }
      },
      {
        path: 'reimbursement/detail/:id',
        name: 'ReimbursementDetail',
        component: () => import('@/views/reimbursement/ReimbursementDetail.vue'),
        meta: { title: '报销详情', hidden: true, roles: ['admin', 'user'] }
      },
      {
        path: 'allowance',
        name: 'Allowance',
        component: () => import('@/views/allowance/AllowanceList.vue'),
        meta: { title: '津贴发放管理', icon: 'Wallet', roles: ['admin'] }
      },
      {
        path: 'salary/declaration',
        name: 'SalaryDeclaration',
        component: () => import('@/views/salary/DeclarationList.vue'),
        meta: { title: '薪酬申报管理', icon: 'User', roles: ['admin'] }
      },
      {
        path: 'salary/declaration/add',
        name: 'SalaryDeclarationAdd',
        component: () => import('@/views/salary/DeclarationForm.vue'),
        meta: { title: '新增申报', hidden: true, roles: ['admin'] }
      },
      {
        path: 'salary/declaration/edit/:id',
        name: 'SalaryDeclarationEdit',
        component: () => import('@/views/salary/DeclarationForm.vue'),
        meta: { title: '编辑申报', hidden: true, roles: ['admin'] }
      },
      {
        path: 'salary/payment',
        name: 'SalaryPayment',
        component: () => import('@/views/salary/PaymentList.vue'),
        meta: { title: '薪酬发放管理', icon: 'Coin', roles: ['admin'] }
      },
      {
        path: 'fund',
        name: 'Fund',
        component: () => import('@/views/fund/FundOverview.vue'),
        meta: { title: '资金管理', icon: 'TrendCharts', roles: ['admin'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.path === '/login') {
    if (userStore.token) {
      next('/')
    } else {
      next()
    }
  } else {
    if (!userStore.token) {
      next('/login')
    } else {
      // 权限检查
      const roles = to.meta?.roles as string[] | undefined
      if (roles && userStore.user) {
        if (roles.includes(userStore.user.role)) {
          next()
        } else {
          next('/dashboard')
        }
      } else {
        next()
      }
    }
  }
})

export default router
