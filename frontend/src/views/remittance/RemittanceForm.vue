<template>
  <div class="remittance-form">
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑汇款' : '新增汇款' }}</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="汇款单位" prop="company">
          <el-input v-model="form.company" placeholder="请输入汇款单位" />
        </el-form-item>

        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :precision="2"
            :min="0"
            placeholder="请输入金额"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="用途" prop="purpose">
          <el-input
            v-model="form.purpose"
            type="textarea"
            :rows="3"
            placeholder="请输入用途说明"
          />
        </el-form-item>

        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="请选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="关联项目" prop="projectId">
          <el-select v-model="form.projectId" placeholder="请选择项目" style="width: 100%">
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="待报销">待报销</el-radio>
            <el-radio label="已报销">已报销</el-radio>
          </el-radio-group>
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
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useRemittanceStore } from '@/stores/remittance'
import { useProjectStore } from '@/stores/project'

const route = useRoute()
const router = useRouter()
const remittanceStore = useRemittanceStore()
const projectStore = useProjectStore()

const formRef = ref<FormInstance>()
const isEdit = ref(false)
const projects = ref(projectStore.getAllProjects())

const form = reactive({
  company: '',
  amount: 0,
  purpose: '',
  date: '',
  projectId: '',
  status: '待报销' as '待报销' | '已报销'
})

const rules: FormRules = {
  company: [
    { required: true, message: '请输入汇款单位', trigger: 'blur' }
  ],
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' }
  ],
  purpose: [
    { required: true, message: '请输入用途', trigger: 'blur' }
  ],
  date: [
    { required: true, message: '请选择日期', trigger: 'change' }
  ],
  projectId: [
    { required: true, message: '请选择关联项目', trigger: 'change' }
  ]
}

function handleSubmit(): void {
  if (!formRef.value) return

  formRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        remittanceStore.updateRemittance(route.params.id as string, form)
        ElMessage.success('更新成功')
      } else {
        remittanceStore.addRemittance(form)
        ElMessage.success('添加成功')
      }
      router.back()
    }
  })
}

function handleCancel(): void {
  router.back()
}

onMounted(() => {
  projectStore.initProjects()
  projects.value = projectStore.getAllProjects()

  if (route.params.id) {
    isEdit.value = true
    const remittance = remittanceStore.getRemittanceById(route.params.id as string)
    if (remittance) {
      Object.assign(form, remittance)
    } else {
      ElMessage.error('汇款记录不存在')
      router.back()
    }
  }
})
</script>

<style scoped lang="css">
.remittance-form {
  padding: 0;
}
</style>
