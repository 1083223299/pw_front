const { contextBridge, ipcRenderer } = require('electron');

// 托盘冒泡小窗专用桥接：只允许关闭和跳转通知中心。
contextBridge.exposeInMainWorld('bubbleBridge', {
  close: () => ipcRenderer.send('notify:bubble-close'),
  jump: (id) => ipcRenderer.send('notify:bubble-jump', id),
});
