<template>
  <div class="notify-center" v-loading="loading">
    <div class="notify-toolbar">
      <el-checkbox v-model="onlyUnread" class="only-unread">仅看未读</el-checkbox>

      <div class="toolbar-right">
        <span v-if="unreadCount" class="total-unread">未读 {{ unreadCount }} 条</span>
        <!-- <el-button size="small" @click="notify.clearBubbles">清空气泡</el-button>
        <el-button
          size="small"
          type="primary"
          :disabled="!unreadCount"
          @click="notify.markAllRead"
        >
          全部已读
        </el-button> -->
      </div>
    </div>

    <div v-if="filtered.length" class="notify-list">
      <div
        v-for="item in filtered"
        :key="item.id"
        class="notify-item"
        :class="{ unread: !item.read }"
        @click="handleView(item)"
      >
        <div class="item-body">
          <div class="item-head">
            <span v-if="!item.read" class="unread-dot" title="未读" />
            <strong class="item-title">{{ item.title }}</strong>
            <span v-if="item.sceneLabel" class="scene-tag" :class="{ 'scene-danger': item.scene === 'ALIPAY_BALANCE', 'scene-warning': item.scene === 'ALIPAY_BALANCE_LOW' }">{{ item.sceneLabel }}</span>
            <span class="item-time">{{ relativeTime(item) }}</span>
          </div>

          <p class="item-content">{{ item.content || '暂无消息内容' }}</p>

          <div v-if="metaText(item)" class="item-meta">
            {{ metaText(item) }}
          </div>

          <div v-if="item.mentions?.length" class="mentions">
            <span v-for="mention in item.mentions" :key="mention" class="mention-chip">
              @{{ mention }}
            </span>
          </div>
        </div>

        <el-button size="small" type="primary" @click.stop="handleView(item)">
          查看
        </el-button>
      </div>
    </div>

    <div ref="sentinelRef" class="list-sentinel">
      <span v-if="loadingMore">正在加载更多…</span>
      <span v-else-if="!hasMore && listTotal > 0">没有更多了</span>
    </div>

    <el-empty
      v-if="!filtered.length"
      :description="onlyUnread ? '暂无未读通知' : '暂无通知'"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotifyStore } from '@/stores/notify';

const notify = useNotifyStore();
const router = useRouter();
const route = useRoute();

const onlyUnread = ref(false);
const loading = ref(false);
const loadingMore = ref(false);
const sentinelRef = ref(null);
let observer = null;

const filtered = computed(() =>
  onlyUnread.value ? notify.items.filter((item) => !item.read) : notify.items
);

const unreadCount = computed(() => notify.unreadCount);
const hasMore = computed(() => notify.hasMore);
const listTotal = computed(() => notify.listTotal);

function metaText(item) {
  return [
    item.merchantOrderNo,
    item.orderId,
    item.subOrderId,
    item.username,
    item.account,
    item.amount ? `¥${item.amount}` : ''
  ]
    .filter(Boolean)
    .join(' · ');
}

/** 参考通知页使用相对时间；解析失败时回退展示原始时间。 */
function relativeTime(item) {
  const raw = item.timeText || item.time || '';
  if (!raw) return '';

  const then = new Date(String(raw).replace(/-/g, '/')).getTime();
  if (Number.isNaN(then)) return raw;

  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);

  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}小时前`;

  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}天前`;

  return String(raw).slice(0, 10);
}

async function loadList() {
  loading.value = true;
  loadingMore.value = false;
  try {
    await notify.fetchList({ unread_only: onlyUnread.value }, false);
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (loading.value || loadingMore.value || !notify.hasMore) return;
  loadingMore.value = true;
  try {
    await notify.fetchList({ unread_only: onlyUnread.value }, true);
  } finally {
    loadingMore.value = false;
  }
}

async function handleView(item) {
  await notify.markRead(item.id);
  router.push(notify.resolveItemTarget(item));
}

function reportPageStatus(active) {
  if (window.notifyBridge?.reportPageStatus) {
    window.notifyBridge.reportPageStatus(active);
  }
}

onMounted(() => {
  reportPageStatus(true);
  loadList();
  if (route.query.id) notify.markRead(route.query.id);

  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) loadMore();
  }, { rootMargin: '120px' });

  if (sentinelRef.value) observer.observe(sentinelRef.value);
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
  reportPageStatus(false);
});

watch(onlyUnread, () => {
  loadList();
});

watch(() => route.query.id, (id) => {
  if (id) notify.markRead(id);
});
</script>

<style scoped>
.notify-center {
  max-width: 960px;
  margin: 0 auto;
  padding: 26px 30px 44px;
  box-sizing: border-box;
}

.notify-toolbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding: 13px 16px;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 13px;
  box-shadow: 0 8px 26px rgba(49, 86, 153, 0.055);
}

.only-unread {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.total-unread {
  font-size: 12px;
  font-weight: 600;
  color: #d92d20;
}

.notify-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-sentinel {
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0 4px;
  font-size: 12px;
  color: var(--app-text-muted);
}

.notify-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 15px 16px;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 13px;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.notify-item:hover {
  border-color: var(--app-accent-border);
  box-shadow: 0 8px 26px rgba(49, 86, 153, 0.08);
  transform: translateY(-1px);
}

.notify-item.unread {
  background: var(--app-bg-subtle);
  border-left: 3px solid var(--app-accent);
}

.item-body {
  flex: 1;
  min-width: 0;
}

.item-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.14);
}

.item-title {
  font-size: 14px;
  color: var(--app-text-primary);
}

.scene-tag {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #d97706;
  background: rgba(217, 119, 6, 0.12);
}

/* 余额类通知按 scene 区分：预警橙、余额不足红（后者会拦单，更严重） */
.scene-tag.scene-warning { color: #d97706; background: rgba(217, 119, 6, 0.12); }
.scene-tag.scene-danger { color: var(--el-color-danger); background: rgba(220, 38, 38, 0.14); }

.item-time {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--app-text-muted);
  font-variant-numeric: tabular-nums;
}

.item-content {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--app-text-secondary);
  word-break: break-all;
}

.item-meta {
  margin-top: 8px;
  font-size: 12px;
  color: var(--app-text-muted);
}

.mentions {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.mention-chip {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #b45309;
  background: #fef3c7;
}

html.dark .mention-chip {
  background: rgba(245, 158, 11, 0.14);
  color: #fbbf24;
}

.notify-center :deep(.el-empty) {
  padding: 48px 0;
}

@media (max-width: 700px) {
  .notify-center {
    padding: 20px 14px 30px;
  }

  .notify-toolbar {
    top: 60px;
  }
}
</style>
