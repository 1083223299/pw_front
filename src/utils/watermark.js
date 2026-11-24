/**
 * 全局水印覆盖层：Canvas 生成半透明斜向水印并平铺页面。
 * 仅作为视觉防泄密标记，不拦截点击、不影响业务操作。
 */

let watermarkEl = null;

/**
 * 挂载水印；重复调用会先移除旧水印再重建。
 * @param {string} text 水印文字
 */
export function applyWatermark(text) {
  removeWatermark();

  // 深色背景下用白色水印，浅色背景下用深灰水印；整体压低透明度、加大间距，避免满屏显眼杂乱
  const isDark = document.documentElement.classList.contains('dark');
  const ink = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.11)';

  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 18);
  ctx.font = '400 13px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/png');
  const el = document.createElement('div');
  el.id = 'app-watermark';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = [
    'position: fixed',
    'inset: 0',
    'z-index: 9999',
    'pointer-events: none',
    'user-select: none',
    `background-image: url("${dataUrl}")`,
    'background-repeat: repeat',
    'background-size: 300px 200px',
  ].join(';');

  document.body.appendChild(el);
  watermarkEl = el;
}

/** 移除水印覆盖层。 */
export function removeWatermark() {
  if (watermarkEl && watermarkEl.parentNode) {
    watermarkEl.parentNode.removeChild(watermarkEl);
  }
  watermarkEl = null;
}
