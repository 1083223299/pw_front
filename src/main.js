import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
// Element Plus 中文语言包（分页、空文本、按钮等内置文案）
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import 'element-plus/dist/index.css'
// Element Plus 自带深色主题变量：<html> 带 dark 类时自动生效
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.css'

import App from './App.vue'
import router from './router'
import { CLIENT_VERSION, config, CURRENT_ENV } from '@/config/env'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 桌面端启动时向主进程上报实际使用的环境，便于核对日志。
window.appInfo?.reportEnv({
    env: CURRENT_ENV,
    name: config.name,
    version: CLIENT_VERSION,
    baseURL: config.apibaseURL,
    toolsBaseURL: config.toolsApibaseURL,
})

app.mount('#app')