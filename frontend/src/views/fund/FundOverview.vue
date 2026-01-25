<template>
  <div class="fund-overview">
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="stat in stats" :key="stat.title">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon :size="30"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card>
          <template #header>
            <span>资金分布</span>
          </template>
          <v-chart :option="fundDistributionOption" style="height: 300px" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-card>
          <template #header>
            <span>资金使用情况</span>
          </template>
          <v-chart :option="fundUsageOption" style="height: 300px" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24">
        <el-card>
          <template #header>
            <span>资金使用趋势</span>
          </template>
          <v-chart :option="fundTrendOption" style="height: 350px" />
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>资金列表</span>
          <el-button type="primary" @click="handleAddFund">
            <el-icon><Plus /></el-icon>
            新增资金
          </el-button>
        </div>
      </template>

      <el-table :data="fundStore.allFunds" style="width: 100%" table-layout="auto">
        <el-table-column prop="name" label="资金名称" min-width="200" />
        <el-table-column prop="type" label="类型" min-width="150">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="总额" min-width="150" sortable>
          <template #default="{ row }">
            ¥{{ (row.totalAmount / 10000).toFixed(2) }}万
          </template>
        </el-table-column>
        <el-table-column prop="receivedAmount" label="已到款" min-width="150" sortable>
          <template #default="{ row }">
            ¥{{ (row.receivedAmount / 10000).toFixed(2) }}万
          </template>
        </el-table-column>
        <el-table-column prop="usedAmount" label="已使用" min-width="150" sortable>
          <template #default="{ row }">
            ¥{{ (row.usedAmount / 10000).toFixed(2) }}万
          </template>
        </el-table-column>
        <el-table-column prop="remainingAmount" label="剩余" min-width="150" sortable>
          <template #default="{ row }">
            <span :style="{ color: row.remainingAmount < 0 ? '#f56c6c' : '#67c23a' }">
              ¥{{ (row.remainingAmount / 10000).toFixed(2) }}万
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="projectId" label="关联项目" min-width="150">
          <template #default="{ row }">
            {{ getProjectName(row.projectId) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              查看详情
            </el-button>
            <el-button type="success" link size="small" @click="handleAddRecord(row)">
              添加使用记录
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 资金详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="资金详情"
      width="800px"
    >
      <div v-if="selectedFund">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="资金名称">{{ selectedFund.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="getTypeTagType(selectedFund.type)">{{ selectedFund.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总额">¥{{ (selectedFund.totalAmount / 10000).toFixed(2) }}万</el-descriptions-item>
          <el-descriptions-item label="已到款">¥{{ (selectedFund.receivedAmount / 10000).toFixed(2) }}万</el-descriptions-item>
          <el-descriptions-item label="已使用">¥{{ (selectedFund.usedAmount / 10000).toFixed(2) }}万</el-descriptions-item>
          <el-descriptions-item label="剩余">¥{{ (selectedFund.remainingAmount / 10000).toFixed(2) }}万</el-descriptions-item>
        </el-descriptions>

        <h3 style="margin-top: 20px; margin-bottom: 15px">使用记录</h3>
        <el-table :data="selectedFund.records" style="width: 100%" table-layout="auto">
          <el-table-column prop="type" label="类型" min-width="120" />
          <el-table-column prop="amount" label="金额" min-width="150">
            <template #default="{ row }">
              {{ formatAmount(row.amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="200" />
          <el-table-column prop="time" label="时间" min-width="180">
            <template #default="{ row }">
              {{ formatDate(row.time) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 新增资金对话框 -->
    <el-dialog
      v-model="showFundDialog"
      title="新增资金"
      width="500px"
      @closed="handleFundDialogClosed"
    >
      <el-form :model="fundForm" label-width="100px">
        <el-form-item label="资金名称">
          <el-input v-model="fundForm.name" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="fundForm.type" style="width: 100%">
            <el-option label="扶持资金" value="扶持资金" />
            <el-option label="建设经费" value="建设经费" />
            <el-option label="运营经费" value="运营经费" />
          </el-select>
        </el-form-item>
        <el-form-item label="总额">
          <el-input-number
            v-model="fundForm.totalAmount"
            :precision="2"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="已到款">
          <el-input-number
            v-model="fundForm.receivedAmount"
            :precision="2"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="关联项目">
          <el-select v-model="fundForm.projectId" placeholder="请选择项目" style="width: 100%">
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFundDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveFund">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加使用记录对话框 -->
    <el-dialog
      v-model="showRecordDialog"
      title="添加使用记录"
      width="500px"
      @closed="handleRecordDialogClosed"
    >
      <el-form :model="recordForm" label-width="100px">
        <el-form-item label="类型">
          <el-select v-model="recordForm.type" style="width: 100%">
            <el-option label="报销" value="报销" />
            <el-option label="薪酬" value="薪酬" />
            <el-option label="津贴" value="津贴" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number
            v-model="recordForm.amount"
            :precision="2"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="说明">
          <el-input
            v-model="recordForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="关联ID">
          <el-input v-model="recordForm.relatedId" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecordDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRecord">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import { Plus, TrendCharts, Money } from '@element-plus/icons-vue'
import { useFundStore } from '@/stores/fund'
import { useProjectStore } from '@/stores/project'
import dayjs from 'dayjs'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const fundStore = useFundStore()
const projectStore = useProjectStore()

const showDetailDialog = ref(false)
const showFundDialog = ref(false)
const showRecordDialog = ref(false)
const selectedFund = ref<any>(null)
const selectedFundId = ref('')
const projects = ref(projectStore.getAllProjects())

const fundForm = reactive({
  name: '',
  type: '扶持资金',
  totalAmount: 0,
  receivedAmount: 0,
  projectId: ''
})

const recordForm = reactive({
  type: '其他',
  amount: 0,
  description: '',
  relatedId: ''
})

const stats = computed(() => [
  {
    title: '总资金',
    value: `¥${(fundStore.totalFunds / 10000).toFixed(2)}万`,
    icon: TrendCharts,
    color: '#409eff'
  },
  {
    title: '已到款',
    value: `¥${(fundStore.totalReceived / 10000).toFixed(2)}万`,
    icon: Money,
    color: '#67c23a'
  },
  {
    title: '已使用',
    value: `¥${(fundStore.totalUsed / 10000).toFixed(2)}万`,
    icon: TrendCharts,
    color: '#e6a23c'
  },
  {
    title: '剩余',
    value: `¥${(fundStore.totalRemaining / 10000).toFixed(2)}万`,
    icon: Money,
    color: '#f56c6c'
  }
])

const fundDistributionOption = computed(() => ({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: '资金分布',
      type: 'pie',
      radius: '50%',
      data: fundStore.allFunds.map(fund => ({
        value: fund.totalAmount,
        name: fund.name
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ]
}))

const fundUsageOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: fundStore.allFunds.map(fund => fund.name)
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '已到款',
      type: 'bar',
      data: fundStore.allFunds.map(fund => fund.receivedAmount),
      itemStyle: { color: '#67c23a' }
    },
    {
      name: '已使用',
      type: 'bar',
      data: fundStore.allFunds.map(fund => fund.usedAmount),
      itemStyle: { color: '#e6a23c' }
    },
    {
      name: '剩余',
      type: 'bar',
      data: fundStore.allFunds.map(fund => fund.remainingAmount),
      itemStyle: { color: '#409eff' }
    }
  ]
}))

const fundTrendOption = computed(() => {
  const last12Months = Array.from({ length: 12 }, (_, i) =>
    dayjs().subtract(11 - i, 'month').format('YYYY-MM')
  )

  // 模拟每月使用金额（实际应该从记录中计算）
  const monthlyUsage = last12Months.map(() =>
    Math.random() * 500000 + 200000
  )

  return {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: last12Months
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '资金使用',
        type: 'line',
        data: monthlyUsage,
        smooth: true,
        itemStyle: { color: '#409eff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        }
      }
    ]
  }
})

function getTypeTagType(type: string): string {
  const map: Record<string, string> = {
    扶持资金: 'primary',
    建设经费: 'success',
    运营经费: 'info'
  }
  return map[type] || 'info'
}

function getProjectName(projectId?: string): string {
  if (!projectId) return '-'
  const project = projectStore.getProjectById(projectId)
  return project?.name || projectId
}

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function formatAmount(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(2)}万`
  } else {
    return `¥${amount.toFixed(2)}`
  }
}

function handleAddFund(): void {
  Object.assign(fundForm, {
    name: '',
    type: '扶持资金',
    totalAmount: 0,
    receivedAmount: 0,
    projectId: ''
  })
  showFundDialog.value = true
}

function handleFundDialogClosed(): void {
  Object.assign(fundForm, {
    name: '',
    type: '扶持资金',
    totalAmount: 0,
    receivedAmount: 0,
    projectId: ''
  })
}

function handleRecordDialogClosed(): void {
  Object.assign(recordForm, {
    type: '其他',
    amount: 0,
    description: '',
    relatedId: ''
  })
}

function handleView(fund: any): void {
  selectedFund.value = fund
  showDetailDialog.value = true
}

function handleAddRecord(fund: any): void {
  selectedFundId.value = fund.id
  Object.assign(recordForm, {
    type: '其他',
    amount: 0,
    description: '',
    relatedId: ''
  })
  showRecordDialog.value = true
}

function handleSaveFund(): void {
  if (!fundForm.name) {
    ElMessage.warning('请输入资金名称')
    return
  }
  if (fundForm.totalAmount <= 0) {
    ElMessage.warning('请输入有效的总额')
    return
  }

  fundStore.addFund({
    name: fundForm.name,
    type: fundForm.type as '扶持资金' | '建设经费' | '运营经费',
    totalAmount: fundForm.totalAmount,
    receivedAmount: fundForm.receivedAmount,
    projectId: fundForm.projectId,
    usedAmount: 0,
    remainingAmount: fundForm.receivedAmount
  })
  ElMessage.success('添加成功')
  showFundDialog.value = false
  Object.assign(fundForm, {
    name: '',
    type: '扶持资金',
    totalAmount: 0,
    receivedAmount: 0,
    projectId: ''
  })
}

function handleSaveRecord(): void {
  if (recordForm.amount <= 0) {
    ElMessage.warning('请输入有效的金额')
    return
  }

  fundStore.addFundRecord(selectedFundId.value, {
    fundId: selectedFundId.value,
    type: recordForm.type as '报销' | '薪酬' | '津贴' | '其他',
    amount: recordForm.amount,
    description: recordForm.description,
    relatedId: recordForm.relatedId
  })
  ElMessage.success('添加成功')
  showRecordDialog.value = false
  Object.assign(recordForm, {
    type: '其他',
    amount: 0,
    description: '',
    relatedId: ''
  })
}

onMounted(() => {
  fundStore.initFunds()
  projectStore.initProjects()
  projects.value = projectStore.getAllProjects()
})
</script>

<style scoped lang="css">
.fund-overview {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-title {
  font-size: 14px;
  color: #909399;
}

.charts-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
