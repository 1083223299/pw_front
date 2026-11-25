<template>
  <!-- 全局「回到顶部」：仅在页面级内容下滚较深时出现，位于右下角 -->
  <transition name="backtop">
    <button
      v-if="visible"
      class="back-to-top"
      type="button"
      aria-label="回到顶部"
      title="回到顶部"
      @click="handleBackToTop"
    >
      <el-icon><Top /></el-icon>
    </button>
  </transition>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Top } from '@element-plus/icons-vue'

const route = useRoute()
const visible = ref(false)

// 见过的页面级滚动容器（Electron 下是 .main-content，Web 下是整页，个别页面自带滚动区）
const pageScrollers = []
let rafId = 0

/* ---------- 阈值 ---------- */
// 出现阈值：至少 320px，屏幕越高要求滚得更多，避免刚滑一下就弹按钮
function getThreshold() {
  return Math.max(320, Math.round(window.innerHeight * 0.42))
}

/* ---------- 判定「页面级」滚动容器 ---------- */
// 用高度和可滚余量两个条件，把下拉框、弹窗里的小列表排除掉
function isPageScroller(el) {
  if (!el || el.nodeType !== 1 || el === document.body) return false
  if (el.clientHeight < window.innerHeight * 0.32) return false
  return el.scrollHeight - el.clientHeight > 200
}

function trackScroller(el) {
  if (!pageScrollers.includes(el)) {
    pageScrollers.unshift(el)
    if (pageScrollers.length > 4) pageScrollers.length = 4
  }
}

/* ---------- 读取当前滚动深度 ---------- */
function readScrollTop() {
  const docTop = Math.max(
    window.scrollY || 0,
    document.documentElement.scrollTop || 0,
    document.body ? document.body.scrollTop : 0
  )
  let top = docTop
  pageScrollers.forEach((el) => {
    if (el && el.isConnected) top = Math.max(top, el.scrollTop || 0)
  })
  return top
}

function evaluate() {
  rafId = 0
  visible.value = readScrollTop() > getThreshold()
}

// scroll 事件高频，用 requestAnimationFrame 合并成每帧一次
function scheduleEvaluate() {
  if (rafId) return
  rafId = requestAnimationFrame(evaluate)
}

/* ---------- 监听 ---------- */
// scroll 事件不冒泡，但在捕获阶段挂到 document 上能收到任意容器的滚动
function handleScroll(event) {
  const target = event.target
  if (target && isPageScroller(target)) trackScroller(target)
  scheduleEvaluate()
}

function handleResize() {
  scheduleEvaluate()
}

/* ---------- 回到顶部 ---------- */
function handleBackToTop() {
  // 尊重系统「减少动态效果」设置
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

  window.scrollTo({ top: 0, behavior })

  pageScrollers.forEach((el) => {
    if (el && el.isConnected) el.scrollTo({ top: 0, behavior })
  })

  // 平滑滚动结束后兜底复核一次，避免内容不足时按钮残留
  window.setTimeout(evaluate, 420)
}

/* ---------- 生命周期 ---------- */
onMounted(() => {
  document.addEventListener('scroll', handleScroll, { capture: true, passive: true })
  window.addEventListener('resize', handleResize)
  // 刷新或回到页面时可能已有滚动位置，先算一次
  nextTick(evaluate)
})

onBeforeUnmount(() => {
  document.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleResize)
  if (rafId) cancelAnimationFrame(rafId)
})

// 切换页面后旧容器已卸载，清空记录并重新评估，避免按钮残留
function resetAfterRouteChange() {
  pageScrollers.length = 0
  nextTick(() => {
    evaluate()
    // 新页面可能挂载后才有滚动区，再补一次
    window.setTimeout(evaluate, 260)
  })
}

watch(() => route.fullPath, resetAfterRouteChange)
</script>

<style scoped>
.back-to-top {
  position: fixed;
  right: 26px;
  /* 避开页脚文案，也不压住内容底部的操作按钮 */
  bottom: 74px;
  z-index: 1200;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-bg-elevated);
  color: var(--app-accent);
  font-size: 17px;
  cursor: pointer;
  box-shadow: var(--app-shadow);
  backdrop-filter: blur(10px);
  transition: background 0.18s, border-color 0.18s, transform 0.18s;
}

.back-to-top:hover {
  border-color: var(--app-accent-border);
  background: var(--app-accent-soft);
  transform: translateY(-2px);
}

.back-to-top:active {
  transform: translateY(0);
}

.back-to-top:focus-visible {
  outline: 2px solid var(--app-accent);
  outline-offset: 2px;
}

/* 出现 / 消失的淡入上移 */
.backtop-enter-active,
.backtop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.backtop-enter-from,
.backtop-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 700px) {
  .back-to-top {
    right: 14px;
    bottom: 58px;
    width: 38px;
    height: 38px;
  }
}
</style>
