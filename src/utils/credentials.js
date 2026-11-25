/**
 * 登录「记住密码」的本地存储
 *
 * 桌面端（Electron）：交给主进程 safeStorage，用系统级凭据加密（Windows DPAPI / macOS Keychain），
 * 密文只能在本机当前用户下解开，localStorage 里存的始终是密文。
 *
 * Web 端（无桌面桥）：退化为「可逆混淆」，只避免明文被人一眼看到，不具备真正的加密强度。
 */

const KEY_REMEMBER = 'login_remember'
const KEY_USERNAME = 'login_username'
const KEY_PASSWORD = 'login_password'

// 混淆盐：Web 端使用的固定字符串，仅用于打散明文
const WEB_SALT = 'pw-recharge-login-v1'

/* ---------------- Web 端混淆（可逆） ---------------- */

function xorBytes(bytes) {
  const salt = WEB_SALT.split('')
  const out = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i += 1) {
    out[i] = bytes[i] ^ salt[i % salt.length].charCodeAt(0)
  }
  return out
}

function webEncode(text) {
  const bytes = xorBytes(new TextEncoder().encode(text))
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return `web:${btoa(binary)}`
}

function webDecode(cipher) {
  const binary = atob(cipher.slice(4))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(xorBytes(bytes))
}

/* ---------------- 对外接口 ---------------- */

/**
 * 读取上次保存的登录信息
 * @returns {{ remembered: boolean, username: string, password: string }}
 */
export async function loadSavedCredential() {
  const remembered = localStorage.getItem(KEY_REMEMBER) === '1'
  const username = localStorage.getItem(KEY_USERNAME) || ''
  if (!remembered) return { remembered: false, username, password: '' }

  const cipher = localStorage.getItem(KEY_PASSWORD) || ''
  if (!cipher) return { remembered: true, username, password: '' }

  let password = ''
  try {
    if (cipher.startsWith('secure:')) {
      // 桌面端密文：需要主进程解密；Web 端读到桌面端密文时解不开，只回填账号
      const result = window.secureStore ? await window.secureStore.decrypt(cipher.slice(7)) : null
      password = result && result.ok ? result.data : ''
    } else if (cipher.startsWith('web:')) {
      password = webDecode(cipher)
    }
  } catch (error) {
    console.warn('[credential] 读取记住的密码失败:', error)
    password = ''
  }

  return { remembered: true, username, password }
}

/**
 * 保存登录信息（勾选「记住密码」时调用）
 * @param {string} username
 * @param {string} password 原始密码，不是 RSA 加密后的串
 */
export async function saveCredential(username, password) {
  localStorage.setItem(KEY_REMEMBER, '1')
  localStorage.setItem(KEY_USERNAME, username || '')

  let cipher = ''
  try {
    if (window.secureStore) {
      const result = await window.secureStore.encrypt(password)
      if (result && result.ok) cipher = `secure:${result.data}`
    }
    // 桌面端加密不可用（如系统凭据服务异常）时仍不落明文
    if (!cipher) cipher = webEncode(password)
  } catch (error) {
    console.warn('[credential] 加密密码失败，退回混淆存储:', error)
    cipher = webEncode(password)
  }

  localStorage.setItem(KEY_PASSWORD, cipher)
}

/** 清除已保存的登录信息（取消勾选或登录失败时调用） */
export function clearCredential() {
  localStorage.removeItem(KEY_REMEMBER)
  localStorage.removeItem(KEY_USERNAME)
  localStorage.removeItem(KEY_PASSWORD)
}
