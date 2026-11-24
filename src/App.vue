<template>
  <DesktopTitlebar v-if="isDesktop" />
  <div :class="{ 'desktop-content': isDesktop }">
    <router-view />
  </div>
  <NotifyBubbleHost />
  <UpdateDialog />
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import DesktopTitlebar from '@/components/DesktopTitlebar.vue';
import NotifyBubbleHost from '@/components/NotifyBubbleHost.vue';
import UpdateDialog from '@/components/UpdateDialog.vue';
import { useNotifyStore } from '@/stores/notify';
import { usePreferencesStore } from '@/stores/preferences';
import { useAuthStore } from '@/stores/auth';
import { applyWatermark, removeWatermark } from '@/utils/watermark';
import { applyTheme, watchSystemTheme } from '@/utils/theme';

// 仅 Electron 环境显示桌面窗口控制栏，Web 端结构保持不变。
const isDesktop = Boolean(window.windowControls);
const router = useRouter();
const notify = useNotifyStore();
const prefs = usePreferencesStore();
const authStore = useAuthStore();
let removeOpenNotifyListener = null;
let removeSystemThemeListener = null;

function watermarkText() {
  const date = new Date().toISOString().slice(0, 10);
  const who = authStore.username ? ` · ${authStore.username}` : '';
  return `充值中心${who} · ${date}`;
}

function syncWatermark() {
  if (!isDesktop) return;
  if (prefs.watermark) applyWatermark(watermarkText());
  else removeWatermark();
}

function handleWindowFocus() {
  // 主窗口重新聚焦后，托盘不再继续闪动。
  if (window.notifyBridge?.clearFlash) window.notifyBridge.clearFlash();
}

onMounted(() => {
  if (isDesktop) document.body.classList.add('desktop-app');
  // 应用外观主题，并监听系统深浅色变化（仅跟随系统模式时生效）
  applyTheme(prefs.themeMode);
  removeSystemThemeListener = watchSystemTheme(
    () => prefs.themeMode,
    () => {
      applyTheme(prefs.themeMode);
      // 主题变化后重建水印，使水印颜色跟随深浅背景
      syncWatermark();
    }
  );
  if (window.notifyBridge?.onOpenNotify) {
    removeOpenNotifyListener = window.notifyBridge.onOpenNotify((payload) => {
      let target = notify.getJumpTarget(payload?.notificationId);
      if (payload?.orderId || payload?.subOrderId || payload?.orderNo) {
        target = {
          path: '/admin/home',
          query: {
            orderId: payload.orderId || '',
            subOrderId: payload.subOrderId || '',
            orderNo: payload.orderNo || payload.merchantOrderNo || ''
          }
        };
      }
      router.push(target);
      if (payload?.notificationId) notify.markRead(payload.notificationId);
    });
  }
  window.addEventListener('focus', handleWindowFocus);
  syncWatermark();

  if (authStore.token) {
    notify.bootstrap(authStore.token);
  }
});

watch(
  () => prefs.themeMode,
  (mode) => {
    applyTheme(mode);
    syncWatermark();
  }
);

watch(
  () => `${prefs.watermark}:${authStore.username}`,
  () => syncWatermark()
);

watch(
  () => authStore.token,
  (token) => {
    if (token) notify.bootstrap(token);
    else notify.resetState();
  }
);

onUnmounted(() => {
  document.body.classList.remove('desktop-app');
  window.removeEventListener('focus', handleWindowFocus);
  if (typeof removeOpenNotifyListener === 'function') removeOpenNotifyListener();
  if (typeof removeSystemThemeListener === 'function') removeSystemThemeListener();
  removeWatermark();
});
</script>
