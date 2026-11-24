<template>
  <div class="settings-wrap" ref="panelWrap">
    <button
      class="trigger-btn"
      :class="{ active: open }"
      type="button"
      title="设置"
      aria-label="设置"
      @click="open = !open"
    >
      <el-icon><Setting /></el-icon>
    </button>

    <div v-if="open" class="settings-panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">设置</div>
          <div class="panel-sub">SETTINGS · 应用偏好</div>
        </div>
        <span class="version-badge">v{{ version || '--' }}</span>
      </div>

      <div class="panel-body">
        <div class="section-title">应用设置</div>

        <div class="setting-row">
          <div class="row-text">
            <div class="row-title">开机自动启动</div>
            <div class="row-desc">登录系统后自动在后台运行</div>
          </div>
          <el-switch
            v-model="autoLaunch"
            :disabled="!bridgeReady"
            size="small"
            @change="toggleAutoLaunch"
          />
        </div>

        <div class="setting-row">
          <div class="row-text">
            <div class="row-title">启动自动检测更新</div>
            <div class="row-desc">检测到新版本后弹窗确认，下载完成后询问是否重启安装</div>
          </div>
          <el-switch
            v-model="autoUpdate"
            :disabled="!bridgeReady"
            size="small"
            @change="toggleAutoUpdate"
          />
        </div>

        <div class="section-title">界面偏好</div>

        <!-- 外观模式：跟随系统 / 浅色 / 深色 -->
        <div class="theme-block">
          <div class="theme-label">外观模式</div>
          <div class="theme-options">
            <div
              v-for="option in themeOptions"
              :key="option.value"
              class="theme-option"
              :class="{ active: prefs.themeMode === option.value }"
              @click="prefs.setThemeMode(option.value)"
            >
              <span class="theme-option-left">
                <el-icon><component :is="option.icon" /></el-icon>
                <span>{{ option.label }}</span>
              </span>
              <el-icon v-if="prefs.themeMode === option.value" class="theme-check">
                <Check />
              </el-icon>
            </div>
          </div>
        </div>

        <div class="setting-row">
          <div class="row-text">
            <div class="row-title">页面水印</div>
            <div class="row-desc">半透明水印覆盖页面</div>
          </div>
          <el-switch
            v-model="prefs.watermark"
            size="small"
            @change="prefs.setWatermark"
          />
        </div>

        <div class="setting-row">
          <div class="row-text">
            <div class="row-title">快捷键</div>
            <div class="row-desc">查看常用快捷操作</div>
          </div>
          <button class="small-btn" type="button" @click="openShortcut">查看</button>
        </div>

        <div class="section-title">版本与缓存</div>

        <div class="setting-row">
          <div class="row-text">
            <div class="row-title">当前版本</div>
            <div class="row-desc">v{{ version || '--' }}</div>
          </div>
          <button
            class="small-btn"
            type="button"
            :disabled="!bridgeReady || checking || updateStatus === 'downloading'"
            @click="checkUpdate"
          >
            {{ checking ? '检查中…' : '检查更新' }}
          </button>
        </div>

        <div class="setting-row">
          <div class="row-text">
            <div class="row-title">清除缓存</div>
            <div class="row-desc">清理网络请求缓存，解决页面异常（不影响登录）</div>
          </div>
          <button
            class="small-btn"
            type="button"
            :disabled="!bridgeReady || clearing"
            @click="clearCache"
          >
            {{ clearing ? '清除中…' : '清除缓存' }}
          </button>
        </div>

        <div
          v-if="updateStatus !== 'idle'"
          class="update-status"
          :class="{ error: updateStatus === 'error' || updateStatus === 'disabled' }"
        >
          <span class="status-dot" :class="updateStatus"></span>
          <span class="status-text">{{ statusText }}</span>
          <button
            v-if="updateStatus === 'available'"
            class="mini-btn"
            type="button"
            @click="downloadUpdate"
          >
            立即下载
          </button>
          <button
            v-if="updateStatus === 'downloaded'"
            class="mini-btn primary"
            type="button"
            @click="quitAndInstall"
          >
            立即重启安装
          </button>
        </div>

      </div>

      <div class="panel-foot">
        <span>✦ 设置自动保存，重启后依然生效</span>
      </div>
    </div>

    <el-dialog
      v-model="shortcutVisible"
      title="快捷键说明"
      width="520px"
      class="shortcut-dialog fixed-body-dialog"
      align-center
    >
      <div class="shortcut-list">
        <div class="shortcut-item">
          <div class="shortcut-description">
            <strong>执行搜索</strong>
            <span>在支持回车搜索的搜索框中按 Enter 执行查询。</span>
          </div>
          <kbd>Enter</kbd>
        </div>

        <div class="shortcut-item">
          <div class="shortcut-description">
            <strong>关闭最上层弹窗</strong>
            <span>有未保存修改时会先确认，避免误丢内容。</span>
          </div>
          <kbd>Esc</kbd>
        </div>

        <div class="shortcut-item">
          <div class="shortcut-description">
            <strong>保存当前弹窗</strong>
            <span>仅在支持快捷保存的弹窗中生效；退款、派单等操作不会触发。</span>
          </div>
          <kbd>Ctrl</kbd><span class="shortcut-plus">+</span><kbd>Enter</kbd>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="shortcutVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Setting, Monitor, Sunny, Moon, Check } from '@element-plus/icons-vue';
