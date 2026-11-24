const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell, screen, dialog, Notification, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const packageMetadata = require('./package.json');

// 桌面端运行环境：开发/打包命令通过 VITE_APP_ENV 注入，安装包则从 extraMetadata 读取。
const APP_ENV = process.env.VITE_APP_ENV || packageMetadata.appEnvironment || 'prod';
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// 打包后 package.json 内的 build 元数据会被剥离，appId 不能从 packageMetadata.build 读取。
const BASE_APP_ID = 'com.pwesports.recharge';
const APP_ID = APP_ENV === 'prod'
  ? BASE_APP_ID
  : `${BASE_APP_ID}.${APP_ENV}`;

// 非生产环境使用独立用户目录，避免窗口状态、缓存和日志相互影响。
if (APP_ENV !== 'prod') {
  app.setPath('userData', path.join(app.getPath('appData'), `pw-esports-recharge-${APP_ENV}`));
}

const log = require('electron-log');
log.transports.file.level = 'info';
log.transports.file.maxSize = 10 * 1024 * 1024;
log.transports.file.fileName = 'main.log';
Object.assign(console, log.functions);

let mainWindow = null;
let tray = null;
let trayNormalIcon = null;
let localServer = null;
let localServerUrl = null;
let saveWindowTimer = null;

// 本地应用设置：开机自启、自动更新偏好持久化到用户目录。
const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');
let settings = {
  autoLaunch: true,
  autoUpdate: true,
};

// 可选自动更新模块；未安装时设置面板仍可展示状态，但不执行检查下载。
let autoUpdater = null;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch (error) {
  console.warn('[updater] electron-updater 未安装:', error.message);
}

let updateStatus = 'idle';
let updateVersion = null;
let updateError = null;
let updateProgress = null;
let quitFlowActive = false;

// 通知托盘状态：未读列表、角标图片、闪动定时器和冒泡小窗。
let notifyItems = [];
let notifyUnread = 0;
let notifyBadgeImage = null;
let flashTimer = null;
let flashOn = false;
let notifyBubbleWindow = null;
let handledNotifyIds = new Set();
let isOnNotifyPage = false;

const WIN_STATE_FILE = path.join(app.getPath('userData'), 'win-state.json');

if (process.platform === 'win32') {
  app.setAppUserModelId(APP_ID);
}

/** 读取上次窗口位置和尺寸。 */
function readWindowState() {
  try {
    const state = JSON.parse(fs.readFileSync(WIN_STATE_FILE, 'utf8'));
    if (Number.isFinite(state.width) && Number.isFinite(state.height)) return state;
  } catch {
    // 首次启动或文件损坏时使用默认窗口尺寸。
  }
  return null;
}

/** 保存普通窗口边界，最大化时不会覆盖还原前的尺寸。 */
function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    const bounds = mainWindow.getNormalBounds();
    fs.writeFileSync(WIN_STATE_FILE, JSON.stringify({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: mainWindow.isMaximized(),
    }));
  } catch (error) {
    console.warn('[win-state] 保存失败:', error.message);
  }
}

function scheduleSaveWindowState() {
  clearTimeout(saveWindowTimer);
  saveWindowTimer = setTimeout(saveWindowState, 300);
}

/** 读取本地设置；文件不存在时使用默认值并落盘。 */
function readSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const saved = JSON.parse(raw);
    if (saved && typeof saved === 'object') {
      settings = {
        autoLaunch: saved.autoLaunch !== undefined ? !!saved.autoLaunch : true,
        autoUpdate: saved.autoUpdate !== undefined ? !!saved.autoUpdate : true,
        // 记录上次已成功写入系统的自启状态；用于避免 macOS 每次启动重复注册登录项
        autoLaunchApplied:
          saved.autoLaunchApplied === undefined ? null : !!saved.autoLaunchApplied,
      };
    }
  } catch {
    /* 首次启动或配置损坏时使用默认设置 */
  }
  return settings;
}

/** 局部合并并写入本地设置。 */
function writeSettings(patch) {
  settings = Object.assign({}, settings, patch);
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    console.error('[settings] 保存设置失败:', error.message);
  }
  return settings;
}

