<template>
  <Teleport to="body">
    <div class="notify-bubble-host">
      <TransitionGroup name="bubble">
        <div
          v-for="bubble in notify.bubbles"
          :key="bubble.id"
          class="notify-bubble"
          :class="`is-${bubble.type}`"
          @click="openList(bubble)"
        >
          <div class="bubble-icon">{{ iconText(bubble.type) }}</div>

          <div class="bubble-body">
            <div class="bubble-head">
              <strong class="bubble-title">{{ bubble.title }}</strong>
              <span class="bubble-time">{{ formatTime(bubble.time) }}</span>
            </div>
            <p class="bubble-content">{{ bubble.content }}</p>
            <div v-if="bubble.mentions?.length" class="bubble-mentions">
              <span v-for="mention in bubble.mentions" :key="mention" class="mention-chip">@{{ mention }}</span>
            </div>
          </div>

          <span
            class="bubble-close"
            title="关闭"
            @click.stop="closeBubble(bubble.id)"
          >
            ×
          </span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useNotifyStore, NOTIFY_TYPE } from '@/stores/notify';

const notify = useNotifyStore();
const router = useRouter();

function iconText(type) {
  if (type === NOTIFY_TYPE.ORDER) return '单';
  if (type === NOTIFY_TYPE.HANDOVER) return '交';
  return '告';
}

function formatTime(time) {
  if (!time || typeof time !== 'string') return '';
  return time.slice(11, 19);
}

async function openList(bubble) {
  await notify.markRead(bubble.id);
  notify.dismissBubble(bubble.id);
  router.push(notify.resolveItemTarget(bubble));
}

function closeBubble(id) {
  notify.dismissBubble(id);
}
</script>

<style scoped>
.notify-bubble-host {
  position: fixed;
  top: 68px;
  right: 18px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.notify-bubble {
  pointer-events: auto;
  width: 350px;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 13px 15px;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-card-border);
  border-radius: 14px;
  box-shadow: var(--app-shadow);
  cursor: pointer;
  transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}

.notify-bubble:hover {
  transform: translateY(-2px);
  border-color: var(--app-accent-border);
  box-shadow: var(--app-shadow);
}

.bubble-icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
}

.is-order .bubble-icon {
  background: linear-gradient(135deg, #ef4444, #f97316);
}

.is-handover .bubble-icon {
  background: var(--app-accent-gradient);
}

.is-system .bubble-icon {
  background: linear-gradient(135deg, #64748b, #94a3b8);
}

.bubble-body {
  flex: 1;
  min-width: 0;
}

.bubble-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bubble-title {
  font-size: 13px;
  color: var(--app-text-primary);
}

.bubble-time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--app-text-muted);
  font-variant-numeric: tabular-nums;
}

.bubble-content {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--app-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.bubble-mentions {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.mention-chip {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.14);
}

.bubble-close {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  color: var(--app-text-secondary);
  background: var(--app-bg-subtle);
  opacity: 0.72;
  transition: all 0.15s ease;
}

.notify-bubble:hover .bubble-close {
  opacity: 1;
}

.bubble-close:hover {
  color: var(--app-text-primary);
  background: var(--app-bg-hover);
  opacity: 1;
}

.bubble-enter-from {
  opacity: 0;
  transform: translateX(36px);
}

.bubble-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.bubble-enter-active,
.bubble-leave-active {
  transition: all 0.26s ease;
}

.bubble-leave-active {
  position: absolute;
  right: 0;
}
</style>
