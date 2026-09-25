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
      <n-steps v-if="!registered" :current="currentStep" :status="stepStatus" style="margin-bottom: 24px;">
        <n-step title="域名" />
        <n-step title="管理员" />
        <n-step title="学校信息" />
        <n-step title="确认" />
      </n-steps>

      <!-- 成功结果页 -->
      <div v-if="registered" class="step-content">
        <n-result status="success" title="注册成功">
          <template #footer>
            <n-space vertical size="large">
              <n-alert v-if="warnings.length" type="warning" title="部分解析服务商未写入成功">
                <n-space vertical size="small">
                  <n-text v-for="warning in warnings" :key="warning" depth="3">{{ warning }}</n-text>
                </n-space>
                <n-text depth="3">不影响已成功的地址，如需要请联系维护者补写。</n-text>
              </n-alert>

              <n-timeline>
                <n-timeline-item type="success" title="第一步：下载安装包">
                  <n-button tag="a" href="https://hubproxy.khbit.cn/https://github.com/daizihan233/AstraSchedule/releases/latest/download/AstraScheduleInstaller.exe" target="_blank" size="small">
                    下载 AstraScheduleInstaller.exe
                  </n-button>
                </n-timeline-item>
                <n-timeline-item type="info" :title="successUrls.length > 1 ? `第二步：复制云端服务地址（${successUrls.length} 个，任选其一）` : '第二步：复制云端服务地址'">
                  <n-space vertical size="small">
                    <n-input v-for="url in successUrls" :key="url" :value="url" readonly class="url-input">
                      <template #suffix>
                        <n-button text @click="copyUrl(url)">复制</n-button>
                      </template>
                    </n-input>
                  </n-space>
                  <n-text depth="3">复制后粘贴至管理页与客户端</n-text>
                </n-timeline-item>
                <n-timeline-item type="info" title="第三步：前往配置">
                  <n-button tag="a" href="https://i.getastra.cn" target="_blank" size="small">
                    打开管理后台
                  </n-button>
                  <n-text depth="3" style="display: block; margin-top: 4px;">登录后可管理课表、作息等配置</n-text>
                </n-timeline-item>
              </n-timeline>

              <n-descriptions v-if="providerResults.length" :column="1" label-placement="left" bordered size="small" title="解析服务商写入结果">
                <n-descriptions-item v-for="item in providerResults" :key="item.label" :label="item.label">
                  <n-text :type="item.type" depth="3">{{ item.text }}</n-text>
                </n-descriptions-item>
              </n-descriptions>
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
            <n-form-item v-if="fqdnPreview" label="预览">
              <n-text depth="3">{{ fqdnPreview }}</n-text>
            </n-form-item>
            <n-form-item v-if="subdomainStatus" label="状态">
              <n-text :type="subdomainAvailable ? (subdomainDegraded ? 'warning' : 'success') : 'error'">
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
              <n-input v-model:value="form.password" type="password" show-password-on="click" placeholder="至少 8 位" />
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
              <n-text depth="3">• 学校名称 <n-text code>39</n-text>，年级 <n-text code>7</n-text>，班级 <n-text code>8</n-text> → 39学校7年级8班（建议）</n-text>
              <n-text depth="3">• 学校名称 <n-text code>39</n-text>，年级 <n-text code>2023</n-text>，班级 <n-text code>1</n-text> → 39学校2023级1班</n-text>
              <n-text depth="3">• 学校名称 <n-text code>xx</n-text>，年级 <n-text code>10</n-text>，班级 <n-text code>a</n-text> → xx学校10年级a班</n-text>
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
            <n-descriptions-item label="域名">{{ fqdnPreview || form.subdomain }}</n-descriptions-item>
            <n-descriptions-item label="管理员">{{ form.username }}</n-descriptions-item>
            <n-descriptions-item label="学校">{{ form.school }}</n-descriptions-item>
            <n-descriptions-item label="年级">{{ form.grade }}</n-descriptions-item>
            <n-descriptions-item label="班级">{{ form.class }}</n-descriptions-item>
          </n-descriptions>

          <div v-if="isDev" style="margin-top: 16px;">
            <n-alert type="warning">开发模式：ESA AI 验证码已跳过</n-alert>
          </div>
          <template v-else>
            <div id="captcha-element" style="margin-top: 16px;"></div>
            <n-alert v-if="captchaError" type="error" :title="captchaError" style="margin-top: 8px;">
              请检查网络或广告拦截插件后刷新页面重试。
            </n-alert>
          </template>

          <n-button type="error" block size="large" :loading="submitting" :disabled="!captchaVerified || !!captchaError" @click="handleSubmit" style="margin-top: 16px;">
            确认注册
          </n-button>
          <n-text v-if="submitError" type="error" depth="3" style="display: block; margin-top: 8px;">
            {{ submitError }}（可直接再次点击「确认注册」重试，已完成的步骤不会重复创建）
          </n-text>
        </div>
      </template>

      <!-- 导航按钮 -->
      <template #action v-if="!registered">
        <n-space v-if="currentStep >= 1 && currentStep <= 4" justify="end">
          <n-button v-if="currentStep > 1" :disabled="submitting" @click="currentStep--">上一步</n-button>
          <n-button v-if="currentStep < 4" type="primary" :disabled="!canProceed || submitting" @click="currentStep++">
            下一步
          </n-button>
        </n-space>
      </template>
    </n-card>
    <IcpFiling class="register-icp" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  NCard, NSteps, NStep, NForm, NFormItem, NInput, NButton,
  NSpace, NText, NAlert, NResult, NProgress, NDescriptions, NDescriptionsItem, NTimeline, NTimelineItem,
  useMessage, useThemeVars
} from 'naive-ui'
import axios from 'axios'
import IcpFiling from '../components/IcpFiling.vue'

