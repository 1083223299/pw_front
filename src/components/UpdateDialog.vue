<template>
  <Teleport to="body">
    <!-- 下载中遮罩：阻断页面操作，并展示下载进度 -->
    <Transition name="ud-fade">
      <div v-if="downloading" class="ud-mask">
        <div class="ud-downloading">
          <div class="ud-spinner"></div>
          <div class="ud-title">正在下载更新{{ version ? ` v${version}` : '' }}</div>
          <div class="ud-sub">更新下载中，请勿关闭应用</div>
          <div class="ud-bar">
            <div class="ud-bar-inner" :style="{ width: Math.min(100, progress) + '%' }"></div>
          </div>
          <div class="ud-percent">{{ Math.round(Math.min(100, progress)) }}%</div>
        </div>
      </div>
    </Transition>

    <!-- 确认弹窗：发现新版本 / 下载完成 -->
    <Transition name="ud-fade">
      <div
        v-if="confirmVisible"
        class="ud-mask"
        @pointerdown="handleOverlayPointerDown"
        @pointermove="handleOverlayPointerMove"
        @pointerup="handleOverlayPointerUp"
        @pointercancel="overlayPointer = null"
      >
        <div class="ud-dialog">
          <div class="ud-dialog-title">
            {{ confirmMode === 'available' ? '发现新版本' : '更新已就绪' }}
          </div>
          <div class="ud-desc">
            {{
              confirmMode === 'available'
                ? `检测到新版本${version ? ` v${version}` : ''}，是否立即下载更新？`
                : `新版本${version ? ` v${version}` : ''}已下载完成，重启后生效。`
            }}
          </div>
          <div class="ud-actions">
            <button class="ud-btn ghost" type="button" @click="later">
              {{ confirmMode === 'available' ? '暂不更新' : '稍后重启' }}
            </button>
            <button
              class="ud-btn primary"
              type="button"
              @click="confirmMode === 'available' ? updateNow() : restartNow()"
            >
              {{ confirmMode === 'available' ? '立即更新' : '立即重启' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';

/**
 * 全局自动更新弹窗。
 * 状态来源：主进程 settings:update-status；下载/安装通过 settingsBridge 桥接。
 */
const bridge = window.settingsBridge;

const confirmVisible = ref(false);
const confirmMode = ref('available'); // available | downloaded
const downloading = ref(false);
const progress = ref(0);
const version = ref('');
const errorMsg = ref('');

let offUpdateStatus = null;
let downloadedTimer = null;
let overlayPointer = null;

function handleStatus(payload) {
  const status = payload && payload.status;
  if (!status) return;

  switch (status) {
    case 'available':
      if (downloadedTimer) clearTimeout(downloadedTimer);
      version.value = payload.version || '';
      errorMsg.value = '';
      confirmMode.value = 'available';
      confirmVisible.value = true;
      downloading.value = false;
      break;

    case 'downloading':
      confirmVisible.value = false;
      downloading.value = true;
      if (payload.extra && payload.extra.percent !== undefined) {
        progress.value = payload.extra.percent;
      }
      break;

    case 'downloaded':
      version.value = payload.version || version.value;
      progress.value = 100;
      if (downloadedTimer) clearTimeout(downloadedTimer);
      // 下载过快时先停留一下进度遮罩，再切到“更新已就绪”确认弹窗，避免界面闪烁。
      downloadedTimer = setTimeout(() => {
        downloading.value = false;
        confirmMode.value = 'downloaded';
        confirmVisible.value = true;
      }, 400);
      break;

    case 'error':
      if (downloadedTimer) clearTimeout(downloadedTimer);
      downloading.value = false;
      confirmVisible.value = false;
      errorMsg.value = payload.extra || '未知错误';
      ElMessage.error(`更新失败：${errorMsg.value}`);
      break;

    case 'not-available':
    case 'dev':
      if (downloadedTimer) clearTimeout(downloadedTimer);
      break;

    case 'disabled':
      if (downloadedTimer) clearTimeout(downloadedTimer);
      ElMessage.warning(payload.extra || '自动更新组件未安装');
      break;

    default:
      break;
  }
}

/** 用户点击“立即更新”后通知主进程下载。 */
function updateNow() {
  confirmVisible.value = false;
  progress.value = 0;
  if (bridge && bridge.downloadUpdate) bridge.downloadUpdate();
}

/** 暂不更新 / 稍后重启：仅关闭弹窗，已下载的更新会在退出时按主进程策略安装。 */
function later() {
  confirmVisible.value = false;
  downloading.value = false;
}

function restartNow() {
  if (bridge && bridge.quitAndInstall) bridge.quitAndInstall();
}

function handleOverlayPointerDown(event) {
  if (event.target !== event.currentTarget) {
    overlayPointer = null;
    return;
  }
  overlayPointer = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    moved: false,
  };
}

function handleOverlayPointerMove(event) {
  if (!overlayPointer || overlayPointer.pointerId !== event.pointerId) return;
  if (Math.hypot(event.clientX - overlayPointer.x, event.clientY - overlayPointer.y) > 8) {
    overlayPointer.moved = true;
  }
}

function handleOverlayPointerUp(event) {
  const start = overlayPointer;
  overlayPointer = null;
  if (start && start.pointerId === event.pointerId && !start.moved && event.target === event.currentTarget) {
    later();
  }
}

onMounted(() => {
  if (bridge && bridge.onUpdateStatus) {
    offUpdateStatus = bridge.onUpdateStatus(handleStatus);
  }
});

onBeforeUnmount(() => {
  if (typeof offUpdateStatus === 'function') offUpdateStatus();
  if (downloadedTimer) clearTimeout(downloadedTimer);
});
</script>

<style scoped>
.ud-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(31, 45, 61, 0.45);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  user-select: none;
}

.ud-downloading {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 360px;
  padding: 36px 32px;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-card-border);
  border-radius: 18px;
  box-shadow: var(--app-shadow);
}

.ud-spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--app-accent-soft);
  border-top-color: var(--app-accent);
  border-radius: 50%;
  animation: ud-spin 0.8s linear infinite;
}

@keyframes ud-spin {
  to {
    transform: rotate(360deg);
  }
}

.ud-title {
  margin-top: 18px;
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.ud-sub {
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--app-text-secondary);
}

.ud-bar {
  margin-top: 18px;
  width: 280px;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-accent-soft);
}

.ud-bar-inner {
  height: 100%;
  border-radius: 999px;
  background: var(--app-accent-gradient);
  transition: width 0.3s ease;
}

.ud-percent {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-accent);
  font-variant-numeric: tabular-nums;
}

.ud-dialog {
  width: 420px;
  max-width: 90vw;
  padding: 26px 28px 22px;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-card-border);
  border-radius: 18px;
  box-shadow: var(--app-shadow);
}

.ud-dialog-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--app-text-primary);
}

.ud-desc {
  margin-top: 10px;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--app-text-secondary);
  word-break: break-all;
}

.ud-actions {
  margin-top: 22px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.ud-btn {
  border: none;
  cursor: pointer;
  padding: 8px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  transition: background 0.15s ease, filter 0.15s ease;
}

.ud-btn.ghost {
  background: var(--app-accent-subtle);
  color: var(--app-accent);
}

.ud-btn.ghost:hover {
  background: var(--app-accent-soft);
}

.ud-btn.primary {
  background: var(--app-accent);
  color: #ffffff;
}

.ud-btn.primary:hover {
  filter: brightness(1.08);
}

.ud-fade-enter-active,
.ud-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.ud-fade-enter-from,
.ud-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
