import request from "./request.js";

const TOKEN_KEY = 'admin_token'

/* ==================================================
   统一错误提取
   ================================================== */

// 从 axios 错误里提取可读信息（网络层）
function extractAxiosError(error, fallback) {
    if (!error) return fallback

    // 已经是业务 Error（try 里 throw 的），直接透传 message
    if (error instanceof Error && !error.response) {
        return error.message || fallback
    }

    return (
        error?.response?.data?.msg ||
        error?.response?.data?.message ||
        error?.message ||
        fallback
    )
}

// 从业务响应体里提取可读信息（业务层）
function extractBusinessError(data, fallback) {
    return (
        data?.msg ||
        data?.message ||
        fallback
    )
}

// 通用请求封装
// - 成功：返回 data.data
// - 业务失败：throw Error(msg)
// - 网络失败：throw Error(msg)
async function requestData(method, url, payload, fallback) {
    let response
    try {
        response = await request.post(url, payload)
    } catch (error) {
        const message = extractAxiosError(error, fallback)
        console.error(`${fallback}:`, message, error)
        throw new Error(message)
    }

    const data = response?.data || {}

    if (data.code === 0) {
        return data.data
    }

    const message = extractBusinessError(data, fallback)
    console.error(`${fallback}:`, message, data)
    throw new Error(message)
}

/* ==================================================
   登录 / 退出
   ================================================== */

export async function login(data) {
    return requestData('post', '/v1/login', data, '登录失败')
}

export async function logout(data) {
    return requestData('post', '/v1/logout', data, '退出失败')
}

/* ==================================================
   统计 / 订单
   ================================================== */

export async function getStatistics(payload = {}) {
    return requestData('post', '/v1/statistics', payload, '获取统计失败')
}

export async function getOrders(data) {
    return requestData('post', '/v1/e_list', data, '获取订单失败')
}

export async function getOrderDetail(id, tenantId) {
    return requestData(
        'post',
        '/v1/detail',
        { id, tenant_id: tenantId },
        '获取订单失败'
    )
}

export async function getRechargeOrder(hash) {
    return requestData(
        'post',
        '/v1/order',
        { order_id: hash },
        '获取订单失败'
    )
}

/* ==================================================
   补单
   ================================================== */

export async function replenishOrder(sof_finance_no) {
    return requestData(
        'post',
        '/v1/replenish',
        { sof_finance_no },
        '补单失败'
    )
}

/* ==================================================
   充值流程
   ================================================== */

export async function sendRechargeCode(hash, phone) {
    const result = await requestData(
        'post',
        '/v1/send_code',
        { order_id: hash },
        '发送验证码失败'
    )
    return true
}

export async function submitRechargeCode(hash, code) {
    return requestData(
        'post',
        '/v1/submit',
        { order_id: hash, code },
        '提交登录失败'
    )
}

export async function recharge(hash, amount) {
    return requestData(
        'post',
        '/v1/recharge',
        { order_id: hash, amount },
        '充值失败'
    )
}

export async function aliPay(hash) {
    return requestData(
        'post',
        '/v1/pay',
        { order_id: hash },
        '选择阿里失败'
    )
}

export async function nestCharge(hash) {
    return requestData(
        'post',
        '/v1/nest_pay',
        { order_id: hash },
        '进一步提交失败'
    )
}

export async function confirm(hash) {
    return requestData(
        'post',
        '/v1/confirm',
        { order_id: hash },
        '校验失败'
    )
}

export async function cacheWork(hash) {
    return requestData(
        'post',
        '/v1/cache_work',
        { order_id: hash },
        '缓存母版失败'
    )
}

export async function setResult(hash, status, statusInfo) {
    return requestData(
        'post',
        '/v1/result',
        { order_id: hash, status, status_info: statusInfo },
        '设置结果失败'
    )
}

/** 管理端修改订单状态（需登录密码；可选是否推上游回调） */
export async function adminStatusCorrect(payload) {
    return requestData(
        'post',
        '/v1/admin_status_correct',
        payload,
        '修改订单状态失败'
    )
}

/** 二次推送上游回调（不需要登录密码） */
export async function adminNotifyRepush(payload) {
    return requestData(
        'post',
        '/v1/admin_notify_repush',
        payload,
        '二次推送失败'
    )
}

/* ==================================================
   步骤 / Task
   ================================================== */