const themeVars = useThemeVars()
const message = useMessage()

const currentStep = ref(1)
const submitting = ref(false)
const subdomainAvailable = ref(false)
const subdomainStatus = ref('')
const subdomainChecking = ref(false)
const subdomainDegraded = ref(false)
const fqdnPreview = ref('')
const captchaVerifyParam = ref('')
const captchaError = ref('')
const submitError = ref('')
const registered = ref(false)
const successUrls = ref([])
const warnings = ref([])
const providerResults = ref([])
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

// ESA AI 验证码验签参数的两种承载位置，与后端 handler.CaptchaQueryKey / CaptchaHeaderKey 一致。
const CAPTCHA_QUERY_KEY = 'captcha_verify_param'
const CAPTCHA_HEADER_KEY = 'captcha-verify-param'

const apiBase = import.meta.env.VITE_API_BASE || ''
const astraApiBase = import.meta.env.VITE_ASTRA_API_BASE || ''
// 身份标不在前端读取：它由 index.html 在 SDK 加载前写入 window.AliyunCaptchaConfig。
const captchaSceneId = import.meta.env.VITE_CAPTCHA_SCENE_ID || ''
// 以构建模式而非 API 域名判断环境，避免忘记配置 VITE_API_BASE 时误判为开发模式。
const isDev = import.meta.env.DEV

// captchaVerified 表示已拿到可用的验签参数（开发模式视为已通过）。
const captchaVerified = computed(() => isDev || captchaVerifyParam.value !== '')

const stepStatus = computed(() => 'process')

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1: return Boolean(form.value.subdomain) && subdomainAvailable.value && !subdomainChecking.value
    case 2: return form.value.username.length >= 3 && form.value.password.length >= 8 && form.value.password === form.value.confirmPassword
    case 3: return form.value.school && form.value.grade && form.value.class
    default: return true
  }
})

const ACTION_TEXT = { created: '已创建', updated: '已更新', unchanged: '已存在' }

// describeRecord 把单条记录渲染成「域名 [线路] 动作」。
// 单独抽出来是为了避免嵌套模板字符串。
function describeRecord(record) {
  const line = record.line ? ' [' + record.line + ']' : ''
  const action = ACTION_TEXT[record.action] || record.action
  return record.fqdn + line + ' ' + action
}

function describeProvider(provider) {
  if (provider.skipped) return { text: `已跳过（${provider.reason || '未配置'}）`, type: 'default' }
  if (!provider.ok) return { text: `失败：${provider.error || '未知错误'}`, type: 'error' }

  const records = provider.records || []
  const suffix = provider.public === false ? '（仅写入记录，不作为访问地址）' : ''
  if (!records.length) return { text: `无需改动${suffix}`, type: 'success' }

  const text = records
    .map(describeRecord)
    .join('；')
  return { text: text + suffix, type: 'success' }
}

