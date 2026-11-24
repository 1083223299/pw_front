<template>
  <div class="admin-layout">
    <!-- =========================
         顶部导航
         ========================= -->
    <header class="top-header">
      <!-- Logo -->
      <div class="brand" @click="goHome">
        <img class="brand-icon" :src="logoUrl" alt="品牌 Logo" />

        <div class="brand-info">
          <div class="brand-name">充值中心</div>
          <div class="brand-subtitle">RECHARGE CENTER</div>
        </div>
      </div>

      <!-- PC 导航 -->
      <nav class="navigation">
        <div
            class="nav-item"
            :class="{ active: isActive('/admin/home') }"
            @click="router.push('/admin/home')"
        >
          <el-icon>
            <House />
          </el-icon>

          <span>首页</span>
        </div>

        <div
            class="nav-item"
            :class="{ active: isActive('/admin/parameter') }"
            @click="router.push('/admin/parameter')"
        >
          <el-icon>
            <Setting />
          </el-icon>

          <span>参数管控</span>
        </div>

        <div
            class="nav-item"
            :class="{ active: isActive('/admin/link') }"
            @click="router.push('/admin/link')"
        >
          <el-icon>
            <Link />
          </el-icon>

          <span>链接管控</span>
        </div>

        <div
            class="nav-item"
            :class="{ active: isActive('/admin/finance') }"
            @click="router.push('/admin/finance')"
        >
          <el-icon>
            <Wallet />
          </el-icon>

          <span>财务管控</span>
        </div>

        <!-- 订单处理工具 -->
        <div
            class="nav-item"
            :class="{ active: isActive('/admin/tools') }"
            @click="router.push('/admin/tools')"
        >
          <el-icon>
            <Tools />
          </el-icon>

          <span>订单处理工具</span>
        </div>


      </nav>

      <!-- 右侧 -->
      <div class="header-right">
        <div class="online-status">
          <span class="online-dot"></span>
          <span>系统正常</span>
        </div>

        <el-dropdown
            trigger="click"
            @command="handleCommand"
        >
          <div class="user-menu">
            <div class="user-avatar">管</div>

            <div class="user-info">
              <span class="username">管理员</span>
              <span class="user-role">ADMIN</span>
            </div>

            <el-icon class="arrow">
              <ArrowDown />
            </el-icon>
          </div>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="home">
                <el-icon>
                  <House />
                </el-icon>

                返回首页
              </el-dropdown-item>

              <el-dropdown-item
                  divided
                  command="logout"
              >
                <el-icon>
                  <SwitchButton />
                </el-icon>

                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- =========================
         手机端导航
         ========================= -->
    <div class="mobile-navigation">
      <div
          class="mobile-nav-item"
          :class="{ active: isActive('/admin/home') }"
          @click="router.push('/admin/home')"
      >
        <el-icon>
          <House />
        </el-icon>

        <span>首页</span>
      </div>

      <div
          class="mobile-nav-item"
          :class="{ active: isActive('/admin/parameter') }"
          @click="router.push('/admin/parameter')"
      >
        <el-icon>
          <Setting />
        </el-icon>

        <span>参数管控</span>
      </div>

      <div
          class="mobile-nav-item"
          :class="{ active: isActive('/admin/link') }"
          @click="router.push('/admin/link')"
      >

        <el-icon>
          <Link />
        </el-icon>

        <span>链接管控</span>

      </div>

      <div
          class="mobile-nav-item"
          :class="{ active: isActive('/admin/finance') }"
          @click="router.push('/admin/finance')"
      >
        <el-icon>
          <Wallet />
        </el-icon>

        <span>财务管控</span>
      </div>

      <!-- 手机端：订单处理工具 -->
      <div
          class="mobile-nav-item"
          :class="{ active: isActive('/admin/tools') }"
          @click="router.push('/admin/tools')"
      >
        <el-icon>
          <Tools />
        </el-icon>

        <span>订单处理工具</span>
      </div>
    </div>

    <!-- =========================
         页面内容
         ========================= -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- =========================
         页脚
         ========================= -->
    <footer class="footer">
      <span>© {{ currentYear }} 充值中心</span>
      <span class="footer-dot">·</span>
      <span>Recharge Center</span>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ElMessageBox,
  ElMessage
} from 'element-plus'

import {
  House,
  Setting,
  Link,
  Wallet,
  Tools,
  ArrowDown,
  SwitchButton
} from '@element-plus/icons-vue'

import { useAuthStore } from '../stores/auth'
import { useNotifyStore } from '@/stores/notify'
import { logout } from '@/api/api.js'
import logoUrl from '@/assets/images/logo-brand.png'

/* =========================
   Router
   ========================= */
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notify = useNotifyStore()

/* =========================
   当前年份
   ========================= */
const currentYear = computed(() => {
  return new Date().getFullYear()
})

/* =========================
   判断当前菜单
   ========================= */
function isActive(path) {
  if (path === '/admin/home') {
    return (
        route.path === '/admin/home' ||
        route.path === '/admin/' ||
        route.path === '/admin'
    )
  }

  return route.path.startsWith(path)
}

/* =========================
   返回首页
   ========================= */
function goHome() {
  router.push('/admin/home')
}

/* =========================
   用户菜单
   ========================= */