/** 应用开机自启系统设置。force=false 表示启动时的同步，仅在状态不一致时才写入。 */
function applyAutoLaunch(enable, options = {}) {
  const force = !!options.force;
  try {
    if (process.platform === 'win32') {
      const loginOptions = { openAtLogin: enable, args: ['--hidden'] };
      if (!app.isPackaged) {
        loginOptions.path = process.execPath;
        loginOptions.args = ['--hidden', app.getAppPath()];
      }
      app.setLoginItemSettings(loginOptions);
      writeSettings({ autoLaunchApplied: enable });
    } else if (process.platform === 'darwin') {
      // macOS 13+ 每次调用 setLoginItemSettings 都会重新注册登录项，
      // 系统随之弹出“登录项已添加”通知。因此这里先读当前状态：
      // 1) 系统已是目标状态，直接跳过；
      // 2) 非用户主动操作时，若上次已写过同一状态就不再重复写（防止每次启动都弹）。
      const current = app.getLoginItemSettings().openAtLogin;
      if (current === enable) {
        if (settings.autoLaunchApplied !== enable) writeSettings({ autoLaunchApplied: enable });
        return;
      }
      if (!force && settings.autoLaunchApplied === enable) return;
      // openAsHidden 在 macOS 13+ 已失效，不再传
      app.setLoginItemSettings({ openAtLogin: enable });
      writeSettings({ autoLaunchApplied: enable });
    }
  } catch (error) {
    console.error('[settings] 设置开机自启失败:', error.message);
  }
}

function initSettings() {
  readSettings();
  if (!fs.existsSync(SETTINGS_FILE)) writeSettings(settings);
  applyAutoLaunch(settings.autoLaunch);
}

/** 向渲染进程推送更新状态。 */
function pushUpdateStatus(status, version, extra) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings:update-status', {
      status,
      version: version || null,
      extra: extra || null,
    });
  }
}

/** 当前设置与更新状态快照。 */
function getSettingsState() {
  return {
    version: app.getVersion(),
    autoLaunch: !!settings.autoLaunch,
    autoUpdate: !!settings.autoUpdate,
    canManageAutoLaunch: true,
    canManageAutoUpdate: true,
    updateStatus,
    updateVersion,
    updateError,
    updateProgress,
    isPackaged: app.isPackaged,
    updateReady: !!autoUpdater && app.isPackaged,
  };
}

/** 更新源：优先取环境变量 UPDATE_SERVER_URL；未设置时使用打包资源内的 app-update.yml。 */
function configureUpdateFeed() {
  if (!autoUpdater) return;
  const url = process.env.UPDATE_SERVER_URL;
  if (url) {
    autoUpdater.setFeedURL({ provider: 'generic', url });
    console.log('[updater] 使用环境变量更新源:', url);
  }
}

/** 注册自动更新事件；未安装 electron-updater 时保持 disabled 状态。 */
function setupAutoUpdater() {
  if (!autoUpdater) return;
  configureUpdateFeed();
  // 发现新版本后先弹窗确认，用户点击“立即更新”再下载；下载完成后再询问是否重启安装。
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    updateStatus = 'checking';
    pushUpdateStatus('checking');
  });
  autoUpdater.on('update-available', (info) => {
    // 再次锁定手动下载：发现新版本只推送给弹窗，等待用户确认后再下载。
    autoUpdater.autoDownload = false;
    updateStatus = 'available';
    updateVersion = info && info.version;
    updateError = null;
    pushUpdateStatus('available', updateVersion);
  });
  autoUpdater.on('update-not-available', () => {
    updateStatus = 'not-available';
    updateError = null;
    pushUpdateStatus('not-available');
  });
  autoUpdater.on('download-progress', (progress) => {
    updateStatus = 'downloading';
    updateProgress = progress && progress.percent;
    pushUpdateStatus('downloading', updateVersion, { percent: updateProgress });
  });
  autoUpdater.on('update-downloaded', (info) => {
    updateStatus = 'downloaded';
    updateVersion = info && info.version;
    updateProgress = 100;
    pushUpdateStatus('downloaded', updateVersion);
  });
  autoUpdater.on('error', (error) => {
    updateStatus = 'error';
    updateError = String((error && error.message) || error);
    pushUpdateStatus('error', null, updateError);
  });
}

