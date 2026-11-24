<template>
  <div class="login-page">

    <!-- 背景装饰 -->
    <div class="bg-decoration decoration-1"></div>
    <div class="bg-decoration decoration-2"></div>
    <div class="bg-decoration decoration-3"></div>

    <div class="login-wrapper">

      <!-- 左侧品牌区域 -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="brand-logo">
            <img class="logo-icon" :src="logoUrl" alt="品牌 Logo" />

            <span>管理中心</span>
          </div>

          <div class="brand-title">
            简洁、高效的
            <br />
            <span>智能管理平台</span>
          </div>

          <div class="brand-description">
            集中管理您的业务数据，
            <br />
            让管理更加简单、高效。
          </div>

          <div class="feature-list">

            <div class="feature-item">
              <div class="feature-icon">
                <el-icon>
                  <DataAnalysis />
                </el-icon>
              </div>

              <div>
                <div class="feature-title">数据管理</div>

                <div class="feature-desc">实时掌握业务数据</div>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">
                <el-icon>
                  <Lock />
                </el-icon>
              </div>

              <div>
                <div class="feature-title">安全可靠</div>

                <div class="feature-desc">完善的权限与安全机制</div>
              </div>
            </div>

          </div>

        </div>

      </div>

      <!-- 右侧登录 -->
      <div class="login-section">

        <div class="login-card">

          <div class="mobile-logo">
            <img class="logo-icon" :src="logoUrl" alt="品牌 Logo" />

            <span>管理中心</span>
          </div>

          <div class="login-header">
            <h1>欢迎回来</h1>
            <p>请登录您的管理账户</p>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" class="login-form" @keyup.enter="handleLogin">

            <el-form-item prop="username">

              <label>账号</label>
              <el-input v-model="form.username" size="large" placeholder="请输入账号" clearable>
                <template #prefix>
                  <el-icon>
                    <User />
                  </el-icon>
                </template>
              </el-input>

            </el-form-item>

            <!-- 密码 -->
            <el-form-item prop="password">

              <label>密码</label>

              <el-input v-model="form.password" type="password" size="large" placeholder="请输入密码" show-password>
                <template #prefix>
                  <el-icon>
                    <Lock />
                  </el-icon>
                </template>
              </el-input>

            </el-form-item>

            <!-- 登录 -->
            <el-button type="primary" size="large" class="login-button" :loading="loading" @click="handleLogin">
              <span v-if="!loading">登录</span>
              <span v-else>登录中...</span>
            </el-button>

          </el-form>

          <div class="login-footer">
            © 2026 管理中心
          </div>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {User, Lock, DataAnalysis,} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import logoUrl from '@/assets/images/logo-brand.png'
import { login } from '../api/api.js'
import {encryptPassword} from '../api/utils.js'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [
    {
      required: true,
      message: '请输入用户名',
      trigger: 'blur',
    },
  ],

  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: 'blur',
    },
  ],
}

async function handleLogin() {
  if (!formRef.value) {
    return
  }

  try {
    await formRef.value.validate()

    loading.value = true

    let password = await encryptPassword(form.password)

    const res = await login({
      "username":form.username,
      "password": password
    })

    if (!res.token) {
      throw new Error('登录失败：未获取到 token')

    }

    authStore.setLogin(res)

    ElMessage.success('登录成功')
    await router.replace('/admin/home')

  } catch (error) {
    console.error(error)
    if (error !== false) {
      ElMessage.error('登录失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* =========================
   页面
========================= */
.login-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 10% 20%, var(--app-accent-soft), transparent 35%), radial-gradient(circle at 90% 80%, rgba(128, 90, 213, 0.10), transparent 35%), var(--app-bg);
}

/* =========================
   背景装饰
========================= */
.bg-decoration {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.decoration-1 {
  width: 500px;
  height: 500px;
  top: -280px;
  left: -180px;
  background: var(--app-accent-subtle);
}

.decoration-2 {
  width: 420px;
  height: 420px;
  right: -220px;
  bottom: -200px;
  background: rgba(128, 90, 213, 0.06);
}

.decoration-3 {
  width: 180px;
  height: 180px;
  right: 15%;
  top: 8%;
  background: var(--app-accent-subtle);
}

/* =========================
   整体
========================= */
.login-wrapper {
  position: relative;
  z-index: 1;
  width: min(1080px, calc(100vw - 60px));
  min-height: 620px;
  display: flex;
  overflow: hidden;
  background: var(--app-bg-elevated);
  border-radius: 20px;
  box-shadow: var(--app-shadow);
}

/* =========================
   左侧
========================= */
.brand-section {
  position: relative;
  width: 52%;
  padding: 70px 70px;
  display: flex;
  align-items: center;
  background: var(--app-bg-subtle);
}

.brand-content {
  width: 100%;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: var(--app-text-regular);
}

.logo-icon {
  width: 46px;
  height: 46px;
  object-fit: contain;
  display: block;
}

.brand-title {
  margin-top: 70px;
  font-size: 38px;
  line-height: 1.35;
  font-weight: 600;
  letter-spacing: -1px;
  color: var(--app-text-regular);
}

.brand-title span {
  color: var(--app-accent);
}

.brand-description {
  margin-top: 24px;
  font-size: 15px;
  line-height: 1.9;
  color: var(--app-text-muted);
}

.feature-list {
  margin-top: 60px;
  display: flex;
  gap: 35px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feature-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.feature-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text-secondary);
}

.feature-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--app-text-placeholder);
}

/* =========================
   右侧
========================= */
.login-section {
  width: 48%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px;
}

.login-card {
  width: 360px;
  max-width: 100%;
}

.mobile-logo {
  display: none;
}

/* =========================
   标题
========================= */
.login-header {
  margin-bottom: 36px;
}

.login-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--app-text-regular);
}

.login-header p {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--app-text-muted);
}

/* =========================
   表单
========================= */
.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.login-form label {
  display: block;
  margin-bottom: 9px;
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text-secondary);
}

.login-form :deep(.el-input__wrapper) {
  min-height: 46px;
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--app-border) inset;
  transition: all 0.2s;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--app-text-muted) inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
      0 0 0 1px var(--app-accent) inset,
      0 0 0 3px var(--app-accent-soft);
}

/* =========================
   登录按钮
========================= */
.login-button {
  width: 100%;
  height: 48px;
  margin-top: 8px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  box-shadow:
      0 8px 18px var(--app-accent-soft);
}

/* =========================
   底部
========================= */
.login-footer {
  margin-top: 45px;
  text-align: center;
  font-size: 12px;
  color: var(--app-text-placeholder);
}

/* =========================
   手机端
========================= */
@media (max-width: 800px) {
  .login-wrapper {
    width: calc(100vw - 30px);
    min-height: auto;
    border-radius: 16px;
  }

  .brand-section {
    display: none;
  }

  .login-section {
    width: 100%;
    padding: 40px 30px;
  }

  .mobile-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 40px;
    font-size: 20px;
    font-weight: 600;
    color: var(--app-text-regular);
  }

  .mobile-logo .logo-icon {
    width: 40px;
    height: 40px;
  }

  .login-header {
    margin-bottom: 30px;
  }

  .login-header h1 {
    font-size: 26px;
  }
}
</style>