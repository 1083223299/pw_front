// 后端提供的 RSA 公钥
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2up79RV1esyEBkbb38CD
3TVedt7E3h6LLpKBAQfbV6u4+lh2lQq/FPEBbjvFyoH3ALiGjS9Pm62vh9ihY0R1
NKilf/5mY5PIqCw2U7XMTP/McLcGaK5hUiTH9RKzwEHmlfGZMpnjtVOSN8M7TE6W
c2NwfRO7Tcpitz9Y0An5KBIDELPSO6VFAVTpbfLjYgw5OiBK6yqAr/QcV+SmzgcB
qVmaZVRWXG4y6cmesawHU4AtJRWnH2oXUiMe45MZXxwCk1c2RII3hWBVbHEuqYZW
tnnYCtHUy6lds9qqw09i89lk/OT94NGqtuv68EaGg7umcgsUe6bdYt4Skao0N7vC
8QIDAQAB
-----END PUBLIC KEY-----`;

const pemToArrayBuffer = (pem) => {
  const b64 = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '');
  const raw = atob(b64);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    buffer[i] = raw.charCodeAt(i);
  }
  return buffer.buffer;
};

// HTTP 非安全上下文（如 http://公网IP）下 crypto.subtle 不可用，回退到 forge
const encryptWithForge = async (plain) => {
  const { default: forge } = await import('node-forge')
  const publicKey = forge.pki.publicKeyFromPem(PUBLIC_KEY)
  const encrypted = publicKey.encrypt(plain, 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() },
  })
  return forge.util.encode64(encrypted)
}

// 使用 Web Crypto 做 RSA-OAEP 加密，返回 base64 字符串
export const encryptPassword = async (plain) => {
  if (!plain) return '';
  try {
    if (!globalThis.crypto?.subtle) {
      return await encryptWithForge(plain)
    }
    const key = await crypto.subtle.importKey(
      'spki',
      pemToArrayBuffer(PUBLIC_KEY),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      key,
      new TextEncoder().encode(plain)
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  } catch (err) {
    console.error('Encrypt password failed:', err);
    // 部分浏览器在 http 下 subtle 存在但不可用，再试 forge
    try {
      return await encryptWithForge(plain)
    } catch (fallbackErr) {
      console.error('Encrypt password forge fallback failed:', fallbackErr)
      throw fallbackErr
    }
  }
};

// 获取今天的开始时间
export function getTodayStart() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day} 00:00:00`

}

// 获取当前时间
export function getTodayEnd() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`

}

export function generateSocCode() {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  const rand2 = Math.random().toString(36).slice(2, 6)
  return `${ts}-${rand}${rand2}`
}