let checkTimer = null
let checkSeq = 0

function checkSubdomain() {
  // 先取号再判断空值：清空输入时在途请求的结果也必须失效，
  // 否则旧响应会把状态与域名预览恢复回来。
  const seq = ++checkSeq

  subdomainStatus.value = ''
  subdomainAvailable.value = false
  subdomainDegraded.value = false
  fqdnPreview.value = ''
  clearTimeout(checkTimer)
  if (!form.value.subdomain) return

  checkTimer = setTimeout(async () => {
    subdomainChecking.value = true
    try {
      const resp = await axios.get(`${apiBase}/api/check-subdomain/${encodeURIComponent(form.value.subdomain)}`)
      // 丢弃过期响应，避免慢请求覆盖用户最新输入的检查结果。
      if (seq !== checkSeq) return
      subdomainAvailable.value = resp.data?.available === true
      subdomainStatus.value = resp.data?.message || ''
      subdomainDegraded.value = resp.data?.degraded === true
      // 完整域名由后端按各服务商配置生成，前端不硬编码根域名。
      // 优先展示对外暴露的那一个；只做回源的服务商不作为访问地址。
      const enabled = (resp.data?.providers || []).filter((provider) => provider.enabled && provider.fqdn)
      const preferred = enabled.find((provider) => provider.public !== false) || enabled[0]
      fqdnPreview.value = preferred ? preferred.fqdn : ''
    } catch (e) {
      if (seq !== checkSeq) return
      subdomainAvailable.value = false
      subdomainStatus.value = e?.response?.data?.message || '检查失败，请稍后重试'
    } finally {
      if (seq === checkSeq) subdomainChecking.value = false
    }
  }, 500)
}

onMounted(() => {
  if (isDev) return
  if (!captchaSceneId || !globalThis.AliyunCaptchaConfig?.prefix) {
    captchaError.value = '前端未配置 ESA 验证码身份标或场景 ID'
    return
  }
  renderCaptcha()
})

onUnmounted(() => {
  clearTimeout(checkTimer)
  clearInterval(captchaTimer)
})

async function copyUrl(url) {
  try {
    if (!navigator.clipboard) throw new Error('clipboard unavailable')
    await navigator.clipboard.writeText(url)
    message.success('已复制到剪贴板')
  } catch {
    // 非安全上下文或缺权限时 navigator.clipboard 不可用，退化为手动提示。
    message.warning('自动复制失败，请手动选中地址复制')
  }
}

// captchaInstance 是 ESA AI 验证码实例，用于验签失败后刷新令牌。
let captchaInstance = null
let captchaTimer = null
let captchaReadyPromise = null

// waitForCaptcha 轮询等待 ESA 验证码 SDK 加载完成。
// SDK 由 index.html 从官方 CDN 引入，挂载时可能尚未就绪。
function waitForCaptcha(timeoutMs = 10000) {
  return new Promise((resolve) => {
    if (globalThis.initAliyunCaptcha) {
      resolve(true)
      return
    }
    const startedAt = Date.now()
    captchaTimer = setInterval(() => {
      if (globalThis.initAliyunCaptcha) {
        clearInterval(captchaTimer)
        resolve(true)
        return
      }
      if (Date.now() - startedAt >= timeoutMs) {
        clearInterval(captchaTimer)
        resolve(false)
      }
    }, 100)
  })
}

