import axios from 'axios'
import { config } from '@/config/env'

/* ==================================================
   订单处理工具 API
   ================================================== */

// 抖店工具接口地址统一从多环境配置读取，具体值仍来自当前项目的 .env 文件。
const API_BASE = config.toolsApibaseURL

// 单独创建 Axios 实例，不影响原来的 request.js
const toolsRequest = axios.create({
    baseURL: API_BASE,
    timeout: config.toolsTimeout
})

/* ==================================================
   统一请求
   ================================================== */
async function requestTools(method, url, params = {}) {

    try {

        const response = await toolsRequest({
            method,
            url,
            ...(method.toLowerCase() === 'get'
                ? { params }
                : { data: params })
        })

        const result = response.data

        if (result?.code !== 0) {
            throw new Error(
                result?.msg ||
                result?.message ||
                '操作失败'
            )
        }

        // 返回完整响应，方便 Tools.vue 展示
        return result

    } catch (error) {

        const message =
            error?.response?.data?.msg ||
            error?.response?.data?.message ||
            error?.message ||
            '请求失败'

        console.error('订单工具请求失败:', message)

        throw new Error(message)

    }

}

/* ==================================================
   获取店铺列表
   GET /get_shop/0
   ================================================== */
export async function getToolShopList() {
    return requestTools(
        'get',
        '/get_shop/0'
    )

}

/* ==================================================
   抖店添加作废链接
   GET /dd_fake_link
   ================================================== */
export async function addFakeLink(shopId, orderId, num = 1) {
    return requestTools(
        'get',
        '/dd_fake_link',
        {
            shopId,
            orderId,
            shopSkuId: '3381522593589029',
            num
        }
    )

}

/* ==================================================
   抖店指定订单结果
   GET /dy_recharge_result
   ================================================== */
export async function setToolOrderResult(shopId, orderId, status) {
    return requestTools(
        'get',
        '/dy_recharge_result',
        {
            shopId,
            orderId,
            result: status
        }
    )

}

/* ==================================================
   抖店代发码
   GET /test_hexiao
   ================================================== */
export async function handleToolDaifaCode(shopId, orderId) {
    return requestTools(
        'get',
        '/test_hexiao',
        {
            shopId,
            orderId
        }
    )

}

/* ==================================================
   淘宝指定订单作废
   GET /tb_sync
   ================================================== */
export async function cancelToolTaobaoOrder(shopId, orderId) {
    return requestTools(
        'get',
        '/tb_sync',
        {
            shopId,
            orderId
        }
    )

}

/* ==================================================
   获取待同步订单
   GET /{shopId}/sync1/{typeId}
   ================================================== */
export async function getToolSyncOrders(shopId, typeId) {
    return requestTools(
        'get',
        `/${encodeURIComponent(shopId)}/sync1/${encodeURIComponent(typeId)}`
    )

}

/* ==================================================
   批量同步订单
   POST /{shopId}/sync1
   ================================================== */
export async function submitToolSyncOrders(shopId, orders) {
    return requestTools(
        'post',
        `/${encodeURIComponent(shopId)}/sync1`,
        {
            order_id: orders
        }
    )

}