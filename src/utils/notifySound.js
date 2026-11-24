/**
 * 系统通知提示音（微信式“叮咚”）。
 * 使用 Web Audio API 合成音阶，不引入音频资源；300ms 内连续触发只响一次。
 */

let ctx = null;
let lastPlayAt = 0;
const MIN_GAP = 300;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  return ctx;
}

function tone(ac, freq, startOffset, duration, volume) {
  const t0 = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.06);
}

function playTones(ac) {
  tone(ac, 1174.66, 0, 0.38, 0.2);
  tone(ac, 880.0, 0.13, 0.42, 0.18);
}

export function playNotifySound() {
  const now = Date.now();
  if (now - lastPlayAt < MIN_GAP) return;
  lastPlayAt = now;

  const ac = getCtx();
  if (!ac) return;

  if (ac.state === 'suspended') {
    ac.resume()
      .then(() => {
        if (ac.state === 'running') playTones(ac);
      })
      .catch(() => {});
    return;
  }

  playTones(ac);
}

if (typeof window !== 'undefined') {
  const unlock = () => {
    const ac = getCtx();
    if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}
