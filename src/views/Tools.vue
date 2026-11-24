<template>
  <div class="tools-page">

    <!-- =========================
         页面标题
         ========================= -->
    <div class="page-header">
      <div class="page-title">
        <div class="title-icon">
          <el-icon><Operation /></el-icon>
        </div>

        <div>
          <h1>订单处理工具</h1>
          <p>订单状态管理、代发码处理、订单同步等辅助工具</p>
        </div>
      </div>

      <div class="header-right">
        <el-tag type="success" effect="light" round>
          <el-icon><CircleCheck /></el-icon>
          工具服务
        </el-tag>
      </div>
    </div>

    <!-- =========================
         主卡片
         ========================= -->
    <div class="tools-card">

      <!-- Tab 导航 -->
      <el-tabs
          v-model="activeTab"
          class="tools-tabs"
      >

        <el-tab-pane
            label="抖店添加作废链接"
            name="fake"
        />

        <el-tab-pane
            label="抖店指定订单结果"
            name="result"
        />

        <el-tab-pane
            label="抖店代发码"
            name="daifa"
        />

        <el-tab-pane
            label="淘宝指定订单作废"
            name="taobao"
        />

        <el-tab-pane
            label="订单同步中心"
            name="sync"
        />

      </el-tabs>

      <!-- =========================
           操作区域
           ========================= -->
      <div class="tools-content">

        <!-- 店铺选择 -->
        <div class="form-section">

          <div class="section-title">
            <el-icon><Shop /></el-icon>
            <span>店铺信息</span>
          </div>

          <el-form label-position="top">

            <el-form-item label="选择店铺">

              <el-select
                  v-model="shopId"
                  placeholder="请选择店铺，支持名称或店铺ID搜索"
                  filterable
                  clearable
                  :filter-method="filterShop"
                  :loading="shopLoading"
                  style="width: 100%"
                  @change="shopKeyword = ''"
                  @clear="shopKeyword = ''"
              >
                <el-option
                    v-for="shop in filteredShopList"
                    :key="shop.id"
                    :label="`${shop.name}（${shop.id}）`"
                    :value="String(shop.id)"
                >
                  <div class="shop-option">
                    <span>{{ shop.name }}</span>
                    <span class="shop-option-id">
        ID：{{ shop.id }}
      </span>
                  </div>
                </el-option>
              </el-select>

            </el-form-item>

          </el-form>

        </div>

        <!-- =========================
             抖店添加作废链接
             ========================= -->
        <div
            v-show="activeTab === 'fake'"
            class="form-section"
        >

          <div class="section-title">
            <el-icon><Link /></el-icon>
            <span>抖店添加作废链接</span>
          </div>

          <el-alert
              title="为指定抖店订单添加作废链接"
              type="info"
              :closable="false"
              show-icon
              class="section-alert"
          />

          <el-form label-position="top">

            <el-form-item label="订单 ID">

              <el-input
                  v-model="orderId"
                  placeholder="请输入订单 ID"
                  clearable
              />

            </el-form-item>

            <el-form-item label="数量">

              <el-input-number
                  v-model="fakeNum"
                  :min="1"
                  :max="999999"
                  :step="1"
                  :precision="0"
                  controls-position="right"
                  style="width: 100%"
              />

              <div class="form-tip">
                默认数量为 1，可根据实际情况修改
              </div>

            </el-form-item>

            <div class="action-row">

              <el-button
                  type="primary"
                  :icon="Link"
                  :loading="loading"
                  @click="fakeLink"
              >
                给假链接
              </el-button>

            </div>

          </el-form>

        </div>

        <!-- =========================
             指定订单结果
             ========================= -->
        <div
            v-show="activeTab === 'result'"
            class="form-section"
        >

          <div class="section-title">
            <el-icon><CircleCheck /></el-icon>
            <span>抖店指定订单结果</span>
          </div>

          <el-alert
              title="手动设置订单处理结果，请确认订单状态后再操作"
              type="warning"
              :closable="false"
              show-icon
              class="section-alert"
          />

          <el-form label-position="top">

            <el-form-item label="订单 ID">

              <el-input
                  v-model="orderId"
                  placeholder="请输入订单 ID"
                  clearable
              />

            </el-form-item>

            <div class="action-row">

              <el-button
                  type="success"
                  :icon="CircleCheck"
                  :loading="loading"
                  @click="setResult(1)"
              >
                设置成功
              </el-button>

              <el-button
                  type="danger"
                  :icon="CircleClose"
                  :loading="loading"
                  @click="setResult(2)"
              >
                设置失败
              </el-button>

            </div>

          </el-form>

        </div>

        <!-- =========================
             抖店代发码
             ========================= -->
        <div
            v-show="activeTab === 'daifa'"
            class="form-section"
        >

          <div class="section-title">
            <el-icon><Tickets /></el-icon>
            <span>抖店代发码</span>
          </div>

          <el-alert
              title="适用于店铺已购买、订单已进入系统，但尚未生成卡密的情况"
              type="warning"
              :closable="false"
              show-icon
              class="section-alert"
          />

          <el-form label-position="top">

            <el-form-item label="店铺订单号">

              <el-input
                  v-model="daifaOrderNo"
                  placeholder="请输入店铺订单号"
                  clearable
              />

            </el-form-item>

            <div class="action-row">

              <el-button
                  type="primary"
                  :icon="Tickets"
                  :loading="loading"
                  @click="handleDaifaCode"
              >
                处理代发码
              </el-button>

            </div>

          </el-form>

        </div>

        <!-- =========================
             淘宝订单作废
             ========================= -->
        <div
            v-show="activeTab === 'taobao'"
            class="form-section"
        >

          <div class="section-title">
            <el-icon><Delete /></el-icon>
            <span>淘宝指定订单作废</span>
          </div>

          <el-alert
              title="该操作将指定淘宝订单设置为作废，请谨慎操作"
              type="error"
              :closable="false"
              show-icon
              class="section-alert"
          />

          <el-form label-position="top">

            <el-form-item label="订单 ID">

              <el-input
                  v-model="orderId"
                  placeholder="请输入淘宝订单 ID"
                  clearable
              />

            </el-form-item>

            <div class="action-row">

              <el-button
                  type="danger"
                  :icon="Delete"
                  :loading="loading"
                  @click="taobaoCancel"
              >
                设置淘宝订单作废
              </el-button>

            </div>

          </el-form>

        </div>

        <!-- =========================
             订单同步中心
             ========================= -->
        <div
            v-show="activeTab === 'sync'"
            class="form-section"
        >

          <div class="section-title">
            <el-icon><Refresh /></el-icon>
            <span>订单同步中心</span>
          </div>

          <el-alert
              title="支持抖店码券、小红书、淘宝直充订单同步"
              type="info"
              :closable="false"
              show-icon
              class="section-alert"
          />

          <el-form label-position="top">

            <el-form-item label="待同步订单">

              <el-input
                  v-model="syncOrderText"
                  type="textarea"
                  :rows="10"
                  resize="vertical"
                  placeholder="点击获取待同步订单，也可以手动输入，一行一个订单 ID"
              />

            </el-form-item>

            <!-- 数量统计 -->
            <div class="sync-stats">

              <div class="sync-count">

                <el-icon><Document /></el-icon>

                <span>当前订单数量</span>

                <strong>{{ syncCount }}</strong>

              </div>

              <el-button
                  link
                  type="danger"
                  :disabled="!syncOrderText.trim() || loading"
                  @click="clearSyncOrders"
              >
                清空订单
              </el-button>

            </div>

            <div class="action-row">

              <el-button
                  type="primary"
                  :icon="Download"
                  :loading="loading"
                  @click="loadSyncOrders"
              >
                获取待进系统订单
              </el-button>

              <el-button
                  type="success"
                  :icon="Refresh"
                  :loading="loading"
                  @click="syncOrders"
              >
                同步订单
              </el-button>

            </div>

          </el-form>

        </div>

        <!-- =========================
             返回结果
             ========================= -->
        <div class="result-section">

          <div class="result-header">

            <div class="section-title result-title">

              <el-icon><Document /></el-icon>

              <span>返回结果</span>

            </div>

            <div class="result-actions">

              <el-button
                  link
                  type="primary"
                  :icon="CopyDocument"
                  @click="copyResult"
              >
                复制结果
              </el-button>

              <el-button
                  link
                  :icon="Delete"
                  @click="clearResult"
              >
                清空
              </el-button>

            </div>

          </div>

          <div class="result-box">

            <div
                v-if="loading"
                class="result-loading"
            >
              <el-icon class="is-loading">
                <Loading />
              </el-icon>

              <span>正在处理请求...</span>
            </div>

            <pre v-else>{{ resultText }}</pre>

          </div>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  watch
} from 'vue'

