<template>
  <div class="recharge-tool-page">

    <div class="tool-card">
      <div class="tool-header">
        <div class="header-text">
          <h1>充值档位匹配</h1>
          <p>选择平台，输入数量，自动匹配最优档位</p>
        </div>
        <div class="tool-back">
          <el-button class="app-back-btn" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </div>

      <!-- 平台 -->
      <div class="field">
        <label>平台</label>
        <div class="platform-group">
          <button
              class="platform-btn"
              :class="{ active: currentFlag === 'soul' }"
              @click="selectPlatform('soul')"
          >
            Soul
          </button>
          <button
              class="platform-btn"
              :class="{ active: currentFlag === 'eggie' }"
              @click="selectPlatform('eggie')"
          >
            蛋仔派对
          </button>
          <button
              class="platform-btn"
              :class="{ active: currentFlag === 'klmb' }"
              @click="selectPlatform('klmb')"
          >
            克拉漫播
          </button>
          <button
              class="platform-btn"
              :class="{ active: currentFlag === 'taqu' }"
              @click="selectPlatform('taqu')"
          >
            他趣
          </button>
          <button
              class="platform-btn"
              :class="{ active: currentFlag === 'd5rg' }"
              @click="selectPlatform('d5rg')"
          >
            第五人格
          </button>

          <button
              class="platform-btn"
              :class="{ active: currentFlag === 'mhxy' }"
              @click="selectPlatform('mhxy')"
          >
            梦幻西游
          </button>

          <button
              class="platform-btn"
              :class="{ active: currentFlag === 'yjwj_c' }"
              @click="selectPlatform('yjwj_c')"
          >
            永劫无间-直充
          </button>

          <button
              class="platform-btn"
              :class="{ active: currentFlag === 'yjwj_m' }"
              @click="selectPlatform('yjwj_m')"
          >
            永劫无间-手游
          </button>

          <button
              class="platform-btn"
              :class="{ active: currentFlag === 'dhxy_m' }"
              @click="selectPlatform('dhxy_m')"
          >
            大话手游
          </button>

        </div>
      </div>

      <!-- 金额 -->
      <div class="field">
        <label>数量</label>
        <el-input
            v-model="numInput"
            type="number"
            placeholder="请输入数量，如 24"
            @keyup.enter="handleCalc"
        />
      </div>

      <el-button
          type="primary"
          class="calc-btn"
          @click="handleCalc"
      >
        计算
      </el-button>

      <!-- 结果 -->
      <div
          v-if="result.visible"
          class="result"
          :class="result.success ? 'ok' : 'fail'"
      >
        <template v-if="result.success">
          <div class="result-title">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>匹配成功</span>
          </div>

          <div class="result-row">
            <span class="label">平台</span>
            <span class="val">{{ platformName }}</span>
          </div>
          <div class="result-row">
            <span class="label">输入数量</span>
            <span class="val">{{ result.num }}</span>
          </div>
          <div class="result-row">
            <span class="label">匹配档位</span>
            <span class="val">
              {{ result.faceValue }}
              <span v-if="result.isMultiple" class="badge">1元为倍数</span>
            </span>
          </div>
          <div class="result-row">
            <span class="label">充值次数</span>
            <span class="val">{{ result.count }} 次</span>
          </div>
          <div class="result-row">
            <span class="label">验算</span>
            <span class="val">
              {{ result.faceValue }} 对应 {{ result.amount }} × {{ result.count }}
            </span>
          </div>
        </template>

        <template v-else>
          <div class="result-title">
            <el-icon><CircleCloseFilled /></el-icon>
            <span>无法匹配</span>
          </div>

          <div class="result-row">
            <span class="label">平台</span>
            <span class="val">{{ platformName }}</span>
          </div>
          <div class="result-row">
            <span class="label">输入数量</span>
            <span class="val">{{ result.num }}</span>
          </div>
          <div class="result-row">
            <span class="label">说明</span>
            <span class="val">
              {{ result.reason || '没有任何档位能在最大次数内整除该金额' }}
            </span>
          </div>
        </template>
      </div>

      <!-- 规则说明 -->
      <div class="rules">
        <div class="rules-title">
          {{ ruleTitle }}（从大到小匹配）
        </div>

        <div class="rule-row rule-head">
          <span>档位标识</span>
          <span>金额 × 最大次数</span>
        </div>

        <div
            v-for="r in currentRules"
            :key="r.faceValue"
            class="rule-row"
        >
          <span>{{ r.faceValue }}</span>
          <span>{{ r.amount }} × {{ r.maxCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  CircleCheckFilled,
  CircleCloseFilled,
} from '@element-plus/icons-vue'

const router = useRouter()

function goBack() {
  router.back()
}

/* ==================================================
   档位规则
   ================================================== */
const RECHARGE_RULES = {
  soul: [
    { faceValue: '36',     amount: 6,     maxCount: 10 },
    { faceValue: '108',    amount: 18,    maxCount: 10 },
    { faceValue: '213',    amount: 32,    maxCount: 10 },
    { faceValue: '564',    amount: 80,    maxCount: 10 },
    { faceValue: '2436',   amount: 330,   maxCount: 10 },
    { faceValue: '5319',   amount: 670,   maxCount: 10 },
    { faceValue: '12817',  amount: 1580,  maxCount: 10 },
    { faceValue: '24263',  amount: 2970,  maxCount: 10 },
    { faceValue: '49011',  amount: 5800,  maxCount: 10 },
    { faceValue: '92300',  amount: 10400, maxCount: 10 },
    { faceValue: '272285', amount: 30666, maxCount: 10 },
  ],
  eggie: [
    { faceValue: '蛋币-6480', amount: 648, maxCount: 10 },
    { faceValue: '蛋币-3280', amount: 328, maxCount: 10 },
    { faceValue: '蛋币-1980', amount: 198, maxCount: 10 },
    { faceValue: '蛋币-1280', amount: 128, maxCount: 10 },
    { faceValue: '蛋币-680',  amount: 68,  maxCount: 10 },
    { faceValue: '蛋币-300',  amount: 30,  maxCount: 10 },
    { faceValue: '蛋币-60',   amount: 6,   maxCount: 10 },
    { faceValue: '蛋币-10',   amount: 1,   maxCount: 99 },
  ],
  klmb: [
    { faceValue: '4999800', amount: 49998, maxCount: 10 },
    { faceValue: '999800',  amount: 9998,  maxCount: 10 },
    { faceValue: '299800',  amount: 2998,  maxCount: 10 },
    { faceValue: '99800',   amount: 998,   maxCount: 10 },
    { faceValue: '51800',   amount: 518,   maxCount: 10 },
    { faceValue: '9800',    amount: 98,    maxCount: 10 },
    { faceValue: '3000',    amount: 30,    maxCount: 10 },
    { faceValue: '1200',    amount: 12,    maxCount: 10 },
    { faceValue: '600',     amount: 6,     maxCount: 10 },
    { faceValue: '100',     amount: 1,     maxCount: 6  },
  ],
  // 👇 他趣：普通档位，无智能兜底
  taqu: [
    { faceValue: '119800', amount: 1198, maxCount: 10 },
    { faceValue: '58800',  amount: 588,  maxCount: 10 },
    { faceValue: '29800',  amount: 298,  maxCount: 10 },
    { faceValue: '9800',   amount: 98,   maxCount: 10 },
    { faceValue: '3000',   amount: 30,   maxCount: 10 },
    { faceValue: '900',    amount: 9,    maxCount: 10 },
    { faceValue: '600',    amount: 6,    maxCount: 10 },
  ],

  d5rg: [
    { faceValue: '6480回声', amount: 648, maxCount: 10 },
    { faceValue: '3280回声', amount: 328, maxCount: 10 },
    { faceValue: '1980回声', amount: 198, maxCount: 10 },
    { faceValue: '1280回声', amount: 128, maxCount: 10 },
    { faceValue: '680回声',  amount: 68,  maxCount: 10 },
    { faceValue: '300回声',  amount: 30,  maxCount: 10 },
    { faceValue: '60回声',   amount: 6,   maxCount: 10 },
    { faceValue: '10回声',   amount: 1,   maxCount: 6 },
  ],

  mhxy: [
    { faceValue: '64980仙玉', amount: 6498, maxCount: 99 },
    { faceValue: '32980仙玉', amount: 3298, maxCount: 99 },
    { faceValue: '12980仙玉', amount: 1298, maxCount: 99 },
    { faceValue: '6480仙玉', amount: 648, maxCount: 99 },
    { faceValue: '4880仙玉',  amount: 488,  maxCount: 99 },
    { faceValue: '2980仙玉',  amount: 298,  maxCount: 99 },
    { faceValue: '1980仙玉',   amount: 198,   maxCount: 99 },
    { faceValue: '980仙玉',   amount: 98,   maxCount: 99 },
    { faceValue: '500仙玉',   amount: 50,   maxCount: 99 },
    { faceValue: '300仙玉',   amount: 30,   maxCount: 99 },
    { faceValue: '60仙玉',   amount: 6,   maxCount: 99 },
  ],

  yjwj_c: [
    { faceValue: '12960金块', amount: 648, maxCount: 100 },
    { faceValue: '6000金块', amount: 300, maxCount: 99 },
    { faceValue: '3000金块', amount: 150, maxCount: 99 },
    { faceValue: '1200金块', amount: 60, maxCount: 100 },
    { faceValue: '120金块', amount: 6, maxCount: 99 },
  ],

  yjwj_m: [
    { faceValue: '6480元宝', amount: 648, maxCount: 9999 },
    { faceValue: '3000元宝', amount: 300, maxCount: 9999 },
    { faceValue: '1500元宝', amount: 150, maxCount: 9999 },
    { faceValue: '600元宝', amount: 60, maxCount: 9999 },
    { faceValue: '60元宝', amount: 6, maxCount: 9999 },
  ],

  dhxy_m: [
    { faceValue: '一整车仙玉', amount: 6498, maxCount: 20 },
    { faceValue: '一大车仙玉', amount: 3298, maxCount: 40 },
    { faceValue: '一整箱仙玉', amount: 1298, maxCount: 99 },
    { faceValue: '一大箱仙玉', amount: 648, maxCount: 100 },
    { faceValue: '一大堆仙玉', amount: 328, maxCount: 100 },
    { faceValue: '一大袋仙玉', amount: 198, maxCount: 100 },
    { faceValue: '一小袋仙玉', amount: 98, maxCount: 98 },
    { faceValue: '一大包仙玉', amount: 30, maxCount: 100 },
    { faceValue: '一小包仙玉', amount: 6, maxCount: 100 },
  ],
}

/* ==================================================
   状态
   ================================================== */
const currentFlag = ref('soul')
const numInput = ref('')

const result = ref({
  visible: false,
  success: false,
  num: 0,
  faceValue: '',
  amount: 0,
  count: 0,
  isMultiple: false,
  reason: '',
})

/* ==================================================
   计算属性
   ================================================== */
const currentRules = computed(() => RECHARGE_RULES[currentFlag.value] || [])

const ruleTitle = computed(() => {
  switch (currentFlag.value) {
    case 'soul':   return 'Soul 档位'
    case 'eggie':  return '蛋仔档位'
    case 'klmb':   return '克拉漫播档位'
    case 'taqu':   return '他趣档位'
    case 'd5rg':   return '第五人格档位'
    case 'mhxy':   return '梦幻西游档位'
    case 'yjwj_c': return '永劫无间-直充档位'
    case 'yjwj_m': return '永劫无间-手游档位'
    case 'dhxy_m': return '大话手游档位'
    default:       return '档位'
  }
})

const platformName = computed(() => {
  switch (currentFlag.value) {
    case 'soul':   return 'Soul'
    case 'eggie':  return '蛋仔派对'
    case 'klmb':   return '克拉漫播'
    case 'taqu':   return '他趣'
    case 'd5rg':   return '第五人格'
    case 'mhxy':   return '梦幻西游'
    case 'yjwj_c': return '永劫无间-直充'
    case 'yjwj_m': return '永劫无间-手游'
    case 'dhxy_m': return '大话手游'
    default:       return ''
  }
})

/* ==================================================
   算法（与 Go 版本一致，所有平台统一）
   ================================================== */
function getRechargeRule(flag, num) {
  if (num <= 0) {
    return { success: false }
  }

  const items = RECHARGE_RULES[flag]
  if (!items) {
    return { success: false, reason: '未知平台' }
  }

  for (const rule of items) {
    if (num % rule.amount !== 0) continue

    const count = num / rule.amount
    if (count > rule.maxCount) continue

    return {
      success: true,
      faceValue: rule.faceValue,
      amount: rule.amount,
      count: count,
      isMultiple: rule.amount === 1 && count > 1,
    }
  }

  return { success: false }
}

/* ==================================================
   交互
   ================================================== */
function selectPlatform(flag) {
  currentFlag.value = flag
  result.value.visible = false
}

function handleCalc() {
  const num = parseInt(numInput.value, 10)

  if (isNaN(num) || num <= 0) {
    result.value = {
      visible: true,
      success: false,
      num: numInput.value,
      reason: '请输入一个大于 0 的整数',
    }
    return
  }

  const res = getRechargeRule(currentFlag.value, num)

  if (res.success) {
    result.value = {
      visible: true,
      success: true,
      num,
      faceValue: res.faceValue,
      amount: res.amount,
      count: res.count,
      isMultiple: res.isMultiple,
      reason: '',
    }
  } else {
    result.value = {
      visible: true,
      success: false,
      num,
      reason: res.reason || '没有任何档位能在最大次数内整除该金额',
    }
  }
}
</script>

<style scoped>
/* ==================================================
   页面容器
   ================================================== */
.recharge-tool-page {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 4px 0;
}

/* ==================================================
   卡片
   ================================================== */
.tool-card {
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 16px;
  padding: 26px 26px 22px;
  box-shadow: 0 8px 28px rgba(20, 30, 50, .08);
}

/* ==================================================
   头部
   ================================================== */
.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.header-text {
  min-width: 0;
}

.tool-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
  color: var(--app-text-primary);
}

