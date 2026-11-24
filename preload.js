const { contextBridge, ipcRenderer } = require('electron');

// 仅暴露桌面端所需能力，渲染进程不直接访问 Node.js。
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
  close: () => ipcRenderer.send('window:close'),
  onMaximizeChange: (callback) => {
    const listener = (_event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window:maximize-change', listener);
    return () => ipcRenderer.removeListener('window:maximize-change', listener);
  },
});

contextBridge.exposeInMainWorld('appInfo', {
  // 渲染进程据此区分 macOS / Windows 的窗口外观（macOS 走系统原生红黄绿按钮）
  platform: process.platform,
  reportEnv: (info) => ipcRenderer.send('app:report-env', info),
  openLogsDir: () => ipcRenderer.invoke('app:open-logs-dir'),
  openUserData: () => ipcRenderer.invoke('app:open-userdata'),
  clearCache: () => ipcRenderer.invoke('app:clear-cache'),
});

// 设置桥接：开机自启、自动更新偏好和版本检查。
contextBridge.exposeInMainWorld('settingsBridge', {
  getState: () => ipcRenderer.invoke('settings:get-state'),
  setAutoLaunch: (enable) => ipcRenderer.invoke('settings:set-auto-launch', enable),
  setAutoUpdate: (enable) => ipcRenderer.invoke('settings:set-auto-update', enable),
  checkUpdate: () => ipcRenderer.invoke('settings:check-update'),
  downloadUpdate: () => ipcRenderer.invoke('settings:download-update'),
  quitAndInstall: () => ipcRenderer.invoke('settings:quit-and-install'),
  onUpdateStatus: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on('settings:update-status', listener);
    return () => ipcRenderer.removeListener('settings:update-status', listener);
  },
});

// 通知中心与托盘桥接：主进程只接收规范化后的通知状态，不直接访问业务接口。
contextBridge.exposeInMainWorld('notifyBridge', {
  notifyIncoming: (payload) => ipcRenderer.send('notify:incoming', payload),
  clearFlash: () => ipcRenderer.send('notify:clear-flash'),
  setTrayBadge: (payload) => ipcRenderer.send('notify:tray-badge', payload),
  setTrayList: (payload) => ipcRenderer.send('notify:tray-list', payload),
  reportPageStatus: (isNotifyPage) => ipcRenderer.send('notify:page-status', !!isNotifyPage),
  onOpenNotify: (callback) => {
    const listener = (_event, payload) => callback(payload || {});
    ipcRenderer.on('notify:open-notify', listener);
    return () => ipcRenderer.removeListener('notify:open-notify', listener);
  },
});

