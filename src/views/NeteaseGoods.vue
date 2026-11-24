<template>
  <div class="ng-page">

    <div class="ng-head">

      <!-- 左侧：页面标题 -->
      <div class="page-title-row">
        <div class="page-title-content">
          <h1>网易实时商品中心</h1>
          <p>实时查看网易商品、价格及库存信息</p>
        </div>
      </div>

      <!-- 右侧：操作按钮 -->
      <div class="header-actions">

        <el-button
            class="app-back-btn"
            :icon="ArrowLeft"
            @click="goBack"
        >
          返回
        </el-button>

        <el-button
            type="primary"
            :loading="loading"
            @click="loadGoods"
        >
          刷新实时商品
        </el-button>

      </div>

    </div>

    <el-card shadow="never" class="ng-filter">
      <div class="ng-row">
        <span>选择游戏</span>
        <el-select v-model="platform" style="width:210px" @change="changeGame">
          <el-option v-for="(v,k) in NETEASE_GAMES" :key="k" :label="v.name" :value="k" />
        </el-select>
        <span>查询账号</span>
        <el-input v-model="account" style="width:200px" placeholder="使用游戏默认账号" clearable @keyup.enter="loadGoods" />
        <el-tag type="info">{{ info.name || NETEASE_GAMES[platform].name }}</el-tag>
        <span class="ng-muted">最近更新：{{ lastUpdated || '未查询' }}</span>
      </div>
    </el-card>

    <div class="ng-stats">
      <div><span>商品总数</span><strong>{{ goods.length }}</strong></div>
      <div><span>可购买</span><strong class="ng-green">{{ goods.filter(g=>g.available).length }}</strong></div>
      <div><span>不可购买</span><strong>{{ goods.filter(g=>!g.available).length }}</strong></div>
      <div><span>价格上涨</span><strong class="ng-red">{{ goods.filter(g=>g.change==='up').length }}</strong></div>
      <div><span>价格下降</span><strong class="ng-green">{{ goods.filter(g=>g.change==='down').length }}</strong></div>
    </div>

    <el-card shadow="never" v-loading="loading">
      <div class="ng-row ng-categories">
        <el-radio-group v-model="category">
          <el-radio-button value="全部">全部</el-radio-button>
          <el-radio-button v-for="tag in categories" :key="tag" :value="tag">{{ tag }}</el-radio-button>
        </el-radio-group>
      </div>
      <div class="ng-row ng-toolbar">
        <el-input v-model="keyword" clearable placeholder="搜索名称或商品 SN" style="width:260px" />
        <el-select v-model="status" style="width:145px">
          <el-option label="全部购买状态" value="all"/><el-option label="可购买" value="yes"/><el-option label="不可购买" value="no"/>
        </el-select>
<!--        <el-select v-model="priceStatus" style="width:145px">-->
<!--          <el-option label="全部价格变化" value="all"/><el-option label="上涨" value="up"/><el-option label="下降" value="down"/><el-option label="未变" value="same"/><el-option label="首次记录" value="new"/>-->
<!--        </el-select>-->
        <el-button-group><el-button :type="view==='card'?'primary':''" @click="view='card'">卡片</el-button><el-button :type="view==='table'?'primary':''" @click="view='table'">表格</el-button></el-button-group>
