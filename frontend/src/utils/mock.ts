import dayjs from 'dayjs'
import type { Invoice, Remittance, Reimbursement, AllowancePerson, AllowanceRecord, AllowanceRule, SalaryDeclaration, Fund, Project } from '@/types'

/**
 * 生成随机ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 生成发票Mock数据
 */
export function generateInvoices(): Invoice[] {
  const types: Array<'住宿' | '餐饮' | '其他'> = ['住宿', '餐饮', '其他']
  const statuses: Array<'未报销' | '已报销'> = ['未报销', '已报销']
  const uploaders = ['张三', '李四', '王五', '赵六', '钱七', '孙八']
  const companies = ['北京科技酒店', '上海商务酒店', '深圳餐饮集团', '广州服务公司', '杭州贸易公司']
  
  const invoices: Invoice[] = []
  for (let i = 0; i < 25; i++) {
    const date = dayjs().subtract(Math.floor(Math.random() * 90), 'day').format('YYYY-MM-DD')
    invoices.push({
      id: generateId(),
      invoiceNumber: `INV${String(i + 1).padStart(6, '0')}`,
      invoiceDate: date,
      amount: Math.round((Math.random() * 5000 + 100) * 100) / 100,
      type: types[Math.floor(Math.random() * types.length)],
      uploader: uploaders[Math.floor(Math.random() * uploaders.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createTime: dayjs().subtract(Math.floor(Math.random() * 90), 'day').toISOString()
    })
  }
  return invoices
}

/**
 * 生成汇款Mock数据
 */
export function generateRemittances(): Remittance[] {
  const companies = ['北京科技发展有限公司', '上海创新科技有限公司', '深圳智慧产业集团', '广州科技孵化器', '杭州数字科技公司']
  const purposes = ['项目启动资金', '设备采购款', '运营费用', '研发经费', '市场推广费']
  const projects = ['科技孵化项目A', '智慧园区建设', '创新研发项目', '数字化转型项目']
  
  const remittances: Remittance[] = []
  for (let i = 0; i < 15; i++) {
    const date = dayjs().subtract(Math.floor(Math.random() * 60), 'day').format('YYYY-MM-DD')
    remittances.push({
      id: generateId(),
      company: companies[Math.floor(Math.random() * companies.length)],
      amount: Math.round((Math.random() * 100000 + 10000) * 100) / 100,
      purpose: purposes[Math.floor(Math.random() * purposes.length)],
      date,
      projectId: `project_${Math.floor(Math.random() * projects.length) + 1}`,
      status: Math.random() > 0.5 ? '待报销' : '已报销',
      createTime: dayjs().subtract(Math.floor(Math.random() * 60), 'day').toISOString()
    })
  }
  return remittances
}

/**
 * 生成项目Mock数据
 */
export function generateProjects(): Project[] {
  return [
    { id: 'project_1', name: '科技孵化项目A', code: 'PROJ001' },
    { id: 'project_2', name: '智慧园区建设', code: 'PROJ002' },
    { id: 'project_3', name: '创新研发项目', code: 'PROJ003' },
    { id: 'project_4', name: '数字化转型项目', code: 'PROJ004' },
    { id: 'project_5', name: '人才培养计划', code: 'PROJ005' }
  ]
}

/**
 * 生成津贴人员Mock数据
 */
export function generateAllowancePersons(): AllowancePerson[] {
  const departments = ['技术部', '市场部', '财务部', '人事部', '运营部', '研发部']
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑一', '王二', '李三', '张四', '刘五', '陈六', '杨七', '黄八', '周九', '吴十', '徐一', '朱二']
  const types = ['交通补贴', '餐补', '通讯补贴', '住房补贴']
  
  return names.map((name, index) => ({
    id: generateId(),
    name,
    department: departments[index % departments.length],
    standardAmount: Math.round((Math.random() * 1000 + 500) * 100) / 100,
    allowanceType: types[index % types.length]
  }))
}

/**
 * 生成津贴发放规则Mock数据
 */
export function generateAllowanceRules(): AllowanceRule[] {
  const now = new Date().toISOString()
  
  return [
    {
      id: generateId(),
      name: '交通补贴固定标准',
      type: 'fixed',
      allowanceType: '交通补贴',
      description: '每月固定发放500元交通补贴，适用于所有部门员工',
      enabled: true,
      config: {
        fixedAmount: 500,
        minAmount: 0,
        maxAmount: 800,
        effectiveDate: dayjs().subtract(6, 'month').format('YYYY-MM-DD'),
        departments: []
      },
      createTime: dayjs().subtract(6, 'month').toISOString(),
      updateTime: now
    },
    {
      id: generateId(),
      name: '餐补出勤计算规则',
      type: 'attendance',
      allowanceType: '餐补',
      description: '根据实际出勤天数计算餐补，每日25元，最多22天',
      enabled: true,
      config: {
        perDayAmount: 25,
        attendanceDays: 22,
        minAmount: 0,
        maxAmount: 550,
        effectiveDate: dayjs().subtract(3, 'month').format('YYYY-MM-DD'),
        departments: []
      },
      createTime: dayjs().subtract(3, 'month').toISOString(),
      updateTime: now
    },
    {
      id: generateId(),
      name: '通讯补贴按项目系数',
      type: 'project',
      allowanceType: '通讯补贴',
      description: '基础200元，按参与项目数量乘以系数1.5计算',
      enabled: true,
      config: {
        baseAmount: 200,
        projectMultiplier: 1.5,
        minAmount: 200,
        maxAmount: 600,
        effectiveDate: dayjs().subtract(2, 'month').format('YYYY-MM-DD'),
        departments: ['技术部', '研发部']
      },
      createTime: dayjs().subtract(2, 'month').toISOString(),
      updateTime: now
    },
    {
      id: generateId(),
      name: '住房补贴绩效关联',
      type: 'performance',
      allowanceType: '住房补贴',
      description: '基础1000元，按绩效考核结果的80%发放',
      enabled: false,
      config: {
        baseAmount: 1000,
        performanceRatio: 80,
        minAmount: 500,
        maxAmount: 2000,
        effectiveDate: dayjs().format('YYYY-MM-DD'),
        departments: []
      },
      createTime: dayjs().subtract(1, 'month').toISOString(),
      updateTime: now
    },
    {
      id: generateId(),
      name: '研发部特殊津贴',
      type: 'fixed',
      allowanceType: '交通补贴',
      description: '研发部额外交通补贴，每月固定800元',
      enabled: true,
      config: {
        fixedAmount: 800,
        minAmount: 0,
        maxAmount: 1000,
        effectiveDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        departments: ['研发部']
      },
      createTime: dayjs().subtract(1, 'month').toISOString(),
      updateTime: now
    },
    {
      id: generateId(),
      name: '高温津贴',
      type: 'attendance',
      allowanceType: '其他',
      description: '夏季高温津贴，每出勤日15元，6-9月生效',
      enabled: false,
      config: {
        perDayAmount: 15,
        attendanceDays: 22,
        minAmount: 0,
        maxAmount: 330,
        effectiveDate: dayjs().month(5).format('YYYY-MM-DD'),
        expiryDate: dayjs().month(8).endOf('month').format('YYYY-MM-DD'),
        departments: []
      },
      createTime: dayjs().subtract(7, 'day').toISOString(),
      updateTime: now
    }
  ]
}

/**
 * 生成资金Mock数据
 */
export function generateFunds(): Fund[] {
  const funds: Fund[] = [
    {
      id: 'fund_1',
      name: '科技扶持资金',
      type: '扶持资金',
      totalAmount: 5000000,
      receivedAmount: 5000000,
      usedAmount: 3200000,
      remainingAmount: 1800000,
      records: []
    },
    {
      id: 'fund_2',
      name: '园区建设经费',
      type: '建设经费',
      totalAmount: 3000000,
      receivedAmount: 2500000,
      usedAmount: 1800000,
      remainingAmount: 700000,
      records: []
    },
    {
      id: 'fund_3',
      name: '运营维护经费',
      type: '运营经费',
      totalAmount: 2000000,
      receivedAmount: 2000000,
      usedAmount: 1200000,
      remainingAmount: 800000,
      records: []
    }
  ]
  return funds
}


/**
 * 生成薪酬申报Mock数据
 */
export function generateSalaryDeclarations(): SalaryDeclaration[] {
  const departments = ['技术部', '市场部', '财务部', '人事部', '运营部', '研发部']
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑一', '王二']
  
  const declarations: SalaryDeclaration[] = []
  
  // 生成最近3个月的申报数据
  for (let m = 0; m < 3; m++) {
    const month = dayjs().subtract(m, 'month').format('YYYY-MM')
    const employees = names.map((name, index) => {
      const baseSalary = Math.round((8000 + Math.random() * 12000) * 100) / 100
      const performance = Math.round((1000 + Math.random() * 5000) * 100) / 100
      const deduction = Math.round((Math.random() * 500) * 100) / 100
      return {
        id: generateId(),
        name,
        department: departments[index % departments.length],
        baseSalary,
        performance,
        deduction,
        total: baseSalary + performance - deduction
      }
    })
    
    const totalAmount = employees.reduce((sum, emp) => sum + emp.total, 0)
    const statuses: Array<'待审核' | '已通过' | '已发放'> = ['待审核', '已通过', '已发放']
    
    declarations.push({
      id: generateId(),
      month,
      declarant: '管理员',
      totalAmount,
      status: m === 0 ? '待审核' : (m === 1 ? '已通过' : '已发放'),
      employees,
      createTime: dayjs().subtract(m, 'month').toISOString()
    })
  }
  
  return declarations
}

/**
 * 生成薪酬发放Mock数据
 */
export function generateSalaryPayments(declarations: SalaryDeclaration[]): import('@/types').SalaryPayment[] {
  return declarations
    .filter(dec => dec.status === '已通过' || dec.status === '已发放')
    .map(dec => ({
      id: generateId(),
      declarationId: dec.id,
      month: dec.month,
      totalAmount: dec.totalAmount,
      employeeCount: dec.employees.length,
      status: dec.status === '已发放' ? '已发放' as const : '待发放' as const,
      paymentTime: dec.status === '已发放' ? dayjs().subtract(1, 'month').toISOString() : undefined
    }))
}