import { usePreferencesStore } from '@/stores/preferences';
import { CLIENT_VERSION } from '@/config/env';

const prefs = usePreferencesStore();
const bridge = window.settingsBridge;
const bridgeReady = Boolean(bridge);

// 外观模式可选项：图标与设置面板中的展示顺序保持一致
const themeOptions = [
  { value: 'system', label: '跟随系统', icon: Monitor },
  { value: 'light', label: '浅色模式', icon: Sunny },
  { value: 'dark', label: '深色模式', icon: Moon },
];

const open = ref(false);
const panelWrap = ref(null);
const autoLaunch = ref(false);
const autoUpdate = ref(false);
const version = ref(CLIENT_VERSION || '1.0.0');
const checking = ref(false);
const clearing = ref(false);
const shortcutVisible = ref(false);

const updateStatus = ref('idle');
const updateVersion = ref(null);
const updateError = ref(null);
const updateProgress = ref(null);
let removeUpdateListener = null;

const statusText = computed(() => {
  const v = updateVersion.value ? ` v${updateVersion.value}` : '';
  switch (updateStatus.value) {
    case 'checking': return '正在检查更新…';
    case 'available': return `发现新版本${v}，可在弹窗中确认下载`;
    case 'downloading': return `正在下载更新${v}（${Math.round(updateProgress.value || 0)}%）…`;
    case 'downloaded': return `新版本${v}已下载完成`;
    case 'not-available': return '已是最新版本';
    case 'dev': return '开发环境不检查自动更新';
    case 'error': return `检查更新失败：${updateError.value || '未知错误'}`;
    case 'disabled': return '自动更新组件未安装';
    default: return '检测到新版本后弹窗确认，下载完成后询问是否重启安装';
  }
});

function applyState(state) {
  if (!state) return;
  if (state.version) version.value = state.version;
  if (state.autoLaunch !== undefined) autoLaunch.value = !!state.autoLaunch;
  if (state.autoUpdate !== undefined) autoUpdate.value = !!state.autoUpdate;
  if (state.updateStatus) updateStatus.value = state.updateStatus;
  if (state.updateVersion) updateVersion.value = state.updateVersion;
  if (state.updateError) updateError.value = state.updateError;
  if (state.updateProgress !== null && state.updateProgress !== undefined) {
    updateProgress.value = state.updateProgress;
  }
}

function applyUpdateStatus(payload) {
  if (!payload) return;
  updateStatus.value = payload.status || updateStatus.value;
  updateVersion.value = payload.version || updateVersion.value;
  const extra = payload.extra;
  if (extra && typeof extra === 'object' && 'percent' in extra) {
    updateProgress.value = extra.percent ?? null;
  } else if (typeof extra === 'string' && extra) {
    updateError.value = extra;
  }
}

function closePanel(event) {
  if (panelWrap.value && !panelWrap.value.contains(event.target)) {
    open.value = false;
  }
}

// 打开快捷键说明时先收起设置面板，避免两个弹窗叠加
function openShortcut() {
  open.value = false;
  shortcutVisible.value = true;
}

async function toggleAutoLaunch(value) {
  if (!bridge) return;
  const oldValue = autoLaunch.value;
  autoLaunch.value = value;
  try {
    applyState(await bridge.setAutoLaunch(value));
  } catch (error) {
    autoLaunch.value = oldValue;
    ElMessage.error('切换开机自启失败');
    console.error('[settings] 切换开机自启失败:', error);
  }
}

async function toggleAutoUpdate(value) {
  if (!bridge) return;
  const oldValue = autoUpdate.value;
  autoUpdate.value = value;
  try {
    applyState(await bridge.setAutoUpdate(value));
  } catch (error) {
    autoUpdate.value = oldValue;
    ElMessage.error('切换自动更新失败');
    console.error('[settings] 切换自动更新失败:', error);
  }
}

async function checkUpdate() {
  if (!bridge || checking.value) return;
  checking.value = true;
  try {
    await bridge.checkUpdate();
  } catch (error) {
    updateStatus.value = 'error';
    updateError.value = String((error && error.message) || error);
  } finally {
    checking.value = false;
  }
}

async function downloadUpdate() {
  if (!bridge) return;
  try {
    await bridge.downloadUpdate();
  } catch (error) {
    updateStatus.value = 'error';
    updateError.value = String((error && error.message) || error);
  }
}

function quitAndInstall() {
  bridge?.quitAndInstall();
}

