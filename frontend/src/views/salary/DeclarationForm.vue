<template>
  <div class="declaration-form">
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑申报' : '新增申报' }}</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="月份" prop="month">
          <el-date-picker
            v-model="form.month"
            type="month"
            placeholder="请选择月份"
            value-format="YYYY-MM"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="申报人" prop="declarant">
          <el-input v-model="form.declarant" placeholder="请输入申报人" />
        </el-form-item>

        <el-form-item label="员工薪酬明细">
          <el-button type="primary" @click="handleAddEmployee">添加员工</el-button>
          <el-table :data="form.employees" style="width: 100%; margin-top: 20px" table-layout="auto">
            <el-table-column prop="name" label="姓名" min-width="120">
              <template #default="{ row, $index }">
                <el-input v-model="row.name" @blur="calculateTotal($index)" />
              </template>
            </el-table-column>
            <el-table-column prop="department" label="部门" min-width="150">
              <template #default="{ row, $index }">
                <el-input v-model="row.department" />
              </template>
            </el-table-column>
            <el-table-column prop="baseSalary" label="基本工资" min-width="150">
              <template #default="{ row, $index }">
                <el-input-number
                  v-model="row.baseSalary"
                  :precision="2"
                  :min="0"
                  style="width: 100%"
                  @change="calculateTotal($index)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="performance" label="绩效" min-width="150">
              <template #default="{ row, $index }">
                <el-input-number
                  v-model="row.performance"
                  :precision="2"
                  :min="0"
                  style="width: 100%"
                  @change="calculateTotal($index)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="deduction" label="扣款" min-width="150">
              <template #default="{ row, $index }">
                <el-input-number
                  v-model="row.deduction"
                  :precision="2"
                  :min="0"
                  style="width: 100%"
                  @change="calculateTotal($index)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="total" label="合计" min-width="150">
              <template #default="{ row }">
                <span style="font-weight: bold; color: #409eff">
                  ¥{{ row.total.toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="100">
              <template #default="{ $index }">
                <el-button
                  type="danger"
                  link
                  size="small"
                  @click="handleRemoveEmployee($index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="total-summary">
            <span>总计：</span>
            <span class="total-amount">¥{{ totalAmount.toFixed(2) }}</span>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useSalaryStore } from '@/stores/salary'
import { useUserStore } from '@/stores/user'
import { generateId } from '@/utils/mock'
import type { SalaryEmployee } from '@/types'

const route = useRoute()
const router = useRouter()
const salaryStore = useSalaryStore()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const isEdit = ref(false)

const form = reactive({
  month: '',
  declarant: '',
  employees: [] as SalaryEmployee[]
})

const rules: FormRules = {
  month: [
    { required: true, message: '请选择月份', trigger: 'change' }
  ],
  declarant: [
    { required: true, message: '请输入申报人', trigger: 'blur' }
  ]
}

const totalAmount = computed(() => {
  return form.employees.reduce((sum, emp) => sum + emp.total, 0)
})

function handleAddEmployee(): void {
  form.employees.push({
    id: generateId(),
    name: '',
    department: '',
    baseSalary: 0,
    performance: 0,
    deduction: 0,
    total: 0
  })
}

function handleRemoveEmployee(index: number): void {
  form.employees.splice(index, 1)
  updateFormTotal()
}

function calculateTotal(index: number): void {
  const emp = form.employees[index]
  if (emp) {
    emp.total = emp.baseSalary + emp.performance - emp.deduction
    updateFormTotal()
  }
}

function updateFormTotal(): void {
  // 触发响应式更新
}

function handleSubmit(): void {
  if (!formRef.value) return

  formRef.value.validate((valid) => {
    if (valid) {
      if (form.employees.length === 0) {
        ElMessage.warning('请至少添加一个员工')
        return
      }

      // 验证员工信息完整性
      const hasInvalid = form.employees.some(emp => !emp.name || !emp.department)
      if (hasInvalid) {
        ElMessage.warning('请完善所有员工信息')
        return
      }

      if (isEdit.value) {
        salaryStore.updateDeclaration(route.params.id as string, {
          ...form,
          totalAmount: totalAmount.value,
          status: '待审核'
        })
        ElMessage.success('更新成功')
      } else {
        salaryStore.addDeclaration({
          ...form,
          totalAmount: totalAmount.value,
          status: '待审核'
        })
        ElMessage.success('添加成功')
      }
      router.push('/salary/declaration')
    }
  })
}

function handleCancel(): void {
  router.back()
}

onMounted(() => {
  form.declarant = userStore.user?.name || ''

  if (route.params.id) {
    isEdit.value = true
    const declaration = salaryStore.getDeclarationById(route.params.id as string)
    if (declaration) {
      form.month = declaration.month
      form.declarant = declaration.declarant
      form.employees = declaration.employees.map(emp => ({ ...emp }))
    } else {
      ElMessage.error('申报记录不存在')
      router.back()
    }
  }
})
</script>

<style scoped lang="css">
.declaration-form {
  padding: 0;
}

.total-summary {
  margin-top: 20px;
  text-align: right;
  font-size: 16px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.total-amount {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-left: 10px;
}
</style>
