// 发票类型
export interface Invoice {
  id: string
  invoiceNumber: string // 发票号码
  invoiceDate: string // 开票日期
  amount: number // 金额
  type: '住宿' | '餐饮' | '其他' // 类型
  uploader: string // 上传人
  status: '未报销' | '已报销' // 状态
  projectId?: string // 关联项目
  createTime: string
}

// 汇款申请
export interface Remittance {
  id: string
  company: string // 汇款单位
  amount: number // 金额
  purpose: string // 用途
  date: string // 日期
  projectId: string // 关联项目
  status: '待报销' | '已报销' // 状态
  createTime: string
}

// 报销单
export interface Reimbursement {
  id: string
  reimbursementNumber: string // 单号
  applicant: string // 申请人
  type: '普通报销' | '汇款报销' // 类型
  amount: number // 金额
  status: '待审核' | '已通过' | '已驳回' // 状态
  projectId: string // 关联项目
  description: string // 说明
  invoiceIds?: string[] // 关联发票ID
  remittanceId?: string // 关联汇款ID
  approvalHistory: ApprovalRecord[] // 审批历史
  createTime: string
}

// 审批记录
export interface ApprovalRecord {
  id: string
  approver: string // 审批人
  role: string // 角色（部门负责人/财务/园区领导）
  action: '通过' | '驳回' // 操作
  comment: string // 审批意见
  time: string // 时间
}

// 津贴人员
export interface AllowancePerson {
  id: string
  name: string // 姓名
  department: string // 部门
  standardAmount: number // 标准金额
  allowanceType: string // 津贴类型
}

// 津贴发放记录
export interface AllowanceRecord {
  id: string
  personId: string
  personName: string
  department: string
  amount: number // 金额
  time: string // 时间
  method: string // 发放方式
  allowanceType: string // 津贴类型
}

// 津贴发放规则
export interface AllowanceRule {
  id: string
  name: string // 规则名称
  type: 'fixed' | 'project' | 'performance' | 'attendance' // 规则类型：固定金额、按项目计算、绩效关联、出勤关联
  allowanceType: string // 适用的津贴类型
  description: string // 规则说明
  enabled: boolean // 是否启用
  config: AllowanceRuleConfig // 规则配置
  createTime: string
  updateTime: string
}

// 津贴规则配置
export interface AllowanceRuleConfig {
  fixedAmount?: number // 固定金额（type为fixed时）
  projectMultiplier?: number // 项目系数（type为project时）
  performanceRatio?: number // 绩效比例（type为performance时，百分比）
  baseAmount?: number // 基础金额
  maxAmount?: number // 最大金额
  minAmount?: number // 最小金额
  attendanceDays?: number // 出勤天数要求（type为attendance时）
  perDayAmount?: number // 每日金额（type为attendance时）
  effectiveDate?: string // 生效日期
  expiryDate?: string // 失效日期
  departments?: string[] // 适用部门（空为全部）
}

// 薪酬申报
export interface SalaryDeclaration {
  id: string
  month: string // 月份（YYYY-MM）
  declarant: string // 申报人
  totalAmount: number // 总金额
  status: '待审核' | '已通过' | '已发放' // 状态
  employees: SalaryEmployee[] // 员工薪酬明细
  createTime: string
}

// 员工薪酬
export interface SalaryEmployee {
  id: string
  name: string // 姓名
  department: string // 部门
  baseSalary: number // 基本工资
  performance: number // 绩效
  deduction: number // 扣款
  total: number // 合计
}

// 薪酬发放记录
export interface SalaryPayment {
  id: string
  declarationId: string // 申报ID
  month: string // 月份
  totalAmount: number // 总金额
  employeeCount: number // 员工数
  status: '待发放' | '已发放' // 状态
  paymentTime?: string // 发放时间
}

// 资金
export interface Fund {
  id: string
  name: string // 资金名称
  type: '扶持资金' | '建设经费' | '运营经费' // 类型
  totalAmount: number // 总额
  receivedAmount: number // 已到款
  usedAmount: number // 已使用
  remainingAmount: number // 剩余
  projectId?: string // 关联项目
  records: FundRecord[] // 使用记录
}

// 资金使用记录
export interface FundRecord {
  id: string
  fundId: string
  type: '报销' | '薪酬' | '津贴' | '其他' // 类型
  relatedId: string // 关联ID
  amount: number // 金额
  description: string // 说明
  time: string // 时间
}

// 项目
export interface Project {
  id: string
  name: string // 项目名称
  code: string // 项目编号
}

// 用户
export interface User {
  id: string
  username: string
  name: string
  role: 'admin' | 'user' // 角色
  department: string
}