async function clearCache() {
  if (!window.appInfo || clearing.value) return;
  clearing.value = true;
  try {
    const result = await window.appInfo.clearCache();
    if (result?.ok) ElMessage.success('缓存已清除，下次请求自动加载最新数据');
    else ElMessage.warning('清除缓存失败');
  } finally {
    clearing.value = false;
  }
}

onMounted(async () => {
  document.addEventListener('pointerdown', closePanel);
  if (!bridge) return;
  try {
    applyState(await bridge.getState());
    removeUpdateListener = bridge.onUpdateStatus(applyUpdateStatus);
  } catch (error) {
    console.error('[settings] 读取设置失败:', error);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closePanel);
  if (typeof removeUpdateListener === 'function') removeUpdateListener();
});
</script>

<style scoped>
.settings-wrap {
  position: relative;
  display: inline-flex;
  -webkit-app-region: no-drag;
}

.trigger-btn {
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

.trigger-btn:hover,
.trigger-btn.active {
  color: var(--app-accent);
  background: var(--app-bg-hover);
}

.trigger-btn:active {
  transform: scale(0.94);
}

.settings-panel {
  position: absolute;
  top: 36px;
  right: 0;
  width: 320px;
  padding: 16px;
  z-index: 2000;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-card-border);
  border-radius: 16px;
  box-shadow: var(--app-shadow);
  text-align: left;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.panel-title {
  font-size: 15px;
  font-weight: 650;
  color: var(--app-text-primary);
}

.panel-sub {
  margin-top: 3px;
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--app-text-placeholder);
}

.version-badge {
  padding: 3px 10px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.panel-body {
  margin-top: 12px;
}

.section-title {
  margin: 14px 0 4px;
  padding-top: 12px;
  border-top: 1px solid var(--app-divider);
  font-size: 11px;
  letter-spacing: 1.2px;
  color: var(--app-text-placeholder);
}

.section-title:first-child {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px;
  border-radius: 10px;
  transition: background 0.18s ease;
}

.setting-row:hover {
  background: var(--app-bg-hover);
}

.row-text {
  min-width: 0;
}

.row-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-regular);
}

.row-desc {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--app-text-muted);
}

/* ============================
   外观模式选择
   ============================ */
.theme-block {
  padding: 6px 2px 2px;
}

.theme-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-regular);
}

.theme-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.theme-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 11px;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, border-color 0.18s;
}

.theme-option-left {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  color: var(--app-text-secondary);
}

.theme-option:hover {
  background: var(--app-bg-hover);
}

.theme-option.active {
  background: var(--app-bg-subtle);
  border-color: var(--app-border-light);
}

.theme-option.active .theme-option-left {
  color: var(--app-text-primary);
  font-weight: 500;
}

.theme-check {
  color: var(--app-accent);
  font-size: 15px;
}

.small-btn {
  flex-shrink: 0;
  border: 1px solid var(--app-accent-border);
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, transform 0.15s ease;
}

.small-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.small-btn:hover:not(:disabled) {
  background: var(--app-accent);
  color: #ffffff;
}

.small-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.update-status {
  margin-top: 8px;
  padding: 9px 11px;
  border-radius: 12px;
  background: var(--app-bg-subtle);
  border: 1px solid var(--app-border-light);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--app-text-secondary);
}

.update-status.error {
  border-color: rgba(239, 68, 68, 0.35);
  color: #ef4444;
}

.status-dot {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-dot.checking,
.status-dot.downloading {
  background: var(--app-accent);
  animation: dot-pulse 1s ease-in-out infinite;
}

.status-dot.available { background: #f59e0b; }
.status-dot.downloaded { background: #22c55e; }
.status-dot.error,
.status-dot.disabled { background: #ef4444; }
.status-dot.not-available { background: #22c55e; }
.status-dot.dev { background: #94a3b8; }

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.status-text {
  flex: 1;
  min-width: 0;
  line-height: 1.5;
}

.mini-btn {
  flex-shrink: 0;
  border: 1px solid var(--app-accent-border);
  background: transparent;
  color: var(--app-accent);
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.mini-btn.primary {
  background: var(--app-accent);
  color: #ffffff;
  border: none;
}

.panel-foot {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--app-divider);
  font-size: 11px;
  color: var(--app-text-placeholder);
}

.shortcut-list {
  display: flex;
  flex-direction: column;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 0;
  border-bottom: 1px solid var(--app-divider);
}

.shortcut-item:first-child { padding-top: 0; }
.shortcut-item:last-child { padding-bottom: 0; border-bottom: 0; }

.shortcut-description {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-right: 12px;
}

.shortcut-description strong { font-size: 13px; color: var(--app-text-regular); }
.shortcut-description span {
  font-size: 12px;
  line-height: 1.5;
  color: var(--app-text-secondary);
}

.shortcut-item kbd {
  min-width: 28px;
  padding: 4px 7px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-bg-subtle);
  box-shadow: 0 1px 0 var(--app-border);
  color: var(--app-text-regular);
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

.shortcut-plus {
  color: var(--app-text-muted);
  font-size: 12px;
}
</style>
