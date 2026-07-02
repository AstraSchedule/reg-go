<template>
  <div class="register-wrapper">
    <n-card title="星程课表 - 注册新租户" class="register-card">
      <n-steps :current="currentStep" :status="stepStatus">
        <n-step title="域名" description="设置你的子域名" />
        <n-step title="管理员" description="设置管理员账户" />
        <n-step title="学校信息" description="填写学校基本信息" />
        <n-step title="确认" description="验证并提交" />
      </n-steps>

      <div class="step-content">
        <!-- Step 1: 域名 -->
        <n-form v-if="currentStep === 1" label-placement="left">
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

        <!-- Step 2: 管理员 -->
        <n-form v-if="currentStep === 2" label-placement="left">
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

        <!-- Step 3: 学校信息 -->
        <n-form v-if="currentStep === 3" label-placement="left">
          <n-form-item label="学校名称">
            <n-input v-model:value="form.school" placeholder="如：zh" />
          </n-form-item>
          <n-form-item label="年级名称">
            <n-input v-model:value="form.grade" placeholder="如：39" />
          </n-form-item>
          <n-form-item label="班级名称">
            <n-input v-model:value="form.class" placeholder="如：1" />
          </n-form-item>
        </n-form>

        <!-- Step 4: 确认 -->
        <div v-if="currentStep === 4">
          <n-space vertical>
            <n-alert type="info" title="注册摘要">
              <p>域名：{{ form.subdomain }}.getastra.cn</p>
              <p>管理员：{{ form.username }}</p>
              <p>学校：{{ form.school }} / {{ form.grade }} / {{ form.class }} 班</p>
            </n-alert>
            <div v-if="isDev" id="turnstile-container">
              <n-alert type="warning" title="开发模式">Turnstile 人机验证已跳过</n-alert>
            </div>
            <div v-else id="turnstile-container"></div>
            <n-button type="error" block :loading="submitting" :disabled="!turnstileVerified" @click="handleSubmit">
              确认注册
            </n-button>
          </n-space>
        </div>
      </div>

      <template #action>
        <n-space v-if="currentStep < 4" justify="end">
          <n-button v-if="currentStep > 1" @click="currentStep--">上一步</n-button>
          <n-button type="primary" :disabled="!canProceed" @click="currentStep++">
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
  NSpace, NText, NAlert, useMessage
} from 'naive-ui'
import axios from 'axios'

const message = useMessage()

const currentStep = ref(1)
const submitting = ref(false)
const subdomainAvailable = ref(false)
const subdomainStatus = ref('')
const turnstileVerified = ref(false)

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
const turnstileSitekey = import.meta.env.VITE_TURNSTILE_SITEKEY || ''
const isDev = !apiBase.includes('getastra.cn')

const stepStatus = computed(() => {
  if (submitting.value) return 'process'
  return 'process'
})

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
  if (turnstileSitekey) {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.onload = () => {
      window.turnstile.render('#turnstile-container', {
        sitekey: turnstileSitekey,
        callback: () => { turnstileVerified.value = true },
        'expired-callback': () => { turnstileVerified.value = false },
      })
    }
    document.head.appendChild(script)
  }
})

watch(currentStep, (step) => {
  if (step === 4 && turnstileSitekey && window.turnstile) {
    setTimeout(() => {
      const container = document.getElementById('turnstile-container')
      if (container && container.childElementCount === 0) {
        window.turnstile.render('#turnstile-container', {
          sitekey: turnstileSitekey,
          callback: () => { turnstileVerified.value = true },
          'expired-callback': () => { turnstileVerified.value = false },
        })
      }
    }, 100)
  }
})

async function handleSubmit() {
  if (!turnstileVerified.value) {
    message.warning('请完成人机验证')
    return
  }

  submitting.value = true
  try {
    const resp = await axios.post(`${apiBase}/api/register`, {
      subdomain: form.value.subdomain,
      username: form.value.username,
      password: form.value.password,
      school: form.value.school,
      grade: form.value.grade,
      class: form.value.class,
      turnstile_token: document.querySelector('[name="cf-turnstile-response"]')?.value || '',
    })
    message.success('注册成功！')
    window.open(resp.data.url, '_blank')
  } catch (e) {
    message.error(e?.response?.data?.error || '注册失败')
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
  background: var(--n-color, #f5f5f5);
}
.register-card {
  width: 560px;
}
.step-content {
  margin-top: 24px;
  min-height: 200px;
}
</style>
