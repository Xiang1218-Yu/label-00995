<template>
  <div class="login-container">
    <div class="login-left">
      <div class="login-brand">
        <div class="brand-icon">
          <el-icon :size="48"><TrendCharts /></el-icon>
        </div>
        <h1>科技园智慧财务一体化管理系统</h1>
        <p>Finance Management System</p>
      </div>
      <div class="login-features">
        <div class="feature-item">
          <el-icon :size="24"><Document /></el-icon>
          <span>发票管理</span>
        </div>
        <div class="feature-item">
          <el-icon :size="24"><Money /></el-icon>
          <span>报销审批</span>
        </div>
        <div class="feature-item">
          <el-icon :size="24"><Wallet /></el-icon>
          <span>资金管理</span>
        </div>
        <div class="feature-item">
          <el-icon :size="24"><Coin /></el-icon>
          <span>薪酬发放</span>
        </div>
      </div>
    </div>
    <div class="login-right">
      <div class="right-background">
        <div class="bg-pattern"></div>
      </div>
      <div class="login-box">
        <div class="login-header">
          <h2>用户登录</h2>
          <p>欢迎回来，请登录您的账户</p>
        </div>
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
              class="form-input"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              class="form-input"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-button"
              :loading="loading"
              @click="handleLogin"
            >
              <span v-if="!loading">登 录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>
        <div class="login-tip">
          <el-divider>
            <span class="divider-text">测试账号</span>
          </el-divider>
          <div class="account-info">
            <div class="account-item">
              <el-tag type="primary" size="small" effect="plain">管理员</el-tag>
              <span class="account-text">admin / 123456</span>
            </div>
            <div class="account-item">
              <el-tag type="info" size="small" effect="plain">普通用户</el-tag>
              <span class="account-text">user / 123456</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, TrendCharts, Document, Money, Wallet, Coin } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

async function handleLogin(): Promise<void> {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const success = await userStore.login(loginForm.username, loginForm.password)
        if (success) {
          ElMessage.success('登录成功')
          router.push('/')
        } else {
          ElMessage.error('用户名或密码错误')
        }
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped lang="css">
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #304156 0%, #1a252f 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px;
  color: #fff;
}

.login-brand {
  text-align: center;
  margin-bottom: 60px;
}

.brand-icon {
  width: 80px;
  height: 80px;
  background: rgba(64, 158, 255, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: #409eff;
}

.login-brand h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 12px;
}

.login-brand p {
  font-size: 14px;
  color: #bfcbd9;
  letter-spacing: 2px;
}

.login-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.3s;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.feature-item span {
  font-size: 14px;
}

.login-right {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 50%, #f0f2f5 100%);
  position: relative;
  overflow: hidden;
}

.right-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.6;
}

.bg-pattern {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(64, 158, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(64, 158, 255, 0.06) 0%, transparent 50%);
  background-size: 200% 200%;
  animation: bgMove 20s ease infinite;
}

@keyframes bgMove {
  0%, 100% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
}

.login-box {
  width: 360px;
  padding: 50px 40px;
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}


.login-header h2 {
  font-size: 26px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  letter-spacing: 0.5px;
}

.login-header p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.login-form {
  margin-top: 0;
}

.form-input {
  width: 100%;
}

.form-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
  padding: 12px 16px;
}

.form-input :deep(.el-input__wrapper:hover) {
  border-color: #c0c4cc;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.form-input :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.25);
}

.form-input :deep(.el-input__inner) {
  font-size: 14px;
}

.form-input :deep(.el-input__prefix) {
  color: #909399;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.4);
  transition: all 0.3s ease;
  letter-spacing: 1px;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.5);
  background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
}

.login-button:active {
  transform: translateY(0);
}

.login-tip {
  margin-top: 32px;
}

.divider-text {
  color: #909399;
  font-size: 12px;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.account-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(64, 158, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.account-item:hover {
  background: rgba(64, 158, 255, 0.1);
  transform: translateX(3px);
}

.account-text {
  font-size: 13px;
  color: #606266;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  letter-spacing: 0.5px;
}

/* 响应式 */
@media (max-width: 900px) {
  .login-left {
    display: none;
  }
  
  .login-right {
    width: 100%;
  }
}
</style>
