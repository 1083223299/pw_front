<template>
  <header class="desktop-titlebar" @dblclick="toggleMaximize">
    <div class="titlebar-brand">
      <span v-if="CURRENT_ENV !== ENV_NAMES.PROD" class="environment-badge">{{ config.name }}环境</span>
    </div>

    <div class="titlebar-actions" @dblclick.stop>
      <button
        class="titlebar-action"
        type="button"
        title="刷新页面（F5）"
        @click="refreshPage"
      >
        <el-icon><Refresh /></el-icon>
      </button>

      <button
        class="titlebar-action coin"
        type="button"
        title="财务管控"
        @click="router.push('/admin/finance')"
      >
        <el-icon><Coin /></el-icon>
      </button>

      <SettingsPanel />

      <button
        class="titlebar-action bell"
        :class="{ shaking: bellShaking }"
        type="button"
        title="消息通知"
        @click="openNotify"
      >
        <el-icon><Bell /></el-icon>
        <span v-if="notify.badgeText" class="action-badge">{{ notify.badgeText }}</span>
      </button>
    </div>

    <div class="window-controls" @dblclick.stop>
      <button class="window-button" type="button" title="最小化" @click="minimize">
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8" /></svg>
      </button>
      <button
        class="window-button"
        type="button"
        :title="isMaximized ? '还原' : '最大化'"
        @click="toggleMaximize"
      >
        <svg v-if="!isMaximized" viewBox="0 0 12 12" aria-hidden="true">
          <rect x="2.4" y="2.4" width="7.2" height="7.2" />
        </svg>
        <svg v-else viewBox="0 0 12 12" aria-hidden="true">
          <rect x="2.2" y="3.4" width="6" height="6" />
          <path d="M4 3.4V2.2h6v6H8.8" />
        </svg>
      </button>
      <button class="window-button close" type="button" title="关闭" @click="closeWindow">
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" /></svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, Coin, Refresh } from '@element-plus/icons-vue';
import { config, CURRENT_ENV, ENV_NAMES } from '@/config/env';
import SettingsPanel from '@/components/SettingsPanel.vue';
import { useNotifyStore } from '@/stores/notify';

const controls = window.windowControls;
const router = useRouter();
const notify = useNotifyStore();
const isMaximized = ref(false);
const bellShaking = ref(false);
let removeMaximizeListener = null;
let shakeTimer = null;

watch(() => notify.pulse, () => {
  bellShaking.value = true;
  if (shakeTimer) clearTimeout(shakeTimer);
  shakeTimer = setTimeout(() => {
    bellShaking.value = false;
  }, 900);
});

function minimize() {
  controls?.minimize();
}

function toggleMaximize() {
  controls?.toggleMaximize();
}

function closeWindow() {
  controls?.close();
}

function refreshPage() {
  // 刷新当前渲染进程页面，等价于浏览器 F5；不重启 Electron 主进程。
  window.location.reload();
}

function openNotify() {
  if (window.notifyBridge?.clearFlash) window.notifyBridge.clearFlash();
  router.push('/admin/notify');
}

onMounted(() => {
  removeMaximizeListener = controls?.onMaximizeChange((value) => {
    isMaximized.value = value;
  });
});

onBeforeUnmount(() => {
  removeMaximizeListener?.();
  if (shakeTimer) clearTimeout(shakeTimer);
});
</script>

<style scoped>
.desktop-titlebar {
  position: relative;
  z-index: 1000;
  height: 36px;
  flex: 0 0 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--app-titlebar-bg);
  border-bottom: 1px solid var(--app-titlebar-border);
  box-shadow: 0 1px 2px var(--app-bg-mask);
  user-select: none;
  -webkit-app-region: drag;
}

.titlebar-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding-left: 14px;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.environment-badge {
  padding: 2px 7px;
  border-radius: 5px;
  color: #f59e0b;
  background: rgba(180, 83, 9, 0.15);
  font-size: 10px;
  font-weight: 600;
}

.titlebar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 6px;
  -webkit-app-region: no-drag;
}

.titlebar-action {
  position: relative;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--app-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.15s ease;
}

.titlebar-action:active {
  transform: scale(0.94);
}

.titlebar-action:hover {
  color: var(--app-accent);
  background: var(--app-bg-hover);
}

.titlebar-action.coin {
  color: #d97706;
}

.titlebar-action.coin:hover {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}

.titlebar-action.bell.shaking {
  animation: bell-shake 0.9s ease;
}

.action-badge {
  position: absolute;
  top: -2px;
  right: -3px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: #ffffff;
  background: #ef4444;
  border: 1.5px solid #ffffff;
  box-sizing: border-box;
}

@keyframes bell-shake {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(14deg); }
  40% { transform: rotate(-12deg); }
  60% { transform: rotate(8deg); }
  80% { transform: rotate(-5deg); }
}

.window-controls {
  align-self: stretch;
  display: flex;
  flex: 0 0 auto;
  margin-left: 6px;
  border-left: 1px solid var(--app-divider);
  -webkit-app-region: no-drag;
}

.window-button {
  width: 42px;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  color: var(--app-text-secondary);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.window-button svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.2;
}

.window-button:hover {
  color: var(--app-text-regular);
  background: var(--app-bg-hover);
}

.window-button.close:hover {
  color: #fff;
  background: #e81123;
}
</style>
