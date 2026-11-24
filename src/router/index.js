import {
    createRouter,
    createWebHashHistory,
    createWebHistory,
} from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const routes = [
    // =========================
    // 根目录
    // =========================
    {
        path: '/',
        redirect: '/login',
    },

    // =========================
    // 登录
    // =========================
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: {
            public: true,
            title: '登录',
        },
    },

    // =========================
    // 管理后台
    // =========================
    {
        path: '/admin',
        component: () => import('@/layouts/AdminLayout.vue'),
        children: [

            // /admin
            // ↓
            // /admin/home
            {
                path: '',
                redirect: '/admin/home',
            },

            // =========================
            // 首页
            // =========================
            {
                path: 'home',
                name: 'Home',
                component: () => import('@/views/Home.vue'),
                meta: {
                    title: '首页',
                },
            },

            // =========================
            // 参数管控
            // =========================
            {
                path: 'parameter',
                name: 'Parameter',
                component: () => import('@/views/Parameter.vue'),
                meta: {
                    title: '参数管控',
                },
            },

            // =========================
            // 链接管控
            // =========================
            {
                path: 'link',
                name: 'Link',
                component: () => import('@/views/Link.vue'),
                meta: {
                    title: '链接管控',
                },
            },

            {
                path: 'finance',
                name: 'Finance',
                component: () => import('@/views/Finance.vue'),
                meta: {
                    title: '财务管控'
                }
            },

            {
                path: 'tools',
                name: 'AdminTools',
                component: () => import('@/views/Tools.vue'),
                meta: {
                    title: '订单处理工具'
                }
            },

            {
                path: 'notify',
                name: 'NotifyCenter',
                component: () => import('@/views/NotifyCenter.vue'),
                meta: {
                    title: '消息通知'
                }
            },

            // =========================
            // 某个平台的配置列表
            //
            // 例如：
            // /admin/parameter/soul
            // /admin/parameter/danzai
            // =========================
            {
                path: 'parameter/:platform',
                name: 'ParameterList',
                component: () => import('@/views/ParameterList.vue'),
                meta: {
                    title: '平台配置',
                },
            },


            {
                path: '/recharge-rule-tool',
                name: 'RechargeRuleTool',
                component: () => import('@/views/RechargeRuleTool.vue'),
                meta: {
                    title: '充值档位匹配工具',
                },
            },

            {
                path: 'netease-goods',
                name: 'NeteaseGoods',
                component: () => import('@/views/NeteaseGoods.vue'),
                meta: {
                    title: '网易实时商品中心'
                }
            },
            // =========================
            // 抖音钻石母版管理
            // =========================
            {
                path: 'douyin-master',
                name: 'DouyinMaster',
                component: () => import('@/views/DouyinMaster.vue'),
                meta: {
                    title: '抖音钻石母版'
                }
            },

            // =========================
            // 某一个具体配置
            //
            // 例如：
            // /admin/parameter/soul/soul-36
            // =========================
            // {
            //     path: 'parameter/:platform/:configId',
            //     name: 'ParameterDetail',
            //     component: () => import('@/views/ParameterDetail.vue'),
            //     meta: {
            //         title: '参数配置',
            //     },
            // },
        ],
    },

    // =========================
    // 404
    // =========================
    {
        path: '/:pathMatch(.*)*',
        redirect: '/login',
    },
]

const router = createRouter({
    // Electron 打包后通过 file:// 加载，使用 hash 避免刷新或跳转时找不到本地文件；Web 端保持原路径。
    history: import.meta.env.VITE_DESKTOP === 'true'
        ? createWebHashHistory()
        : createWebHistory('/h5_pw/'),
    routes,
})

// =========================
// 全局路由守卫
// =========================

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isLogin = authStore.isLogin()

    // =========================
    // 登录页面
    // =========================
    if (to.path === '/login') {

        // 已经登录
        // 不允许再次进入登录页
        if (isLogin) {
            next('/admin/home')
            return
        }

        next()
        return
    }

    // =========================
    // 非公开页面
    // 必须登录
    // =========================
    if (!isLogin) {
        next('/login')
        return
    }

    next()
})

export default router