import {
  ElMessage,
  ElMessageBox
} from 'element-plus'

import {
  Operation,
  Shop,
  Link,
  CircleCheck,
  CircleClose,
  Tickets,
  Delete,
  Refresh,
  Document,
  Download,
  CopyDocument,
  Loading
} from '@element-plus/icons-vue'

import {
  getToolShopList,
  addFakeLink,
  setToolOrderResult,
  handleToolDaifaCode,
  cancelToolTaobaoOrder,
  getToolSyncOrders,
  submitToolSyncOrders
} from '@/api/tools.js'


/* ==================================================
   页面状态
   ================================================== */

// 当前 Tab
const activeTab = ref('fake')

// 切换 Tab 时，清空返回结果
watch(activeTab, () => {
  resultText.value = '等待操作...'
})

// 店铺列表
const shopList = ref([])

// 店铺搜索关键词
const shopKeyword = ref('')

// 筛选后的店铺列表
const filteredShopList = computed(() => {

  const keyword = shopKeyword.value.trim().toLowerCase()

  // 没有搜索内容，显示全部店铺
  if (!keyword) {
    return shopList.value
  }

  return shopList.value.filter(shop => {

    const name = String(shop.name ?? '').toLowerCase()
    const id = String(shop.id ?? '')

    // 店铺ID精确匹配，店铺名称模糊匹配
    return id === keyword || name.includes(keyword)

  })

})