<!--        <el-button @click="historyVisible=true">价格历史</el-button>-->
        <span class="ng-muted">当前显示 {{ filtered.length }} 件</span>
      </div>
      <el-empty v-if="!loading && !filtered.length" description="暂无商品，请刷新或调整筛选" />
      <div v-else-if="view==='card'" class="ng-grid">
        <div v-for="g in filtered" :key="g.key" class="ng-product" @click="showDetail(g)">
          <el-image :src="g.icon" fit="contain" class="ng-image"><template #error><div class="ng-image-error">暂无图片</div></template></el-image>
          <div class="ng-name" :title="g.name">{{ g.name }}</div>
          <div class="ng-price">¥{{ money(g.price) }} <del v-if="g.price < g.unitPrice">¥{{ money(g.unitPrice) }}</del></div>
          <div class="ng-product-bottom"><el-tag size="small" :type="g.available?'success':'danger'">{{ g.available?'可购买':g.reason }}</el-tag><span :class="changeClass(g)">{{ changeText(g) }}</span></div>
          <div class="ng-muted ng-sn">SN：{{ g.sn }}</div>
        </div>
      </div>
      <el-table v-else :data="filtered" border stripe>
        <el-table-column label="图片" width="75"><template #default="{row}"><el-image :src="row.icon" style="width:46px;height:46px" fit="contain"/></template></el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="190" show-overflow-tooltip/>
        <el-table-column prop="sn" label="商品SN" min-width="150" show-overflow-tooltip/>
        <el-table-column prop="tag" label="分类" width="110"/>
        <el-table-column label="原价" width="100"><template #default="{row}">¥{{ money(row.unitPrice) }}</template></el-table-column>
        <el-table-column label="现价" width="100"><template #default="{row}"><b>¥{{ money(row.price) }}</b></template></el-table-column>
        <el-table-column label="价格变化" width="120"><template #default="{row}"><span :class="changeClass(row)">{{ changeText(row) }}</span></template></el-table-column>
        <el-table-column label="状态" width="120"><template #default="{row}"><el-tag :type="row.available?'success':'danger'">{{ row.available?'可购买':row.reason }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="100"><template #default="{row}"><el-button link type="primary" @click="showDetail(row)">查看详情</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="商品详细信息" width="620px" class="fixed-body-dialog ng-detail-dialog" align-center destroy-on-close>
      <template v-if="selected">
        <div class="ng-detail-head">
          <div class="ng-detail-image">
            <el-image :src="selected.icon" fit="contain" />
          </div>
          <div class="ng-detail-info">
            <h3>{{ selected.name }}</h3>
            <div class="ng-detail-price">¥{{ money(selected.price) }}</div>
            <span class="ng-detail-status" :class="changeClass(selected)">{{ changeText(selected) }}</span>
          </div>
        </div>

        <el-descriptions :column="1" border class="ng-descriptions">
          <el-descriptions-item label="商品SN">{{ selected.sn }} <el-button link type="primary" @click="copy(selected.sn)">复制</el-button></el-descriptions-item>
          <el-descriptions-item label="分类">{{ selected.tag }}</el-descriptions-item>
          <el-descriptions-item label="商品标价">¥{{ money(selected.unitPrice) }}</el-descriptions-item>
          <el-descriptions-item label="当前展示价">¥{{ money(selected.price) }}</el-descriptions-item>
          <el-descriptions-item label="上次查询价">{{ selected.oldPrice===null?'首次记录':'¥'+money(selected.oldPrice) }}</el-descriptions-item>
          <el-descriptions-item label="购买状态">{{ selected.available?'可购买':selected.reason }}</el-descriptions-item>
          <el-descriptions-item label="限购次数">{{ selected.raw.max_buy_count ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ selected.raw.selling_stime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ selected.raw.selling_etime || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="ng-description-title">商品说明</div>
        <div class="ng-description">{{ formatDescription(selected.raw.jifei_meta?.goods_detail) }}</div>
        <div class="ng-detail-actions">
          <el-button @click="copy(selected.name)">复制商品名称</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="historyVisible" title="本机价格变化记录" width="850px" class="fixed-body-dialog" align-center>
      <el-alert type="info" :closable="false" title="历史仅保存在当前浏览器；不同游戏、账号分别记录。首次查询作为基准，不视为涨跌。" style="margin-bottom:12px"/>
      <el-table :data="historyRows" max-height="calc(100dvh - 230px)" border stripe>
        <el-table-column prop="time" label="时间" width="170"/>
        <el-table-column prop="name" label="商品" min-width="180" show-overflow-tooltip/>
        <el-table-column prop="sn" label="SN" width="140" show-overflow-tooltip/>
        <el-table-column label="原价格" width="105"><template #default="{row}">¥{{ money(row.oldPrice) }}</template></el-table-column>
        <el-table-column label="新价格" width="105"><template #default="{row}">¥{{ money(row.newPrice) }}</template></el-table-column>
        <el-table-column label="变化" width="90"><template #default="{row}"><span :class="row.newPrice>row.oldPrice?'ng-red':'ng-green'">{{ row.newPrice>row.oldPrice?'上涨':'下降' }}</span></template></el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { NETEASE_GAMES } from '@/config/neteaseGames'
import { getNeteaseGoods } from '@/api/realtimeGoods'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

function goBack() {
  router.back()
}

const platform = ref('eggie')
const account = ref('')
const info = ref({})
const goods = ref([])
const loading = ref(false)
const category = ref('全部')
const keyword = ref('')
const status = ref('all')
const priceStatus = ref('all')
const view = ref('card')
const detailVisible = ref(false)
const selected = ref(null)
const historyVisible = ref(false)
const historyRows = ref([])
const lastUpdated = ref('')
let requestVersion = 0

const money = value => Number(value || 0).toFixed(2)
// 商品说明里的 <br/> 转为换行，兼容后端转义后的标签
const formatDescription = text => {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = String(text || '暂无说明')
  return textarea.value.replace(/<br\s*\/?>/gi, '\n')
}
const storageKey = () => `netease:goods:prices:v1:${platform.value}:${account.value.trim() || NETEASE_GAMES[platform.value].account || 'default'}`
const historyKey = () => storageKey() + ':history'
const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } }
const nowText = () => new Date().toLocaleString('zh-CN', { hour12: false })

