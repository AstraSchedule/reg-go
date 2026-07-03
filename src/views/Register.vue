<template>
  <div class="register-wrapper" :style="{ background: themeVars.bodyColor }">
    <n-card class="register-card" :bordered="false">
      <template #header>
        <div class="card-header">
          <img src="https://image-hk-1.oss-accelerate.aliyuncs.com/icon.png" alt="Logo" class="logo" />
          <div>
            <div class="title">星程课表</div>
            <div class="subtitle">注册新租户</div>
          </div>
        </div>
      </template>

      <!-- 进度条 -->
      <n-progress v-if="submitting" :percentage="regProgress" :status="regProgress === 100 ? 'success' : 'info'" style="margin-bottom: 20px;" />

      <!-- 步骤条 -->
      <n-steps v-if="!successUrl" :current="currentStep" :status="stepStatus" style="margin-bottom: 24px;">
        <n-step title="域名" />
        <n-step title="管理员" />
        <n-step title="学校信息" />
        <n-step title="确认" />
      </n-steps>

      <!-- 成功结果页 -->
      <div v-if="successUrl" class="step-content">
        <n-result status="success" title="注册成功">
          <template #footer>
            <n-space vertical align="center">
              <n-text depth="3">您的租户已创建完成</n-text>
              <n-input :value="successUrl" readonly @click="copyUrl" class="url-input">
                <template #suffix>
                  <n-button text @click.stop="copyUrl">复制</n-button>
                </template>
              </n-input>
              <n-button type="primary" tag="a" :href="'https://' + successUrl" target="_blank" size="large">
                立即访问
              </n-button>
            </n-space>
          </template>
        </n-result>
      </div>

      <!-- 注册表单 -->
      <template v-else>
        <!-- Step 1: 域名 -->
        <div v-if="currentStep === 1" class="step-content">
          <n-alert type="info" style="margin-bottom: 20px;">
            <template #header>子域名建议</template>
            <n-space vertical size="small">
              <n-text>个人用户：使用简短的用户名，如 <n-text code>kuohu</n-text></n-text>
              <n-text>学校用户：使用学校简写，如 <n-text code>nj39</n-text></n-text>
              <n-text depth="3">域名需要在教室机器上手动输入，越短越好</n-text>
            </n-space>
          </n-alert>
          <n-form label-placement="left" :label-width="80">
            <n-form-item label="子域名">
              <n-input v-model:value="form.subdomain" placeholder="如：school" @input="checkSubdomain" />
            </n-form-item>
            <n-form-item label="预览">
              <n-text depth="3">
                {{ form.subdomain ? form.subdomain + '.getastra.cn → class.getastra.cn' : '请输入子域名' }}
              </n-text>
            </n-form-item>
            <n-form-item v-if="subdomainStatus" label="状态">
              <n-text :type="subdomainAvailable ? 'success' : 'error'">
                {{ subdomainStatus }}
              </n-text>
            </n-form-item>
          </n-form>
        </div>

        <!-- Step 2: 管理员 -->
        <div v-if="currentStep === 2" class="step-content">
          <n-alert type="warning" style="margin-bottom: 20px;">
            <template #header>管理员账户</template>
            <n-text>拥有该租户的最高权限，请妥善保存。管理员遗忘密码需联系维护者。</n-text>
          </n-alert>
          <n-form label-placement="left" :label-width="80">
            <n-form-item label="用户名">
              <n-input v-model:value="form.username" placeholder="至少 3 位" />
            </n-form-item>
            <n-form-item label="密码">
              <n-input v-model:value="form.password" type="password" show-password-on="click" placeholder="至少 6 位" />
            </n-form-item>
            <n-form-item label="确认密码">
              <n-input v-model:value="form.confirmPassword" type="password" show-password-on="click" placeholder="再次输入密码" />
            </n-form-item>
          </n-form>
        </div>

        <!-- Step 3: 学校信息 -->
        <div v-if="currentStep === 3" class="step-content">
          <n-alert type="info" style="margin-bottom: 20px;">
            <template #header>学校信息</template>
            <n-space vertical size="small">
              <n-text>三个字段的语义可自由定义，比如：</n-text>
              <n-text depth="3">• a学校b级c班：39 / 2023 / 1</n-text>
              <n-text depth="3">• a学校b年级c班：39 / 7 / 8</n-text>
              <n-text depth="3">• 字母简写：xx / 10 / 3</n-text>
              <n-text depth="3">初始化后可自由增删，这里只是创建一个空白班级</n-text>
            </n-space>
          </n-alert>
          <n-form label-placement="left" :label-width="80">
            <n-form-item label="学校">
              <n-input v-model:value="form.school" placeholder="如：zh" />
            </n-form-item>
            <n-form-item label="年级">
              <n-input v-model:value="form.grade" placeholder="如：2023" />
            </n-form-item>
            <n-form-item label="班级">
              <n-input v-model:value="form.class" placeholder="如：1" />
            </n-form-item>
          </n-form>
        </div>

        <!-- Step 4: 确认 -->
        <div v-if="currentStep === 4" class="step-content">
          <n-alert type="warning" style="margin-bottom: 20px;">
            <template #header>请确认信息</template>
            <n-text>租户创建后无法自行删除，如需删除请联系维护者</n-text>
          </n-alert>
          <n-descriptions :column="1" label-placement="left" bordered size="small">
            <n-descriptions-item label="域名">{{ form.subdomain }}.getastra.cn</n-descriptions-item>
            <n-descriptions-item label="管理员">{{ form.username }}</n-descriptions-item>
            <n-descriptions-item label="学校">{{ form.school }}</n-descriptions-item>
            <n-descriptions-item label="年级">{{ form.grade }}</n-descriptions-item>
            <n-descriptions-item label="班级">{{ form.class }}</n-descriptions-item>
          </n-descriptions>

          <div v-if="isDev" id="turnstile-container" style="margin-top: 16px;">
            <n-alert type="warning">开发模式：Turnstile 人机验证已跳过</n-alert>
          </div>
          <div v-else id="turnstile-container" style="margin-top: 16px;"></div>

          <n-button type="error" block size="large" :loading="submitting" :disabled="!turnstileVerified" @click="handleSubmit" style="margin-top: 16px;">
            确认注册
          </n-button>
        </div>
      </template>

      <!-- 导航按钮 -->
      <template #action v-if="!successUrl">
        <n-space v-if="currentStep >= 1 && currentStep <= 4" justify="end">
          <n-button v-if="currentStep > 1" @click="currentStep--">上一步</n-button>
          <n-button v-if="currentStep < 4" type="primary" :disabled="!canProceed" @click="currentStep++">
            下一步
          </n-button>
        </n-space>
      </template>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  NCard, NSteps, NStep, NForm, NFormItem, NInput, NButton,
  NSpace, NText, NAlert, NResult, NProgress, NDescriptions, NDescriptionsItem,
  useMessage, useThemeVars
} from 'naive-ui'
import axios from 'axios'

