<template>
  <el-dialog
      v-model="visible"
      width="460px"
      class="bill-detail-dialog fixed-body-dialog"
      :show-close="false"
      :close-on-click-modal="true"
      append-to-body
      align-center
      destroy-on-close
  >
    <div class="bill-page">

      <!-- 手机状态栏 -->
      <div class="status-bar">
        <div class="status-left">
          <span class="time">{{ currentTime }}</span>
        </div>

        <div class="status-right">
          <!-- WiFi -->
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
                d="M2 8C7.5 3 16.5 3 22 8"
                stroke="#555"
                stroke-width="2.6"
                fill="none"
                stroke-linecap="round"
            />
            <path
                d="M5.5 12C9 9 15 9 18.5 12"
                stroke="#555"
                stroke-width="2.6"
                fill="none"
                stroke-linecap="round"
            />
            <path
                d="M9 16C11 14.5 13 14.5 15 16"
                stroke="#555"
                stroke-width="2.6"
                fill="none"
                stroke-linecap="round"
            />
            <circle cx="12" cy="19" r="1.5" fill="#555"/>
          </svg>

          <!-- 电池：充电中 -->
          <div class="battery charging">
            <div class="battery-fill"></div>

            <!-- 充电闪电 -->
            <svg
                class="battery-lightning"
                width="11"
                height="13"
                viewBox="0 0 12 16"
                xmlns="http://www.w3.org/2000/svg"
            >
              <path
                  d="M7 0L1 9H5L4 16L11 6H7L7 0Z"
                  fill="#fff"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- 标题 -->
      <div class="page-header">
        <div class="back-btn" @click="visible = false">
          <svg width="25" height="25" viewBox="0 0 24 24">
            <path
                d="M15 3L6 12L15 21"
                stroke="#333"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
          </svg>
        </div>

        <span>账单详情</span>
      </div>

      <!-- 中间内容：独立滚动，状态栏和标题保持固定 -->
      <div class="bill-scroll-content">
      <!-- 账单主体 -->
      <div class="bill-card">

        <!-- 商家图标 -->
        <div class="merchant-logo">
          <img
              v-if="bill.merchantIcon"
              :src="bill.merchantIcon"
              class="merchant-image"
              alt="商家图标"
          />
        </div>

        <div class="merchant-name">
          {{ bill.merchantName }}
        </div>

        <div class="amount">
          {{ formatAmount }}
        </div>

        <div class="trade-status">
          交易成功
        </div>

        <!-- 交易信息 -->
        <div class="bill-info">

          <div v-if="bill.showOrderAmount" class="info-row">
            <span class="label">订单金额</span>
            <span class="value">{{ bill.amount.toFixed(2) }}</span>
          </div>

          <div class="info-row">
            <span class="label">支付时间</span>
            <span class="value">{{ bill.payTime }}</span>
          </div>

          <div class="info-row payment-row">
            <span class="label">付款方式</span>

            <span class="value payment-value">
              <span>账户余额</span>
              <span class="arrow">›</span>
            </span>
          </div>

          <div class="info-row">
            <span class="label">商品说明</span>
            <span class="value">{{ bill.productDesc }}</span>
          </div>

          <div class="info-row">
            <span class="label">收款方全称</span>
            <span class="value">{{ bill.payeeName }}</span>
          </div>

          <div class="info-row">
            <span class="label">订单号</span>
            <span class="value order-number">
              {{ bill.orderNo }}
            </span>
          </div>

          <div class="info-row">
            <span class="label">商家订单号</span>
            <span class="value order-number">
              {{ bill.merchantOrderNo }}
            </span>
          </div>

        </div>
      </div>

      <!-- 账单管理 -->
      <div class="manage-card">

        <div class="manage-header">
          <span class="manage-title">账单管理</span>

<!--          <div class="manage-tip">-->
<!--            <span class="tip-icon">▣</span>-->
<!--            <span>本月文化休闲是最大支出类目，看看花在哪里了</span>-->
<!--            <span class="tip-arrow">›</span>-->
<!--          </div>-->
        </div>

        <!-- 分类 -->
        <div class="manage-row">
          <span>账单分类</span>

          <div class="manage-value">
            <span>文化休闲</span>
            <span class="arrow">›</span>
          </div>
        </div>

        <!-- 标签 -->
        <div class="manage-row tag-row">
          <span>标签</span>

          <div class="tags">
             <span v-if="bill.showGameRecharge" class="tag">
              🎮 游戏充值
            </span>

<!--            <span class="tag" v-if="bill.tag">-->
<!--              🏷️ {{ bill.tag }}-->
<!--            </span>-->
            <span class="tag" v-if="bill.tag">
              {{ bill.tag }}
            </span>

            <span class="arrow">›</span>
          </div>
        </div>

      </div>
      </div>

    </div>
  </el-dialog>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },

  // 账单详情数据
  billData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

// 账单数据
const bill = computed(() => ({
  merchantIcon: props.billData?.merchantIcon || '',
  merchantName: props.billData?.merchantName || '',
  amount: props.billData?.amount ?? 0,
  payTime: props.billData?.payTime || '',
  productDesc: props.billData?.productDesc || '',
  payeeName: props.billData?.payeeName || '',
  orderNo: props.billData?.orderNo || '',
  merchantOrderNo: props.billData?.merchantOrderNo || '',
  tag: props.billData?.tag || '',
  showOrderAmount: props.billData?.showOrderAmount ?? false,
  showGameRecharge: props.billData?.showGameRecharge ?? true,
}))

