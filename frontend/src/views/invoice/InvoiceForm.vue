<template>
  <div class="invoice-form">
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑发票' : '新增发票' }}</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="发票号码" prop="invoiceNumber">
          <el-input v-model="form.invoiceNumber" placeholder="请输入发票号码" />
        </el-form-item>

        <el-form-item label="开票日期" prop="invoiceDate">
          <el-date-picker
            v-model="form.invoiceDate"
            type="date"
            placeholder="请选择开票日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
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

        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="住宿" value="住宿" />
            <el-option label="餐饮" value="餐饮" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="上传人" prop="uploader">
          <el-input v-model="form.uploader" placeholder="请输入上传人" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="未报销">未报销</el-radio>
            <el-radio label="已报销">已报销</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="发票预览">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持jpg/png/pdf格式，最大10MB</div>
            </template>
          </el-upload>
          <div v-if="previewUrl" class="preview-box">
            <img v-if="previewUrl.startsWith('data:image')" :src="previewUrl" alt="预览" />
            <div v-else class="file-preview">
              <el-icon><Document /></el-icon>
              <span>文件已选择</span>
            </div>
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
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { useInvoiceStore } from '@/stores/invoice'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const invoiceStore = useInvoiceStore()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const isEdit = ref(false)
const fileList = ref<UploadFile[]>([])
const previewUrl = ref('')

const form = reactive({
  invoiceNumber: '',
  invoiceDate: '',
  amount: 0,
  type: '其他' as '住宿' | '餐饮' | '其他',
  uploader: '',
  status: '未报销' as '未报销' | '已报销'
})

const rules: FormRules = {
  invoiceNumber: [
    { required: true, message: '请输入发票号码', trigger: 'blur' }
  ],
  invoiceDate: [
    { required: true, message: '请选择开票日期', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择类型', trigger: 'change' }
  ],
  uploader: [
    { required: true, message: '请输入上传人', trigger: 'blur' }
  ]
}

function handleFileChange(file: UploadFile): void {
  if (file.raw) {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string
    }
    if (file.raw.type.startsWith('image/')) {
      reader.readAsDataURL(file.raw)
    } else {
      previewUrl.value = 'file'
    }
  }
}

function handleSubmit(): void {
  if (!formRef.value) return

  formRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        invoiceStore.updateInvoice(route.params.id as string, form)
        ElMessage.success('更新成功')
      } else {
        if (!form.uploader) {
          form.uploader = userStore.user?.name || ''
        }
        invoiceStore.addInvoice(form)
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
  if (route.params.id) {
    isEdit.value = true
    const invoice = invoiceStore.getInvoiceById(route.params.id as string)
    if (invoice) {
      Object.assign(form, invoice)
    } else {
      ElMessage.error('发票不存在')
      router.back()
    }
  } else {
    form.uploader = userStore.user?.name || ''
  }
})
</script>

<style scoped lang="css">
.invoice-form {
  padding: 0;
}

.preview-box {
  margin-top: 10px;
  padding: 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  text-align: center;
}

.preview-box img {
  max-width: 100%;
  max-height: 200px;
}

.file-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
}
</style>