export async function getTask(orderId) {
    return requestData(
        'post',
        '/v1/task',
        { order_id: orderId },
        '获取步骤失败'
    )
}

export async function executeStep(orderId, step) {
    return requestData(
        'post',
        '/v1/step',
        { order_id: orderId, current_step: step },
        '执行步骤失败'
    )
}

/* ==================================================
   平台 / 配置
   ================================================== */

export async function platformList(params = {}) {
    return requestData(
        'post',
        '/v1/platform/list',
        { pageIndex: 1, pageSize: 10, ...params },
        '获取平台数据报错'
    )
}

export async function platformSave(payload) {
    return requestData('post', '/v1/platform/save', payload, '保存平台数据报错')
}

export async function platformDelete(id) {
    return requestData('post', '/v1/platform/delete', { id }, '删除平台数据报错')
}

export async function configList(params = {}) {
    return requestData(
        'post',
        '/v1/config/list',
        { pageIndex: 1, pageSize: 10, ...params },
        '获取平台数据报错'
    )
}

export async function configSave(payload) {
    return requestData('post', '/v1/config/save', payload, '保存平台数据报错')
}

export async function configDelete(id) {
    return requestData('post', '/v1/config/delete', { id }, '删除平台数据报错')
}

/* ==================================================
   全局差额亏损限制
   ================================================== */

/** 读取全局推送地址与差额亏损限制 */
export async function outerSettingGet() {
    return requestData('post', '/v1/outer_setting/get', {}, '读取差额限制失败')
}

/** 保存全局推送地址与差额亏损限制；mode 只能传 1 固定 / 2 百分比 */
export async function outerSettingSave(payload) {
    return requestData('post', '/v1/outer_setting/save', payload, '保存差额限制失败')
}

/* ==================================================
   清除 / 状态 / Worker
   ================================================== */

export async function pushExecuteOrder(sub_order_id) {
    return requestData(
        'post',
        '/v1/pushExecute',
        {sub_order_id: sub_order_id },
        '清除数据报错'
    )
}

export async function clearOrder(id) {
    return requestData(
        'post',
        '/clear_session',
        { order_id: id },
        '清除数据报错'
    )
}

export async function getOrderStatusLogs(id, tenant_id) {
    return requestData(
        'post',
        '/v1/status_logs',
        { keyword: id, tenant_id },
        '获取状态过程报错'
    )
}

export async function getWorkerList(params = {}) {
    return requestData('post', '/v1/worker_list', params, '获取 Worker 列表报错')
}

export async function androidGroupList(payload) {
    return requestData('post', '/v1/android_group/list', payload, '获取安卓分组报错')
}

export async function androidGroupSave(payload) {
    return requestData('post', '/v1/android_group/save', payload, '保存安卓分组报错')
}

export async function androidGroupDelete(payload) {
    return requestData('post', '/v1/android_group/delete', payload, '删除安卓分组报错')
}

export async function androidGroupAssign(payload) {
    return requestData('post', '/v1/android_group/assign', payload, '分配设备分组报错')
}

export async function alipayAccountList(payload) {
    return requestData('post', '/v1/alipay_account/list', payload, '获取支付宝账号列表报错')
}

export async function alipayAccountSave(payload) {
    return requestData('post', '/v1/alipay_account/save', payload, '新增支付宝账号报错')
}

export async function setAlipayAccountPassword(payload) {
    return requestData('post', '/v1/alipay_account/set_password', payload, '设置支付宝密码报错')
}

export async function androidDeviceList(payload) {
    return requestData('post', '/v1/android_device/list', payload, '获取安卓设备列表报错')
}

export async function androidDeviceBindAlipay(payload) {
    return requestData('post', '/v1/android_device/bind_alipay', payload, '绑定设备支付宝报错')
}

// 余额预警阈值：get / set 均为空 body 或仅 threshold，租户由登录 Token 推断
export async function getAlipayBalanceThreshold() {
    return requestData('post', '/v1/alipay_balance_threshold/get', {}, '获取余额预警阈值报错')
}

export async function setAlipayBalanceThreshold(payload) {
    return requestData('post', '/v1/alipay_balance_threshold/set', payload, '设置余额预警阈值报错')
}

export async function saveWorkerSchedule(obj) {
    return requestData('post', '/v1/schedule', obj, '保存 Worker 排班报错')
}