.tool-header p {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

.tool-back {
  flex-shrink: 0;
}

/* ==================================================
   字段
   ================================================== */
.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 12px;
  color: var(--app-text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
}

/* ==================================================
   平台按钮
   ================================================== */
.platform-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.platform-btn {
  flex: 1;
  min-width: 100px;
  height: 42px;
  border: 1.5px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-bg-elevated);
  font-size: 14px;
  color: var(--app-text-secondary);
  cursor: pointer;
  transition: all .2s;
  font-weight: 500;
}

.platform-btn:hover {
  border-color: var(--app-accent-border);
  background: var(--app-bg-subtle);
}

.platform-btn.active {
  border-color: var(--app-accent);
  background: var(--app-bg-subtle);
  color: var(--app-accent);
  font-weight: 600;
}

/* ==================================================
   计算按钮
   ================================================== */
.calc-btn {
  width: 100%;
  height: 42px;
  margin-top: 4px;
}

/* ==================================================
   结果
   ================================================== */
.result {
  margin-top: 20px;
  border-radius: 12px;
  padding: 16px 18px;
  font-size: 13px;
  line-height: 1.9;
}

.result.ok {
  background: var(--app-bg-subtle);
  border: 1px solid #b7e4c7;
  color: #1b4332;
}

.result.fail {
  background: #fff5f5;
  border: 1px solid #ffc9c9;
  color: #c92a2a;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.result.ok .result-title {
  color: #16a34a;
}

.result.fail .result-title {
  color: #dc2626;
}

.result-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 2px 0;
}

.result-row .label {
  flex-shrink: 0;
  min-width: 68px;
  color: var(--app-text-secondary);
}

.result-row .val {
  font-weight: 600;
  word-break: break-all;
}

.badge {
  display: inline-block;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 20px;
  background: var(--app-accent);
  color: #fff;
  margin-left: 6px;
  vertical-align: 1px;
  font-weight: 500;
}

/* ==================================================
   规则说明
   ================================================== */
.rules {
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px dashed #eee;
  font-size: 12px;
  color: var(--app-text-muted);
  line-height: 1.9;
}

.rules-title {
  font-weight: 600;
  color: var(--app-text-secondary);
  margin-bottom: 6px;
}

.rule-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}

.rule-head {
  color: var(--app-text-muted);
  font-size: 11px;
  padding-bottom: 4px;
  margin-bottom: 2px;
  border-bottom: 1px solid var(--app-border);
}

.rule-row span:first-child {
  color: var(--app-text-secondary);
}

.rule-row span:last-child {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

html.dark .result.ok {
  border-color: rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

html.dark .result.fail {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}
</style>