<template>
  <div class="register-wrapper" :style="{ background: themeVars.bodyColor }">
    <n-card title="星程课表 - 注册新租户" class="register-card">
      <n-steps :current="currentStep" :status="stepStatus">
        <n-step title="域名" />
        <n-step title="管理员" />
        <n-step title="学校信息" />
        <n-step title="确认" />
      </n-steps>

      <div class="step-content">
        <!-- Step 1: 域名 -->
        <template v-if="currentStep === 1">
          <n-alert type="info" title="提示" style="margin-bottom: 16px;">
            子域名建议：<br>
            如果您是个人：使用您日常使用的较为简短的用户名，比如 kuohu<br>
            如果您是学校：使用您们学校较为简短且不易重复的缩写，比如 nj39<br>
            域名需要您在为教室机器安装后手动输一遍，所以越简短越好！
          </n-alert>
          <n-form label-placement="left">
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
        </template>

        <!-- Step 2: 管理员 -->
        <template v-if="currentStep === 2">
          <n-alert type="info" title="提示" style="margin-bottom: 16px;">
            此为管理员账户，拥有该租户的最高权限，请您妥善保存此账户的用户名与密码。<br>
            其他用户若遗忘密码，要通过管理员账户更改，但管理员若遗忘密码，则您需要与项目维护者联系！
          </n-alert>
          <n-form label-placement="left">
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
        </template>

        <!-- Step 3: 学校信息 -->
        <template v-if="currentStep === 3">
          <n-alert type="info" title="提示" style="margin-bottom: 16px;">
            学校名称：建议为您的学校的简写，比如 “39”。这与子域名互相独立，并不冲突，同样越简短越好。<br>
            年级名称：建议的写法有两种：“9”（9年级） 或者 2023（2023级）。通常为了方便统一管理，建议前者。<br>
            班级名称：建议以数字来标记，比如 “1”、“2”…… 您只要写任意一个班级即可<br>
            这会为您的租户创建一个空白班级，在创建完成之后，您可以通过复制这个班级来快速完成其他班级的配置。<br>
            学校名称与子域名无关，学校名称只存在于本租户下，所以可以任意取名，不用在意重复。<br>
            此项仅用于初始化租户，实际您可以在完成后创建任意多的学校、年级或班级。
          </n-alert>
          <n-form label-placement="left">
            <n-form-item label="学校名称">
              <n-input v-model:value="form.school" placeholder="如：zh" />
            </n-form-item>
            <n-form-item label="年级名称">
              <n-input v-model:value="form.grade" placeholder="如：2023" />
            </n-form-item>
            <n-form-item label="班级名称">
              <n-input v-model:value="form.class" placeholder="如：1" />
            </n-form-item>
          </n-form>
        </template>

        <!-- Step 4: 确认 -->
        <div v-if="currentStep === 4">
          <n-space vertical>
            <n-alert type="info" title="提示" style="margin-bottom: 16px;">
              请确定您的填写没有问题，为了安全，租户无法删除自己！<br>
              如果需要删除租户，请与系统维护者联系。
            </n-alert>
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
  NSpace, NText, NAlert, useMessage, useThemeVars
} from 'naive-ui'

const themeVars = useThemeVars()
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
}
.register-card {
  width: 700px;
}
.step-content {
  margin-top: 24px;
  min-height: 200px;
}
</style>
