import { defineStore } from 'pinia';

const PREFERENCES_STORAGE_KEY = 'pw-recharge-preferences';
const PREFERENCES_VERSION = 1;

const DEFAULT_PREFERENCES = {
  notifySound: true, // 新消息提示音
  notifyTrayFlash: true, // 托盘图标闪动
  notifyBubble: true, // 右上角/托盘冒泡弹窗
  watermark: false, // 页面水印
  themeMode: 'system', // 外观主题：system 跟随系统 / light 浅色 / dark 深色
};

function readSaved() {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object' && saved.__v === PREFERENCES_VERSION) {
        return { ...DEFAULT_PREFERENCES, ...saved };
      }
    }
  } catch {
    /* 本地配置损坏时使用默认值 */
  }
  return null;
}

/** 桌面端偏好设置：仅保存在本地，不改动业务接口配置。 */
export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    ...DEFAULT_PREFERENCES,
    ...(readSaved() || {}),
  }),

  actions: {
    persist() {
      try {
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({
          __v: PREFERENCES_VERSION,
          notifySound: this.notifySound,
          notifyTrayFlash: this.notifyTrayFlash,
          notifyBubble: this.notifyBubble,
          watermark: this.watermark,
          themeMode: this.themeMode,
        }));
      } catch {
        /* 忽略持久化失败 */
      }
    },

    setNotifySound(enabled) {
      this.notifySound = !!enabled;
      this.persist();
    },

    setNotifyTrayFlash(enabled) {
      this.notifyTrayFlash = !!enabled;
      this.persist();
    },

    setNotifyBubble(enabled) {
      this.notifyBubble = !!enabled;
      this.persist();
    },

    setWatermark(enabled) {
      this.watermark = !!enabled;
      this.persist();
    },

    /** 设置外观主题模式：system / light / dark */
    setThemeMode(mode) {
      const allowed = ['system', 'light', 'dark'];
      this.themeMode = allowed.includes(mode) ? mode : 'system';
      this.persist();
    },
  },
});