// renderCaptcha 初始化 ESA AI 验证码。
//
// 身份标已由 index.html 在 SDK 之前写入 window.AliyunCaptchaConfig，这里只需场景 ID。
// initAliyunCaptcha 不支持重复初始化，因此已初始化过就跳过。
async function renderCaptcha() {
  if (captchaInstance) return
  const container = document.getElementById('captcha-element')
  if (!container) return

  // 并发调用共用同一个等待过程，避免同一个容器被初始化两次。
  if (!captchaReadyPromise) {
    captchaReadyPromise = waitForCaptcha().finally(() => { captchaReadyPromise = null })
  }
  const loaded = await captchaReadyPromise
  if (!loaded) {
    captchaError.value = '人机验证组件加载失败'
    return
  }

  // 等待期间可能已完成初始化、已离开确认步骤、或容器已被重建，
  // 因此这里必须重新确认条件，否则会在已失效的容器上初始化。
  if (captchaInstance) return
  if (document.getElementById('captcha-element') !== container) return

  captchaError.value = ''
  globalThis.initAliyunCaptcha({
    SceneId: captchaSceneId,
    mode: 'embed',
    element: '#captcha-element',
    language: 'cn',
    // 一点即过与滑块形态的触发框体尺寸
    slideStyle: { width: 360, height: 40 },
    success: (param) => { captchaVerifyParam.value = param },
    fail: () => { captchaVerifyParam.value = '' },
    onError: (errorInfo) => {
      captchaVerifyParam.value = ''
      captchaError.value = `人机验证出错（${errorInfo?.code || 'unknown'}），请刷新页面重试`
    },
    getInstance: (instance) => { captchaInstance = instance },
    // ESA 验证码服务域名，官方要求固定使用
    server: ['captcha-esa-open.aliyuncs.com', 'captcha-esa-open-b.aliyuncs.com'],
  })
}

// resetCaptcha 作废已消耗的验签参数（一次性、有效期 90 秒）。
function resetCaptcha() {
  captchaVerifyParam.value = ''
  captchaInstance?.refresh?.()
}

// captchaParams 返回携带验签参数的请求配置。
//
// ESA 文档里查询参数写作 captcha_verify_param、请求头写作 captcha-verify-param，
// 两种都带上，避免文档口径不一致导致边缘取不到令牌。
function captchaParams() {
  const param = captchaVerifyParam.value
  if (!param) return { params: {}, headers: {} }
  return {
    params: { [CAPTCHA_QUERY_KEY]: param },
    headers: { [CAPTCHA_HEADER_KEY]: param },
  }
}

watch(currentStep, (step) => {
  if (step === 4 && !isDev) {
    renderCaptcha()
  }
  // flush: 'post' 让回调在 DOM 更新之后执行；否则切到确认步骤时
  // #captcha-element 还没被 v-if 创建，控件永远不会初始化、按钮一直禁用。
}, { flush: 'post' })

// pickSuccessUrls 兼容新旧两种响应：优先用 urls 数组，回退到单个 url 字段。
function pickSuccessUrls(data) {
  if (data?.urls?.length) return data.urls
  if (data?.url) return [data.url]
  return []
}

async function handleSubmit() {
  if (!captchaVerified.value) {
    message.warning('请完成人机验证')
    return
  }

  const captcha = captchaParams()
  submitting.value = true
  submitError.value = ''
  regProgress.value = 0
  try {
    const tokenResp = await axios.post(
      `${apiBase}/api/sign-token`,
      {
        subdomain: form.value.subdomain,
        username: form.value.username,
        password: form.value.password,
        school: form.value.school,
        grade: form.value.grade,
        class: form.value.class,
      },
      captcha,
    )
    const token = tokenResp.data.token
    regProgress.value = 33

    await axios.post(`${astraApiBase}/web/admin/register-tenant`, null, {
      headers: { 'X-Reg-Token': token },
    })
    regProgress.value = 66

    const dnsResp = await axios.post(`${apiBase}/api/create-dns`, { token })
    regProgress.value = 100

    const urls = pickSuccessUrls(dnsResp.data)
    successUrls.value = urls
    warnings.value = dnsResp.data?.warnings || []
    providerResults.value = (dnsResp.data?.providers || []).map((provider) => ({
      label: provider.label || provider.provider,
      ...describeProvider(provider),
    }))
    registered.value = true
    message.success('注册成功！')
  } catch (e) {
    // 令牌与人机验证都是一次性的，失败后必须重置并让用户重试，
    // 后端两步均为幂等，重复提交不会产生重复租户或重复记录。
    submitError.value = e?.response?.data?.error || e?.message || '注册失败'
    message.error(submitError.value)
    resetCaptcha()
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.register-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 20px;
}
.register-icp {
  margin-top: 16px;
}
.register-card {
  width: 560px;
  margin: auto 0;
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