// 输入搜索关键词
function filterShop(value) {
  shopKeyword.value = value
}

// 当前店铺
const shopId = ref('')

// 店铺加载状态
const shopLoading = ref(false)

// 订单 ID
const orderId = ref('')

// 作废链接数量
const fakeNum = ref(1)

// 代发码订单号
const daifaOrderNo = ref('')

// 同步订单文本
const syncOrderText = ref('')

// 请求状态
const loading = ref(false)

// 返回结果
const resultText = ref('等待操作...')


/* ==================================================
   当前店铺
   ================================================== */

const currentShop = computed(() => {

  return shopList.value.find(
      item => String(item.id) === shopId.value
  ) || null

})


/* ==================================================
   同步订单数量
   ================================================== */
const syncCount = computed(() => {
  return syncOrderText.value
      .split('\n')
      .filter(v => v.trim())
      .length

})


/* ==================================================
   页面初始化
   ================================================== */
onMounted(() => {
  loadShopList()
})

/* ==================================================
   加载店铺
   ================================================== */
async function loadShopList() {
  shopLoading.value = true
  try {
    const json = await getToolShopList()
    if (json.code !== 0) {
      ElMessage.error(
          json.msg || '店铺列表加载失败'
      )
      return
    }

    shopList.value = Array.isArray(json.data)
        ? json.data
        : []

    // 默认选中第一个店铺
    if (shopList.value.length > 0) {
      shopId.value =
          String(shopList.value[0].id)
    }

  } catch (error) {

    console.error('加载店铺失败:', error)
    ElMessage.error(
        error.message || '加载店铺失败'
    )
  } finally {
    shopLoading.value = false
  }
}


/* ==================================================
   校验店铺
   ================================================== */

function checkShop() {

  if (!currentShop.value) {

    ElMessage.warning('请选择店铺')

    return false

  }

  return true

}


/* ==================================================
   校验订单
   ================================================== */

function checkOrder() {

  if (!checkShop()) {
    return false
  }

  if (!orderId.value.trim()) {

    ElMessage.warning('请输入订单 ID')

    return false

  }

  return true

}


/* ==================================================
   显示返回结果
   ================================================== */

function showResult(data) {

  if (typeof data === 'string') {

    resultText.value = data

    return

  }

  resultText.value =
      JSON.stringify(data, null, 4)

}


/* ==================================================
   统一执行请求
   ================================================== */

