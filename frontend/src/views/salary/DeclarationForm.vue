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
          <el-button type="primary" @click="showEmployeeSelectDialog = true">选择员工</el-button>
          <el-table :data="form.employees" style="width: 100%; margin-top: 20px" table-layout="auto">
            <el-table-column prop="name" label="姓名" min-width="120" />
            <el-table-column prop="department" label="部门" min-width="150" />
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

    <!-- 员工选择对话框 -->
    <el-dialog
      v-model="showEmployeeSelectDialog"
      title="选择员工"
      width="600px"
    >
      <el-table
        ref="employeeTableRef"
        :data="availableEmployees"
        @selection-change="handleEmployeeSelectionChange"
        max-height="400"
        table-layout="auto"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column prop="department" label="部门" min-width="150" />
      </el-table>
      <template #footer>
        <el-button @click="showEmployeeSelectDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEmployeeSelection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useSalaryStore } from '@/stores/salary'
import { useUserStore } from '@/stores/user'
import { useAllowanceStore } from '@/stores/allowance'
import { generateId } from '@/utils/mock'
import type { SalaryEmployee, AllowancePerson } from '@/types'

const route = useRoute()
const router = useRouter()
const salaryStore = useSalaryStore()
const userStore = useUserStore()
const allowanceStore = useAllowanceStore()

const formRef = ref<FormInstance>()
const isEdit = ref(false)
const showEmployeeSelectDialog = ref(false)
const tempSelectedEmployees = ref<AllowancePerson[]>([])

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

// 可选员工列表（排除已添加的）
const availableEmployees = computed(() => {
  const addedNames = form.employees.map(e => e.name)
  return allowanceStore.persons.filter(p => !addedNames.includes(p.name))
})

const totalAmount = computed(() => {
  return form.employees.reduce((sum, emp) => sum + emp.total, 0)
})

function handleEmployeeSelectionChange(selection: AllowancePerson[]): void {
  tempSelectedEmployees.value = selection
}

function confirmEmployeeSelection(): void {
  tempSelectedEmployees.value.forEach(person => {
    form.employees.push({
      id: generateId(),
      name: person.name,
      department: person.department,
      baseSalary: 0,
      performance: 0,
      deduction: 0,
      total: 0
    })
  })
  tempSelectedEmployees.value = []
  showEmployeeSelectDialog.value = false
}

function handleRemoveEmployee(index: number): void {
  form.employees.splice(index, 1)
}

function calculateTotal(index: number): void {
  const emp = form.employees[index]
  if (emp) {
    emp.total = emp.baseSalary + emp.performance - emp.deduction
  }
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
      const hasInvalid = form.employees.some(emp => !emp.name || !emp.department || emp.baseSalary <= 0)
      if (hasInvalid) {
        ElMessage.warning('请完善所有员工的薪酬信息（基本工资必须大于0）')
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
  allowanceStore.initAllowance()
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
