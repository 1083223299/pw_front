import axios from 'axios'
import { NETEASE_COOKIE, NETEASE_GAMES } from '@/config/neteaseGames'

const client = axios.create({ baseURL: '', timeout: 30000 })

export async function getNeteaseGoods(platform, accountOverride = '') {
  const config = NETEASE_GAMES[platform]
  if (!config) throw new Error(`未知游戏：${platform}`)
  if (!NETEASE_COOKIE || NETEASE_COOKIE.startsWith('请填写')) throw new Error('请先在 neteaseGames.js 配置有效 Cookie')
  // 大话西游原的 account / channel / gameCode 是未启用的，按原逻辑仅传有效字段。
  const payload = { cookie: NETEASE_COOKIE, apiBase: config.apiBase }
  const account = accountOverride.trim() || config.account
  if (account) payload.account = account
  if (config.gameCode) payload.gameCode = config.gameCode
  if (config.channel) payload.channel = config.channel
  try {
    const { data: response } = await client.post(config.goodsApi, payload)
    if (typeof response !== 'object' || response === null || Array.isArray(response)) {
      throw new Error(`商品接口返回异常（非 JSON）：${config.goodsApi}`)
    }
    if ('code' in response && response.code !== 0 && response.code !== 200) {
      throw new Error(response.message || response.msg || '查询失败')
    }
    const data = response?.data ?? response
    const list = data?.[config.listField]
    if (!Array.isArray(list)) throw new Error(`接口未返回 ${config.listField} 数组，请核对游戏接口`)
    return { info: data.info || {}, list, account }
  } catch (e) {
    throw new Error(e.response?.data?.msg || e.response?.data?.message || e.message || '商品请求失败')
  }
}