const categories = computed(() => {
  const order = NETEASE_GAMES[platform.value].categoryOrder || []
  return [...new Set(goods.value.map(g => g.tag))].sort((a,b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b)
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib)
  })
})
const filtered = computed(() => goods.value.filter(g => {
  const q = keyword.value.trim().toLowerCase()
  return (category.value === '全部' || g.tag === category.value)
    && (!q || g.name.toLowerCase().includes(q) || String(g.sn).toLowerCase().includes(q))
    && (status.value === 'all' || (status.value === 'yes' ? g.available : !g.available))
    && (priceStatus.value === 'all' || g.change === priceStatus.value)
}))

function normalize(raw, idx, previous) {
  const unitPrice = Number(raw.unit_price)
  const discount = raw.discount_price === '' || raw.discount_price == null ? NaN : Number(raw.discount_price)
  const price = Number.isFinite(discount) && discount >= 0 && discount < unitPrice ? discount : unitPrice
  const sn = String(raw.sn ?? '')
  const key = sn || `__missing_sn_${idx}`
  const oldPrice = Object.prototype.hasOwnProperty.call(previous, key) ? Number(previous[key]) : null
  const change = oldPrice === null ? 'new' : price > oldPrice ? 'up' : price < oldPrice ? 'down' : 'same'
  const available = raw.purchase_status !== false && raw.purchase_status !== 0
  // 购买原因：后端返回的文案优先，否则前端码值映射兜底，仍未知则显示原始原因码
  const reason = resolvePurchaseReason(raw)
  return { raw, key, sn, name: String(raw.name || '未命名商品'), icon: raw.icon || '', tag: raw.product_tag || '其他', unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0, price: Number.isFinite(price) ? price : 0, oldPrice, change, available, reason }
}

// 限购原因码 → 中文兜底映射（后端直接返回文案时不走此表）
const PURCHASE_REASON_TEXT_MAP = {
  BUY_NUM: '已达限购',
  BLACKLIST: '黑名单'
}

function resolvePurchaseReason(raw) {
  const backendText = String(raw.purchase_limit_reason_text || raw.reason_text || '').trim()
  if (backendText) return backendText
  const code = raw.purchase_limit_reason
  if (PURCHASE_REASON_TEXT_MAP[code]) return PURCHASE_REASON_TEXT_MAP[code]
  return code || '不可购买'
}
function changeText(g) { return g.change === 'new' ? '首次记录' : g.change === 'same' ? '未变化' : g.change === 'up' ? `↑ ¥${money(g.price-g.oldPrice)}` : `↓ ¥${money(g.oldPrice-g.price)}` }
function changeClass(g) { return g.change === 'up' ? 'ng-red' : g.change === 'down' ? 'ng-green' : 'ng-muted' }
function changeGame() { requestVersion++; account.value = ''; goods.value = []; info.value = {}; category.value = '全部'; keyword.value = ''; loadGoods() }

async function loadGoods() {
  const version = ++requestVersion
  loading.value = true
  try {
    const result = await getNeteaseGoods(platform.value, account.value)
    if (version !== requestVersion) return
    const key = storageKey()
    const previous = safeRead(key, {})
    const normalized = result.list.map((raw, idx) => normalize(raw, idx, previous))
    const time = nowText()
    const changes = normalized.filter(g => (g.change === 'up' || g.change === 'down') && g.sn).map(g => ({ time, sn:g.sn, name:g.name, oldPrice:g.oldPrice, newPrice:g.price }))
    const history = [...changes, ...safeRead(historyKey(), [])].slice(0, 1000)
    const next = Object.fromEntries(normalized.filter(g => g.sn).map(g => [g.key, g.price]))
    try { localStorage.setItem(key, JSON.stringify(next)); localStorage.setItem(historyKey(), JSON.stringify(history)) }
    catch { ElMessage.warning('浏览器存储空间不足，价格历史未保存') }
    historyRows.value = history
    goods.value = normalized
    info.value = result.info
    lastUpdated.value = time
    ElMessage.success(`已获取 ${normalized.length} 件商品`)
  } catch (e) {
    if (version !== requestVersion) return
    ElMessage.error(e.message || '获取失败')
  } finally {
    if (version === requestVersion) loading.value = false
  }
}
function showDetail(g) { selected.value = g; detailVisible.value = true }
async function copy(text) { try { await navigator.clipboard.writeText(String(text)); ElMessage.success('复制成功') } catch { ElMessage.warning('复制失败，请手动复制') } }

