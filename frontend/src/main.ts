import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import App from './App.vue'
import router from './router'
import './styles/index.css'
import { useUserStore } from './stores/user'
import { useInvoiceStore } from './stores/invoice'
import { useRemittanceStore } from './stores/remittance'
import { useReimbursementStore } from './stores/reimbursement'
import { useAllowanceStore } from './stores/allowance'
import { useSalaryStore } from './stores/salary'
import { useFundStore } from './stores/fund'
import { useProjectStore } from './stores/project'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 初始化stores
const userStore = useUserStore()
userStore.initUser()

const invoiceStore = useInvoiceStore()
invoiceStore.initInvoices()

const remittanceStore = useRemittanceStore()
remittanceStore.initRemittances()

const reimbursementStore = useReimbursementStore()
reimbursementStore.initReimbursements()

const allowanceStore = useAllowanceStore()
allowanceStore.initAllowance()

const salaryStore = useSalaryStore()
salaryStore.initSalary()

const fundStore = useFundStore()
fundStore.initFunds()

const projectStore = useProjectStore()
projectStore.initProjects()

app.mount('#app')
