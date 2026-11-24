import { defineStore } from 'pinia'
import { ref } from 'vue'

const TOKEN_KEY = 'admin_token'

export const useAuthStore = defineStore('auth', () => {

        const token = ref(localStorage.getItem(TOKEN_KEY) || '')
        const tenantId = ref(localStorage.getItem('tenant_id') || '')
        const username = ref(localStorage.getItem('username') || '')

    /**

     * 设置登录信息

     */

    function setLogin(data) {

        console.log('setLogin 收到的 data:', data)
        console.log('tenant_id:', data.tenant_id, typeof data.tenant_id)

        setToken(data.token)

        // 兼容后端返回 user_name/tenant_id 或 username/tenantId 两种字段命名
        const nextTenantId = data.tenant_id || data.tenantId || ''
        const nextUsername = data.username || data.user_name || data.userName || ''

        tenantId.value = nextTenantId
        username.value = nextUsername

        console.log('store 里的 tenantId:', tenantId.value, typeof tenantId.value)

        if (nextTenantId) {
            localStorage.setItem('tenant_id', nextTenantId)
        } else {
            localStorage.removeItem('tenant_id')
        }
        if (nextUsername) {
            localStorage.setItem('username', nextUsername)
        } else {
            localStorage.removeItem('username')

        }
    }

    /**
     * 设置 Token
     */
    function setToken(value) {
        token.value = value

        if (value) {
            localStorage.setItem(TOKEN_KEY, value)
        } else {
            localStorage.removeItem(TOKEN_KEY)
        }
    }

    /**
     * 清除 Token
     */
    function clearToken() {
        token.value = ''
        tenantId.value = ''
        username.value = ''

        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('tenant_id')
        localStorage.removeItem('username')

    }

    /**
     * 是否登录
     */
    function isLogin() {
        return !!token.value
    }

    return {
        token,
        tenantId,
        username,
        setToken,
        setLogin,
        clearToken,
        isLogin,
    }
})