onMounted(() => loadGoods())
</script>

<style scoped>
/* 页面标题与返回按钮 */
.page-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 页面右侧操作按钮 */
.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

/* 取消 Element Plus 按钮默认左边距 */
.header-actions .el-button + .el-button {
  margin-left: 0;
}

.page-title-content h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.page-title-content p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--app-text-muted);
}
.ng-page{padding: 26px 30px 44px;background:var(--app-bg);min-height:100%;color:var(--app-text-regular)}.ng-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.ng-head h2{font-size:24px;margin:0 0 7px}.ng-head p{color:var(--app-text-muted);margin:0}.ng-filter{margin-bottom:16px}.ng-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.ng-muted{color:var(--app-text-muted);font-size:12px}.ng-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;margin-bottom:16px}.ng-stats>div{background:var(--app-bg-elevated);border:1px solid var(--app-border);border-radius:9px;padding:17px;display:flex;flex-direction:column;gap:9px}.ng-stats strong{font-size:26px}.ng-red{color:#f56c6c}.ng-green{color:#18a058}.ng-categories{margin-bottom:18px}.ng-toolbar{margin-bottom:18px}.ng-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:15px}.ng-product{background:var(--app-bg-elevated);border:1px solid var(--app-border);border-radius:10px;padding:12px;cursor:pointer;transition:.15s}.ng-product:hover{border-color:var(--app-accent);box-shadow:0 5px 16px #00000012}.ng-image{width:100%;height:145px}.ng-image-error{height:145px;display:grid;place-items:center;color:var(--app-text-muted);background:var(--app-bg-subtle)}.ng-name{font-weight:600;font-size:13px;min-height:38px;margin-top:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.ng-price{font-size:19px;color:#f56c6c;font-weight:700;margin:9px 0}.ng-price del{font-size:12px;color:var(--app-text-muted);font-weight:400;margin-left:5px}.ng-product-bottom{display:flex;justify-content:space-between;gap:4px;align-items:center;font-size:12px}.ng-sn{margin-top:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ng-detail-dialog .el-dialog__body{padding:20px 22px 18px}
.ng-detail-head{display:flex;align-items:center;gap:18px;margin-bottom:18px;padding:16px;background:var(--app-bg-subtle);border:1px solid var(--app-border);border-radius:16px}
.ng-detail-image{width:88px;height:88px;flex:0 0 88px;display:grid;place-items:center;overflow:hidden;background:var(--app-bg-elevated);border:1px solid var(--app-border);border-radius:14px}
.ng-detail-image .el-image{width:100%;height:100%}
.ng-detail-info{min-width:0}
.ng-detail-info h3{margin:0 0 8px;font-size:18px;font-weight:600;color:var(--app-text-primary)}
.ng-detail-price{margin-bottom:6px;font-size:22px;font-weight:700;line-height:1.2;color:#f56c6c}
.ng-detail-status{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:12px;background:var(--app-bg-elevated)}
.ng-descriptions{margin-bottom:18px}
:deep(.ng-descriptions .el-descriptions__label){width:112px;background:var(--app-bg-subtle);color:var(--app-text-secondary);font-weight:500}
:deep(.ng-descriptions .el-descriptions__content){color:var(--app-text-regular)}
:deep(.ng-descriptions .el-descriptions__cell){padding:12px 14px}
.ng-description-title{margin:0 0 10px;font-size:14px;font-weight:600;color:var(--app-text-primary)}
.ng-description{white-space:pre-wrap;line-height:1.75;background:var(--app-bg-subtle);border:1px solid var(--app-border);border-radius:12px;padding:14px 16px;margin-bottom:16px;color:var(--app-text-regular)}
.ng-detail-actions{display:flex;justify-content:flex-end;gap:10px}
@media(max-width:900px){.ng-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ng-page{padding:12px}.ng-head{gap:12px}.ng-detail-head{padding:14px;gap:14px}.ng-detail-image{width:72px;height:72px;flex-basis:72px}:deep(.ng-descriptions .el-descriptions__label){width:96px}}
</style>