async function handleCommand(command) {
  if (command === 'home') {
    await router.push('/admin/home')
    return
  }

  if (command === 'logout') {
    try {
      await ElMessageBox.confirm(
          '确定要退出当前账号吗？',
          '退出登录',
          {
            confirmButtonText: '退出登录',
            cancelButtonText: '取消',
            type: 'warning'
          }
      )

      const res = await logout()

      if (!res) {
        throw new Error('退出失败')
      }

      authStore.clearToken()
      notify.resetState()

      localStorage.removeItem('user')

      await router.replace('/login')

      ElMessage.success('已退出登录')
    } catch (error) {
      /*
       * 点击取消或者关闭弹窗
       * 不做任何处理
       */
      if (
          error !== 'cancel' &&
          error !== 'close'
      ) {
        console.error(
            '退出登录失败:',
            error
        )
      }
    }
  }
}
</script>

<style scoped>
/* ==================================================
   整体
   ================================================== */
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--app-bg);
  color: var(--app-text-regular);
}

/* ==================================================
   顶部导航
   ================================================== */
.top-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 68px;
  display: flex;
  align-items: center;
  padding: 0 32px;
  background: var(--app-header-bg);
  border-bottom: 1px solid var(--app-border);
  box-shadow: 0 1px 2px var(--app-bg-mask);
  backdrop-filter: blur(12px);
}

/* ==================================================
   Logo
   ================================================== */
.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;
}

.brand-icon {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  object-fit: contain;
  display: block;
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-name {
  font-size: 15px;
  font-weight: 650;
  line-height: 1;
  color: var(--app-text-primary);
}

.brand-subtitle {
  font-size: 7px;
  line-height: 1;
  letter-spacing: 1.5px;
  color: var(--app-text-placeholder);
}

/* ==================================================
   导航
   ================================================== */
.navigation {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 55px;
}

.nav-item {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 18px;
  font-size: 13px;
  color: var(--app-text-secondary);
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.nav-item:hover {
  color: var(--app-accent);
  background: var(--app-bg-hover);
}

.nav-item.active {
  color: var(--app-accent);
  font-weight: 500;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 22px;
  height: 3px;
  transform: translateX(-50%);
  border-radius: 3px 3px 0 0;
  background: var(--app-accent);
}

/* ==================================================
   右侧
   ================================================== */
.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 22px;
}

.online-status {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--app-text-muted);
}

.online-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

/* ==================================================
   用户
   ================================================== */
.user-menu {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 6px 6px 7px;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.user-menu:hover {
  background: var(--app-bg-hover);
}

.user-avatar {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.username {
  font-size: 12px;
  line-height: 1;
  font-weight: 500;
  color: var(--app-text-regular);
}

.user-role {
  font-size: 8px;
  line-height: 1;
  letter-spacing: 1px;
  color: var(--app-text-placeholder);
}

.arrow {
  margin-left: 2px;
  font-size: 12px;
  color: var(--app-text-muted);
}

/* ==================================================
   手机导航
   ================================================== */
.mobile-navigation {
  display: none;
}

/* ==================================================
   页面主体
   ================================================== */
.main-content {
  flex: 1;
  width: 100%;
  /* padding: 30px 32px 40px; */
  box-sizing: border-box;
}

/* ==================================================
   Footer
   ================================================== */
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 20px 22px;
  font-size: 11px;
  color: var(--app-text-muted);
}

.footer-dot {
  color: var(--app-border);
}

.mobile-nav-item {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 12px;
  color: var(--app-text-muted);
  cursor: pointer;
  white-space: nowrap;
}

/* ==================================================
   平板
   ================================================== */
@media (max-width: 900px) {
  .top-header {
    padding: 0 20px;
  }

  .navigation {
    margin-left: 25px;
  }

  .nav-item {
    padding: 0 13px;
  }

  .online-status {
    display: none;
  }

  .main-content {
    padding: 25px 20px 35px;
  }
}

/* ==================================================
   手机
   ================================================== */
@media (max-width: 700px) {
  .top-header {
    height: 60px;
    padding: 0 16px;
  }

  .brand-icon {
    width: 31px;
    height: 31px;
    border-radius: 9px;
  }

  .brand-name {
    font-size: 14px;
  }

  .brand-subtitle {
    display: none;
  }

  .navigation {
    display: none;
  }

  .header-right {
    gap: 0;
  }

  .user-info {
    display: none;
  }

  .user-menu {
    padding: 3px;
  }

  .user-avatar {
    width: 31px;
    height: 31px;
  }

  .arrow {
    display: none;
  }

  /* 手机导航：仅在手机端显示，PC / 平板保持隐藏 */
  .mobile-navigation {
    position: sticky;
    top: 60px;
    z-index: 90;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0;
    padding: 0 8px;
    background: var(--app-header-bg);
    border-bottom: 1px solid var(--app-border);
    backdrop-filter: blur(12px);
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .mobile-navigation::-webkit-scrollbar {
    display: none;
  }

  .mobile-nav-item {
    flex: 0 0 auto;
    min-width: 95px;
    padding: 0 12px;
  }

  .mobile-nav-item.active {
    color: var(--app-accent);
    font-weight: 500;
  }

  .mobile-nav-item.active::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 24px;
    height: 2px;
    transform: translateX(-50%);
    border-radius: 2px 2px 0 0;
    background: var(--app-accent);
  }

  .main-content {
    padding: 20px 14px 30px;
  }

  .footer {
    padding-bottom: 18px;
  }
}

/* ==================================================
   超小屏
   ================================================== */
@media (max-width: 380px) {
  .mobile-navigation {
    gap: 0;
    justify-content: space-around;

  }

  .mobile-nav-item {
    flex: 1;
    min-width: 0;
    padding: 0 6px;
    white-space: nowrap;
  }
}
</style>