async function executeRequest(callback) {

  if (loading.value) {
    return
  }

  loading.value = true

  resultText.value = 'Loading...'

  try {

    const json = await callback()

    showResult(json)

    if (json.code === 0) {

      ElMessage.success(
          json.msg || '操作成功'
      )

    } else {

      ElMessage.error(
          json.msg || '操作失败'
      )

    }

    return json

  } catch (error) {

    console.error('请求失败:', error)

    showResult(
        error.message || String(error)
    )

    ElMessage.error(
        error.message || '请求失败'
    )

    return null

  } finally {

    loading.value = false

  }

}


/* ==================================================
   抖店添加作废链接
   ================================================== */
async function fakeLink() {
  if (!checkOrder()) {
    return
  }

  const num = Number(fakeNum.value)
  if (
      !Number.isSafeInteger(num) ||
      num < 1
  ) {
    ElMessage.warning(
        '请输入大于等于 1 的整数数量'
    )
    return
  }

  await executeRequest(() => {
    return addFakeLink(
        shopId.value,
        orderId.value.trim(),
        num
    )
  })

}


/* ==================================================
   抖店指定订单结果
   ================================================== */

async function setResult(status) {

  if (!checkOrder()) {
    return
  }

  const text = status === 1 ? '成功' : '失败'
  try {
    await ElMessageBox.confirm(
        `确定要将该订单设置为${text}吗？`,
        '确认操作',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )

  } catch {
    return
  }

  await executeRequest(() => {
    return setToolOrderResult(
        shopId.value,
        orderId.value.trim(),
        status
    )
  })

}


/* ==================================================
   淘宝订单作废
   ================================================== */

async function taobaoCancel() {

  if (!checkOrder()) {
    return
  }

  try {
    await ElMessageBox.confirm(
        '确定要将淘宝订单设置为作废吗？',
        '订单作废确认',
        {
          confirmButtonText: '确定作废',
          cancelButtonText: '取消',
          type: 'warning'
        }
    )

  } catch {
    return
  }

  await executeRequest(() => {
    return cancelToolTaobaoOrder(
        shopId.value,
        orderId.value.trim()
    )
  })

}


/* ==================================================
   抖店代发码
   ================================================== */

async function handleDaifaCode() {
  if (!checkShop()) {
    return
  }
  const orderNo =
      daifaOrderNo.value.trim()
  if (!orderNo) {
    ElMessage.warning(
        '请输入店铺订单号'
    )
    return
  }

  await executeRequest(() => {
    return handleToolDaifaCode(
        shopId.value,
        orderNo
    )
  })

}


/* ==================================================
   获取待同步订单
   ================================================== */

async function loadSyncOrders() {

  if (!checkShop()) {
    return
  }

  const shop = currentShop.value

  await executeRequest(async () => {
    const json = await getToolSyncOrders(
        shop.id,
        shop.type_id
    )

    if (json.code === 0) {

      const orders = Array.isArray(json.data)
          ? json.data
          : []

      syncOrderText.value =
          orders.join('\n')

      showResult(
          `获取成功，共 ${orders.length} 条`
      )

    }

    return json

  })

}


/* ==================================================
   同步订单
   ================================================== */
async function syncOrders() {
  if (!checkShop()) {
    return
  }
  const orders = syncOrderText.value
      .split('\n')
      .map(v => v.trim())
      .filter(Boolean)
  if (orders.length === 0) {
    ElMessage.warning('没有订单')
    return
  }

  try {

    await ElMessageBox.confirm(
        `确定同步 ${orders.length} 条订单吗？`,
        '订单同步确认',
        {
          confirmButtonText: '开始同步',
          cancelButtonText: '取消',
          type: 'info'
        }
    )
  } catch {
    return
  }

  await executeRequest(() => {
    return submitToolSyncOrders(
        shopId.value,
        orders
    )
  })

}


/* ==================================================
   清空同步订单
   ================================================== */

function clearSyncOrders() {

  syncOrderText.value = ''

  ElMessage.success('已清空订单')

}


/* ==================================================
   复制结果
   ================================================== */

async function copyResult() {

  try {

    await navigator.clipboard.writeText(
        resultText.value
    )

    ElMessage.success('复制成功')

  } catch (error) {

    ElMessage.error('复制失败')

  }

}


/* ==================================================
   清空结果
   ================================================== */

function clearResult() {

  resultText.value = '等待操作...'

}
</script>

<style scoped>

/* ==================================================
   页面整体
   ================================================== */