/** 启动后延迟自动检查更新；仅打包版且用户开启自动更新时执行。 */
function scheduleAutoCheck() {
  if (!app.isPackaged || !autoUpdater || !settings.autoUpdate) return;
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      updateStatus = 'error';
      updateError = String((error && error.message) || error);
      pushUpdateStatus('error', null, updateError);
    });
  }, 10 * 1000);
}

/** 设置面板 IPC：开机自启、自动更新偏好、版本检查。 */
function setupSettingsIpc() {
  ipcMain.handle('settings:get-state', () => getSettingsState());

  ipcMain.handle('settings:set-auto-launch', (_event, enable) => {
    const enabled = !!enable;
    writeSettings({ autoLaunch: enabled });
    // 用户主动切换，允许强制写入系统登录项
    applyAutoLaunch(enabled, { force: true });
    return getSettingsState();
  });

  ipcMain.handle('settings:set-auto-update', (_event, enable) => {
    const enabled = !!enable;
    writeSettings({ autoUpdate: enabled });
    // 自动更新开关只控制启动后是否自动检查新版本；下载仍由更新弹窗确认。
    if (autoUpdater) autoUpdater.autoDownload = false;
    return getSettingsState();
  });

  ipcMain.handle('settings:check-update', async () => {
    if (!autoUpdater) {
      updateStatus = 'disabled';
      updateError = '自动更新组件未安装';
      pushUpdateStatus('disabled', null, updateError);
      return getSettingsState();
    }

    if (!app.isPackaged) {
      updateStatus = 'dev';
      updateError = null;
      pushUpdateStatus('dev');
      return getSettingsState();
    }

    configureUpdateFeed();
    autoUpdater.autoDownload = false;
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      updateStatus = 'error';
      updateError = String((error && error.message) || error);
      pushUpdateStatus('error', null, updateError);
    }
    return getSettingsState();
  });

  ipcMain.handle('settings:download-update', async () => {
    if (autoUpdater && updateStatus === 'available') {
      try {
        autoUpdater.autoDownload = false;
        await autoUpdater.downloadUpdate();
      } catch (error) {
        updateStatus = 'error';
        updateError = String((error && error.message) || error);
        pushUpdateStatus('error', null, updateError);
      }
    }
    return getSettingsState();
  });

  ipcMain.handle('settings:quit-and-install', () => {
    if (autoUpdater && updateStatus === 'downloaded') {
      autoUpdater.quitAndInstall(false, true);
    }
    return getSettingsState();
  });
}

function finishQuit() {
  app.isQuitting = true;
  app.quit();
}

function showQuitDialog(options) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return dialog.showMessageBox(mainWindow, options);
  }
  return dialog.showMessageBox(options);
}

function resumeAfterCancelledQuit() {
  quitFlowActive = false;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  }
}