export async function disconnectWorkerApi(obj) {
    return requestData('post', '/v1/disconnect', obj, '断开 Worker 报错')
}

/* ==================================================
   财务
   ================================================== */

export async function getFinancePage(obj) {
    return requestData('post', '/v1/finance_list', obj, '财务流水分页报错')
}

export async function getFinanceStat(obj) {
    return requestData('post', '/v1/finance_stat', obj, '财务统计报错')
}

export async function getFinanceDetail(obj) {
    return requestData('post', '/v1/finance_detail', obj, '财务流水详情报错')
}

/* ==================================================
   租户余额
   ================================================== */

/** 读取当前租户余额与可用额 */
export async function tenantBalanceGet() {
    return requestData('post', '/v1/tenant_balance/get', {}, '读取租户余额失败')
}

/** 人工加款；amount 必须大于 0，remark 必填 */
export async function tenantBalanceRecharge(payload) {
    return requestData('post', '/v1/tenant_balance/recharge', payload, '人工加款失败')
}

/** 租户余额流水分页 */
export async function tenantBalanceLedger(payload) {
    return requestData('post', '/v1/tenant_balance/ledger', payload, '读取余额流水失败')
}

/* ==================================================
   人工充值单 · 支付宝余额扣除流水
   注意：这里扣的是「支付宝账号余额」(alipay_account/list 的 balance)，
   与上方「租户余额」(tenant_balance/*，租户预付余额 / 人工加款) 是两套账；
   接口均不传 tenantId，租户由登录 Token 推断。
   ================================================== */

/** 新建人工充值单：手机人工支付完成后记账，扣对应支付宝账号余额 */
export async function createManualRecharge(payload) {
    return requestData('post', '/v1/manual_recharge/create', payload, '新建人工充值单报错')
}

/** 人工充值单分页列表 */
export async function getManualRechargeList(payload) {
    return requestData('post', '/v1/manual_recharge/list', payload, '读取人工充值单列表报错')
}

/** 支付宝余额扣除流水分页（changeType=manual_deduct，amount 为负数） */
export async function getAlipayBalanceLedger(payload) {
    return requestData('post', '/v1/alipay_balance_ledger/list', payload, '读取支付宝余额流水报错')
}

export async function exportFinance(obj) {
    // 导出接口返回 Excel 文件流，必须按 Blob 接收；失败 JSON 仍由页面读取 Blob 内容解析提示
    return request.post('/v1/finance_export', obj, {
        responseType: 'blob',
        headers: {
            Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, application/json'
        }
    })
}

export async function getFinanceDeviceStat(obj) {
    return requestData('post', '/v1/device_stat', obj, '设备支出统计报错')
}

export async function getFinanceDeviceTrend(obj) {
    return requestData('post', '/v1/device_trend', obj, '设备趋势统计报错')
}

export async function getFinanceDailyStat(obj) {
    return requestData('post', '/v1/daily_stat', obj, '每日统计报错')
}

/* ==================================================
   管理端异常订单通知
   ================================================== */

export async function listNotifications(payload = {}) {
    return requestData(
        'post',
        '/v1/admin_notifications',
        { page: 1, page_size: 20, unread_only: false, ...payload },
        '获取通知列表失败'
    )
}

export async function getUnreadNotifications() {
    return requestData(
        'post',
        '/v1/admin_notifications/unread',
        {},
        '获取未读通知失败'
    )
}

export async function readNotification(id) {
    return requestData(
        'post',
        '/v1/admin_notifications/read',
        { id },
        '通知已读失败'
    )
}

export async function readAllNotifications() {
    return requestData(
        'post',
        '/v1/admin_notifications/read_all',
        {},
        '全部已读失败'
    )
}

export async function clearNotificationPopup() {
    return requestData(
        'post',
        '/v1/admin_notifications/clear_popup',
        {},
        '清空气泡失败'
    )
}

// 1. 查询是否需要验证码
export async function getGeneral(obj) {
    return requestData(
        'post',
        '/general_order',
        obj,
        '查询验证码状态'
    )
}

// 2. 真正发送验证码
export async function sendGeneralCode(obj) {
    return requestData(
        'post',
        '/general_sendCode',
        obj,
        '发送验证码'
    )
}
// 3 提交验证码
export async function submitGeneralCode(obj) {
    return requestData(
        'post',
        '/general_submit',
        obj,
        '提交验证码'
    )
}