.tools-page {
  width: 100%;
  /* max-width: 1400px; */
  /* margin: 0 auto; */
  color: var(--app-text-primary);
  padding: 26px 30px 44px
}

/* ==================================================
   页面标题
   ================================================== */

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.title-icon {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 23px;
}

.page-title h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 650;
  color: var(--app-text-primary);
}

.page-title p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--app-text-muted);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ==================================================
   主卡片
   ================================================== */

.tools-card {
  background: var(--app-bg-elevated);
  border-radius: 14px;
  border: 1px solid var(--app-border);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.035);
  overflow: hidden;
}

/* ==================================================
   Tab
   ================================================== */

.tools-tabs {
  padding: 0 24px;
  border-bottom: 1px solid #f0f2f5;
}

.tools-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.tools-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.tools-tabs :deep(.el-tabs__item) {
  height: 58px;
  font-size: 14px;
  padding: 0 20px;
  color: var(--app-text-secondary);
}

.tools-tabs :deep(.el-tabs__item.is-active) {
  color: var(--app-accent);
  font-weight: 600;
}

.tools-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px;
}

/* ==================================================
   内容区域
   ================================================== */

.tools-content {
  padding: 28px;
}

.form-section {
  margin-bottom: 28px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.section-title .el-icon {
  color: var(--app-accent);
  font-size: 17px;
}

.section-alert {
  margin-bottom: 24px;
  border-radius: 8px;
}

/* ==================================================
   表单
   ================================================== */

.tools-content :deep(.el-form-item__label) {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-secondary);
}

.tools-content :deep(.el-input__wrapper) {
  min-height: 42px;
  border-radius: 8px;
}

.tools-content :deep(.el-select__wrapper) {
  min-height: 42px;
  border-radius: 8px;
}

.tools-content :deep(.el-textarea__inner) {
  border-radius: 8px;
  line-height: 1.7;
  padding: 14px;
}

.tools-content :deep(.el-input-number) {
  width: 100%;
}

.tools-content :deep(.el-input-number .el-input__inner) {
  text-align: left;
}

.form-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--app-text-muted);
}

/* ==================================================
   店铺选项
   ================================================== */

.shop-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.shop-option-id {
  font-size: 12px;
  color: var(--app-text-muted);
}

/* ==================================================
   操作按钮
   ================================================== */

.action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.action-row .el-button {
  min-width: 150px;
  height: 42px;
  border-radius: 8px;
  font-size: 14px;
  margin-left: 0;
}

/* ==================================================
   同步统计
   ================================================== */

.sync-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--app-bg-subtle);
}

.sync-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--app-text-secondary);
}

.sync-count .el-icon {
  color: var(--app-accent);
}

.sync-count strong {
  font-size: 18px;
  color: var(--app-accent);
}

/* ==================================================
   返回结果
   ================================================== */

.result-section {
  margin-top: 35px;
  padding-top: 26px;
  border-top: 1px solid #f0f2f5;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.result-title {
  margin-bottom: 0;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-box {
  min-height: 220px;
  max-height: 500px;
  overflow: auto;
  padding: 20px;
  background: #1e2430;
  border-radius: 10px;
  border: 1px solid #2d3442;
}

.result-box pre {
  margin: 0;
  color: #7ee787;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
  font-family:
      Monaco,
      Consolas,
      monospace;
}

.result-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #a5b4fc;
  font-size: 13px;
}

.result-loading .el-icon {
  font-size: 17px;
}

/* ==================================================
   手机适配
   ================================================== */

@media (max-width: 700px) {

  .page-header {
    margin-bottom: 18px;
  }

  .title-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .page-title h1 {
    font-size: 18px;
  }

  .page-title p {
    font-size: 11px;
  }

  .header-right {
    display: none;
  }

  .tools-tabs {
    padding: 0 12px;
  }

  .tools-tabs :deep(.el-tabs__item) {
    height: 50px;
    padding: 0 14px;
    font-size: 13px;
  }

  .tools-content {
    padding: 18px;
  }

  .section-title {
    font-size: 14px;
  }

  .action-row {
    flex-direction: column;
    align-items: stretch;
  }

  .action-row .el-button {
    width: 100%;
    margin-left: 0;
  }

  .result-box {
    min-height: 180px;
    padding: 14px;
  }

  .result-box pre {
    font-size: 12px;
  }

}

</style>