/** 托盘退出前检查更新；无更新直接退出，有更新则由用户选择下载安装或直接退出。 */
async function requestQuitWithUpdateCheck() {
  if (quitFlowActive) return;
  quitFlowActive = true;

  if (!app.isPackaged || !autoUpdater) {
    finishQuit();
    return;
  }

  try {
    if (updateStatus !== 'available' && updateStatus !== 'downloaded') {
      const result = await autoUpdater.checkForUpdates();
      if (!result || !result.isUpdateAvailable) {
        finishQuit();
        return;
      }
      updateVersion = result.updateInfo && result.updateInfo.version;
    }

    const versionLabel = updateVersion ? ` v${updateVersion}` : '';
    const response = await showQuitDialog({
      type: 'info',
      title: '发现新版本',
      message: `发现新版本${versionLabel}`,
      detail: '是否下载并安装更新后退出？',
      buttons: ['下载并安装', '暂不更新，直接退出', '取消退出'],
      defaultId: 0,
      cancelId: 2,
    });

    if (response.response === 1) {
      finishQuit();
      return;
    }
    if (response.response !== 0) {
      resumeAfterCancelledQuit();
      return;
    }

    if (updateStatus !== 'downloaded') {
      updateStatus = 'downloading';
      pushUpdateStatus('downloading', updateVersion);
      await autoUpdater.downloadUpdate();
    }
    autoUpdater.quitAndInstall(false, true);
  } catch (error) {
    const errorMessage = String((error && error.message) || error);
    console.error('[updater] 退出前检查或安装更新失败:', errorMessage);
    const response = await showQuitDialog({
      type: 'warning',
      title: '更新失败',
      message: '检查或下载更新失败',
      detail: `${errorMessage}\n\n是否仍然退出软件？`,
      buttons: ['仍然退出', '取消退出'],
      defaultId: 0,
      cancelId: 1,
    });
    if (response.response === 0) finishQuit();
    else resumeAfterCancelledQuit();
  }
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function createWindow() {
  const savedState = readWindowState();
  const isMac = process.platform === 'darwin';
  const options = {
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    frame: false,
    resizable: true,
    show: true,
    transparent: true,
    icon: path.join(__dirname, 'src', 'assets', 'images', 'logo32.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,
    },
  };

  if (isMac) {
    // macOS：窗口圆角、投影和左上角红黄绿按钮都交给系统绘制，
    // 只隐藏标题栏背景，内容依然铺满整窗，业务侧的 36px 标题栏继续自绘。
    options.frame = true;
    options.transparent = false;
    options.titleBarStyle = 'hiddenInset';
    options.trafficLightPosition = { x: 16, y: 12 };
    options.backgroundColor = nativeTheme.shouldUseDarkColors ? '#1c1d21' : '#f2f3f5';
  }

  if (savedState) {
    options.x = savedState.x;
    options.y = savedState.y;
    options.width = savedState.width;
    options.height = savedState.height;
  }

  mainWindow = new BrowserWindow(options);
  if (savedState?.isMaximized) mainWindow.maximize();

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true);

  const sendMaximizeState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:maximize-change', mainWindow.isMaximized());
    }
  };
  mainWindow.on('maximize', sendMaximizeState);
  mainWindow.on('unmaximize', sendMaximizeState);
  mainWindow.on('resize', scheduleSaveWindowState);
  mainWindow.on('move', scheduleSaveWindowState);
  mainWindow.on('maximize', scheduleSaveWindowState);
  mainWindow.on('unmaximize', scheduleSaveWindowState);
  mainWindow.on('focus', stopTrayFlash);

  // 外部链接统一交给系统浏览器，不在应用内打开新窗口。
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return;
    console.error('[did-fail-load]', errorCode, errorDescription, validatedURL);
  });

  // F12 仅开发服务器环境可用；打包版不允许用户随意打开 DevTools。
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (!DEV_SERVER_URL) return;
    if (input.type === 'keyDown' && input.key === 'F12') {
      event.preventDefault();
      mainWindow.webContents.toggleDevTools();
    }
  });

  if (DEV_SERVER_URL) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadURL(localServerUrl);
  }

  // 与参考项目一致：关闭主窗口时驻留托盘，托盘菜单中的“退出”才会真正退出。
  mainWindow.on('close', (event) => {
    saveWindowState();
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function isMainWindowSender(event) {
  return mainWindow && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents;
}

/* ============================ 通知托盘与冒泡小窗 ============================ */

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 主进程生命周期内按通知 ID 去重，避免重连/重复 IPC 再次闪托盘或弹旧消息。 */
function rememberNotifyId(id) {
  const key = String(id || '');
  if (!key) return true;
  if (handledNotifyIds.has(key)) return false;
  handledNotifyIds.add(key);
  if (handledNotifyIds.size > 500) {
    const oldest = handledNotifyIds.values().next().value;
    handledNotifyIds.delete(oldest);
  }
  return true;
}

function applyTrayIcon() {
  if (!tray) return;
  // macOS 菜单栏统一走单色模板图，随系统深浅色自动反色；
  // 不叠加彩色红点，未读条数交给 Dock 数字角标和 tooltip，这符合 Mac 应用惯例。
  const isMac = process.platform === 'darwin';
  if (isMac) {
    if (trayNormalIcon) tray.setImage(trayNormalIcon);
  } else {
    const badgeImage = notifyBadgeImage && !notifyBadgeImage.isEmpty() ? notifyBadgeImage : null;
    if (badgeImage) {
      // Windows：闪动阶段在"正常图标 / 红点图标"之间交替，图标始终存在，不会切到空图消失
      tray.setImage(flashTimer && !flashOn ? trayNormalIcon : badgeImage);
    } else if (trayNormalIcon) {
      tray.setImage(trayNormalIcon);
    }
  }
  tray.setToolTip(notifyUnread > 0 ? `充值中心（${notifyUnread} 条未读）` : '充值中心');
}

function startTrayFlash() {
  if (!tray || flashTimer) return;
  flashOn = false;
  flashTimer = setInterval(() => {
    flashOn = !flashOn;
    applyTrayIcon();
  }, 500);
}

function stopTrayFlash() {
  if (flashTimer) {
    clearInterval(flashTimer);
    flashTimer = null;
  }
  flashOn = false;
  applyTrayIcon();
}

/** macOS 程序坞未读角标；其他平台没有 dock 概念，直接忽略。 */
function setDockBadge(count) {
  if (process.platform !== 'darwin' || !app.dock) return;
  const n = Math.max(0, Number(count) || 0);
  app.dock.setBadge(n > 0 ? (n > 99 ? '99+' : String(n)) : '');
}

/** macOS 系统通知横幅，点击跳转通知页；Windows 沿用自定义冒泡窗。 */
function showSystemNotify(item, withSound) {
  if (process.platform !== 'darwin' || !Notification.isSupported()) return;
  const notification = new Notification({
    title: item.title || '系统通知',
    body: item.content || item.body || '',
    silent: !withSound,
  });
  notification.on('click', () => openNotifyPage(item));
  notification.show();
}

function notifySceneClass(item) {
  const scene = `${item.scene || ''} ${item.type || ''} ${item.sceneLabel || ''}`.toLowerCase();
  if (scene.includes('alipay') || scene.includes('balance') || scene.includes('warn')) return 'icon-warn';
  if (scene.includes('abnormal') || scene.includes('order')) return 'icon-abnormal';
  return 'icon-system';
}

function renderNotifyBubbleHtml() {
  const rows = notifyItems.slice(0, 5).map((item) => {
    const meta = [item.sceneLabel, item.orderNo || item.orderId || item.subOrderId]
      .filter(Boolean)
      .join(' · ');
    const shortLabel = item.sceneLabel ? String(item.sceneLabel).slice(0, 1) : '告';

    return `
    <div class="notify-row" data-id="${escapeHtml(item.id)}">
      <div class="notify-icon ${notifySceneClass(item)}">${escapeHtml(shortLabel)}</div>
      <div class="notify-body">
        <div class="notify-head">
          <strong>${escapeHtml(item.title || '系统通知')}</strong>
          <span>${escapeHtml(item.time || '')}</span>
        </div>
        <p>${escapeHtml(item.content || '')}</p>
        ${meta ? `<div class="notify-meta">${escapeHtml(meta)}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 14px;
    font-family: "Microsoft YaHei", Arial, sans-serif;
    background: linear-gradient(160deg, #131c2e 0%, #0b1120 100%);
    color: #e5e7eb;
  }
  .bubble-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 2px 2px 13px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 12px;
  }
  .head-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .head-dot {
    flex: 0 0 10px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #f97316;
    box-shadow: 0 0 12px rgba(249, 115, 22, 0.65);
  }
  .bubble-title { font-size: 15px; font-weight: 700; color: #f8fafc; letter-spacing: 0.2px; }
  .bubble-sub { margin-top: 2px; font-size: 11px; color: #8b9bb8; }
  .close {
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.06);
    color: #cbd5e1;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.16s ease, color 0.16s ease;
  }
  .close:hover { background: rgba(255, 255, 255, 0.12); color: #ffffff; }
  .notify-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
    max-height: 326px;
    overflow-y: auto;
  }
  .notify-list::-webkit-scrollbar { width: 5px; }
  .notify-list::-webkit-scrollbar-thumb { border-radius: 10px; background: rgba(255, 255, 255, 0.14); }
  .notify-row {
    display: flex;
    gap: 11px;
    padding: 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.045);
    border: 1px solid rgba(255, 255, 255, 0.06);
    cursor: pointer;
    transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease;
  }
  .notify-row:hover {
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(96, 165, 250, 0.28);
    transform: translateY(-1px);
  }
  .notify-icon {
    flex: 0 0 36px;
    height: 36px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
  }
  .icon-warn { background: linear-gradient(135deg, #f97316, #ef4444); box-shadow: 0 6px 14px rgba(239, 68, 68, 0.25); }
  .icon-abnormal { background: linear-gradient(135deg, #3b82f6, #8b5cf6); box-shadow: 0 6px 14px rgba(99, 102, 241, 0.25); }
  .icon-system { background: linear-gradient(135deg, #64748b, #94a3b8); }
  .notify-body { flex: 1; min-width: 0; }
  .notify-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .notify-head strong {
    min-width: 0;
    font-size: 13px;
    color: #f1f5f9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .notify-head span { flex: 0 0 auto; font-size: 11px; color: #8b9bb8; white-space: nowrap; }
  p {
    margin: 5px 0 0;
    font-size: 12px;
    line-height: 1.6;
    color: #cbd5e1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-all;
  }
  .notify-meta { margin-top: 6px; font-size: 11px; color: #7c8aa5; word-break: break-all; }
  .empty { padding: 42px 0; text-align: center; color: #8b9bb8; font-size: 13px; }
</style>
</head>
<body>
  <div class="bubble-head">
    <div class="head-title">
      <span class="head-dot"></span>
      <div>
        <div class="bubble-title">消息通知</div>
        <div class="bubble-sub">实时订单异常提醒</div>
      </div>
    </div>
    <button class="close" id="bubble-close" title="关闭">×</button>
  </div>
  <div class="notify-list">
    ${rows || '<div class="empty">暂无未读消息</div>'}
  </div>
  <script>
    const bridge = window.bubbleBridge;
    document.getElementById('bubble-close').addEventListener('click', () => bridge.close());
    document.querySelectorAll('.notify-row').forEach((row) => {
      row.addEventListener('click', () => bridge.jump(row.dataset.id));
    });
  </script>
</body>
</html>`;
}

function closeNotifyBubble() {
  if (notifyBubbleWindow && !notifyBubbleWindow.isDestroyed()) {
    notifyBubbleWindow.hide();
  }
}

function showNotifyBubble() {
  if (!notifyItems.length) {
    closeNotifyBubble();
    return;
  }

  if (!notifyBubbleWindow || notifyBubbleWindow.isDestroyed()) {
    notifyBubbleWindow = new BrowserWindow({
      width: 380,
      height: 420,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      show: false,
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, 'notifyBubblePreload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
    });

    notifyBubbleWindow.on('closed', () => {
      notifyBubbleWindow = null;
    });
  }

  const display = screen.getPrimaryDisplay().workArea;
  const popupWidth = 380;
  const popupHeight = 420;
  notifyBubbleWindow.setBounds({ width: popupWidth, height: popupHeight });
  // macOS Dock 在底部，冒泡窗贴右上角避开 Dock；Windows 仍贴右下角。
  const popupX = display.width - popupWidth - 20;
  const popupY = process.platform === 'darwin'
    ? display.y + 20
    : Math.max(80, display.height - popupHeight - 24);
  notifyBubbleWindow.setPosition(popupX, popupY);
  notifyBubbleWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(renderNotifyBubbleHtml())}`);
  notifyBubbleWindow.showInactive();
}

function refreshNotifyBubble() {
  if (!notifyBubbleWindow || notifyBubbleWindow.isDestroyed() || !notifyBubbleWindow.isVisible()) return;
  if (notifyItems.length) {
    notifyBubbleWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(renderNotifyBubbleHtml())}`);
  } else {
    closeNotifyBubble();
  }
}

function openNotifyPage(payload = {}) {
  showMainWindow();
  stopTrayFlash();
  closeNotifyBubble();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('notify:open-notify', {
      path: payload.path || payload.jumpTarget || '/admin/notify',
      notificationId: payload.notificationId || payload.id || '',
      orderId: payload.orderId || '',
      subOrderId: payload.subOrderId || '',
      orderNo: payload.orderNo || payload.merchantOrderNo || '',
    });
  }
}

function setupNotifyIpc() {
  ipcMain.on('notify:incoming', (_event, payload) => {
    if (!payload || typeof payload !== 'object') return;
    if (!rememberNotifyId(payload.id)) return;

    const item = {
      id: payload.id || `nt-${Date.now()}`,
      type: payload.type || 'system',
      title: payload.title || '系统通知',
      content: payload.body || payload.content || '',
      time: payload.time || '',
      mentions: Array.isArray(payload.mentions) ? payload.mentions : [],
      scene: payload.scene || '',
      sceneLabel: payload.sceneLabel || '',
      jumpTarget: payload.jumpTarget || '',
      orderId: payload.orderId || '',
      subOrderId: payload.subOrderId || '',
      orderNo: payload.orderNo || '',
      thirdOrderNo: payload.thirdOrderNo || '',
      applicationId: payload.applicationId || '',
      playerId: payload.playerId || '',
      playerName: payload.playerName || '',
      phone: payload.phone || '',
    };

    const index = notifyItems.findIndex((entry) => String(entry.id) === String(item.id));
    if (index > -1) notifyItems[index] = item;
    else notifyItems.unshift(item);
    notifyItems = notifyItems.slice(0, 50);

    // 是否需要闪托盘：
    // - 不在通知页 → 闪；
    // - 在通知页但主窗口已最小化/隐藏到托盘 → 人不在看，也要闪；
    // - 在通知页且窗口正常可见 → 不闪，但提示音和冒泡弹窗照常。
    const windowVisible = mainWindow
      && !mainWindow.isDestroyed()
      && mainWindow.isVisible()
      && !mainWindow.isMinimized();
    if (payload.flash !== false && (!isOnNotifyPage || !windowVisible)) {
      startTrayFlash();
    }
    if (payload.showBubble !== false) {
      // macOS 走系统通知横幅（含横幅/系统音/通知中心），其他平台沿用自研冒泡窗。
      if (process.platform === 'darwin') {
        showSystemNotify(item, payload.sound !== false);
      } else {
        showNotifyBubble();
      }
    }
  });

  ipcMain.on('notify:tray-badge', (_event, payload) => {
    const count = Number(payload?.count) || 0;
    notifyUnread = count;
    setDockBadge(count);

    if (count > 0 && payload?.dataUrl) {
      try {
        notifyBadgeImage = nativeImage.createFromDataURL(payload.dataUrl);
      } catch {
        notifyBadgeImage = null;
      }
      applyTrayIcon();
    } else {
      notifyBadgeImage = null;
      stopTrayFlash();
      applyTrayIcon();
    }
  });

  ipcMain.on('notify:tray-list', (_event, payload) => {
    const items = Array.isArray(payload?.items) ? payload.items : [];
    // 空列表且未 force：视为渲染进程尚未同步刚推送的新消息，保留现有冒泡避免一闪而过。
    if (!items.length && !payload.force) return;
    notifyItems = items;
    if (payload?.force && notifyItems.length === 0) {
      handledNotifyIds = new Set();
      closeNotifyBubble();
    } else {
      refreshNotifyBubble();
    }
  });

  ipcMain.on('notify:clear-flash', stopTrayFlash);

  ipcMain.on('notify:page-status', (_event, status) => {
    isOnNotifyPage = !!status;
    if (status) stopTrayFlash();
  });

  ipcMain.on('notify:bubble-close', closeNotifyBubble);

  ipcMain.on('notify:bubble-jump', (_event, id) => {
    const item = notifyItems.find((entry) => String(entry.id) === String(id));
    openNotifyPage({
      path: item?.jumpTarget || '',
      notificationId: id,
      orderId: item?.orderId || '',
      subOrderId: item?.subOrderId || '',
      orderNo: item?.orderNo || item?.merchantOrderNo || '',
    });
  });
}

/**
 * macOS 顶部菜单栏：补齐系统惯例的「应用菜单 / 编辑菜单 / 窗口菜单」。
 * Windows 不设置，保持原有的无菜单条（Alt 也不唤出）行为。
 */
function setupMacApplicationMenu() {
  if (process.platform !== 'darwin') return;
  const template = [
    {
      label: '充值中心',
      submenu: [
        { role: 'about', label: '关于充值中心' },
        { type: 'separator' },
        { role: 'hide', label: '隐藏充值中心' },
        { role: 'hideOthers', label: '隐藏其他' },
        { role: 'unhide', label: '全部显示' },
        { type: 'separator' },
        { role: 'quit', label: '退出充值中心' },
      ],
    },
    {
      label: '文件',
      submenu: [{ role: 'close', label: '关闭窗口' }],
    },
    { role: 'editMenu' },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function setupIpc() {
  ipcMain.on('window:minimize', (event) => {
    if (isMainWindowSender(event)) mainWindow.minimize();
  });
  ipcMain.on('window:toggle-maximize', (event) => {
    if (!isMainWindowSender(event)) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('window:close', (event) => {
    if (isMainWindowSender(event)) mainWindow.close();
  });
  ipcMain.on('app:report-env', (_event, info) => {
    console.log('[ENV] 当前环境:', info.env, `(${info.name})`);
    console.log('[ENV] 版本:', info.version);
    console.log('[ENV] API 地址:', info.baseURL);
    console.log('[ENV] 工具 API 地址:', info.toolsBaseURL);
  });
  ipcMain.handle('app:open-logs-dir', async () => {
    const directory = path.join(app.getPath('userData'), 'logs');
    await fs.promises.mkdir(directory, { recursive: true });
    const error = await shell.openPath(directory);
    return { ok: !error, dir: directory, error };
  });
  ipcMain.handle('app:open-userdata', async () => {
    const error = await shell.openPath(app.getPath('userData'));
    return { ok: !error, dir: app.getPath('userData'), error };
  });
  ipcMain.handle('app:clear-cache', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return { ok: false };
    await mainWindow.webContents.session.clearCache();
    return { ok: true };
  });

  setupNotifyIpc();
  setupSettingsIpc();
}

function createTray() {
  // Windows 用 32px 彩色图（16px 源图放到托盘尺寸边缘会发虚）；
  // macOS 菜单栏用单色模板图，由系统按深浅色自动反色，深色菜单栏才看得清。
  const isMac = process.platform === 'darwin';
  const iconPath = path.join(
    __dirname,
    'src',
    'assets',
    'images',
    isMac ? 'logo-template.png' : 'logo32.png'
  );
  trayNormalIcon = nativeImage.createFromPath(iconPath);
  if (isMac) trayNormalIcon.setTemplateImage(true);
  tray = new Tray(trayNormalIcon);
  tray.setToolTip('充值中心');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示主界面', click: showMainWindow },
    { label: '消息通知', click: () => openNotifyPage() },
    { label: '隐藏主界面', click: () => mainWindow?.hide() },
    { type: 'separator' },
    {
      label: '退出',
      click: () => requestQuitWithUpdateCheck(),
    },
  ]));
  tray.on('click', () => {
    if (flashTimer) openNotifyPage();
    else showMainWindow();
  });
  tray.on('double-click', showMainWindow);
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', showMainWindow);

  app.whenReady().then(async () => {
    if (!DEV_SERVER_URL) {
      const { startLocalServer } = require('./localServer');
      const local = await startLocalServer({
        root: path.join(__dirname, 'dist'),
        apiTarget: require('./api-target.cjs'),
      });
      localServer = local.server;
      localServerUrl = local.url;
    }

    initSettings();
    setupAutoUpdater();
    scheduleAutoCheck();
    setupIpc();
    setupMacApplicationMenu();
    createWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
      else showMainWindow();
    });
  }).catch((error) => {
    console.error('[startup] 应用启动失败:', error);
    app.quit();
  });
}

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('will-quit', () => {
  clearTimeout(saveWindowTimer);
  stopTrayFlash();
  closeNotifyBubble();
  if (localServer) localServer.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !tray) app.quit();
});

app.on('render-process-gone', (_event, webContents, details) => {
  console.error('[render-process-gone]', details);
  if (mainWindow && webContents === mainWindow.webContents && !mainWindow.isDestroyed()) {
    mainWindow.reload();
  }
});

process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
