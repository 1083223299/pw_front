import axios from 'axios'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { config } from '@/config/env'

// 主后端接口地址和超时时间统一从多环境配置读取，具体值仍来自当前项目的 .env 文件。
const BASE_URL = config.apibaseURL

const request = axios.create({
    baseURL: BASE_URL,
    timeout: config.timeout,
})

// 请求拦截器
request.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore()
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        // Token 过期
        if (error.response?.status === 401) {
            const authStore = useAuthStore()

            authStore.clearToken()

            // 当前不在登录页才跳转
            if (router.currentRoute.value.path !== '/login') {
                await router.replace('/login')
            }
        }

        return Promise.reject(error)
    }
)

export default request