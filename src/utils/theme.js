/**
 * 外观主题工具
 * 主题模式分三种：
 *  - system：跟随操作系统的深浅色设置
 *  - light：强制浅色
 *  - dark：强制深色
 *
 * 实现方式：在 <html> 元素上切换 `dark` 类，
 * Element Plus 自带深色变量与本项目自定义的 --app-* 变量都依赖该类名生效。
 */

// 主题模式枚举（与 preferences store 中 themeMode 取值保持一致）
export const THEME_MODES = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
};

// 监听系统深浅色偏好（Web / Electron 渲染进程均支持）
const darkMedia = window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null;

/** 当前系统是否为深色 */
export function isSystemDark() {
  return darkMedia ? darkMedia.matches : false;
}

/** 根据主题模式计算当前是否应使用深色 */
export function resolveDark(mode) {
  if (mode === THEME_MODES.DARK) return true;
  if (mode === THEME_MODES.LIGHT) return false;
  // system：跟随系统
  return isSystemDark();
}

/**
 * 把主题结果应用到页面：切换 <html> 上的 dark 类。
 * @param {'system'|'light'|'dark'} mode 主题模式
 * @returns {boolean} 当前是否为深色
 */
export function applyTheme(mode) {
  const dark = resolveDark(mode);
  document.documentElement.classList.toggle('dark', dark);
  return dark;
}

/**
 * 监听系统主题变化；仅当当前处于 system 模式时触发回调。
 * @param {() => 'system'|'light'|'dark'} getMode 读取当前主题模式的函数
 * @param {(isDark: boolean) => void} onChange 系统主题变化回调
 * @returns {() => void} 取消监听函数
 */
export function watchSystemTheme(getMode, onChange) {
  if (!darkMedia) return () => {};

  const handler = (event) => {
    if (getMode() === THEME_MODES.SYSTEM) onChange(event.matches);
  };

  darkMedia.addEventListener('change', handler);
  return () => darkMedia.removeEventListener('change', handler);
}
