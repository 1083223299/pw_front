import logoUrl from '@/assets/images/logo32.png';

/**
 * 在渲染进程用 Canvas 生成托盘未读红点图标。
 *
 * 两个平台都只画红点，不画数字：
 * - Windows：托盘只有 16px，数字必然糊成色块，条数交给 tooltip。
 * - macOS：菜单栏图标保持单色模板图（随深浅色自动反色），未读条数由 Dock 数字角标承担，
 *   这也是 Mac 上微信、QQ 的一致做法，不在菜单栏图标里叠彩色数字。
 */
export function renderTrayBadgeDataUrl(count) {
  const n = Number(count) || 0;
  if (n <= 0) return Promise.resolve(null);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');

        // 用 32px 源图放大，比 16px 源图放大的边缘更干净
        context.drawImage(img, 0, 0, size, size);

        // 红点直径约占图标 28%，缩到 16px 时约 4.5px，足以辨认"有未读"
        const radius = 36;
        const gap = 4;
        const cx = size - radius - gap;
        const cy = radius + gap;

        context.beginPath();
        context.arc(cx, cy, radius, 0, Math.PI * 2);
        context.fillStyle = '#ef4444';
        context.fill();
        // 细白描边，避免红点贴在深色托盘背景上糊成一团
        context.lineWidth = 4;
        context.strokeStyle = '#ffffff';
        context.stroke();

        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = logoUrl;
  });
}