const themeVars = useThemeVars()
const message = useMessage()

const currentStep = ref(1)
const submitting = ref(false)
const subdomainAvailable = ref(false)
const subdomainStatus = ref('')
const turnstileVerified = ref(false)
const successUrl = ref('')
const regProgress = ref(0)

const form = ref({
  subdomain: '',
  username: '',
  password: '',
  confirmPassword: '',
  school: '',
  grade: '',
  class: '',
})

const apiBase = import.meta.env.VITE_API_BASE || ''
const astraApiBase = import.meta.env.VITE_ASTRA_API_BASE || ''
const turnstileSitekey = import.meta.env.VITE_TURNSTILE_SITEKEY || ''
const isDev = !apiBase.includes('getastra.cn')

const stepStatus = computed(() => submitting.value ? 'process' : 'process')

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1: return form.value.subdomain && subdomainAvailable.value
    case 2: return form.value.username && form.value.password && form.value.password === form.value.confirmPassword
    case 3: return form.value.school && form.value.grade && form.value.class
    default: return true
  }
})

let checkTimer = null
function checkSubdomain() {
  subdomainStatus.value = ''
  subdomainAvailable.value = false
  clearTimeout(checkTimer)
  if (!form.value.subdomain) return

  checkTimer = setTimeout(async () => {
    try {
      const resp = await axios.get(`${apiBase}/api/check-subdomain/${form.value.subdomain}`)
      subdomainAvailable.value = resp.data.available
      subdomainStatus.value = resp.data.message
    } catch (e) {
      subdomainAvailable.value = false
      subdomainStatus.value = '检查失败'
    }
  }, 500)
}

onMounted(() => {
  if (isDev) {
    turnstileVerified.value = true
    return
  }
  renderTurnstile()
})

function copyUrl() {
  navigator.clipboard.writeText(successUrl.value)
  message.success('已复制到剪贴板')
}

let turnstileWidgetId = null

function renderTurnstile() {
  if (!turnstileSitekey || !window.turnstile) return
  const container = document.getElementById('turnstile-container')
  if (!container || container.childElementCount > 0) return
  turnstileWidgetId = window.turnstile.render('#turnstile-container', {
    sitekey: turnstileSitekey,
    callback: () => { turnstileVerified.value = true },
    'expired-callback': () => { turnstileVerified.value = false },
  })
}

function resetTurnstile() {
  if (!window.turnstile || turnstileWidgetId === null) return
  turnstileVerified.value = false
  window.turnstile.reset(turnstileWidgetId)
}

watch(currentStep, (step) => {
  if (step === 4 && !isDev) {
    setTimeout(renderTurnstile, 100)
  }
})

async function handleSubmit() {
  if (!turnstileVerified.value) {
    message.warning('请完成人机验证')
    return
  }

  submitting.value = true
  regProgress.value = 0
  try {
    const tokenResp = await axios.post(`${apiBase}/api/sign-token`, {
      subdomain: form.value.subdomain,
      username: form.value.username,
      password: form.value.password,
      school: form.value.school,
      grade: form.value.grade,
      class: form.value.class,
      turnstile_token: document.querySelector('[name="cf-turnstile-response"]')?.value || '',
      internal_secret: 'Internal$KuoHu233*Astra',
    })
    const token = tokenResp.data.token
    regProgress.value = 33

    await axios.post(`${astraApiBase}/web/admin/register-tenant`, null, {
      headers: { 'X-Reg-Token': token },
    })
    regProgress.value = 66

    await axios.post(`${apiBase}/api/create-dns`, { token })
    regProgress.value = 100
    message.success('注册成功！')
    successUrl.value = form.value.subdomain + '.getastra.cn'
  } catch (e) {
    message.error(e?.response?.data?.error || '注册失败')
    resetTurnstile()
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.register-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}
.register-card {
  width: 560px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}
.title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}
.subtitle {
  font-size: 12px;
  opacity: 0.6;
  line-height: 1.3;
}
.step-content {
  min-height: 200px;
}
.url-input {
  cursor: pointer;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
}
</style>
