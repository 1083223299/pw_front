import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import { usePreferencesStore } from './preferences';
import { playNotifySound } from '@/utils/notifySound';
import { renderTrayBadgeDataUrl } from '@/utils/trayBadge';
import {
  listNotifications,
  getUnreadNotifications,
  readNotification,
  readAllNotifications,
  clearNotificationPopup
} from '@/api/api.js';

/**
 * 通知类型映射。
 * 后端 type/orderScene：ORDER、HANDOVER；未识别值兜底为系统通知。
 */
export const NOTIFY_TYPE = {
  SYSTEM: 'system',
  ORDER: 'order',
  HANDOVER: 'handover'
};

const TYPE_MAP = {
  ORDER: NOTIFY_TYPE.ORDER,
  HANDOVER: NOTIFY_TYPE.HANDOVER,
  order: NOTIFY_TYPE.ORDER,
  handover: NOTIFY_TYPE.HANDOVER
};

/** 后端未下发 sceneLabel 时兜底中文标签，避免通知列表直接显示原始枚举。 */
const SCENE_LABELS = {
  ALIPAY_BALANCE_LOW: '支付宝余额预警',
  ALIPAY_BALANCE: '支付宝余额不足'
};

const BUBBLE_DURATION = 6000;
const HEARTBEAT_INTERVAL = 25000;
const MAX_RECONNECT_DELAY = 30000;
/** 离线补弹条数：与气泡最多同时展示 3 条保持一致 */
const OFFLINE_POPUP_LIMIT = 3;
/** 已弹过气泡的通知 ID 持久化 key：刷新/重启后不再重复提醒同一批消息 */
const POPPED_IDS_KEY = 'notify:poppedIds';
const POPPED_IDS_LIMIT = 200;

/** 读取已弹过气泡的通知 ID；localStorage 不可用时退化为空集合 */
function loadPoppedIds() {
  try {
    const raw = localStorage.getItem(POPPED_IDS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.map(String) : []);
  } catch (_) {
    return new Set();
  }
}

/** 记录一条已弹气泡的通知；只保留最近 POPPED_IDS_LIMIT 条，避免无限增长 */
function markPopped(id) {
  if (id == null || id === '') return;
  const popped = loadPoppedIds();
  // 先删再加，保证最近弹出的排在最后，裁剪时保留的是最新记录
  popped.delete(String(id));
  popped.add(String(id));
  try {
    localStorage.setItem(POPPED_IDS_KEY, JSON.stringify([...popped].slice(-POPPED_IDS_LIMIT)));
  } catch (_) {
    // 存储失败不影响本次提醒
  }
}

let ws = null;
let heartbeatTimer = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let manualClosed = false;
let currentToken = '';
/** 本次登录是否已补弹过离线消息；WS 重连不再重复弹，避免刷屏 */
let offlineReplayDone = false;

function normalizeType(rawType) {
  return TYPE_MAP[rawType] || NOTIFY_TYPE.SYSTEM;
}

