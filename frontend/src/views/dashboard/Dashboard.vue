<template>
  <div class="dashboard">
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
            <span>资金统计</span>
          </template>
          <v-chart :option="fundChartOption" style="height: 300px" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-card>
          <template #header>
            <span>报销趋势</span>
          </template>
          <v-chart :option="reimbursementChartOption" style="height: 300px" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="tables-row">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card>
          <template #header>
            <span>待审批报销</span>
          </template>
          <el-table :data="pendingReimbursements" style="width: 100%" table-layout="auto">
            <el-table-column prop="reimbursementNumber" label="单号" min-width="150" />
            <el-table-column prop="applicant" label="申请人" min-width="100" />
            <el-table-column prop="amount" label="金额" min-width="120">
              <template #default="{ row }">
                ¥{{ row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="100">
              <template #default="{ row }">
                <el-tag type="warning">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="100">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="goToDetail(row.id)"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-card>
          <template #header>
            <span>近期津贴发放</span>
          </template>
          <el-table :data="recentAllowances" style="width: 100%" table-layout="auto">
            <el-table-column prop="personName" label="姓名" min-width="100" />
            <el-table-column prop="department" label="部门" min-width="120" />
            <el-table-column prop="amount" label="金额" min-width="120">
              <template #default="{ row }">
                ¥{{ row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="time" label="时间" min-width="150">
              <template #default="{ row }">
                {{ formatDate(row.time) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { TrendCharts, Money, Document, User } from '@element-plus/icons-vue'
import { useReimbursementStore } from '@/stores/reimbursement'
import { useAllowanceStore } from '@/stores/allowance'
import { useFundStore } from '@/stores/fund'
import dayjs from 'dayjs'

use([
  CanvasRenderer,
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const router = useRouter()
const reimbursementStore = useReimbursementStore()
const allowanceStore = useAllowanceStore()
const fundStore = useFundStore()

const stats = computed(() => [
  {
    title: '总资金',
    value: `¥${(fundStore.totalFunds / 10000).toFixed(2)}万`,
    icon: TrendCharts,
    color: '#409eff'
  },
  {
    title: '待审批报销',
    value: reimbursementStore.pendingReimbursements.length,
    icon: Document,
    color: '#e6a23c'
  },
  {
    title: '已使用资金',
    value: `¥${(fundStore.totalUsed / 10000).toFixed(2)}万`,
    icon: Money,
    color: '#67c23a'
  },
  {
    title: '剩余资金',
    value: `¥${(fundStore.totalRemaining / 10000).toFixed(2)}万`,
    icon: User,
    color: '#f56c6c'
  }
])

const pendingReimbursements = computed(() => 
  reimbursementStore.pendingReimbursements.slice(0, 5)
)

const recentAllowances = computed(() =>
  allowanceStore.records
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5)
)

const fundChartOption = computed(() => ({
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

const reimbursementChartOption = computed(() => {
  const last7Days = Array.from({ length: 7 }, (_, i) => 
    dayjs().subtract(6 - i, 'day').format('MM-DD')
  )
  
  const amounts = last7Days.map(date => {
    return reimbursementStore.allReimbursements
      .filter(rem => dayjs(rem.createTime).format('MM-DD') === date)
      .reduce((sum, rem) => sum + rem.amount, 0)
  })

  return {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: last7Days
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '报销金额',
        type: 'line',
        data: amounts,
        smooth: true,
        itemStyle: {
          color: '#409eff'
        }
      }
    ]
  }
})

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function goToDetail(id: string): void {
  router.push(`/reimbursement/detail/${id}`)
}

onMounted(() => {
  reimbursementStore.initReimbursements()
  allowanceStore.initAllowance()
  fundStore.initFunds()
})
</script>

<style scoped lang="css">
.dashboard {
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

.tables-row {
  margin-bottom: 20px;
}
</style>