// 支付金额格式化
const formatAmount = computed(() => {
  const amount = Number(bill.value.amount)

  if (!Number.isFinite(amount)) {
    return '-0.00'
  }

  return `-${Math.abs(amount).toFixed(2)}`
})

// 当前时间
const currentTime = ref('')

const updateTime = () => {
  const now = new Date()

  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  currentTime.value = `${hours}:${minutes}`
}

let timer = null

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 60 * 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>

/* 整个手机页面 */
.bill-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f5f5;
  padding: 0 13px 0;
  box-sizing: border-box;
  color: #333;
  font-family:
      -apple-system,
      BlinkMacSystemFont,
      "PingFang SC",
      "Microsoft YaHei",
      sans-serif;
}

/* 状态栏 */
.status-bar {
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.time {
  font-size: 17px;
  font-weight: 500;
}

.status-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 信号 */
.signal {
  display: flex;
  align-items: flex-end;
  height: 16px;
  gap: 2px;
}

.signal i {
  width: 3px;
  background: #555;
  border-radius: 1px;
}

.signal i:nth-child(1) { height: 5px; }
.signal i:nth-child(2) { height: 8px; }
.signal i:nth-child(3) { height: 12px; }
.signal i:nth-child(4) { height: 15px; }

/* =========================
   电池：充电中
   ========================= */

.battery {
  width: 27px;
  height: 13px;
  border: 1.5px solid #555;
  border-radius: 4px;
  position: relative;
  padding: 2px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 电池右侧凸起 */
.battery::after {
  content: '';
  position: absolute;
  right: -4px;
  top: 3px;
  width: 2px;
  height: 6px;
  background: #555;
  border-radius: 0 2px 2px 0;
}

/* 绿色电量 */
.battery-fill {
  position: absolute;
  left: 2px;
  top: 2px;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  background: #555;
  border-radius: 1px;
}

/* 白色充电闪电 */
.battery-lightning {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.12));
}

/* 页面标题 */
.page-header {
  height: 58px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 23px;
  margin-bottom: 8px;
}

.back-btn {
  display: flex;
  align-items: center;
  cursor: pointer;
}

/* 主账单 */
.bill-card {
  /* 弹窗在暗黑模式下也固定浅色，不跟随全局深色变量 */
  background: #ffffff;
  border-radius: 15px;
  padding: 24px 13px 27px;
  text-align: center;
}

.merchant-image {
  width: 65px;
  height: 65px;
  object-fit: contain;
  border-radius: 50%;
}

/* 商家图标 */
.merchant-icon {
  width: 47px;
  height: 47px;
  background: #f4511e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 17px;
}

.merchant-name {
  font-size: 17px;
  margin-bottom: 13px;
}

.amount {
  font-size: 37px;
  font-weight: 600;
  line-height: 1.4;
}

.trade-status {
  font-size: 17px;
  margin-top: 3px;
  margin-bottom: 29px;
}

/* 交易字段 */
.bill-info {
  text-align: left;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 18px;
  font-size: 14.5px;
  line-height: 1.5;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  width: 102px;
  flex: 0 0 108px;
  color: #999;
}

.value {
  flex: 1;
  min-width: 0;
  color: #333;
  overflow-wrap: anywhere;
}

/* 付款方式整行对齐 */
.payment-row {
  align-items: center;
}

/* 账户余额和箭头对齐 */
.payment-value {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 箭头 */
.payment-value .arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
  //margin-left: 0;
  height: 24px;
  margin-top: -4px;
}

.order-number {
  font-size: 14px;
  letter-spacing: 0.7px;
}

.arrow {
  color: #aaa;
  font-size: 20px;
  font-weight: 300;
  margin-left: 4px;
}

/* 账单管理 */
.manage-card {
  margin-top: 10px;
  /* 弹窗在暗黑模式下也固定浅色，不跟随全局深色变量 */
  background: #ffffff;
  border-radius: 15px 15px 0 0;
  padding: 16px 13px 11px;
}

.manage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 17px;
}

.manage-title {
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.manage-tip {
  /* 固定浅橙底深橙字，避免暗黑主题下变成金底暗纹 */
  background: #fff4ea;
  border-radius: 20px;
  color: #b84f05;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 8px 9px;
  font-size: 10px;
  white-space: nowrap;
}

.tip-icon {
  font-size: 12px;
}

.tip-arrow {
  font-size: 17px;
}

.manage-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 47px;
  font-size: 15px;
}

.manage-value {
  display: flex;
  align-items: center;
  color: #999;
}

.tag-row {
  border-top: 1px solid #f5f5f5;
  padding-top: 8px;
}

.tags {
  display: flex;
  align-items: center;
  gap: 5px;
}

.tag {
  background: #f0f2f7;
  border-radius: 20px;
  padding: 7px 9px;
  font-size: 11px;
  white-space: nowrap;
  color: #555;
}

</style>

<style>
/* 去掉 Element Plus 默认弹窗内边距与标题 */
.bill-detail-dialog.el-dialog {
  height: calc(100vh - 48px);
  height: calc(100dvh - 48px);
  max-height: calc(100vh - 48px);
  max-height: calc(100dvh - 48px);
  margin: auto !important;
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

.bill-detail-dialog .el-dialog__header {
  display: none !important;
}

.bill-detail-dialog .el-dialog__body {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden !important;
  padding: 0 !important;
}

.bill-scroll-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
</style>