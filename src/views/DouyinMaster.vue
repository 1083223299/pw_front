<template>
  <div class="douyin-master-page">

    <!-- 页面头部 -->
    <section class="page-header">
      <div class="header-left">
        <div class="eyebrow">DOUYIN MASTER</div>
        <h1>抖音钻石母版</h1>
        <p>通过手机号验证码登录抖音，登录成功后自动保存母版</p>
      </div>

      <el-button class="app-back-btn" @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </section>

    <!-- 登录卡片 -->
    <section class="login-card">

      <div class="card-heading">
        <div class="heading-icon">
          <el-icon :size="22"><Iphone /></el-icon>
        </div>

        <div>
          <h2>母版账号登录</h2>
          <p>请使用需要保存为母版的抖音账号手机号</p>
        </div>
      </div>

      <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
      >

        <!-- 手机号 -->
        <el-form-item label="手机号码" prop="phone">
          <el-input
              v-model="form.phone"
              placeholder="请输入11位手机号码"
              maxlength="11"
              size="large"
              clearable
              :disabled="sending || verifying || codeSent"
          >
            <template #prefix>
              <el-icon><Iphone /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 获取验证码 -->
        <el-button
            class="send-button"
            type="primary"
            size="large"
            :loading="sending"
            :disabled="codeSent"
            @click="handleSendCode"
        >
          {{ codeSent ? '验证码已发送' : '获取验证码' }}
        </el-button>

        <!-- 验证码 -->
        <div v-if="codeSent" class="code-section">

          <el-form-item label="短信验证码" prop="code">
            <el-input
                v-model="form.code"
                placeholder="请输入短信验证码"
                maxlength="6"
                size="large"
                clearable
                :disabled="verifying"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-button
              class="submit-button"
              type="primary"
              size="large"
              :loading="verifying"
              @click="handleVerifyCode"
          >
            确认登录并保存母版
          </el-button>

        </div>

      </el-form>

      <!-- 登录成功 -->
      <el-result
          v-if="loginSuccess"
          icon="success"
          title="母版保存成功"
          sub-title="抖音登录状态已保存，可以用于后续充值订单"
      >
        <template #extra>
          <el-button type="primary" @click="resetForm">
            登录其他母版
          </el-button>
        </template>
      </el-result>

    </section>

  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Iphone, Lock } from '@element-plus/icons-vue'
import {
  getGeneral,
  sendGeneralCode,
  submitGeneralCode,
} from '@/api/api.js'

const router = useRouter()

const formRef = ref(null)

const form = reactive({
  phone: '',
  code: ''
})

const sending = ref(false)
const verifying = ref(false)
const codeSent = ref(false)
const loginSuccess = ref(false)

const rules = {
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的11位手机号码',
      trigger: 'blur'
    }
  ],
  code: [
    { required: true, message: '请输入短信验证码', trigger: 'blur' },
    {
      pattern: /^\d{6}$/,
      message: '请输入6位数字验证码',
      trigger: 'blur'
    }
  ]
}

// 获取验证码
async function handleSendCode() {
  // 1. 校验手机号
  try {
    await formRef.value.validateField('phone')
  } catch {
    return
  }

  sending.value = true

  try {
    const params = {
      custom_tag: "douyin",
      phone: form.phone,
      account: form.phone
    }

    // ==========================================
    // 第一步：调用 customization_info
    // ==========================================
    const result = await getGeneral(params)

    console.log('抖音母版查询结果：', result)

    // 兼容接口是否已经解包 data
    const info = result?.data ?? result

    const isCharge = info?.is_charge ?? info?.is_charge

    // ==========================================
    // 第二步：判断是否需要验证码
    // ==========================================

    if (typeof isCharge !== 'boolean') {
      throw new Error('接口未返回有效的 isCharge 字段')
    }

    if (isCharge === true) {
      // 母版已经存在，不需要验证码
      codeSent.value = false

      ElMessage.success('当前母版已存在，无需重新登录')
      return
    }

    // ==========================================
    // 第三步：需要验证码，调用 customization_send
    // ==========================================
    await sendGeneralCode(params)

    codeSent.value = true

    ElMessage.success('验证码已发送，请查看手机短信')

  } catch (error) {
    ElMessage.error(error?.message || '获取验证码失败')
  } finally {
    sending.value = false
  }
}

// 提交验证码
// 提交验证码并保存抖音母版
async function handleVerifyCode() {
  // 1. 校验手机号和验证码
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  // 2. 必须先成功发送验证码
  if (!codeSent.value) {
    ElMessage.warning('请先获取短信验证码')
    return
  }

  verifying.value = true

  try {
    // 3. 组装请求参数
    const params = {
      custom_tag: "douyin",
      phone: form.phone,
      account: form.phone,
      code: form.code

      // 如果后端要求 orderId，
      // 这里还必须带上获取验证码时使用的同一个 orderId
    }

    // 4. 提交验证码
    const result = await submitGeneralCode(params)

    console.log('抖音母版验证码提交结果：', result)

    // 5. 接口成功返回
    // 前提：requestData 在业务失败时会抛出错误，
    // 并且后端只有保存母版成功才返回成功。
    loginSuccess.value = true
    codeSent.value = false

    ElMessage.success('抖音母版登录成功，已保存登录状态')

  } catch (error) {
    ElMessage.error(error?.message || '验证码提交失败')
  } finally {
    verifying.value = false
  }
}

// 重置
function resetForm() {
  form.phone = ''
  form.code = ''

  sending.value = false
  verifying.value = false
  codeSent.value = false
  loginSuccess.value = false

  formRef.value?.clearValidate()
}
</script>

<style scoped>
.douyin-master-page {
  width: 100%;
  /* //padding: 26px 30px 44px; */
  /* max-width: 1440px; */
  margin: 0 auto;
  padding: 26px 30px 44px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.eyebrow {
  color: var(--app-text-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
  margin-bottom: 8px;
}

.header-left h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--app-text-primary);
}

.header-left p {
  margin: 8px 0 0;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.login-card {
  max-width: 520px;
  margin: 55px auto 0;
  padding: 34px;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 16px;
  box-shadow: var(--app-shadow);
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 30px;
}

.heading-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--app-accent-soft);
  color: var(--app-accent-strong);
}

.card-heading h2 {
  margin: 0;
  font-size: 18px;
  color: var(--app-text-primary);
}

.card-heading p {
  margin: 6px 0 0;
  color: var(--app-text-muted);
  font-size: 12px;
}

.send-button,
.submit-button {
  width: 100%;
  margin-top: 8px;
  border-radius: 8px;
}

.code-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--app-divider);
}

:deep(.el-form-item__label) {
  color: var(--app-text-regular);
  font-weight: 600;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

@media (max-width: 768px) {
  .douyin-master-page {
    padding: 18px;
  }

  .page-header {
    align-items: flex-start;
  }

  .login-card {
    margin-top: 24px;
    padding: 24px 20px;
  }
}
</style>