function normalize(raw = {}) {
  const rawId = raw.id ?? raw.notificationId ?? raw.uuid;
  const id = rawId == null ? `nt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : rawId;
  const read = raw.readFlag === 1 || raw.read === true || raw.read === 1;
  const createdAt = raw.createdAt || raw.created_at || raw.timeText || raw.time || '';

  return {
    id,
    idText: String(id),
    type: normalizeType(raw.type || raw.orderScene),
    scene: raw.scene || raw.orderScene || '',
    sceneLabel: raw.sceneLabel || SCENE_LABELS[raw.scene] || raw.scene || '',
    title: raw.title || '系统通知',
    content: raw.content || '',
    orderId: raw.orderId || raw.order_id || '',
    subOrderId: raw.subOrderId || raw.sub_order_id || '',
    merchantOrderNo: raw.merchantOrderNo || raw.merchant_order_no || '',
    orderNo: raw.orderNo || raw.order_no || raw.merchantOrderNo || raw.merchant_order_no || '',
    username: raw.username || '',
    account: raw.account || '',
    amount: raw.amount ?? '',
    createdAt,
    time: createdAt,
    timeText: raw.timeText || '',
    read,
    jumpTarget: raw.jumpTarget || raw.jump_target || '',
    needPopup: raw.needPopup !== false,
    payload: raw.payload || raw.extra || {}
  };
}

function normalizeList(list = []) {
  return Array.isArray(list) ? list.map(normalize) : [];
}

/** 后端 ID 为 uint64；数字字符串转 Number，避免 Go 解析 string 失败。 */
function toApiId(id) {
  const text = String(id ?? '');
  return /^\d+$/.test(text) ? Number(text) : id;
}

/** 只拷贝普通字段：Electron IPC 不能直接传递 Vue 响应式代理对象。 */
function plainNotifyItem(item = {}) {
  return {
    id: String(item.id ?? ''),
    type: item.type || NOTIFY_TYPE.SYSTEM,
    scene: item.scene || '',
    sceneLabel: item.sceneLabel || '',
    title: item.title || '系统通知',
    content: item.content || '',
    body: item.content || '',
    orderId: item.orderId || '',
    subOrderId: item.subOrderId || '',
    orderNo: item.orderNo || item.merchantOrderNo || '',
    time: item.time || item.timeText || '',
    jumpTarget: item.jumpTarget || '',
    needPopup: item.needPopup !== false
  };
}

export const useNotifyStore = defineStore('notify', {
  state: () => ({
    /** 通知列表：按时间倒序，列表页使用 */
    items: [],
    /** 当前需要浮出的桌面气泡（最多展示 3 条） */
    bubbles: [],
    /** 未读数，角标展示；后端接口/Ws 下发优先 */
    unreadCount: 0,
    badgeText: '',
    /** 通知列表分页信息 */
    listTotal: 0,
    page: 1,
    pageSize: 20,
    hasMore: true,
    /** 用于触发铃铛抖动的自增信号 */
    pulse: 0
  }),

  actions: {
    /** 供 Electron 托盘/角标读取当前通知快照；所有 IPC 数据必须是普通对象。 */
    syncTray() {
      if (typeof window === 'undefined' || !window.notifyBridge) return;

      try {
        const items = this.items
          .filter((item) => !item.read)
          .slice(0, 50)
          .map(plainNotifyItem);

        if (window.notifyBridge.setTrayList) {
          window.notifyBridge.setTrayList({ count: items.length, items, force: items.length === 0 });
        }
      } catch (error) {
        console.warn('同步托盘通知列表失败', error);
      }

      try {
        const count = Math.max(0, Number(this.unreadCount) || 0);
        if (window.notifyBridge.setTrayBadge) {
          if (count > 0) {
            renderTrayBadgeDataUrl(count).then((dataUrl) => {
              window.notifyBridge?.setTrayBadge({ count, dataUrl: dataUrl || '' });
            });
          } else {
            window.notifyBridge.setTrayBadge({ count: 0, dataUrl: '' });
          }
        }
      } catch (error) {
        console.warn('同步托盘角标失败', error);
      }
    },

    refreshBadge() {
      this.unreadCount = Math.max(0, Number(this.unreadCount) || 0);
      if (this.unreadCount <= 0) {
        this.badgeText = '';
      } else if (!this.badgeText) {
        this.badgeText = this.unreadCount > 99 ? '99+' : String(this.unreadCount);
      }
      this.syncTray();
    },

    refreshUnreadFromLocal() {
      this.unreadCount = this.items.filter((item) => !item.read).length;
      this.refreshBadge();
    },

    /** 登录后初始化：拉未读数、补弹离线消息、建立 WS */
    bootstrap(token) {
      const authStore = useAuthStore();
      const nextToken = token || authStore.token || '';
      if (!nextToken) return;
      // 直接切换账号时 token 会变化，需允许新账号重新补弹一次
      if (currentToken && currentToken !== nextToken) offlineReplayDone = false;
      currentToken = nextToken;
      this.fetchUnread();
      this.replayOfflineNotify();
      this.connectWebSocket(currentToken);
    },

    /**
     * 登录后补弹离线未读消息。
     * 只在本次登录首次执行：WS 断线重连会再次进入 bootstrap 链路，不能重复弹。
     */
    async replayOfflineNotify() {
      if (offlineReplayDone) return;
      offlineReplayDone = true;

      try {
        const res = await listNotifications({
          page: 1,
          page_size: OFFLINE_POPUP_LIMIT,
          unread_only: true
        });
        const list = normalizeList(res?.list || res?.data?.list || res?.notifications || []);
        // 已弹过气泡的不再重复提醒；未读数仍由 fetchUnread 如实展示在角标上
        const popped = loadPoppedIds();
        const fresh = list.filter((item) => !popped.has(item.idText));
        if (!fresh.length) return;

        // 接口返回按时间倒序，倒序补弹可让最新一条最后出现、显示在气泡最上方
        [...fresh].reverse().forEach((item) => {
          // needPopup 为 false 的条目由 addNotification 内部拦截，只入列表不弹
          this.addNotification(item, { popup: true });
        });
      } catch (error) {
        console.warn('离线通知补弹失败', error);
      } finally {
        // addNotification 会逐条累加未读数，这里以后端未读数为准重新校准角标
        this.fetchUnread();
      }
    },

    clearSocket() {
      manualClosed = true;
      reconnectAttempts = 0;
      currentToken = '';
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
        ws = null;
      }
    },

    buildWsUrl(token) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/pws/admin/ws?token=${encodeURIComponent(token)}`;
    },

    connectWebSocket(token) {
      if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;
      const wsToken = token || currentToken;
      if (!wsToken) return;

      this.clearSocket();
      manualClosed = false;
      currentToken = wsToken;

      try {
        ws = new WebSocket(this.buildWsUrl(wsToken));
      } catch (error) {
        console.warn('通知 WebSocket 创建失败', error);
        this.scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        reconnectAttempts = 0;
        this.fetchUnread();
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'PING' }));
        }, HEARTBEAT_INTERVAL);
      };

      ws.onmessage = (event) => {
        let message = null;
        try {
          message = JSON.parse(event.data);
        } catch (_) {
          message = null;
        }

        if (!message || message === 'PONG') return;

        switch (message.event || message.type) {
          case 'NOTIFICATION':
            this.addNotification(message.payload || message, { popup: true });
            break;
          case 'UNREAD':
            this.applyUnread(message.payload || message);
            break;
          default:
            break;
        }
      };

      ws.onerror = () => {
        ws?.close();
      };

      ws.onclose = () => {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        if (!manualClosed) this.scheduleReconnect();
      };
    },

    scheduleReconnect() {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectAttempts += 1;
      const delay = Math.min(MAX_RECONNECT_DELAY, 1000 * 2 ** reconnectAttempts);
      reconnectTimer = setTimeout(() => {
        if (currentToken && !manualClosed) this.connectWebSocket(currentToken);
      }, delay);
    },

    applyUnread(payload = {}) {
      this.unreadCount = Number(payload.unread ?? payload.unreadCount ?? this.unreadCount);
      if (payload.badge != null) this.badgeText = String(payload.badge);
      this.refreshBadge();
    },

    /** 统一解析通知跳转目标：ORDER 跳首页订单详情，其它后端路由按原值跳转。 */
    resolveItemTarget(item) {
      if (item.jumpTarget === 'ORDER' && (item.orderId || item.subOrderId || item.orderNo)) {
        return {
          path: '/admin/home',
          query: {
            orderId: item.orderId || '',
            subOrderId: item.subOrderId || '',
            orderNo: item.orderNo || item.merchantOrderNo || ''
          }
        };
      }
      if (item.jumpTarget && item.jumpTarget !== 'ORDER') return item.jumpTarget;
      return '/admin/notify';
    },

    getJumpTarget(id) {
      const item = this.items.find((entry) => String(entry.id) === String(id));
      return item ? this.resolveItemTarget(item) : '/admin/notify';
    },

    async fetchList(params = {}, append = false) {
      const nextPage = append ? this.page + 1 : 1;
      const res = await listNotifications({
        page: nextPage,
        page_size: this.pageSize,
        ...params
      });

      const list = res?.list || res?.data?.list || res?.notifications || [];
      const normalized = normalizeList(list);

      if (append) {
        const existedIds = new Set(this.items.map((entry) => String(entry.id)));
        normalized.forEach((entry) => {
          if (!existedIds.has(String(entry.id))) this.items.push(entry);
        });
        this.page = nextPage;
      } else {
        this.items = normalized;
        this.page = 1;
      }

      this.listTotal = Number(res?.total ?? res?.data?.total ?? this.items.length);
      this.hasMore = this.items.length < this.listTotal;

      this.applyUnread({
        unread: res?.unread ?? res?.unreadCount ?? this.items.filter((item) => !item.read).length,
        badge: res?.badge
      });
      return res;
    },

    async fetchUnread() {
      try {
        const res = await getUnreadNotifications();
        this.applyUnread(res?.data || res || {});
      } catch (error) {
        // 未读数拉取失败不阻塞主界面，下次心跳/重连后再补
        console.warn('获取未读通知失败', error);
      }
    },

    /**
     * 新增/合并一条通知。
     * opts.popup = false 时只更新列表和角标，不弹气泡、不响提示音。
     */
    addNotification(raw = {}, opts = {}) {
      const item = normalize(raw);
      const existedIndex = this.items.findIndex(
        (entry) => String(entry.id) === String(item.id)
      );

      if (existedIndex >= 0) {
        this.items.splice(existedIndex, 1, item);
      } else {
        this.items.unshift(item);
      }

      const payloadUnread = raw.unread ?? raw.unreadCount;
      if (payloadUnread != null) {
        this.applyUnread({ unread: payloadUnread, badge: raw.badge });
      } else if (!item.read) {
        this.unreadCount += 1;
        this.refreshBadge();
      }

      if (opts.popup !== false && item.needPopup) {
        this.notifyUser(item);
      }

      this.pulse += 1;
      this.syncTray();
    },

    /** 弹气泡 + 提示音 + 通知主进程闪托盘；IPC 前先转换成普通对象。 */
    notifyUser(item) {
      // 实时通知和离线补弹共用此入口，凡弹过气泡的都记下来，避免下次刷新再弹
      markPopped(item.idText);
      const prefs = usePreferencesStore();

      if (prefs.notifyBubble) {
        const bubbleIndex = this.bubbles.findIndex(
          (entry) => String(entry.id) === String(item.id)
        );
        if (bubbleIndex < 0) {
          this.bubbles.push(item);
          if (this.bubbles.length > 3) this.bubbles.shift();
          setTimeout(() => this.dismissBubble(item.id), BUBBLE_DURATION);
        }
      }

      if (prefs.notifySound) {
        playNotifySound();
      }

      if (window.notifyBridge?.notifyIncoming) {
        try {
          window.notifyBridge.notifyIncoming({
            ...plainNotifyItem(item),
            flash: prefs.notifyTrayFlash,
            showBubble: prefs.notifyBubble,
            sound: prefs.notifySound
          });
        } catch (error) {
          console.warn('托盘通知发送失败', error);
        }
      }
    },

    dismissBubble(id) {
      const index = this.bubbles.findIndex((bubble) => bubble.id === id);
      if (index >= 0) this.bubbles.splice(index, 1);
    },

    /** 清空气泡：先调后端持久化，再清本地 */
    async clearBubbles() {
      try {
        await clearNotificationPopup();
      } catch (error) {
        console.warn('清空气泡接口失败', error);
      }
      this.bubbles.splice(0);
      if (window.notifyBridge?.setTrayList) {
        window.notifyBridge.setTrayList({ items: [], force: true });
      }
    },

    /** 单条已读：先调后端，再更新本地 */
    async markRead(id) {
      if (!id) return;
      const item = this.items.find((entry) => String(entry.id) === String(id));
      if (item?.read) return;

      try {
        await readNotification(toApiId(id));
      } catch (error) {
        console.warn('通知已读接口失败', error);
      }

      if (item) {
        item.read = true;
        this.refreshUnreadFromLocal();
      } else {
        // 列表尚未加载到该通知时，以后端未读数为准校准角标。
        this.fetchUnread();
      }
    },

    /** 全部已读 */
    async markAllRead() {
      try {
        await readAllNotifications();
      } catch (error) {
        console.warn('全部已读接口失败', error);
      }
      this.items.forEach((item) => {
        item.read = true;
      });
      this.unreadCount = 0;
      this.refreshBadge();
    },

    resetState() {
      this.clearSocket();
      offlineReplayDone = false;
      this.items.splice(0);
      this.bubbles.splice(0);
      this.unreadCount = 0;
      this.badgeText = '';
      this.listTotal = 0;
      this.page = 1;
      this.hasMore = true;
      this.pulse = 0;
      if (window.notifyBridge?.setTrayList) {
        window.notifyBridge.setTrayList({ items: [], force: true });
      }
    }
  }
});
