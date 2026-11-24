<template>
  <!-- ==================================================
     订单详情
     ================================================== -->
  <el-dialog
      v-model="detailDialogVisible"
      width="700px"
      destroy-on-close
      class="detail-dialog fixed-body-dialog"
      align-center
      title="订单详情"
  >
    <!-- 加载中 -->
    <div
        v-if="detailLoading"
        class="detail-loading"
    >
      <el-icon class="is-loading">
        <Loading />
      </el-icon>

      <span>正在获取订单详情...</span>
    </div>

    <template v-else-if="detailOrder">
      <el-tabs v-model="detailActiveTab" class="detail-tabs">
        <el-tab-pane label="订单详情" name="detail" class="detail-tab-pane">
          <div class="detail-card">

      <div class="detail-card-header">
        <div class="detail-order-main">
          <span class="detail-order-icon">
            <el-icon><Tickets /></el-icon>
          </span>
          <div class="detail-card-order">
            <span class="detail-label">订单号</span>
            <strong>{{ detailOrder.orderNo }}</strong>
          </div>
        </div>

        <span
            class="status-tag"
            :class="`status-${getOrderStatusInfo(detailOrder.merchantStatus).type}`"
        >
          <span class="status-dot"></span>
          {{ getOrderStatusInfo(detailOrder.merchantStatus).text }}
        </span>
      </div>

      <section class="detail-section">
        <div class="detail-section-header">
          <div class="detail-section-title">
            <span class="detail-section-mark"></span>
            订单信息
          </div>
          <span class="detail-section-caption">平台与订单标识</span>
        </div>

        <div class="detail-grid detail-grid-rows">
          <div class="detail-item">
            <span class="detail-label">平台</span>
            <strong>{{ getPlatformText(detailOrder.platform) }}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">租户 ID</span>
            <strong>{{ detailOrder.tenantId }}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">订单 ID</span>
            <strong>{{ detailOrder.id }}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">创建时间</span>
            <strong>{{ detailOrder.createTime }}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">充值账号</span>
            <strong>{{ detailOrder.account || '-' }}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">经销商号</span>
            <strong>{{ detailOrder.dealerNo || '-' }}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">外部订单号</span>
            <strong>{{ detailOrder.outerOrderId || '-' }}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">子订单号</span>
            <strong>{{ detailOrder.subOrderId || '-' }}</strong>
          </div>
        </div>
      </section>

      <section class="detail-section">
        <div class="detail-section-header">
          <div class="detail-section-title">
            <span class="detail-section-mark"></span>
            金额与进度
          </div>
          <span class="detail-section-caption">订单金额及当前执行节点</span>
        </div>

        <div class="detail-grid">
          <div class="detail-item detail-amount-item">
            <span class="detail-label">订单金额</span>
            <strong class="detail-amount">¥{{ Number(detailOrder.amount ?? 0).toFixed(4) }}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">成本金额</span>
            <strong>¥{{ formatMoney(detailOrder.supplyOuterPrice) }}</strong>
          </div>

          <div class="detail-item detail-item-wide detail-progress-item">
            <div class="detail-progress-heading">
              <span class="detail-label">执行进度</span>
              <strong>
                {{ detailOrder.meoStep || 0 }}/8
                <span class="detail-progress-step">· {{ detailOrder.currentStepTitle }}</span>
              </strong>
            </div>
            <div class="detail-progress-track">
              <span
                :style="{
                  width: `${Math.min(Math.max(Number(detailOrder.meoStep) || 0, 0), 8) / 8 * 100}%`
                }"
              ></span>
            </div>
          </div>
        </div>
      </section>

      <section class="detail-section">
        <div class="detail-section-header">
          <div class="detail-section-title">
            <span class="detail-section-mark"></span>
            状态信息
          </div>
          <span class="detail-section-caption">系统与渠道状态</span>
        </div>

        <div class="detail-grid detail-grid-rows">
          <div class="detail-item">
            <span class="detail-label">MEO 状态</span>
            <strong class="detail-code-value">{{ resolveStatusLabel(detailOrder.meoStatusText, detailOrder.meoStatus, MEO_STATUS_TEXT_MAP) }}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">后台状态</span>
            <strong class="detail-code-value">{{ resolveStatusLabel(detailOrder.adminStatusText, detailOrder.adminStatus, ADMIN_STATUS_TEXT_MAP) }}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">订单状态</span>
            <strong :class="['detail-status-value', `is-${getOrderStatusInfo(detailOrder.merchantStatus).type}`]">
              <span class="detail-status-dot"></span>
              {{ getOrderStatusInfo(detailOrder.merchantStatus).text }}
            </strong>
          </div>

          <div class="detail-item">
            <span class="detail-label">渠道状态</span>
            <strong :class="['detail-status-value', `is-${getExternalStatusInfo(detailOrder.externalStatus).type}`]">
              <span class="detail-status-dot"></span>
              {{ getExternalStatusInfo(detailOrder.externalStatus).text }}
            </strong>
          </div>
        </div>
      </section>

      <!-- 卡密商品：展示后端从卡库抽出的卡密 -->
      <section
        v-if="detailOrder.camis?.length"
        class="detail-section"
      >
        <div class="detail-section-header">
          <div class="detail-section-title">
            <span class="detail-section-mark"></span>
            卡密信息
          </div>
          <span class="detail-section-caption">卡号 / 卡密 / 卡库 / 有效期</span>
        </div>

        <div class="detail-camis-list">
          <div
            v-for="(card, cardIndex) in detailOrder.camis"
            :key="cardIndex"
            class="detail-camis-item"
          >
            <div class="detail-camis-head">
              <span class="detail-camis-index">卡密 {{ cardIndex + 1 }}</span>
              <div class="detail-camis-actions">
                <el-button type="primary" link @click="copyText(card.card_no)">
                  复制卡号
                </el-button>
                <el-button type="primary" link @click="copyText(card.card_password)">
                  复制卡密
                </el-button>
              </div>
            </div>

            <div class="detail-grid detail-grid-rows">
              <div class="detail-item">
                <span class="detail-label">卡号</span>
                <strong class="detail-camis-value">{{ card.card_no || '-' }}</strong>
              </div>
              <div class="detail-item">
                <span class="detail-label">卡密</span>
                <strong class="detail-camis-value">{{ card.card_password || '-' }}</strong>
              </div>
              <div class="detail-item">
                <span class="detail-label">卡库名称</span>
                <strong>{{ card.card_name || '-' }}</strong>
              </div>
              <div class="detail-item">
                <span class="detail-label">有效期至</span>
                <strong>{{ card.expire_time || '-' }}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================================================
           充值订单列表
           ================================================== -->
      <!-- ==================================================
           充值订单列表
           ================================================== -->
      <div class="detail-recharge-section">

        <div class="detail-recharge-header">
          <div class="detail-recharge-title">
            <span>充值订单</span>

            <el-tag
                type="primary"
                size="small"
                round
            >
              {{ detailPayOrders.length }} 笔
            </el-tag>
          </div>

          <span class="detail-recharge-desc">
            每笔充值订单可单独查看账单详情
          </span>
        </div>

        <div
            v-if="detailPayOrders.length"
            class="detail-pay-list"
        >
          <div
              v-for="(pay, index) in detailPayOrders"
              :key="pay.id || index"
              class="detail-pay-item"
              :class="{'detail-pay-item-failed': pay.payStatus === 3}"
          >
            <!-- 左侧 -->
            <div class="pay-item-left">

              <span
                  class="pay-item-index"
                  :class="{
                    'pay-index-failed': pay.payStatus === 3
                  }"
              >
                {{ index + 1 }}
              </span>

              <div class="pay-item-info">
                <span class="pay-item-label">
                  支付机子
                </span>
                <strong>
                  {{ pay.deviceId || '未知设备' }}
                </strong>
              </div>
            </div>

            <!-- 右侧 -->
            <div class="pay-item-right">

              <span
                  class="pay-item-status"
                  :class="{
                    'pay-status-success': pay.payStatus === 2,
                    'pay-status-failed': pay.payStatus === 3,
                    'pay-status-processing': pay.payStatus !== 2 && pay.payStatus !== 3
                  }"
              >
{{
                  pay.payStatus === 0
                      ? '未处理'
                      : pay.payStatus === 1
                          ? '充值中'
                          : pay.payStatus === 2
                              ? '充值成功'
                              : pay.payStatus === 3
                                  ? '充值失败'
                                  : '未知状态'
                }}
              </span>

              <el-button
                  v-if="pay.payStatus === 3 && pay.sofFinanceNo"
                  type="warning"
                  link
                  :loading="replenishingId === (pay.id || pay.sofFinanceNo)"
                  :disabled="!!replenishingId && replenishingId !== (pay.id || pay.sofFinanceNo)"
                  @click="handleReplenishClick(pay)"
              >
                {{ replenishingId === (pay.id || pay.sofFinanceNo) ? '补单中...' : '去补单' }}
              </el-button>

              <el-button
                  v-else-if="pay.payStatus === 3"
                  type="info"
                  link
                  @click="copyText(pay.payOrder)"
              >
                复制订单号
              </el-button>

              <!-- 成功 / 处理中：查看订单 -->
              <el-button
                  v-else
                  type="primary"
                  link
                  @click="openBillDetail(pay, detailPayOrders.length)"
              >
                查看订单
              </el-button>

            </div>

          </div>
        </div>

        <el-empty
            v-else
            description="暂无充值订单"
            :image-size="70"
        />

      </div>

      <!-- 备注 -->
      <div v-if="detailOrder.note" class="detail-note">
        <span class="detail-label">备注</span>
        <p>{{ detailOrder.note }}</p>
      </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="订单日志" name="log" class="detail-tab-pane">
          <div class="detail-log-section">
            <div class="log-pane-header">
              <span class="log-pane-title">订单日志</span>
              <div class="log-pane-tools">
                <span
                  v-if="Array.isArray(statusLogs) && statusLogs.length"
                  class="log-pane-count"
                >
                  {{ statusLogs.length }} 条
                </span>
                <el-button
                  size="small"
                  :loading="statusLoading"
                  :icon="Refresh"
                  @click="refreshStatusLog"
                >
                  刷新
                </el-button>
              </div>
            </div>

            <div v-if="statusLoading" class="progress-loading">
              <el-icon class="is-loading">
                <Loading />
              </el-icon>
              <span>正在获取处理记录...</span>
            </div>

            <div
              v-else-if="Array.isArray(statusLogs) && statusLogs.length"
              class="order-log-wrap"
            >
              <div class="order-flow">
                <div
                  v-for="(row, index) in statusLogRows"
                  :key="index"
                  class="order-flow-item"
                  :class="`is-${row.level}`"
                >
                  <div class="order-flow-node">
                    <span class="order-flow-circle">
                      <el-icon v-if="row.level === 'success'">
                        <Check />
                      </el-icon>
                      <el-icon v-else-if="row.level === 'error'">
                        <CircleCloseFilled />
                      </el-icon>
                      <el-icon v-else-if="row.level === 'warn'">
                        <Warning />
                      </el-icon>
                      <i v-else class="order-flow-dot"></i>
                    </span>
                    <span
                      v-if="index < statusLogRows.length - 1"
                      class="order-flow-line"
                    ></span>
                  </div>

                  <div class="order-flow-body">
                    <p class="order-flow-text">{{ row.text }}</p>
                    <span class="order-flow-time">{{ row.time }}</span>
                  </div>
                </div>
              </div>

              <div class="order-log-foot">
                已显示全部 {{ statusLogs.length }} 条记录
              </div>
            </div>

            <el-empty v-else description="暂无处理过程" :image-size="70" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="修改状态" name="correct" class="detail-tab-pane">
          <div class="status-correct-form">
            <div class="status-correct-current">
              当前状态：{{ getOrderStatusInfo(detailOrder.merchantStatus).text }}
            </div>

            <div class="form-row">
              <span class="form-label">目标状态</span>
              <el-radio-group v-model="statusCorrectForm.status">
                <el-radio
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </el-radio>
              </el-radio-group>
            </div>

            <div class="form-row">
              <span class="form-label">自动推送</span>
              <el-switch v-model="statusCorrectForm.pushUpstream" />
              <span class="form-tip">关闭后只修改本地订单状态</span>
            </div>

            <div class="form-row">
              <span class="form-label">备注</span>
              <el-input
                v-model="statusCorrectForm.note"
                type="textarea"
                :rows="2"
                placeholder="可选备注"
              />
            </div>

            <div class="form-row">
              <span class="form-label">登录密码</span>
              <el-input
                v-model="statusCorrectForm.password"
                type="password"
                show-password
                placeholder="请输入登录密码"
              />
            </div>

            <div class="correct-form-actions">
              <el-button
                type="warning"
                plain
                :loading="repushLoading"
                @click="openRepushDialog"
              >
                二次推送
              </el-button>
              <el-button
                type="primary"
                :loading="statusCorrectLoading"
                @click="submitStatusCorrect"
              >
                确认修改
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <el-empty
        v-else
        description="暂无订单详情"
        :image-size="90"
    />

  </el-dialog>

  <div class="home-page">

    <!-- =========================
         页面头部
         ========================= -->
    <section class="page-header">
      <div class="header-left">
        <div class="page-title">
          <div class="title-icon">
            <el-icon>
              <DataBoard />
            </el-icon>
          </div>
          <div class="title-text">
            <div class="eyebrow">OPERATIONS OVERVIEW</div>
            <h1>首页 <span class="home-en">/ Home</span></h1>
            <p>平台运营概览 · 实时掌握充值订单与执行状态</p>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <span class="update-time">
          最后更新 {{ lastUpdateTime }}
        </span>

        <el-button
            :loading="exporting"
            type="success"
            plain
            @click="exportToExcel"
        >
          导出 Excel
        </el-button>

        <el-button
            :loading="refreshing"
            :icon="Refresh"
            @click="refreshAll"
        >
          刷新
        </el-button>
      </div>
    </section>


    <!-- =========================
         数据统计
         ========================= -->
    <section class="statistics-grid">

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">总订单</span>

          <div class="stat-icon order">
            <el-icon>
              <Histogram />
            </el-icon>
          </div>
        </div>

        <div class="stat-value">
          {{ statistics.allOrders }}
        </div>
      </div>


      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">今日订单</span>

          <div class="stat-icon order">
            <el-icon>
              <Calendar />
            </el-icon>
          </div>
        </div>

        <div class="stat-value">
          {{ statistics.todayOrders }}
        </div>
      </div>


      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">成功订单</span>

          <div class="stat-icon success">
            <el-icon>
              <GoldMedal />
            </el-icon>
          </div>
        </div>

        <div class="stat-value">
          {{ statistics.successOrders }}
        </div>

        <div class="stat-bottom">
          <span class="success-text">
            成功率 {{ statistics.successRate }}%
          </span>
        </div>
      </div>


      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">进行中</span>

          <div class="stat-icon processing">
            <el-icon>
              <Stopwatch />
            </el-icon>
          </div>
        </div>

        <div class="stat-value">
          {{ statistics.processingOrders }}
        </div>
      </div>


      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">失败订单</span>

          <div class="stat-icon failed">
            <el-icon>
              <CircleCloseFilled />
            </el-icon>
          </div>
        </div>

        <div class="stat-value">
          {{ statistics.failedOrders }}
        </div>
      </div>

    </section>


    <!-- =========================
         订单列表
         ========================= -->
    <section class="orders-card">

      <div class="orders-header">

        <div>
          <div class="orders-title">
            最近订单
          </div>

          <div class="orders-desc">
            共 {{ listTotal }} 条订单
          </div>
        </div>


        <!-- =========================
             筛选
             ========================= -->
        <div class="order-tools">
          <!-- 平台筛选 -->
          <el-select
              v-model="platformFilter"
              placeholder="选择平台"
              clearable
              filterable
              class="platform-select"
              @change="searchOrders"
          >
            <el-option label="全部平台" value="all"/>
            <el-option label="Soul" value="soul"/>
            <el-option label="蛋仔派对" value="eggie"/>
            <el-option label="小红书" value="xhs"/>
            <el-option label="他趣" value="taqu"/>
            <el-option label="克拉漫播" value="klmb"/>
            <el-option label="第五人格" value="d5rg"/>
            <el-option label="梦幻西游" value="mhxy"/>
            <el-option label="永劫无间-直充" value="yjwj_c"/>
            <el-option label="永劫无间-手游" value="yjwj_m"/>
            <el-option label="大话手游" value="dhxy_m"/>
            <el-option label="快手" value="kuai"/>
            <el-option label="抖音钻石" value="douyin"/>
          </el-select>

          <!-- 充值状态 -->
          <el-select
              v-model="orderStatusFilter"
              class="status-select"
              placeholder="充值状态"
              @change="searchOrders"
          >
            <el-option label="全部状态" :value="-1"/>
            <el-option label="充值中" :value="1"/>
            <el-option label="充值成功" :value="2"/>
            <el-option label="充值失败" :value="3"/>
          </el-select>

          <el-input
              v-model="channelOrderNo"
              clearable
              placeholder="渠道订单号"
              :prefix-icon="Search"
              class="channel-input"
              @keyup.enter="searchOrders"
          />

          <el-input
              v-model="searchKeyword"
              clearable
              placeholder="搜索订单号 / 子订单号"
              :prefix-icon="Search"
              class="search-input"
              @keyup.enter="searchOrders"
          />


          <el-select v-model="statusFilter" class="status-select">
            <el-option label="抓取状态" value="all"/>
            <el-option label="处理中" value="processing"/>
            <el-option label="已处理" value="success"/>
            <!--            <el-option label="充值失败" value="failed"/>-->
          </el-select>

          <el-select v-model="externalStatusFilter" class="status-select">
            <el-option label="处理状态" value="all"/>
            <el-option label="未处理" value="pending"/>
            <el-option label="处理中" value="processing"/>
            <el-option label="处理成功" value="success"/>
            <el-option label="处理失败" value="failed"/>
          </el-select>

          <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="date-range"
              style="max-width: 300px"
          />


          <el-button type="primary" :icon="Search" @click="searchOrders">查询</el-button>
          <el-button :icon="RefreshLeft" @click="resetFilters">重置</el-button>

        </div>

      </div>


      <!-- =========================
           滚动区域
           ========================= -->
      <div
          ref="orderScrollRef"
          class="order-scroll"
      >

        <!-- =========================
             PC 表格
             ========================= -->
        <div class="desktop-table">

          <div class="table-header">
            <div class="col order-col">订单信息</div>
            <div class="col platform-col">平台</div>
            <div class="col tenant-col">租户</div>
            <div class="col account-col">充值账号</div>
            <div class="col amount-col">充值金额</div>
            <div class="col status-col">状态</div>
            <div class="col step-col">执行进度</div>
            <div class="col time-col">创建时间</div>
            <div class="col action-col">操作</div>
          </div>


          <div
              v-for="item in filteredOrders"
              :key="item.id"
              class="table-row"
          >

            <!-- 订单 -->
            <div class="col order-col">

              <div class="order-main">
                <span class="order-no">{{ item.orderNo }}</span>
                <div class="order-sub-info">
                  <span>ID {{ item.id }}</span>
                  <span v-if="item.subOrderId">子单 {{ item.subOrderId }}</span>
                </div>

              </div>

            </div>

            <div class="col platform-col">
              <span class="platform-tag" :class="`platform-${item.platform}`">
                {{ getPlatformText(item.platform) }}
              </span>
            </div>

            <div class="col tenant-col">
              <span class="tenant-tag">{{ item.tenantId }}</span>
            </div>


            <!-- 账号 -->
            <div class="col account-col">
              <div class="account">
                {{ item.account || '-' }}
              </div>
            </div>


            <!-- 金额 -->
            <div class="col amount-col">
              <strong class="amount">
                ¥{{ Number(item.amount ?? 0).toFixed(4) }}
              </strong>
            </div>


            <!-- 状态 -->
            <div class="col status-col order-status-group">

              <!-- 外部渠道状态：主状态 -->
              <span
                  class="channel-status"
                  :class="getExternalStatusInfo(item.externalStatus).type"
              >
                <span class="status-dot"></span>
                 {{ getExternalStatusInfo(item.externalStatus).text }}
                </span>

              <!-- 整个订单状态：辅助状态 -->
              <span
                  class="order-sub-status"
                  :class="getOrderStatusInfo(item.statusValue).type"
              >
                  {{ getOrderStatusInfo(item.statusValue).text }}
                </span>

            </div>


            <!-- 执行进度 -->
            <div class="col step-col">
              <div class="step-info">
                <span class="step-number">{{ item.meoStep || 0 }}/8</span>
                <span class="step-title">{{ item.currentStepTitle }}</span>
              </div>
            </div>

            <!-- 创建时间 -->
            <div class="col time-col">
              <span class="create-time">{{ item.createTime }}</span>
            </div>

            <!-- 操作 -->
            <div class="col action-col">

              <!--              <el-button type="primary" link @click="openProgressDialog(item)">-->
              <!--                查看进度-->
              <!--              </el-button>-->

              <!-- 新增：充值中才显示，打开外部页面 -->
              <!--              <el-button-->
              <!--                  v-if="item.status === 'processing'"-->
              <!--                  type="success"-->
              <!--                  link-->
              <!--                  @click="openExternalPage(item)"-->
              <!--              >-->
              <!--                打开充值页-->
              <!--              </el-button>-->
              <el-button
                  v-if="item.externalStatus === 0 && item.meoStatus === 1 && item.statusValue === 1"
                  type="success"
                  link
                  :loading="pushingId === item.id"
                  :disabled="pushingId === item.id"
                  @click="handlePushExecute(item)"
              >
                {{ pushingId === item.id ? '推送中...' : '推送执行' }}
              </el-button>

              <el-button type="info" link @click="openDetailDialog(item)">
                详情
              </el-button>
              <!-- 仅充值中显示矫正按钮 -->
              <el-button
                  v-if="item.status === 'processing'"
                  type="warning"
                  link
                  :loading="correctingId === item.id"
                  @click="handleCorrectResult(item)"
              >
                矫正结果
              </el-button>
            </div>

          </div>


          <!-- 空数据 -->
          <div v-if="!filteredOrders.length && !loadingOrders" class="empty-state">
            <el-empty description="暂无订单"/>
          </div>

        </div>


        <!-- =========================
             手机卡片
             ========================= -->
        <div class="mobile-orders">
          <div v-for="item in filteredOrders" :key="item.id" class="mobile-order-card">
            <div class="mobile-order-top">
              <div>
                <div class="mobile-order-no">{{ item.orderNo }}</div>
                <div class="mobile-order-id">
                  ID {{ item.id }}
                  <span class="platform-tag" :class="`platform-${item.platform}`">
                    {{ getPlatformText(item.platform) }}
                  </span>
                  <span class="tenant-tag">{{ item.tenantId }}</span>
                </div>
              </div>


              <!-- 移动端双状态 -->
              <div class="mobile-status-group">

                <!-- 外部渠道状态：主状态 -->
                <span
                    class="channel-status"
                    :class="getExternalStatusInfo(item.externalStatus).type"
                >
    <span class="status-dot"></span>
    {{ getExternalStatusInfo(item.externalStatus).text }}
  </span>

                <!-- 系统订单状态：辅助状态 -->
                <span
                    class="order-sub-status"
                    :class="getOrderStatusInfo(item.statusValue).type"
                >
    {{ getOrderStatusInfo(item.statusValue).text }}
  </span>

              </div>

            </div>


            <div class="mobile-order-content">
              <div class="mobile-info">
                <span>充值账号</span>
                <strong>{{ item.account || '-' }}</strong>
              </div>


              <div class="mobile-info">
                <span>充值金额</span>
                <strong class="mobile-amount">¥{{ Number(item.amount ?? 0).toFixed(4) }}</strong>
              </div>

              <div class="mobile-info">
                <span>成本金额</span>
                <strong>¥{{ formatMoney(item.supplyOuterPrice) }}</strong>
              </div>


              <div class="mobile-info">
                <span>执行进度</span>
                <strong>
                  {{ item.meoStep || 0 }}/8
                  ·
                  {{ item.currentStepTitle }}
                </strong>
              </div>


              <div class="mobile-info">
                <span>创建时间</span>
                <strong>{{ item.createTime }}</strong>
              </div>

              <div v-if="item.note" class="mobile-note">{{ item.note }}</div>
            </div>


            <div class="mobile-order-action">

              <!--              <el-button-->
              <!--                  type="primary"-->
              <!--                  plain-->
              <!--                  @click="openProgressDialog(item)"-->
              <!--              >-->
              <!--                查看进度-->
              <!--              </el-button>-->

              <el-button
                  v-if="item.externalStatus === 0 && item.meoStatus === 1 && item.statusValue === 1"
                  type="success"
                  plain
                  :loading="pushingId === item.id"
                  :disabled="pushingId === item.id"
                  @click="handlePushExecute(item)"
              >
                {{ pushingId === item.id ? '推送中...' : '推送执行' }}
              </el-button>

              <el-button type="info" link @click="openDetailDialog(item)">
                详情
              </el-button>

              <el-button
                  v-if="item.status === 'processing'"
                  type="warning"
                  plain
                  :loading="correctingId === item.id"
                  @click="handleCorrectResult(item)"
              >
                矫正结果
              </el-button>
            </div>

          </div>


          <div
              v-if="!filteredOrders.length &&!loadingOrders"
              class="empty-state"
          >
            <el-empty description="暂无订单"/>
          </div>

        </div>


        <div class="home-pagination" v-if="listTotal > 0">
          <span class="pagination-total">共 {{ listTotal }} 条订单</span>
          <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="listTotal"
              layout="sizes, prev, pager, next, jumper"
              background
              @current-change="handlePageChange"
              @size-change="handlePageSizeChange"
          />
        </div>
      </div>

    </section>


    <!-- ==================================================
         充值进度
         ================================================== -->
    <el-dialog
        v-model="progressDialogVisible"
        width="680px"
        destroy-on-close
        class="progress-dialog fixed-body-dialog"
        align-center
    >

      <!-- =========================
           Dialog Header
           ========================= -->
      <template #header>
        <div class="progress-dialog-header">
          <div class="progress-dialog-title">充值进度</div>
          <el-button
              size="small"
              :loading="progressLoading"
              :icon="Refresh"
              @click="refreshProgress"
          >
            刷新进度
          </el-button>

        </div>

      </template>


      <!-- =========================
           Loading
           ========================= -->
      <div v-if="progressLoading" class="progress-loading">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>

        <span>正在获取充值步骤...</span>
      </div>


      <!-- =========================
           进度内容
           ========================= -->
      <div v-else-if="currentOrder" class="progress-content">
        <!-- =========================
             订单头
             ========================= -->
        <div class="progress-order-header">
          <div>
            <span>订单号</span>
            <strong>{{ currentOrder.orderNo }}</strong>
          </div>


          <span
              class="status-tag"
              :class="
                `status-${currentOrder.status}`
              "
          >

            <span class="status-dot"></span>
            {{ getStatusText(currentOrder.status) }}
          </span>

        </div>


        <!-- =========================
             基础信息
             ========================= -->
        <div class="progress-info-grid">

          <div class="progress-info-item">
            <span>订单 ID</span>
            <strong>{{ currentOrder.id }}</strong>
          </div>

          <div class="progress-info-item">

            <span>充值账号</span>
            <strong>
              {{
                progressTask?.account ||
                currentOrder.account ||
                '-'
              }}
            </strong>

          </div>


          <div class="progress-info-item">
            <span>订单金额</span>
            <strong>¥{{ formatMoney(currentOrder.amount) }}</strong>
          </div>

          <div class="progress-info-item">
            <span>已执行</span>
            <strong>{{ currentOrder.meoStep || 0 }}/8</strong>
          </div>

        </div>


        <!-- =========================
             当前任务
             ========================= -->
        <div v-if="progressTask" class="current-step-box">
          <div class="current-step-left">
            <span class="current-step-label">当前任务</span>
            <strong>
              第
              {{ progressTask.current_step || 0 }}
              步
              ·
              {{ progressTask.step_name || '未开始' }}
            </strong>
          </div>


          <div class="current-step-right">
            <span v-if="progressTask.running_step">
              执行中第
              {{ progressTask.running_step }}
              步
            </span>

            <span
                class="task-step-status"
                :class="
                  getStepStatusClass(
                    progressTask.step_status
                  )
                "
            >
              {{getStepStatusText(progressTask.step_status)}}
            </span>

          </div>

        </div>


        <!-- =========================
             8 步流程
             ========================= -->
        <div
            v-if="
              progressTask &&
              Array.isArray(progressTask.steps) &&
              progressTask.steps.length
            "
            class="backend-steps"
        >

          <div class="backend-steps-title">
            充值流程
          </div>


          <div
              v-for="step in progressTask.steps"
              :key="step.step"
              class="backend-step"
              :class="{
                active:
                  getDisplayStepStatus(step) === 'running',

                success:
                  getDisplayStepStatus(step) === 'success',

                failed:
                  getDisplayStepStatus(step) === 'failed',
              }"
          >

            <!-- =========================
                 节点
                 ========================= -->
            <div class="backend-step-node">

              <div class="backend-step-circle">

                <el-icon v-if="getDisplayStepStatus(step)=== 'success'">
                  <Check />
                </el-icon>


                <el-icon v-else-if=" getDisplayStepStatus(step)  === 'failed' ">
                  <CircleCloseFilled />
                </el-icon>

                <el-icon v-else-if=" getDisplayStepStatus(step) === 'running'  " class="is-loading">
                  <Loading />
                </el-icon>

                <span v-else>{{ step.step }}</span>
              </div>

              <div v-if=" step.step < progressTask.steps.length " class="backend-step-line"  ></div>
            </div>


            <!-- =========================
                 内容
                 ========================= -->
            <div class="backend-step-content">
              <div class="backend-step-top">
                <div class="backend-step-name">
                  <span class="backend-step-index">STEP {{ step.step }}</span>
                  <strong>{{ step.name }}</strong>
                </div>


                <div class="backend-step-actions">
                  <!-- 步骤状态 -->
                  <span
                      class="task-step-status"
                      :class="getStepStatusClass(getDisplayStepStatus(step))"
                  >
                    {{getStepStatusText(getDisplayStepStatus(step))}}
                  </span>


                  <!-- =========================
                       请求按钮
                       每个步骤都可以请求
                       点击哪个就是哪个 step
                       ========================= -->
                  <el-button
                      size="small"
                      type="primary"
                      :loading="
                        executingStep &&
                        executingStepNumber ===
                          Number(step.step)
                      "
                      :disabled="
                        executingStep &&
                        executingStepNumber !==
                          Number(step.step)
                      "
                      @click="
                        executeCurrentStep(
                          Number(step.step)
                        )
                      "
                  >
                    请求
                  </el-button>

                </div>

              </div>


              <div class="backend-step-time">
                <span v-if="step.started_at">
                  开始：{{formatStepTime(step.started_at) }}
                </span>


                <span v-if="step.finished_at">
                  完成：{{formatStepTime(step.finished_at) }}
                </span>
                <span
                    v-if="
                      !step.started_at &&
                      !step.finished_at
                    "
                >
                  等待执行
                </span>
              </div>
            </div>
          </div>
        </div>


        <!-- =========================
             手动操作
             ========================= -->
        <div
            v-if=" progressTask && !progressTask.waiting_human "
            class="manual-action-box"
        >

          <div class="manual-action-title">
            手动操作
          </div>


          <!-- =========================
               第 3 步：提交验证码
               ========================= -->
          <div
              v-if="needVerifyCode"
              class="verify-action"
          >

            <el-input
                ref="verifyCodeInputRef"
                v-model="verifyCode"
                placeholder="请输入收到的验证码"
                maxlength="20"
                clearable
                @keyup.enter="submitVerifyCode"
            />


            <el-button
                type="primary"
                :loading="submittingCode"
                @click="submitVerifyCode"
            >
              提交验证码
            </el-button>

          </div>


          <!-- =========================
               当前任务提示
               ========================= -->
          <div  v-else class="execute-finished" >
            点击上方对应步骤的「请求」按钮执行指定步骤
          </div>

        </div>


        <!-- =========================
             等待人工
             ========================= -->
        <div
            v-if="
              progressTask &&
              progressTask.waiting_human
            "
            class="waiting-human-box"
        >

          <div class="waiting-human-icon">
            <el-icon>
              <Loading />
            </el-icon>
          </div>
          <div>
            <strong>等待人工处理</strong>
            <p>当前任务需要人工处理，请完成操作后刷新进度。</p>
          </div>
        </div>


        <!-- =========================
             Task 状态
             ========================= -->
        <div
            v-if="progressTask"
            class="task-status-box"
            :class="
              getTaskStatusClass(
                progressTask.status
              )
            "
        >

          <div class="task-status-left">
            <span class="task-status-dot"></span>
            <span>
              {{getTaskStatusText(progressTask.status) }}
            </span>

          </div>

          <span v-if="progressTask.waiting_human" class="human-waiting">
            等待人工
          </span>

        </div>

        <!-- =========================
     手动矫正结果
     ========================= -->
        <div
            v-if="currentOrder && currentOrder.status === 'processing'"
            class="correct-result-box"
        >
          <div class="correct-result-desc">
            当前步骤 {{ currentOrder.meoStep || 0 }}/8，
            将矫正为
            <strong :class="currentOrder.meoStep === 8 ? 'text-success' : 'text-failed'">
              {{ currentOrder.meoStep === 8 ? '成功' : '失败' }}
            </strong>
          </div>

          <el-button
              type="warning"
              size="small"
              :loading="correcting"
              @click="handleCorrectResult(currentOrder)"
          >
            矫正最终结果
          </el-button>
        </div>


        <!-- =========================
             更新时间
             ========================= -->
        <div v-if="progressTask" class="progress-update-time">
          最后更新： {{formatISOTime(progressTask.updated_at) }}
        </div>

      </div>


      <!-- =========================
           没有数据
           ========================= -->
      <el-empty v-else description="暂无步骤信息"/>

    </el-dialog>

    <!-- ==================================================
     充值页弹框（iframe 加载）
     ================================================== -->
    <el-dialog
        v-model="externalDialogVisible"
        width="900px"
        destroy-on-close
        class="external-dialog fixed-body-dialog"
        align-center
        title="充值页"
    >
      <div class="external-iframe-wrap">
        <iframe
            v-if="externalUrl"
            :src="externalUrl"
            class="external-iframe"
            frameborder="0"
            allowfullscreen
        ></iframe>
      </div>
    </el-dialog>

    <BillDetail
        v-model="billDetailVisible"
        :bill-data="currentPayOrder"
    />
  </div>
</template>


<script setup>

import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
} from 'vue'

import { useRoute, useRouter } from 'vue-router'

import {
  ElMessage,
  ElMessageBox,
} from 'element-plus'

import {
  Tickets,
  Histogram,
  Calendar,
  GoldMedal,
  Stopwatch,
  Loading,
  Refresh,
  Search,
  ArrowDown,
  Check,
  CircleCloseFilled,
  Warning,
  RefreshLeft,
  ArrowRight,
  DataBoard,
} from '@element-plus/icons-vue'

import {
  getStatistics,
  getOrders,
  getOrderDetail,
  replenishOrder,
  getTask,
  executeStep,
  submitRechargeCode,
  setResult,
  clearOrder,
  getOrderStatusLogs,
  pushExecuteOrder,
  adminStatusCorrect,
  adminNotifyRepush,
} from '@/api/api.js'

import { encryptPassword } from '@/api/utils.js'
import { useAuthStore } from '@/stores/auth.js'

import * as XLSX from 'xlsx'

import BillDetail from '@/components/BillDetail.vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
let stopQueryWatch = null

/* ==================================================
   查询条件持久化
   ================================================== */
const FILTER_STORAGE_KEY = 'recharge_order_filters'

// 从 localStorage 读取
function loadFilters() {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.error('读取查询条件失败:', e)
    return null
  }
}

// 保存到 localStorage
function saveFilters() {
  try {
    const data = {
      searchKeyword: searchKeyword.value,
      platformFilter: platformFilter.value,
      orderStatusFilter: orderStatusFilter.value,
      channelOrderNo: channelOrderNo.value,
      statusFilter: statusFilter.value,
      externalStatusFilter: externalStatusFilter.value,   // 新增
      dateRange: dateRange.value,
    }
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('保存查询条件失败:', e)
  }
}

// 清除
function clearFilters() {
  try {
    localStorage.removeItem(FILTER_STORAGE_KEY)
  } catch (e) {
    console.error('清除查询条件失败:', e)
  }
}

/* ==================================================
   时间
   ================================================== */
const lastUpdateTime = ref('--:--:--')
/* ==================================================
   步骤名称
   ================================================== */

const STEP_NAME_MAP = {
  1: '获取订单信息',
  2: '发送验证码',
  3: '提交验证码',
  4: '提交充值',
  5: '阿里选择支付',
  6: '支付宝验证',
  7: '确认充值',
  8: '缓存母版',
}


/* ==================================================
   订单状态
   ================================================== */

const STATUS_TEXT_MAP = {
  processing: '充值中',
  success: '充值成功',
  failed: '充值失败',
}


/* ==================================================
   统计
   ================================================== */
const statistics = ref({
  allOrders: 0,
  todayOrders: 0,
  successOrders: 0,
  processingOrders: 0,
  failedOrders: 0,
  successRate: 0,
})

/* ==================================================
   独立统计：订单总数 / 今日订单数
   ================================================== */
const totalOrderCount = ref(0)   // 全部订单总数
const todayOrderCount = ref(0)   // 今日订单总数

/* ==================================================
   订单
   ================================================== */
const orders = ref([])
const listTotal = ref(0)
/* ==================================================
   查询
   ================================================== */
// 平台筛选
const platformFilter = ref('all')
const orderStatusFilter = ref(-1)
const channelOrderNo = ref('')
const searchKeyword = ref('')
const statusFilter = ref('all')
const externalStatusFilter = ref('all')   // 新增：处理状态
const dateRange = ref([])
/* ==================================================
   分页
   ================================================== */
const page = ref(1)
const pageSize = ref(10)
const noMore = ref(false)
const loadingOrders = ref(false)

/* ==================================================
   刷新
   ================================================== */
const refreshing = ref(false)
/* ==================================================
   滚动
   ================================================== */
const orderScrollRef = ref(null)
/* ==================================================
   下拉刷新
   ================================================== */
const pullDistance = ref(0)
const pullThreshold = 70
const isTouching = ref(false)
const touchStartY = ref(0)
const touchStartScrollTop = ref(0)

/* ==================================================
   PC 鼠标下拉
   ================================================== */
const isMouseDown = ref(false)
const mouseStartY = ref(0)
const mouseStartScrollTop = ref(0)
/* ==================================================
   进度弹窗
   ================================================== */
const progressDialogVisible = ref(false)
const currentOrder = ref(null)
const progressTask = ref(null)
const progressLoading = ref(false)
/* ==================================================
   手动操作
   ================================================== */
const verifyCode = ref('')
const executingStep = ref(false)
/*
 * 当前正在请求的步骤
 *
 * 例如点击 STEP 5：
 *
 * executingStepNumber = 5
 *
 * 只有 STEP 5 的按钮显示 loading
 */
const executingStepNumber = ref(0)
const submittingCode = ref(false)
/* ==================================================
   验证码输入框
   ================================================== */
const verifyCodeInputRef = ref(null)
/* ==================================================
   手动矫正结果
   ================================================== */
const correcting = ref(false)      // 弹窗内使用
const correctingId = ref(0)        // 列表按钮 loading 用
/* ==================================================
   当前是否需要验证码
   ================================================== */
const needVerifyCode = computed(() => {

  if (!progressTask.value) {
    return false
  }

  const step =
      Number(
          progressTask.value.current_step || 0
      )

  return step === 3

})

/* ==================================================
   导出 Excel
   ================================================== */
const exporting = ref(false)


/* ==================================================
  是否可以执行当前步骤
  ==================================================

  这里保留这个 computed，
   但是现在步骤按钮不再依赖它。

   每个步骤都可以单独请求。
   ================================================== */
const canExecuteCurrentStep = computed(() => {

  if (!progressTask.value) {
    return false
  }

  if (progressTask.value.waiting_human) {
    return false
  }

  const step =
      Number(
          progressTask.value.current_step || 0
      )

  return step > 0

})


/* ==================================================
  清除订单（仅调后台接口）
   ================================================== */
const clearingId = ref(0)

async function handleClearOrder(item) {
  if (!item) return

  try {
    await ElMessageBox.confirm(
        `确认清除订单「${item.subOrderId}」吗？`,
        '清除订单',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
    )
  } catch (e) {
    return // 用户取消
  }

  clearingId.value = item.id

  try {
    await clearOrder(item.subOrderId)
    ElMessage.success('操作成功')
  } catch (error) {
    console.error('清除订单失败:', error)
    ElMessage.error(
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        error?.message ||
        '清除订单失败'
    )
  } finally {
    clearingId.value = 0
  }
}

/* ==================================================
   订单详情
   ================================================== */
const detailDialogVisible = ref(false)
const detailOrder = ref(null)
const detailLoading = ref(false)
const detailListItem = ref(null)
const detailAutoPush = ref(true)
const detailActiveTab = ref('detail')
const repushLoading = ref(false)

const statusCorrectLoading = ref(false)
const statusCorrectForm = ref({
  status: 2,
  pushUpstream: true,
  note: '',
  password: ''
})

const statusOptions = [
  { label: '处理中', value: 1 },
  { label: '成功', value: 2 },
  { label: '失败', value: 3 }
]

function getCurrentUsername() {
  return authStore.username || localStorage.getItem('username') || ''
}

/** 读取通知跳转携带的订单定位参数。 */
function getQueryOrderKeys() {
  return {
    orderId: String(route.query.orderId || ''),
    subOrderId: String(route.query.subOrderId || ''),
    orderNo: String(route.query.orderNo || '')
  }
}

/** 兼容内部订单 ID、商户订单号、子订单号、外部订单号。 */
function orderMatches(item, keys) {
  const candidates = [
    String(item.id || ''),
    String(item.orderNo || ''),
    String(item.subOrderId || ''),
    String(item.outerOrderId || ''),
    String(item.channelOrderNo || '')
  ]

  return [keys.orderId, keys.subOrderId, keys.orderNo].some((key) => {
    if (!key) return false
    return candidates.some((candidate) =>
      candidate && (candidate === key || candidate.includes(key))
    )
  })
}

/** 通知跳转：带入订单号搜索条件，重新查询后自动打开对应订单详情。 */
async function locateOrderByQuery() {
  const keys = getQueryOrderKeys()
  const keyword = keys.subOrderId || keys.orderNo || keys.orderId
  if (!keyword) return

  // 清掉可能遮挡目标订单的状态/渠道/时间筛选，避免查不到通知订单。
  searchKeyword.value = keyword
  statusFilter.value = 'all'
  externalStatusFilter.value = 'all'
  orderStatusFilter.value = -1
  platformFilter.value = 'all'
  channelOrderNo.value = ''
  dateRange.value = []

  await fetchOrders(true)

  const target = orders.value.find((item) => orderMatches(item, keys))
  if (target) {
    openDetailDialog(target)
    router.replace({ path: route.path, query: {} })
  } else {
    ElMessage.warning('未查询到对应订单，已按订单号筛选')
  }
}

async function openDetailDialog(item, tab = 'detail') {
  if (!item) return

  detailDialogVisible.value = true
  detailListItem.value = item
  detailOrder.value = null
  detailLoading.value = true
  detailAutoPush.value = true
  detailActiveTab.value = tab
  statusLogs.value = []

  try {
    const data = await getOrderDetail(item.id, item.tenantId)

    if (!data?.id) {
      throw new Error('订单详情不存在')
    }

    const financeList = Array.isArray(data.outerFinance)
        ? data.outerFinance
        : []

// 优先使用详情接口，详情没有则读取列表数据
    const meoPayOrder =
        data.meoPayOrder ||
        data.meo_pay_order ||
        item.meoPayOrder ||
        item.meo_pay_order ||
        item.payOrders ||
        ''

    const firstFinance = financeList[0]
    const merchantStatus = Number(data.merchantOrder?.status ?? 0)
    const orderStatus = merchantStatus === 2
        ? 'success'
        : merchantStatus === 3
            ? 'failed'
            : 'processing'

    detailOrder.value = {
      ...data,

      // 保存列表中的充值订单
      meoPayOrder,

      // 基础订单信息
      orderNo: data.orderId || '',
      tenantId: item.tenantId ?? firstFinance?.tenantId ?? '-',

      // 平台从财务流水获取
      platform: firstFinance?.sofPlatform || '',

      // 充值账号：接口没有返回则显示 -
      account: data.merchantOrder?.account || '',

      // 金额
      amount: data.merchantOrder?.orderPrice || 0,
      supplyOuterPrice: data.merchantOrder?.costPrice || 0,

      // 面值
      faceValue: data.meoFaceValue || '',
      faceAmount: Number(firstFinance?.sofPayAmount || 0),

      // 数量
      number: Number(data.number || 0),

      // 订单主状态：以主单 merchantOrder.status 为准
      merchantStatus,
      status: orderStatus,
      statusValue: merchantStatus,

      meoStatus: Number(data.meoStatus || 0),
      meoStatusText: String(data.meo_status_text || data.meoStatusText || ''),
      adminStatus: Number(data.admin_status || 0),
      adminStatusText: String(data.admin_status_text || data.adminStatusText || ''),
      externalStatus: Number(data.external_status || 0),

      // 执行进度
      meoStep: Number(data.meoStep || 0),
      currentStepTitle: getStepTitle(data.meoStep),

      // 其他信息
      note: data.meoNote || '',
      dealerNo: data.merchantOrder?.dealerNo || '',
      createTime: data.createdAt || data.created_at || item.createTime || '',

      // 卡密商品：后端从卡库抽出的卡密（可能是数组或 JSON 字符串）
      camis: normalizeCamis(data.camis),

      // 财务流水
      outerFinance: financeList
    }

    statusOrder.value = detailOrder.value
    loadDetailLogs(detailOrder.value)

  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error(error?.message || '获取订单详情失败')
  } finally {
    detailLoading.value = false
  }
}

async function refreshDetailAfterAction() {
  await refreshOrders()

  if (detailListItem.value) {
    await openDetailDialog(detailListItem.value)
  }
}

function openStatusCorrectDialog() {
  if (!detailOrder.value?.orderNo) return

  statusCorrectForm.value = {
    status: detailOrder.value.merchantStatus || 1,
    pushUpstream: detailAutoPush.value,
    note: '',
    password: ''
  }
  detailActiveTab.value = 'correct'
}

async function submitStatusCorrect() {
  if (!detailOrder.value?.orderNo) return

  const form = statusCorrectForm.value

  if (!form.password) {
    ElMessage.warning('请输入登录密码')
    return
  }

  statusCorrectLoading.value = true

  try {
    await adminStatusCorrect({
      order_id: detailOrder.value.orderNo,
      status: Number(form.status),
      password: await encryptPassword(form.password),
      username: getCurrentUsername(),
      push_upstream: !!form.pushUpstream,
      note: form.note || ''
    })

    ElMessage.success('订单状态已更新')
    await refreshDetailAfterAction()
  } catch (error) {
    console.error('修改订单状态失败:', error)
    ElMessage.error(error?.message || '修改订单状态失败')
  } finally {
    statusCorrectLoading.value = false
  }
}

async function openRepushDialog() {
  if (!detailOrder.value?.orderNo) return

  try {
    await ElMessageBox.confirm(
      '确认重新向上游推送当前订单回调吗？该操作不需要输入登录密码。',
      '二次推送',
      {
        confirmButtonText: '确认推送',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  repushLoading.value = true

  try {
    await adminNotifyRepush({
      order_id: detailOrder.value.orderNo,
      username: getCurrentUsername()
    })

    ElMessage.success('二次推送成功')
    await refreshOrders()
  } catch (error) {
    console.error('二次推送失败:', error)
    ElMessage.error(error?.message || '二次推送失败')
  } finally {
    repushLoading.value = false
  }
}

function parseMeoPayOrders(value, externalStatus = 0) {
  if (!value) return []

  let list = value

  if (typeof value === 'string') {
    const str = value.trim()
    if (!str) return []

    // 单独的支付宝账单号，直接作为字符串处理

    // 不能 JSON.parse，否则大整数会丢失精度

    if (/^\d+$/.test(str)) {
      list = [str]
    } else {
      try {
        list = JSON.parse(str)
      } catch {
        list = [str]
      }
    }
  }

  if (!Array.isArray(list)) {
    list = [list]
  }

  const status = Number(externalStatus ?? 0)

  return list
      .map((item, index) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return {
            index: index + 1,
            deviceId: status === 2 ? '05' : '',
            payOrder: String(item),
            merchantOrder: '',
            payStatus: status,
            isLegacy: true
          }
        }

        if (!item || typeof item !== 'object') {
          return null
        }

        return {
          ...item,
          index: index + 1,
          deviceId: item.deviceId || (status === 2 ? '05' : ''),
          payOrder: item.payOrder || '',
          merchantOrder: item.merchantOrder || '',
          payStatus: status,
          isLegacy: true
        }
      })
      .filter(item => item && item.payOrder)
}

/* ==================================================
   解析充值订单
   ================================================== */
const detailPayOrders = computed(() => {
  const order = detailOrder.value

  if (!order) return []

  const financeList = order.outerFinance

  // 新数据：优先使用财务流水
  if (Array.isArray(financeList) && financeList.length > 0) {
    return financeList.map((item, index) => ({
      ...item,
      index: index + 1,
      deviceId: item.sofDeviceId || '',
      payOrder: item.sofPayOrder || '',
      merchantOrder: item.sofMerchantOrder || '',
      payAccount: item.sofPayAccount || (Number(item.sofPayStatus) === 2 ? '05' : ''),
      payAmount: Number(item.sofPayAmount || 0),
      orderAmount: Number(item.sofOrderAmount || 0),
      payStatus: Number(item.sofPayStatus ?? 0),
      payTime: item.sofPayTime || '',
      faceValue: item.sofFaceValue || '',
      isLegacy: false
    }))
  }

  // 老数据：使用 externalStatus 判断状态
  return parseMeoPayOrders(
      order.meoPayOrder,
      order.externalStatus ?? order.external_status ?? 0
  )
})

/* ==================================================
   账单详情弹窗
   ================================================== */

// 是否显示账单
const billDetailVisible = ref(false)

// 当前选择的充值订单
const currentPayOrder = ref(null)

async function handleReplenishClick(pay) {
  if (!pay) return

  if (replenishingId.value) {
    ElMessage.warning('正在补单中，请稍候')
    return
  }

  try {
    await ElMessageBox.confirm(
        `第 ${pay.index} 笔充值失败，确认补单吗？`,
        '补单确认',
        {
          confirmButtonText: '确认补单',
          cancelButtonText: '取消',
          type: 'warning',
          distinguishCancelAndClose: true,
        }
    )
  } catch {
    return
  }

  try {
    await handleReplenishOrder(pay)
  } catch (error) {
    console.error('补单失败:', error)
    ElMessage.error(error?.message || '补单失败')
  }
}

/* ==================================================
   打开账单详情
   ================================================== */
async function openBillDetail(pay, len) {
  if (!pay) {
    ElMessage.warning('充值订单数据不存在')
    return
  }

  // 尚未支付成功
  if (pay.payStatus !== 2) {
    ElMessage.warning('该笔充值尚未支付成功')
    return
  }

  // 成功订单需要具备支付宝交易信息
  // if (!pay.payOrder || !pay.merchantOrder) {
  //   ElMessage.warning('该笔充值缺少支付宝交易信息')
  //   return
  // }

  const order = detailOrder.value

  if (!order) {
    ElMessage.warning('主订单数据不存在')
    return
  }

  let merchantIcon;
  let merchantName;
  let productDesc;
  let payeeName;
  let showOrderAmount;
  let showGameRecharge = true;

  if (order.platform === "soul") {
    ElMessage.warning('不是支付宝充值')
    return
  } else if (order.platform === "eggie") {
    showOrderAmount = true
    merchantIcon = `${import.meta.env.BASE_URL}images/netease.png`
    merchantName = "网易游戏＞"

    const qty = (len > 1) ? 1 : (order.isMultiple) ? order.number : 1

    productDesc = order.faceValue + " X " + qty
    payeeName = "杭州网易雷火科技有限公司"
  } else if (order.platform === "xhs") {
    merchantIcon = `${import.meta.env.BASE_URL}images/xhs.png`
    merchantName = "行吟信息科技（上海）有限公司"
    productDesc = "小红书订单"
    payeeName = "行吟信息科技（上海）有限公司"
    showGameRecharge = false
  }else if (order.platform === "taqu") {
    merchantIcon = `${import.meta.env.BASE_URL}images/taqu.png`
    merchantName = "他趣"
    productDesc = "一笔来自他趣(she)x的订单"
    payeeName = "深圳他趣信息技术有限公司"
    showGameRecharge = false
  }else if (order.platform === "klmb") {
    merchantIcon = `${import.meta.env.BASE_URL}images/klkl.png`
    merchantName = "深圳有咖互动科技有限公司"
    productDesc = "充值["+order.faceAmount+"元得" + order.faceValue +"红豆]"
    payeeName = "深圳有咖互动科技有限公司"
    showGameRecharge = false
  }else if (order.platform === "d5rg") {
    merchantIcon = `${import.meta.env.BASE_URL}images/netease.png`
    merchantName = "网易游戏＞"

    productDesc = order.faceValue + " X " + 1
    payeeName = "杭州网易雷火科技有限公司"
  }else if (order.platform === "mhxy") {
    showOrderAmount = true
    merchantIcon = `${import.meta.env.BASE_URL}images/netease.png`
    merchantName = "网易游戏＞"
    const qty = (len > 1) ? 1 : order.number / order.faceAmount

    productDesc = order.faceValue + " X " + qty
    payeeName = "杭州网易雷火科技有限公司"
  }else if (order.platform === "yjwj_c") {
    merchantIcon = `${import.meta.env.BASE_URL}images/netease.png`
    merchantName = "网易"
    const qty = (len > 1) ? 1 : order.number / order.faceAmount

    productDesc = order.faceValue + " X " + qty
    payeeName = "杭州网易雷火科技有限公司"
  }else if (order.platform === "yjwj_m") {
    showOrderAmount = true
    merchantIcon = `${import.meta.env.BASE_URL}images/netease.png`
    merchantName = "网易"
    const qty = (len > 1) ? 1 : order.number / order.faceAmount

    productDesc = order.faceValue + " X " + qty
    payeeName = "杭州网易雷火科技有限公司"
  }else if (order.platform === "dhxy_m") {
    showOrderAmount = true
    merchantIcon = `${import.meta.env.BASE_URL}images/netease.png`
    merchantName = "网易游戏＞"
    const qty = (len > 1) ? 1 : order.number / order.faceAmount

    productDesc = order.faceValue + " X " + qty
    payeeName = "杭州网易雷火科技有限公司"
  }else if (order.platform === "kuai") {
    merchantIcon = `${import.meta.env.BASE_URL}images/kuai.png`
    merchantName = "快手＞"

    productDesc = "快手充值-" + order.faceValue*10+"快币"
    payeeName = "北京快手科技有限公司"
    showGameRecharge = false
  }else if (order.platform === "douyin") {
    merchantIcon = `${import.meta.env.BASE_URL}images/douyin.png`
    merchantName ="微播"

    productDesc = "钻石充值"
    payeeName = "北京抖音科技有限公司"
    showGameRecharge = false
  }

  currentPayOrder.value = {
    // 商家图标
    merchantIcon: merchantIcon,

    // 商家名称
    merchantName: merchantName,

    // =========================
    // 支付金额
    // =========================
    amount: pay.payAmount,

    // =========================
    // 支付时间
    // =========================
    payTime: order.createTime || '',

    // =========================
    // 商品说明
    // =========================
    productDesc: productDesc,

    // =========================
    // 收款方昵称
    // =========================
    payeeName: payeeName,

    // =========================
    // 支付订单号
    // =========================
    orderNo: pay.payOrder || '',

    // =========================
    // 商家订单号
    // =========================
    merchantOrderNo: pay.merchantOrder || '',

    // =========================
    // 第二个标签
    // =========================
    tag: order.account || '',

    // 控制订单金额是否显示
    showOrderAmount: showOrderAmount,

    // 控制标签
    showGameRecharge: showGameRecharge,

  }

  console.log('查看充值账单:', currentPayOrder.value)

  billDetailVisible.value = true
}

function getPlatformText(platform) {
  if (platform === "soul" ) {
    return  'Soul'
  }else if (platform === "eggie" ) {
    return  '蛋仔派对'
  }else if (platform === "xhs" ) {
    return  '小红书'
  }else if (platform === "taqu" ) {
    return  '他趣'
  }else if (platform === "klmb" ) {
    return  '克拉漫播'
  }else if (platform === "d5rg" ) {
    return  '第五人格'
  }else if (platform === "mhxy" ) {
    return  '梦幻西游'
  }else if (platform === "yjwj_c" ) {
    return  '永劫无间-直充'
  }else if (platform === "yjwj_m" ) {
    return  '永劫无间-手游'
  }else if (platform === "dhxy_m" ) {
    return  '大话手游'
  }else if (platform === "kuai" ) {
    return  '快手'
  }else if (platform === "douyin" ) {
    return  '抖音钻石'
  }else {
    return  '-'
  }
}

/* ==================================================
   失败订单重新下单
   ================================================== */
const replenishingId = ref(0)

async function handleReplenishOrder(pay) {
  if (!pay || !detailOrder.value) {
    throw new Error('订单数据不存在')
  }

  if (!pay.sofFinanceNo) {
    throw new Error('缺少财务流水号，无法重新下单')
  }

  if (replenishingId.value) {
    return
  }

  const order = detailOrder.value

  replenishingId.value = pay.id || pay.sofFinanceNo

  try {
    const result = await replenishOrder(pay.sofFinanceNo)

    ElMessage.success('重新下单成功')

    // 刷新详情
    await openDetailDialog({
      id: order.id,
      tenantId: order.tenantId,
    })

    return result

  } finally {
    replenishingId.value = 0
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

/**
 * 卡密数据可能以数组或 JSON 字符串返回，统一规范成数组，
 * 供订单详情里的「卡密信息」区块渲染。
 */
function normalizeCamis(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch (e) {
      return []
    }
  }
  return []
}

/* ==================================================
  订单日志（合并进详情弹窗 Tab）
   ================================================== */
const statusOrder = ref(null)
const statusLogs = ref([])
const statusLoading = ref(false)

async function fetchStatusLogs(order) {
  const data = await getOrderStatusLogs(order.orderNo, order.tenantId)
  statusLogs.value = Array.isArray(data) ? data : []
}

async function loadDetailLogs(order) {
  statusLoading.value = true
  try {
    await fetchStatusLogs(order)
  } catch (error) {
    console.error('获取订单日志失败:', error)
  } finally {
    statusLoading.value = false
  }
}

async function refreshStatusLog() {
  if (!statusOrder.value) return

  statusLoading.value = true
  try {
    await fetchStatusLogs(statusOrder.value)
    ElMessage.success('已刷新')
  } catch (error) {
    console.error('刷新状态处理过程失败:', error)
    ElMessage.error(
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        error?.message ||
        '刷新失败'
    )
  } finally {
    statusLoading.value = false
  }
}

/* ==================================================
  订单日志 级别 / 时间格式化
   ================================================== */
const LOG_ERROR_WORDS = [
  '失败', '错误', '异常', '超时', '未收到', '未返回', '未响应', '拒绝', '中断', '回滚', '不通过',
]
const LOG_SUCCESS_WORDS = ['成功', '完成', '通过', '正常']
const LOG_WARN_WORDS = ['重试', '跳过', '待处理', '等待', '排队', '取消']

function stripZeroCount(text) {
  return text
      .replace(/(失败|错误|异常)(数|个数|数量)?\s*[=:：]\s*0/g, '')
      .replace(/(失败|错误|异常)(数|个数|数量)\s*0/g, '')
}

function resolveLogLevel(text) {
  const normalized = stripZeroCount(String(text || ''))

  if (LOG_ERROR_WORDS.some((word) => normalized.includes(word))) {
    return 'error'
  }
  if (LOG_SUCCESS_WORDS.some((word) => normalized.includes(word))) {
    return 'success'
  }
  if (LOG_WARN_WORDS.some((word) => normalized.includes(word))) {
    return 'warn'
  }

  return 'info'
}

function parseLogDate(value) {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'number') {
    const stamp = value < 1e11 ? value * 1000 : value
    const date = new Date(stamp)

    return Number.isNaN(date.getTime()) ? null : date
  }

  const raw = String(value).trim()
  const normalized = raw.replace(/\//g, '-').replace(' ', 'T')
  const date = new Date(normalized)

  return Number.isNaN(date.getTime()) ? null : date
}

function pad2(num) {
  return String(num).padStart(2, '0')
}

function formatLogClock(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

function formatLogDateTime(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${formatLogClock(date)}`
}

const statusLogRows = computed(() => {
  const entries = statusLogs.value.map((item) => {
    const date = parseLogDate(item?.createTime)
    const text = item?.note || item?.content || '处理记录'

    return { date, text, level: resolveLogLevel(text) }
  })

  return entries.map((entry) => ({
    level: entry.level,
    text: entry.text,
    time: entry.date ? formatLogDateTime(entry.date) : '--',
  }))
})

/* ==================================================
  外部充值页弹框
   ================================================== */
const externalDialogVisible = ref(false)
const externalUrl = ref('')

const EXTERNAL_PAGE_BASE = 'https://jk.jkwy.cn/card/soul/'

function openExternalPage(item) {
  if (!item) {
    return
  }

  const subOrderId = item.subOrderId || ''
  if (!subOrderId) {
    ElMessage.warning('该订单没有子订单号，无法打开充值页')
    return
  }

  externalUrl.value = `${EXTERNAL_PAGE_BASE}${encodeURIComponent(subOrderId)}`
  externalDialogVisible.value = true
}

/* ==================================================
   搜索过滤
   ================================================== */
const filteredOrders = computed(() => orders.value)

async function fetchStatistics() {
  try {
    const res = await getStatistics()

    totalOrderCount.value = Number(res?.totalOrders || 0)
    todayOrderCount.value = Number(res?.todayOrders || 0)

    // 同步到 statistics，触发视图更新
    statistics.value = {
      ...statistics.value,
      allOrders: totalOrderCount.value,
      todayOrders: todayOrderCount.value,
    }

  } catch (error) {
    console.error('获取订单统计失败:', error)
    // 这里可以选择不弹错误，避免影响主流程
  }
}


/* ==================================================
   订单状态
   ================================================== */
function getStatus(item) {
  const status = Number(item.status)
  if (status === 2) {
    return 'success'
  }

  if (status === 1) {
    return 'processing'
  }

  return 'failed'

}


/* ==================================================
   状态文字
   ================================================== */

function getStatusText(status) {
  return (
      STATUS_TEXT_MAP[status]
      ||
      '未知状态'
  )

}


/* ==================================================
   Step 名称
   ================================================== */

function getStepTitle(step) {
  const stepNumber = Number(step || 0)
  return (
      STEP_NAME_MAP[stepNumber]
      ||
      '未开始'
  )

}


/* ==================================================
   格式化订单
   ================================================== */

function formatOrder(item) {
  const status = getStatus(item)
  const meoStep = Number(
      item.meo_step || 0
  )

  return {

    id:
    item.id,

    orderNo:
        item.order_id || '',

    outerOrderId:
        item.outer_order_id || '',

    channelOrderNo:
        item.channel_order_no || item.channelOrderNo || '',

    subOrderId:
        item.sub_order_id || '',

    platform:
        item.platform || '',

    payOrders:
        item.pay_orders || '',

    account:
        item.account || '',

    dealerNo:
        item.dealer_no || '',

    amount:
        Number(Number(item.order_price ?? 0).toFixed(4)),
    supplyOuterPrice:
        Number(
            item.supply_outer_price || 0
        ),
    tenantId:
        Number(item.tenant_id || 0),

    // status 为 success/processing/failed 字符串，供首页统计使用
    status,

    // statusValue 为原始数字状态，供状态标签展示使用
    statusValue:
        Number(
            item.statusValue || item.status || 0
        ),

    meoStatus:
        Number(
            item.meo_status || 0
        ),
    meoStatusText:
        String(
            item.meo_status_text || item.meoStatusText || ''
        ),

    adminStatus:
        Number(
            item.admin_status || 0
        ),
    adminStatusText:
        String(
            item.admin_status_text || item.adminStatusText || ''
        ),

    externalStatus:
        Number(
            item.external_status || 0
        ),

    meoStep,

    currentStepTitle:
        getStepTitle(meoStep),

    note:
        item.note || '',

    createTime:
        item.created_at || '',

    faceValue:
        item.face_value || '',

    number:
        item.number || '',

    faceAmount:
        Number(
            item.amount || 0
        ),

    isMultiple:
        item.is_multiple || false


  }
}

// 外部渠道状态（主状态）
function getExternalStatusInfo(status) {
  const map = {
    0: { text: '渠道未处理', type: 'pending' },
    1: { text: '渠道处理中', type: 'processing' },
    2: { text: '渠道成功', type: 'success' },
    3: { text: '渠道失败', type: 'failed' }
  }

  return map[Number(status)] || map[0]
}

// MEO / 后台状态码值兜底映射：后端未返回文案时使用；
// 码位含义待与后端确认后在此补充，未知码位仍回退显示原始数字。
const MEO_STATUS_TEXT_MAP = {}
const ADMIN_STATUS_TEXT_MAP = {}

// 状态文案解析：后端返回的非空文案优先 → 前端码值映射兜底 → 原始码值
function resolveStatusLabel(backendText, code, map) {
  const text = String(backendText ?? '').trim()
  if (text) return text
  const mapped = map?.[Number(code)]
  if (mapped) return mapped
  return code ?? ''
}

// 系统订单状态（辅助状态）
function getOrderStatusInfo(status) {
  const map = {
    1: { text: '订单处理中', type: 'processing' },
    2: { text: '订单成功', type: 'success' },
    3: { text: '订单失败', type: 'failed' }
  }

  return map[Number(status)] || {
    text: '订单未知',
    type: 'pending'
  }
}


/* ==================================================
   获取订单
   ================================================== */
async function fetchOrders(reset = false) {
  if (loadingOrders.value) {
    return
  }

  loadingOrders.value = true

  try {

    if (reset) {
      page.value = 1
      noMore.value = false
    }

    const keyword =
        searchKeyword.value.trim()

    const startTime =
        dateRange.value?.[0]
            ? `${dateRange.value[0]} 00:00:00`
            : ''

    const endTime =
        dateRange.value?.[1]
            ? `${dateRange.value[1]} 23:59:59`
            : ''


    /*
     * -1 全部
     *  1 充值中
     *  2 成功
     *  3 失败
     */

    let orderType = -1

    if (statusFilter.value === 'processing') {
      orderType = 1
    }

    if (statusFilter.value === 'success') {
      orderType = 2
    }

    if (statusFilter.value === 'failed') {
      orderType = 3
    }

    let externalStatus = -1
    switch (externalStatusFilter.value) {
      case 'pending':    externalStatus = 0; break
      case 'processing': externalStatus = 1; break
      case 'success':    externalStatus = 2; break
      case 'failed':     externalStatus = 3; break
    }


    const params = {
      keyword,
      platform: platformFilter.value === 'all' ? '' : platformFilter.value,
      order_status: orderStatusFilter.value,
      channel_order_no: channelOrderNo.value.trim(),
      page_index: page.value,
      page_size: pageSize.value,
      order_type: orderType,
      external_status: externalStatus,
      order_start_time: startTime,
      order_end_time: endTime,
    }


    console.log('查询订单参数:', params)
    const res = await getOrders(params)
    console.log('查询订单结果:', res)

    const list = Array.isArray(res?.list) ? res.list : []
    const total = Number(res?.total || 0)
    const formattedList = list.map(formatOrder)

    // 服务端分页：每次仅展示当前页，不再追加上一页数据
    orders.value = formattedList
    listTotal.value = total

    updateStatistics(orders.value)

  } catch (error) {
    console.error('获取订单失败:', error)
    ElMessage.error(
        error?.response?.data?.message
        ||
        error?.response?.data?.msg
        ||
        error?.message
        ||
        '获取订单失败'
    )
  } finally {
    loadingOrders.value = false
  }

}


/* ==================================================
   统计
   ================================================== */

function updateStatistics(list) {

  const all = Number(totalOrderCount.value || 0)
  const success = list.filter(item => item.status === 'success').length
  const processing = list.filter(item => item.status === 'processing').length
  const failed = list.filter(item => item.status === 'failed').length

  statistics.value = {
    allOrders: all,
    todayOrders: Number(todayOrderCount.value || 0),
    successOrders: success,
    processingOrders: processing,
    failedOrders: failed,
    successRate:
        all > 0
            ? Number(
                (
                    success /
                    all *
                    100
                ).toFixed(1)
            )
            : 0,

  }

}


/* ==================================================
   查询
   ================================================== */

async function searchOrders() {
  saveFilters()
  await fetchOrders(true)
  updateTime()

}

/* ==================================================
   重置查询条件resetFilters
   ================================================== */
async function resetFilters() {
  searchKeyword.value = ''
  platformFilter.value = 'all'
  orderStatusFilter.value = -1
  channelOrderNo.value = ''
  statusFilter.value = 'all'
  externalStatusFilter.value = 'all'   // 新增
  dateRange.value = getDefaultDateRange()

  clearFilters()          // 清除本地存储
  await fetchOrders(true) // 自动查询
  updateTime()

  ElMessage.success('已重置查询条件')
}


/* ==================================================
   刷新订单
   ================================================== */

async function refreshOrders() {
  if (refreshing.value) {
    return
  }
  refreshing.value = true

  try {
    await fetchStatistics()
    await fetchOrders(true)
    updateTime()

  } finally {
    refreshing.value = false
  }
}


/* ==================================================
   全部刷新
   ================================================== */

async function refreshAll() {
  if (refreshing.value) {
    return
  }
  refreshing.value = true

  try {
    await fetchStatistics()
    await fetchOrders(true)
    updateTime()
    await nextTick()
    ElMessage.success('数据已更新')
  } finally {
    refreshing.value = false
  }

}


/* ==================================================
   更新时间
   ================================================== */

function updateTime() {

  const now =
      new Date()

  lastUpdateTime.value =
      now.toLocaleTimeString(
          'zh-CN',
          {
            hour12: false,
          }
      )

}


async function handlePageChange(newPage) {
  page.value = newPage
  await fetchOrders(false)
}

async function handlePageSizeChange(newSize) {
  pageSize.value = newSize
  page.value = 1
  await fetchOrders(false)
}

/* ==================================================
   滚动加载
   ================================================== */

function handleScroll(event) {
  const el = event.target
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight
  // 首页使用分页，不再滚动加载
}


/* ==================================================
   Touch Start
   ================================================== */
function handleTouchStart(event) {
  if (!event.touches.length) {
    return
  }

  isTouching.value = true
  touchStartY.value = event.touches[0].clientY
  touchStartScrollTop.value = orderScrollRef.value?.scrollTop || 0
}


/* ==================================================
   Touch Move
   ================================================== */
function handleTouchMove(event) {
  if (!isTouching.value) {
    return
  }

  if (!orderScrollRef.value) {
    return
  }

  const currentY = event.touches[0].clientY
  const diff = currentY - touchStartY.value
  if (touchStartScrollTop.value <= 0 && diff > 0) {
    pullDistance.value = Math.min(diff * 0.55, 100)
  }
}


/* ==================================================
   Touch End
   ================================================== */
async function handleTouchEnd() {

  if (!isTouching.value) {
    return
  }

  isTouching.value = false

  if (pullDistance.value >= pullThreshold) {
    pullDistance.value = pullThreshold
    await refreshOrders()

  }

  pullDistance.value = 0

}


/* ==================================================
   Mouse Down
   ================================================== */
function handleMouseDown(event) {

  if (
      orderScrollRef.value
      &&
      orderScrollRef.value.scrollTop > 0
  ) {
    return
  }

  isMouseDown.value = true
  mouseStartY.value = event.clientY
  mouseStartScrollTop.value = orderScrollRef.value?.scrollTop || 0

}


/* ==================================================
   Mouse Move
   ================================================== */
function handleMouseMove(event) {
  if (!isMouseDown.value) {
    return
  }

  if (!orderScrollRef.value) {
    return
  }

  const diff = event.clientY - mouseStartY.value
  if (mouseStartScrollTop.value <= 0 && diff > 0) {
    pullDistance.value = Math.min(diff * 0.45, 100)
  }

}


/* ==================================================
   Mouse Up
   ================================================== */
async function handleMouseUp() {
  if (!isMouseDown.value) {
    return
  }

  isMouseDown.value = false

  if (pullDistance.value >= pullThreshold) {
    pullDistance.value = pullThreshold
    await refreshOrders()
  }

  pullDistance.value = 0

}


/* ==================================================
   打开充值进度
   ================================================== */
async function openProgressDialog(item) {

  currentOrder.value = item
  progressTask.value = null
  verifyCode.value = ''
  executingStep.value = false
  executingStepNumber.value = 0
  progressDialogVisible.value = true
  progressLoading.value = true

  try {
    const data = await getTask(item.subOrderId)
    console.log('充值步骤:', data)
    if (!data) {
      throw new Error('获取充值步骤失败')
    }


    progressTask.value = data
  } catch (error) {
    console.error('获取充值步骤失败:', error)
    ElMessage.error(error?.message || '获取充值步骤失败')

  } finally {
    progressLoading.value = false
  }

}


/* ==================================================
   手动刷新进度
   ================================================== */

async function refreshProgress() {

  if (!currentOrder.value) {
    return
  }

  progressLoading.value = true

  try {
    const data = await getTask(currentOrder.value.orderNo)
    console.log('刷新充值步骤:', data)


    if (!data) {
      throw new Error('获取充值步骤失败')
    }

    progressTask.value = data

    /*
     * 同步订单列表
     */
    updateCurrentOrderFromTask(data)
    ElMessage.success('进度已刷新')

  } catch (error) {
    console.error('刷新充值进度失败:', error)
    ElMessage.error(error?.message || '刷新充值进度失败')

  } finally {
    progressLoading.value = false
  }
}


/* ==================================================
   根据 Task 更新订单列表
   ================================================== */

function updateCurrentOrderFromTask(task) {

  if (!currentOrder.value) {
    return
  }


  const order = orders.value.find(
      item =>
          String(item.id)
          ===
          String(
              currentOrder.value.id
          )
  )

  if (!order) {
    return
  }


  /*
   * current_step
   */

  if (task.current_step) {

    order.meoStep = Number(task.current_step)

    order.currentStepTitle =
        task.step_name
        ||
        getStepTitle(
            task.current_step
        )

  }


  /*
   * Task status
   */

  if (Number(task.status) === 2) {
    order.status = 'success'
    order.statusValue = 2
  } else if (Number(task.status) === 0) {

    order.status = 'processing'
    order.statusValue = 1
  }

  currentOrder.value =
      {
        ...currentOrder.value,
        ...order,
      }


  updateStatistics(
      orders.value
  )

}


/* ==================================================
   获取前端展示的步骤状态
   ================================================== */
function getDisplayStepStatus(step) {
  if (!progressTask.value) {
    return (
        step.status ||
        'pending'
    )
  }

  const currentStep = Number(progressTask.value.current_step || 0)
  const runningStep = Number(progressTask.value.running_step || 0)
  const currentStatus = progressTask.value.step_status || ''
  /*
   * 后端明确失败
   */
  if (step.status === 'failed') {
    return 'failed'
  }


  /*
   * 当前步骤正在执行
   */

  if (step.step === runningStep && (
      currentStatus ===
      'running'
      ||
      currentStatus ===
      'processing'
  )
  ) {
    return 'running'
  }


  /*
   * current_step 当前执行步骤
   */

  if (step.step === currentStep && (
      currentStatus ===
      'running'
      ||
      currentStatus ===
      'processing'
  )
  ) {
    return 'running'
  }

  /*
   * 已经执行到后面的步骤
   */
  if (currentStep > 0 && step.step < currentStep) {
    return 'success'
  }

  /*
   * 后端明确成功
   */
  if (step.status === 'success') {
    return 'success'
  }
  return 'pending'
}


/* ==================================================
   Step 状态文字
   ================================================== */

function getStepStatusText(status) {

  const map = {
    success: '已完成',
    running: '处理中',
    processing: '处理中',
    pending: '待处理',
    failed: '失败',

  }


  return (map[status] || '未知')

}


/* ==================================================
   Step 状态 Class
   ================================================== */

function getStepStatusClass(status) {
  return (
      `step-status-${
          status || 'pending'
      }`
  )

}


/* ==================================================
   请求指定步骤
   ==================================================
   重点：
   不再：
   progressTask.current_step
   而是：
   点击哪个 step
   ↓
   executeCurrentStep(step.step)
   ↓
   executeStep(orderNo, step)
   例如：
   点击 STEP 5
   executeStep(orderNo, 5)

   点击 STEP 8
   executeStep(orderNo, 8)
   ================================================== */

async function executeCurrentStep(step) {

  if (!currentOrder.value) {
    return
  }


  if (!progressTask.value) {
    return
  }


  if (progressTask.value.waiting_human) {
    ElMessage.warning('当前任务等待人工处理')
    return
  }
  const currentStep = Number(step || 0)
  if (!currentStep) {
    ElMessage.warning('无效的步骤')
    return
  }


  if (currentStep < 1 || currentStep > 8) {
    ElMessage.warning('步骤范围必须是 1-8')
    return

  }


  /*
   * 第3步不是普通执行，
   * 第3步需要验证码。
   *
   * 这里仍然不调用 executeStep。
   */

  if (currentStep === 3) {
    ElMessage.warning('第 3 步需要提交验证码')
    await nextTick()

    if (verifyCodeInputRef.value && typeof verifyCodeInputRef.value.focus === 'function') {
      verifyCodeInputRef.value.focus()

    }
    return
  }


  /*
   * 防止重复请求
   */

  if (executingStep.value) {
    return
  }

  executingStep.value = true
  executingStepNumber.value = currentStep

  try {
    console.log('请求充值步骤:',
        {
          orderNo:
          currentOrder.value.orderNo,

          step:
          currentStep,
        }
    )

    /*
     * 关键：
     *
     * 这里直接使用点击的 step
     */
    const result =
        await executeStep(
            currentOrder.value.orderNo,
            currentStep
        )

    /*
     * 防止 API 层没有抛异常，
     * 但是返回空数据
     */

    if (!result) {
      throw new Error('执行当前步骤失败')

    }
    ElMessage.success(`第 ${currentStep} 步请求成功`)

    /*
     * 只有请求成功以后才刷新进度
     */

    await refreshProgress()
  } catch (error) {
    console.error('执行步骤失败:', error)
    ElMessage.error(error?.message || '执行步骤失败')

    /*
     * 注意：
     * 这里故意不调用 refreshProgress()
     * 所以如果后端返回：
     * 订单状态不允许充值
     * 页面不会再次自动请求 getTask。
     */

  } finally {
    executingStep.value = false
    executingStepNumber.value = 0
  }
}


/* ==================================================
   提交验证码
   ================================================== */

async function submitVerifyCode() {

  if (!currentOrder.value) {
    return
  }

  const code = verifyCode.value.trim()
  if (!code) {
    ElMessage.warning('请输入验证码')
    return
  }

  submittingCode.value = true

  try {
    await submitRechargeCode(currentOrder.value.orderNo, code)
    ElMessage.success('验证码提交成功')

    verifyCode.value = ''

    /*
     * 提交成功以后刷新一次
     */

    await refreshProgress()
  } catch (error) {
    console.error('提交验证码失败:', error)
    ElMessage.error(error?.message || '提交验证码失败')
  } finally {
    submittingCode.value = false
  }
}

async function exportToExcel() {
  if (exporting.value) return

  // 导出列表里所有已加载的数据
  const list = orders.value

  if (!list.length) {
    ElMessage.warning('当前没有可导出的订单')
    return
  }

  exporting.value = true

  try {
    const dataForExcel = list.map(item => ({
      '订单号': item.orderNo,
      '平台': getPlatformText(item.platform),
      '租户': item.tenantId,
      '充值账号': item.account || '-',
      '金额': Number(item.amount ?? 0).toFixed(4),
      '成本金额': Number(item.supplyOuterPrice || 0),
      '状态': getStatusText(item.status),
      '支付订单号': item.payOrders || '-',
      '子订单号': item.subOrderId || '-',
      '外部订单号': item.outerOrderId || '-',
      '备注': item.note || '-',
      '创建时间': item.createTime || '-',
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel)

    // 列宽，避免表头挤在一起
    worksheet['!cols'] = [
      { wch: 22 }, // 订单号
      { wch: 10 }, // 平台
      { wch: 10 }, // 平台
      { wch: 16 }, // 充值账号
      { wch: 10 }, // 金额
      { wch: 10 }, // 成本金额
      { wch: 10 }, // 状态
      { wch: 24 }, // 支付订单号
      { wch: 22 }, // 子订单号
      { wch: 18 }, // 外部订单号
      { wch: 16 }, // 备注
      { wch: 20 }, // 创建时间
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '充值订单')

    const now = new Date()
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

    XLSX.writeFile(workbook, `充值订单_${ts}.xlsx`)

    ElMessage.success(`已导出 ${list.length} 条订单`)
  } catch (e) {
    console.error('导出 Excel 失败:', e)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

/* ==================================================
   推送执行
   ================================================== */

const pushingId = ref(0)

async function handlePushExecute(item) {
  if (!item) return

  // 必须满足推送条件
  if (item.externalStatus !== 0 || item.meoStatus !== 1) {
    ElMessage.warning('当前订单不符合推送条件')
    return
  }

  // 防止重复推送
  if (pushingId.value) {
    return
  }

  pushingId.value = item.id

  try {
    await pushExecuteOrder(item.subOrderId)

    ElMessage.success('推送执行成功')

    // 推送成功后刷新列表
    await fetchOrders(true)

  } catch (error) {
    console.error('推送执行失败:', error)

    ElMessage.error(
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        error?.message ||
        '推送执行失败'
    )

  } finally {
    pushingId.value = 0
  }
}

/* ==================================================
   手动矫正最终结果
   ==================================================

   规则：
   - meoStep === 8  → 成功
   - meoStep !== 8  → 失败

   仅对「充值中」的订单生效
   ================================================== */
async function handleCorrectResult(item) {

  if (!item) {
    return
  }

  if (item.status !== 'processing') {
    ElMessage.warning('只有充值中的订单才能矫正结果')
    return
  }

  const step = Number(item.meoStep || 0)

  // 步骤到 8 一定成功，不到 8 一定失败
  const finalStatus = step === 8 ? 1 : 2
  const finalText = step === 8 ? '充值成功' : '充值失败'

  try {

    await ElMessageBox.confirm(
        `当前订单步骤 ${step}/8，确认将最终结果矫正为「${finalText}」吗？`,
        '矫正结果',
        {
          confirmButtonText: '确认矫正',
          cancelButtonText: '取消',
          type: 'warning',
        }
    )

  } catch (e) {
    // 用户取消
    return
  }

  correcting.value = true
  correctingId.value = item.id

  try {
    const res = await setResult(item.orderNo, finalStatus, finalText)
    if (!res) {
      throw new Error('矫正结果失败')
    }

    ElMessage.success(`已矫正为${finalText}`)

    // 同步本地列表
    const target = orders.value.find(
        o => String(o.id) === String(item.id)
    )

    if (target) {
      target.status = finalStatus === 1 ? 'success' : 'failed'
      target.statusValue = finalStatus
    }

    // 如果弹窗正开着这个订单，同步弹窗
    if (
        currentOrder.value &&
        String(currentOrder.value.id) === String(item.id)
    ) {
      currentOrder.value = {
        ...currentOrder.value,
        status: finalStatus === 2 ? 'success' : 'failed',
        statusValue: finalStatus,
      }
    }

    // 重新统计
    updateStatistics(orders.value)
  } catch (error) {

    console.error('矫正结果失败:', error)
    ElMessage.error(
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        error?.message ||
        '矫正结果失败'
    )

  } finally {
    correcting.value = false
    correctingId.value = 0
  }

}

/* ==================================================
   Task 状态
   ================================================== */

function getTaskStatusText(status) {
  const value = Number(status)
  if (value === 0) {
    return '任务处理中'
  }

  if (value === 2) {
    return '任务完成'
  }

  if (value === 1) {
    return '任务异常'
  }

  if (value === 3) {
    return '任务失败'
  }

  return '未知状态'

}


/* ==================================================
   Task 状态 Class
   ================================================== */

function getTaskStatusClass(status) {
  const value = Number(status)
  if (value === 0) {
    return 'task-processing'
  }

  if (value === 2) {
    return 'task-success'
  }

  return 'task-failed'

}


/* ==================================================
   Unix 时间
   ================================================== */

function formatStepTime(timestamp) {
  if (!timestamp) {
    return '-'
  }

  const number = Number(timestamp)
  if (!number) {
    return '-'
  }

  return new Date(number * 1000).toLocaleString(
      'zh-CN',
      {
        hour12: false,
      }
  )

}


/* ==================================================
   ISO 时间
   ================================================== */
function formatISOTime(value) {
  if (!value) {
    return '-'
  }
  // 兼容 "2006-01-02 15:04:05"，Safari 需要把空格换成 T
  const normalized = typeof value === 'string' && value.includes(' ')
      ? value.replace(' ', 'T')
      : value
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    return value
  }


  return date.toLocaleString(
      'zh-CN',
      {
        hour12: false,
      }
  )

}


/* ==================================================
   金额
   ================================================== */
function formatMoney(value) {
  return Number(value || 0).toLocaleString(
      'zh-CN',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
  )
}

/* ==================================================
   日期
   ================================================== */
function initDateRange() {
  dateRange.value = getDefaultDateRange()
}

function getDefaultDateRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const today = `${year}-${month}-${day}`
  // dateRange.value = [today, today,]
  return [today, today]
}


/* ==================================================
   Resize
   ================================================== */
function handleResize() {
}


/* ==================================================
   初始化
   ================================================== */

onMounted(async () => {
  updateTime()

  // 先恢复上次的查询条件
  const saved = loadFilters()
  if (saved) {
    searchKeyword.value = saved.searchKeyword || ''
    platformFilter.value = saved.platformFilter || 'all'
    orderStatusFilter.value = saved.orderStatusFilter ?? -1
    channelOrderNo.value = saved.channelOrderNo || ''
    statusFilter.value = saved.statusFilter || 'all'
    externalStatusFilter.value = saved.externalStatusFilter || 'all'   // 新增
    // 日期也恢复
    dateRange.value = Array.isArray(saved.dateRange) && saved.dateRange.length
        ? saved.dateRange
        : getDefaultDateRange()
  } else {
    initDateRange()
  }

  const queryKeys = getQueryOrderKeys()
  const hasOrderQuery = Boolean(
    queryKeys.orderId || queryKeys.subOrderId || queryKeys.orderNo
  )

  if (hasOrderQuery) {
    await locateOrderByQuery()
  } else {
    await Promise.all([
      fetchStatistics(),
      fetchOrders(true),
    ])
  }

  await nextTick()
  stopQueryWatch = watch(() => route.query, locateOrderByQuery)

  window.addEventListener('resize', handleResize)
})


/* ==================================================
   销毁
   ================================================== */

onBeforeUnmount(
    () => {
      if (stopQueryWatch) stopQueryWatch()

      window.removeEventListener(
          'resize',
          handleResize
      )
    }
)

</script>


<style scoped>

/* ==================================================
   页面
   ================================================== */
.home-page {
  width: 100%;
  min-height: 100%;
  padding: 28px 32px 40px;
  margin: 0 auto;
  background:
    radial-gradient(1100px 420px at 82% -8%, rgba(217, 95, 8, 0.08), transparent 62%),
    linear-gradient(180deg, #f7f8fb 0%, #f3f5f8 100%);
}


/* ==================================================
   Header
   ================================================== */

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.eyebrow {
  margin-bottom: 8px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2.4px;
  color: var(--app-accent-strong);
}

.page-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-icon {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 17px;
  background: var(--app-accent-gradient);
  color: #fff;
  font-size: 24px;
  box-shadow:
    0 10px 20px rgba(184, 79, 5, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.title-text {
  min-width: 0;
}

.header-left h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: var(--app-text-primary);
}

.header-left p {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--app-text-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.update-time {
  padding: 6px 11px;
  font-size: 11px;
  color: var(--app-text-muted);
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 999px;
}


/* ==================================================
   Statistics
   ================================================== */

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

.stat-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 22px 22px 20px;
  overflow: hidden;
  background: var(--app-bg-elevated);
  border: 1px solid #e8edf3;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(36, 66, 115, 0.07);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.stat-card:nth-child(1),
.stat-card:nth-child(2) {
  --stat-accent: var(--app-accent-strong);
}

.stat-card:nth-child(3) {
  --stat-accent: #16a34a;
}

.stat-card:nth-child(4) {
  --stat-accent: #d97706;
}

.stat-card:nth-child(5) {
  --stat-accent: #dc2626;
}

.stat-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--stat-accent);
  opacity: 0.16;
}

.stat-card:hover {
  transform: translateY(-3px);
  border-color: var(--app-accent-border);
  box-shadow: 0 14px 30px rgba(36, 66, 115, 0.11);
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  color: var(--app-text-secondary);
}

.stat-icon {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-size: 26px;
  line-height: 1;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.stat-icon.order {
  background: linear-gradient(135deg, #d96a1d, #b84f05);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 8px 18px rgba(184, 79, 5, 0.24);
}

.stat-icon.success {
  background: linear-gradient(135deg, #22c55e, #15803d);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 8px 18px rgba(22, 163, 74, 0.24);
}

.stat-icon.processing {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 8px 18px rgba(217, 119, 6, 0.24);
}

.stat-icon.failed {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 8px 18px rgba(220, 38, 38, 0.24);
}

.stat-value {
  margin-top: 18px;
  font-size: 30px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: 0.2px;
  font-variant-numeric: tabular-nums;
  color: var(--app-text-primary);
}

.stat-bottom {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 20px;
  margin-top: 10px;
  font-size: 11px;
  color: var(--app-text-muted);
}

.success-text {
  color: #15803d;
}


/* ==================================================
   Orders
   ================================================== */

.orders-card {
  overflow: hidden;
  background: var(--app-bg-elevated);
  border: 1px solid #e7ecf3;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(36, 66, 115, 0.07);
}

.orders-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
  padding: 22px 24px 20px;
  border-bottom: 1px solid var(--app-border);
}

.orders-title {
  position: relative;
  padding-left: 12px;
  font-size: 17px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.orders-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 4px;
  height: 16px;
  border-radius: 999px;
  background: var(--app-accent-gradient);
  transform: translateY(-50%);
}

.orders-desc {
  margin-top: 5px;
  font-size: 12px;
  color: var(--app-text-muted);
}

.order-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;   /* 加这个，窄屏自动换行 */
}

.search-input {
  width: 260px;
}

.status-select {
  width: 120px;
  flex-shrink: 0;    /* 防止被压缩 */
}

.date-range {
  width: 280px;
}


/* ==================================================
   Scroll
   ================================================== */

.order-scroll {
  position: relative;
  max-height: 620px;
  overflow-x: auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--app-scrollbar) transparent;
}

.order-scroll::-webkit-scrollbar {
  width: 5px;
  height: 8px;
}

.order-scroll::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background: var(--app-scrollbar);
}


/* ==================================================
   Pull Refresh
   ================================================== */

.pull-refresh {
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 11px;
  color: var(--app-text-muted);
  transition: height 0.2s ease;
}

.pull-refresh .el-icon {
  transition: transform 0.2s ease;
}

.rotate-arrow {
  transform: rotate(180deg);
}


/* ==================================================
   Desktop
   ================================================== */

.desktop-table {
  width: 100%;
  min-width: 1440px;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns:
    210px
    100px
    90px
    160px
    110px
    140px
    180px
    180px
    220px;
  align-items: center;
  column-gap: 0;
  padding: 0 22px;
}

.table-header {
  height: 48px;
  background: var(--app-table-header-bg);
  border-bottom: 1px solid var(--app-border);
}

.table-header .col {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: var(--app-text-secondary);
}

.table-row {
  min-height: 78px;
  border-bottom: 1px solid var(--app-border-light);
  background: var(--app-bg-elevated);
  transition: background 0.18s ease;
}

.table-row:nth-child(odd) {
  background: var(--app-bg-subtle);
}

.table-row:hover {
  background: var(--app-accent-soft);
}

.table-row:last-child {
  border-bottom: 0;
}

.cost {
  font-size: 13px;
  color: var(--app-text-muted);
}

.tenant-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: var(--app-accent-strong);
  background: var(--app-accent-soft);
}

/* ==================================================
   外部充值页弹框
   ================================================== */
.external-iframe-wrap {
  width: 100%;
  height: 70vh;
  overflow: hidden;
  border-radius: 8px;
  background: var(--app-bg-subtle);
}

.external-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.platform-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: var(--app-text-secondary);
  background: var(--app-bg-subtle);
}

.platform-eggie {
  color: var(--app-accent-strong);
  background: var(--app-accent-soft);
}

.order-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  font-variant-numeric: tabular-nums;
}

.order-no {
  font-size: 13px;
  line-height: 1.45;
  font-weight: 600;
  color: var(--app-text-primary);
  overflow-wrap: anywhere;
}

.order-sub-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--app-text-muted);
}

.order-sub-info span {
  max-width: 100%;
  overflow-wrap: anywhere;
}

.account {
  min-width: 0;
  font-size: 13px;
  color: var(--app-text-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.amount {
  font-size: 16px;
  font-variant-numeric: tabular-nums;
  color: var(--app-text-primary);
  white-space: nowrap;
}

.create-time {
  font-size: 12px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
  color: var(--app-text-secondary);
  white-space: nowrap;
}

.table-header .col,
.table-row .col {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  padding: 0 12px;
  text-align: left;
}

.table-header {
  align-items: center;
}

.order-col {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.order-status-group {
  justify-content: center;
}

.time-col,
.time-col .create-time {
  text-align: left;
  justify-content: flex-start;
}


/* ==================================================
   Step
   ================================================== */

.step-info {
  display: flex;
  align-items: center;
  gap: 7px;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 55px;
  height: 22px;
  padding: 0 5px;
  border-radius: 6px;
  font-size: 10px;
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.step-title {
  min-width: 0;
  font-size: 14px;
  color: var(--app-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 双状态容器 */
.order-status-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

/* 外部渠道主状态 */
.channel-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

/* 系统订单辅助状态 */
.order-sub-status {
  font-size: 11px;
  font-weight: 500;
  padding-left: 4px;
}

/* 成功 */
.channel-status.success {
  color: #16a34a;
  background: #dcfce7;
}

.order-sub-status.success {
  color: #16a34a;
}

/* 失败 */
.channel-status.failed {
  color: #dc2626;
  background: #fee2e2;
}

.order-sub-status.failed {
  color: #dc2626;
}

/* 处理中 */
.channel-status.processing {
  color: #d97706;
  background: #fef3c7;
}

.order-sub-status.processing {
  color: #d97706;
}

/* 未处理 */
.channel-status.pending {
  color: var(--app-text-secondary);
  background: var(--app-bg-subtle);
}

.order-sub-status.pending {
  color: var(--app-text-secondary);
}

.channel-status .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}


/* ==================================================
  Status
   ================================================== */

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-radius: 6px;
  font-size: 10px;
  white-space: nowrap;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.status-processing {
  color: var(--app-accent-strong);
  background: var(--app-accent-soft);
}

.status-processing .status-dot {
  background: var(--app-accent);
}

.status-success {
  color: #16a34a;
  background: #effdf4;
}

.status-success .status-dot {
  background: #22c55e;
}

.status-failed {
  color: #dc2626;
  background: #fff1f2;
}

.status-failed .status-dot {
  background: #ef4444;
}

/* 状态可点击 */
.status-clickable {
  cursor: pointer;
  transition: opacity .15s;
}

.status-clickable:hover {
  opacity: .75;
}


/* ==================================================
   Empty
   ================================================== */

.empty-state {
  padding: 50px 0;
}


/* ==================================================
   Load more
   ================================================== */

.load-more {
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 11px;
  color: var(--app-text-muted);
}

.load-line {
  width: 35px;
  height: 1px;
  background: var(--app-border);
}


/* ==================================================
  Progress Dialog
   ================================================== */

.progress-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.progress-dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text-primary);
}


/* ==================================================
  Progress Loading
   ================================================== */

.progress-loading {
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-size: 12px;
  color: var(--app-text-muted);
}


/* ==================================================
   Order Header
   ================================================== */

.progress-order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  margin-bottom: 20px;
  border-radius: 9px;
  background: var(--app-bg-subtle);
}

.progress-order-header > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.progress-order-header > div > span {
  font-size: 10px;
  color: var(--app-text-muted);
}

.progress-order-header strong {
  font-size: 12px;
  color: var(--app-text-primary);
  word-break: break-all;
}


/* ==================================================
   Info
   ================================================== */

.progress-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.progress-info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--app-bg-subtle);
}

.progress-info-item span {
  font-size: 10px;
  color: var(--app-text-muted);
}

.progress-info-item strong {
  font-size: 12px;
  color: var(--app-text-secondary);
  word-break: break-all;
}


/* ==================================================
   Current Step
   ================================================== */

.current-step-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 14px 16px;
  margin-top: 20px;
  border: 1px solid var(--app-border);
  border-radius: 9px;
  background: var(--app-bg-subtle);
}

.current-step-left {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.current-step-label {
  font-size: 10px;
  color: var(--app-text-muted);
}

.current-step-left strong {
  font-size: 13px;
  color: var(--app-text-primary);
}

.current-step-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.current-step-right > span:first-child {
  font-size: 10px;
  color: var(--app-text-muted);
}


/* ==================================================
   Backend Steps
   ================================================== */

.backend-steps {
  margin-top: 28px;
}

.backend-steps-title {
  margin-bottom: 17px;
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.backend-step {
  display: flex;
  gap: 12px;
  /* //min-height: 72px; */
}

.backend-step-node {
  position: relative;
  width: 26px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.backend-step-circle {
  position: relative;
  z-index: 2;

  width: 24px;
  height: 24px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  font-size: 10px;
  color: var(--app-text-muted);
  background: var(--app-bg-subtle);

  border: 1px solid var(--app-border);
}

.backend-step-line {
  position: absolute;

  top: 24px;
  bottom: -1px;

  width: 1px;

  background: var(--app-border);
}


/* ==================================================
  Success
   ================================================== */

.backend-step.success
.backend-step-circle {
  color: #fff;
  background: #22c55e;
  border-color: #22c55e;
}

.backend-step.success
.backend-step-line {
  background: #bbf7d0;
}


/* ==================================================
  Active
   ================================================== */

.backend-step.active
.backend-step-circle {
  color: var(--app-accent);
  background: var(--app-accent-soft);
  border-color: var(--app-accent-border);
  box-shadow:
      0 0 0 4px var(--app-accent-soft);
}


/* ==================================================
   Failed
   ================================================== */

.backend-step.failed
.backend-step-circle {
  color: #fff;
  background: #ef4444;
  border-color: #ef4444;
}


/* ==================================================
   Step Content
   ================================================== */

.backend-step-content {
  flex: 1;
  min-width: 0;
  padding-bottom: 18px;
}

.backend-step-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}


/* ==================================================
   Step Name
   ================================================== */

.backend-step-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.backend-step-index {
  flex-shrink: 0;
  font-size: 12px;
  letter-spacing: 0.5px;
  color: var(--app-text-secondary);
}

.backend-step-top strong {
  font-size: 12px;
  font-weight: 550;
  color: var(--app-text-secondary);
}


/* ==================================================
   Step Actions
   ================================================== */

.backend-step-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.backend-step-actions .el-button {
  min-width: 52px;
}


/* ==================================================
   Step Time
   ================================================== */

.backend-step-time {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 5px;
  font-size: 10px;
  color: var(--app-text-muted);
}


/* ==================================================
   Step Status
   ================================================== */

.task-step-status {
  display: inline-flex;
  align-items: center;
  padding: 3px 7px;
  border-radius: 5px;
  font-size: 9px;
  white-space: nowrap;
}

.step-status-success {
  color: #16a34a;
  background: #effdf4;
}

.step-status-running {
  color: var(--app-accent-strong);
  background: var(--app-accent-soft);
}

.step-status-processing {
  color: var(--app-accent-strong);
  background: var(--app-accent-soft);
}

.step-status-pending {
  color: var(--app-text-muted);
  background: var(--app-bg-subtle);
}

.step-status-failed {
  color: #dc2626;
  background: #fff1f2;
}


/* ==================================================
   Manual Action
   ================================================== */

.manual-action-box {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid var(--app-border);
  border-radius: 9px;
  background: var(--app-bg-subtle);
}

.manual-action-title {
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.verify-action {
  display: flex;
  gap: 10px;
}

.verify-action .el-input {
  flex: 1;
}

.execute-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.execute-desc {
  font-size: 11px;
  color: var(--app-text-muted);
}

.execute-desc strong {
  color: var(--app-text-primary);
}

.execute-finished {
  font-size: 11px;
  color: var(--app-text-muted);
}


/* ==================================================
   Waiting Human
   ================================================== */

.waiting-human-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px;
  margin-top: 20px;
  border-radius: 8px;
  color: #d97706;
  background: #fffbeb;
}

.waiting-human-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: #fef3c7;
}

.waiting-human-box strong {
  display: block;
  font-size: 12px;
}

.waiting-human-box p {
  margin: 4px 0 0;
  font-size: 10px;
  line-height: 1.5;
}


/* ==================================================
   Task Status
   ================================================== */

.task-status-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-top: 12px;
  border-radius: 7px;
  font-size: 10px;
}

.task-status-left {
  display: flex;
  align-items: center;
  gap: 7px;
}

.task-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.task-processing {
  color: var(--app-accent-strong);
  background: var(--app-accent-soft);
}

.task-processing .task-status-dot {
  background: var(--app-accent);
}

.task-success {
  color: #16a34a;
  background: #effdf4;
}

.task-success .task-status-dot {
  background: #22c55e;
}

.task-failed {
  color: #dc2626;
  background: #fff1f2;
}

.task-failed .task-status-dot {
  background: #ef4444;
}

.human-waiting {
  padding: 3px 7px;
  border-radius: 4px;
  color: #d97706;
  background: #fffbeb;
}


/* ==================================================
   更新时间
   ================================================== */

.progress-update-time {
  padding-top: 15px;
  margin-top: 8px;
  border-top: 1px solid var(--app-border);
  font-size: 10px;
  color: var(--app-text-muted);
}

/* ==================================================
   矫正结果
   ================================================== */

.correct-result-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 12px 14px;
  margin-top: 12px;
  border: 1px solid #fde68a;
  border-radius: 8px;
  background: #fffbeb;
}

.correct-result-desc {
  font-size: 11px;
  color: #92400e;
  line-height: 1.6;
}

.correct-result-desc strong {
  font-weight: 600;
}

.text-success {
  color: #16a34a;
}

.text-failed {
  color: #dc2626;
}

/* 列表操作列按钮单行排列，不换行 */
.action-col {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.action-col .el-button {
  flex-shrink: 0;
  margin-left: 0;
  padding-left: 4px;
  padding-right: 4px;
}

/* 手机端操作区两个按钮 */
.mobile-order-action {
  display: flex;
  gap: 8px;
}

.mobile-order-action .el-button {
  flex: 1;
  margin-left: 0;
}


/* ==================================================
   Mobile Orders
   ================================================== */

.mobile-orders {
  display: none;
}

/* ==================================================
   订单详情弹窗
   ================================================== */
.detail-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin-bottom: 4px;
}

.detail-tabs :deep(.el-tabs__header) {
  margin-bottom: 18px;
  flex-shrink: 0;
}

.detail-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--app-border);
}

.detail-tabs :deep(.el-tabs__item) {
  font-size: 13px;
  font-weight: 500;
}

.detail-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.detail-tab-pane {
  min-height: 220px;
}

.detail-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 17px 18px;
  border: 1px solid var(--app-accent-border);
  border-radius: 16px;
  background: linear-gradient(135deg, var(--app-accent-soft), var(--app-bg-elevated) 82%);
  box-shadow: 0 5px 18px rgba(184, 79, 5, 0.06);
}

.detail-order-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.detail-order-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  color: var(--app-accent-contrast);
  background: var(--app-accent-gradient);
  box-shadow: 0 5px 12px rgba(217, 95, 8, 0.18);
  font-size: 19px;
}

.detail-card-order {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.detail-card-order strong {
  font-size: 14px;
  font-weight: 650;
  line-height: 1.45;
  letter-spacing: 0.2px;
  color: var(--app-text-primary);
  word-break: break-all;
}

.detail-card-header .status-tag {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--app-bg-elevated);
  font-size: 12px;
}

.detail-label {
  font-size: 11px;
  line-height: 1.4;
  color: var(--app-text-muted);
}

.detail-section {
  padding: 15px 17px 5px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-bg-elevated);
  box-shadow: 0 3px 12px rgba(31, 45, 61, 0.025);
}

.detail-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 9px;
  border-bottom: 1px solid var(--app-border);
}

.detail-section-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 650;
  color: var(--app-text-primary);
}

.detail-section-mark {
  width: 3px;
  height: 14px;
  border-radius: 3px;
  background: var(--app-accent-gradient);
}

.detail-section-caption {
  font-size: 11px;
  color: var(--app-text-muted);
}

/* 卡密信息：多张卡逐条展示，卡号/卡密用等宽字体便于核对与复制 */
.detail-camis-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0 6px;
}

.detail-camis-item {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-bg-subtle);
  padding: 10px 14px 0;
}

.detail-camis-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0 6px;
}

.detail-camis-index {
  font-size: 12px;
  font-weight: 650;
  color: var(--app-accent);
}

.detail-camis-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-camis-value {
  font-family: 'SF Mono', 'Cascadia Code', Consolas, 'Courier New', monospace;
  letter-spacing: 0.02em;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
}

.detail-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-height: 67px;
  padding: 11px 0;
  border-bottom: 1px solid var(--app-border);
}

.detail-grid-rows .detail-item:nth-last-child(-n + 2) {
  border-bottom-color: transparent;
}

.detail-item strong {
  font-size: 13px;
  font-weight: 550;
  line-height: 1.5;
  color: var(--app-text-primary);
  font-variant-numeric: tabular-nums;
  word-break: break-all;
}

.detail-item-wide {
  grid-column: 1 / -1;
}

.detail-amount-item strong,
.detail-item strong.detail-amount {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.1px;
  color: var(--app-accent-strong);
}

.detail-progress-item {
  min-height: 76px;
  gap: 11px;
  border-bottom: 0;
}

.detail-progress-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-progress-heading strong {
  font-size: 13px;
  font-weight: 650;
  color: var(--app-accent-strong);
}

.detail-progress-step {
  font-weight: 500;
  color: var(--app-text-secondary);
}

.detail-progress-track {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-bg-subtle);
  box-shadow: inset 0 0 0 1px var(--app-border);
}

.detail-progress-track > span {
  display: block;
  height: 100%;
  min-width: 0;
  border-radius: inherit;
  background: var(--app-accent-gradient);
  transition: width 0.3s ease;
}

.detail-code-value {
  width: fit-content;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--app-bg-subtle);
}

.detail-status-value {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  font-weight: 600 !important;
}

.detail-status-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 12%, transparent);
}

.detail-status-value.is-success {
  color: #16a34a;
}

.detail-status-value.is-processing,
.detail-status-value.is-pending {
  color: #d97706;
}

.detail-status-value.is-failed {
  color: #dc2626;
}

.detail-pay-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 13px 14px;
  border: 1px solid var(--app-accent-border);
  border-radius: 8px;
  background: var(--app-accent-soft);
}

.detail-pay-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.detail-pay-value strong {
  font-size: 13px;
  color: var(--app-accent-strong);
  word-break: break-all;
}

.detail-note {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-bg-elevated);
}

.detail-note p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--app-text-secondary);
}

.detail-admin-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid var(--app-border);
}

.detail-auto-push {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-right: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--app-bg-subtle);
}

.detail-auto-push-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.status-correct-form {
  display: flex;
  flex-direction: column;
  padding: 15px 17px 17px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-bg-elevated);
  box-shadow: 0 3px 12px rgba(31, 45, 61, 0.025);
}

.status-correct-current {
  margin-bottom: 2px;
  padding: 11px 14px;
  border: 1px solid var(--app-accent-border);
  border-radius: 10px;
  background: var(--app-accent-soft);
  font-size: 13px;
  font-weight: 600;
  color: var(--app-accent-strong);
}

.form-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--app-border);
}

.form-label {
  width: 76px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 32px;
  color: var(--app-text-primary);
}

.form-row .el-input,
.form-row .el-radio-group {
  flex: 1;
}

.form-tip {
  margin-left: 10px;
  font-size: 12px;
  line-height: 32px;
  color: var(--app-text-muted);
}

.correct-form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding-top: 4px;
}

.detail-log-section {
  --log-success: #15803d;
  --log-error: #b91c1c;
  --log-warn: #b45309;
  --log-info: #64748b;
  --log-line: #dfe3e9;

  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 15px 17px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-bg-elevated);
  box-shadow: 0 3px 12px rgba(31, 45, 61, 0.025);
}

.log-pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--app-border);
}

.log-pane-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 650;
  color: var(--app-text-primary);
}

.log-pane-title::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: 3px;
  background: var(--app-accent-gradient);
}

.log-pane-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-pane-count {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--app-text-muted);
}

/* ==================================================
   订单日志列表
   ================================================== */

.order-log-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-flow {
  max-height: 100%;
  padding: 2px 4px 0 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--app-border) transparent;
}

.order-flow::-webkit-scrollbar {
  width: 6px;
}

.order-flow::-webkit-scrollbar-track {
  background: transparent;
}

.order-flow::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: var(--app-border);
}

.order-flow::-webkit-scrollbar-thumb:hover {
  background: var(--app-scrollbar-hover);
}

.order-flow-item {
  display: flex;
  gap: 11px;
  border-radius: 8px;
  transition: background-color 0.15s ease;
}

.order-flow-item:hover {
  background: var(--app-bg-hover);
}

.order-flow-node {
  position: relative;
  width: 24px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.order-flow-circle {
  position: relative;
  z-index: 2;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  color: #fff;
  background: var(--log-info);
}

.order-flow-circle .el-icon {
  font-size: 12px;
}

.order-flow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  opacity: 0.92;
}

.order-flow-line {
  position: absolute;
  top: 24px;
  bottom: -1px;
  width: 1px;
  background: var(--log-line);
}

.order-flow-body {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 3px 8px 16px 0;
}

.order-flow-text {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--app-text-secondary);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.order-flow-time {
  flex-shrink: 0;
  padding-top: 1px;
  font-size: 11px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--app-text-muted);
}

.order-flow-item.is-success .order-flow-circle {
  background: var(--log-success);
}

.order-flow-item.is-warn .order-flow-circle {
  background: #d97706;
}

.order-flow-item.is-error .order-flow-circle {
  background: var(--log-error);
}

.order-flow-item.is-error .order-flow-text {
  color: var(--log-error);
  font-weight: 500;
}

.order-flow-item.is-warn .order-flow-text {
  color: var(--log-warn);
}

.order-log-foot {
  padding-top: 8px;
  border-top: 1px solid var(--app-border-light);
  font-size: 11px;
  text-align: center;
  color: var(--app-text-muted);
}

/* ==================================================
   订单详情加载状态
   ================================================== */

.detail-loading {
  min-height: 260px;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 12px;

  color: var(--app-text-muted);
  font-size: 13px;
}

.detail-loading .el-icon {
  font-size: 26px;
  color: var(--app-accent);
}

.channel-input {
  width: 180px;
  flex-shrink: 0;
}

/* ==================================================
   平台筛选
   ================================================== */

.platform-select {
  width: 145px;
  flex-shrink: 0;
}


/* ==================================================
   Tablet
   ================================================== */

@media (max-width: 1100px) {

  .statistics-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .orders-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 15px;
    padding: 18px 22px;
  }

  .order-tools {
    width: 100%;
    flex-wrap: wrap;
  }

}


/* ==================================================
   Mobile
   ================================================== */

@media (max-width: 700px) {
  .platform-select {
    width: 100%;
    grid-column: 1 / -1;
  }

  .page-header {
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 20px;
  }

  .header-left h1 {
    font-size: 23px;
  }

  .header-left p {
    font-size: 12px;
  }

  .header-actions {
    gap: 0;
  }

  .update-time {
    display: none;
  }

  .header-actions .el-button {
    padding: 8px 12px;
  }

  :deep(.progress-dialog) {
    width: 94% !important;
    max-width: 94%;
    margin: 0 auto;
  }


  /* Statistics */

  .statistics-grid {
    grid-template-columns:
      repeat(2, 1fr);

    gap: 10px;

    margin-bottom: 12px;
  }

  .stat-card {
    padding: 15px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-icon {
    width: 42px;
    height: 42px;
    font-size: 20px;
  }

  .stat-value {
    margin-top: 14px;
    font-size: 20px;
  }


  /* Orders */

  .orders-card {
    border-radius: 12px;
  }

  .orders-header {
    min-height: auto;
    display: block;
    padding: 17px 15px 14px;
  }

  .order-tools {
    margin-top: 13px;
    display: grid;
    grid-template-columns:
      1fr 105px;
    gap: 8px;
  }

  .search-input {
    grid-column: 1 / -1;   /* 搜索框占满一行 */
  }

  .status-select {
    width: 105px;
  }

  .date-range {
    width: 100%;
    grid-column: 1 / -1;
  }

  .order-tools .el-button {
    width: 100%;
    grid-column: 1 / -1;
  }


  /* Scroll */

  .order-scroll {
    max-height: 650px;
  }


  /* Desktop hidden */

  .desktop-table {
    display: none;
  }


  /* Mobile */

  .mobile-orders {
    display: block;
    padding: 10px 12px;
  }

  .mobile-order-card {
    padding: 15px;
    margin-bottom: 10px;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    background: var(--app-bg-elevated);
    box-shadow:
        0 2px 7px rgba(0, 0, 0, 0.025);
  }

  .mobile-order-card:last-child {
    margin-bottom: 0;
  }

  .mobile-order-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 13px;
    border-bottom: 1px solid #f1f2f4;
  }

  /* ==================================================
   移动端双状态
   ================================================== */

  .mobile-status-group {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 6px;
    flex-shrink: 0;
  }

  /* 外部渠道状态 */
  .mobile-status-group .channel-status {
    font-size: 11px;
    padding: 5px 9px;
    white-space: nowrap;
    border-radius: 6px;
  }

  /* 系统订单状态 */
  .mobile-status-group .order-sub-status {
    font-size: 10px;
    padding-left: 0;
    padding-right: 4px;
    white-space: nowrap;
  }

  .mobile-order-no {
    font-size: 12px;
    font-weight: 550;
    color: var(--app-text-primary);
    word-break: break-all;
  }

  .mobile-order-id {
    margin-top: 4px;
    font-size: 9px;
    color: var(--app-text-muted);
  }

  .mobile-order-content {
    padding: 13px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .mobile-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    font-size: 11px;
  }

  .mobile-info > span {
    flex-shrink: 0;
    color: var(--app-text-muted);
  }

  .mobile-info > strong {
    font-size: 11px;
    font-weight: 500;
    color: var(--app-text-secondary);
    text-align: right;
    word-break: break-all;
  }

  .mobile-amount {
    font-size: 14px !important;
    color: var(--app-text-primary) !important;
  }

  .mobile-note {
    padding: 9px 10px;
    border-radius: 7px;
    font-size: 10px;
    line-height: 1.6;
    color: var(--app-text-secondary);
    background: var(--app-bg-subtle);
  }

  .mobile-order-action {
    padding-top: 12px;
    border-top: 1px solid #f1f2f4;
  }

  .mobile-order-action .el-button {
    width: 100%;
  }


  /* Progress */

  .progress-info-grid {
    grid-template-columns: 1fr;
  }

  .current-step-box {
    align-items: flex-start;
    flex-direction: column;
  }

  .current-step-right {
    width: 100%;
    justify-content: space-between;
  }


  /*
   * 手机端步骤操作
   */

  .backend-step-top {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .backend-step-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .backend-step-name {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .backend-step-time {
    flex-direction: column;
    gap: 3px;
  }

  .verify-action {
    flex-direction: column;
  }

  .execute-action {
    align-items: stretch;
    flex-direction: column;
  }

  .execute-action .el-button {
    width: 100%;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-grid-rows .detail-item {
    border-bottom-color: var(--app-border);
  }

  .detail-grid-rows .detail-item:last-child {
    border-bottom-color: transparent;
  }

  .detail-card-header {
    align-items: flex-start;
    gap: 10px;
    padding: 14px;
  }

  .detail-order-icon {
    width: 34px;
    height: 34px;
  }

  .detail-section,
  .detail-recharge-section,
  .detail-log-section {
    padding-left: 14px;
    padding-right: 14px;
  }

  .detail-section-caption,
  .detail-recharge-desc {
    display: none;
  }

  .detail-progress-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .channel-input {
    grid-column: 1 / -1;
    width: 100%;
  }
}


/* ==================================================
   Small
   ================================================== */
@media (max-width: 380px) {
  .statistics-grid {
    gap: 8px;
  }
  .stat-card {
    padding: 13px;
  }
  .stat-icon {
    width: 38px;
    height: 38px;
    font-size: 18px;
  }
  .stat-value {
    font-size: 18px;
  }
  .status-select {
    width: 95px;
  }
}

.status-tag {
  background: transparent;
  border: 1px solid currentColor;
  padding: 3px 8px;
}

/* ==================================================
   充值订单列表
   ================================================== */

.detail-recharge-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px 17px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-bg-elevated);
  box-shadow: 0 3px 12px rgba(31, 45, 61, 0.025);
}

/* 标题 */
.detail-recharge-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--app-border);
}

.detail-recharge-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-recharge-title > span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 650;
  color: var(--app-text-primary);
}

.detail-recharge-title > span::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: 3px;
  background: var(--app-accent-gradient);
}

.detail-recharge-desc {
  font-size: 11px;
  color: var(--app-text-muted);
}

/* 订单列表 */
.detail-recharge-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 单个充值订单 */
.detail-recharge-item {
  padding: 15px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: linear-gradient(
      135deg,
      var(--app-bg-subtle) 0%,
      var(--app-bg-elevated) 100%
  );
  transition: all 0.2s ease;
}

.detail-recharge-item:hover {
  border-color: var(--app-accent-border);
  box-shadow: 0 4px 14px var(--app-accent-soft);
}

/* 头部 */
.recharge-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.recharge-item-title {
  display: flex;
  align-items: center;
  gap: 9px;
}

.recharge-item-title strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-primary);
}

/* 序号 */
.recharge-index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  color: #fff;
  background: var(--app-accent);
  font-size: 12px;
  font-weight: 600;
}

/* 字段 */
.recharge-info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.recharge-info-label {
  width: 78px;
  flex-shrink: 0;
  font-size: 11px;
  line-height: 25px;
  color: var(--app-text-muted);
}

.recharge-info-value {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.recharge-info-value > span {
  font-size: 12px;
  line-height: 25px;
  color: var(--app-text-primary);
  word-break: break-all;
}

.recharge-info-value .el-button {
  flex-shrink: 0;
}

/* 底部操作 */
.recharge-item-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid #edf1f5;
}

.recharge-item-footer .el-button {
  border-radius: 7px;
}

/* 手机端 */
@media (max-width: 700px) {

  .detail-recharge-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .detail-recharge-item {
    padding: 12px;
  }

  .recharge-info-row {
    flex-direction: column;
    gap: 2px;
  }

  .recharge-info-label {
    width: auto;
  }

  .recharge-info-value {
    width: 100%;
  }

  .recharge-item-footer .el-button {
    width: 100%;
  }
}

/* ==================================================
   充值订单 - 简洁版
   ================================================== */

.detail-pay-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 默认：保留原有蓝色风格 */
.detail-pay-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  padding: 14px 16px;

  border: 1px solid var(--app-accent-border);
  border-radius: 10px;

  background: linear-gradient(
      135deg,
      var(--app-bg-subtle) 0%,
      var(--app-bg-elevated) 100%
  );

  transition: all 0.2s ease;
}

.detail-pay-item:hover {
  border-color: var(--app-accent-border);
  box-shadow: 0 4px 14px var(--app-accent-soft);
}

/* 充值失败：红色边框 */
.detail-pay-item-failed {
  border-color: #f56c6c;
  background: linear-gradient(
      135deg,
      #fff5f5 0%,
      var(--app-bg-elevated) 100%
  );
}

.detail-pay-item-failed:hover {
  border-color: #ef4444;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.08);
}

/* 左侧 */
.pay-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

/* 序号 */
.pay-item-index {
  width: 28px;
  height: 28px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  border-radius: 8px;

  background: var(--app-accent);
  color: #ffffff;

  font-size: 12px;
  font-weight: 600;
}

/* 失败序号 */
.pay-index-failed {
  background: #f56c6c;
}

/* 设备信息 */
.pay-item-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.pay-item-label {
  font-size: 11px;
  color: var(--app-text-muted);
}

.pay-item-info strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-primary);
  word-break: break-all;
}

/* 右侧 */
/* 右侧：固定宽度，整体左对齐 */
.pay-item-right {
  display: flex;
  align-items: center;
  justify-content: flex-start;

  width: 180px;
  min-width: 180px;

  gap: 14px;
  flex-shrink: 0;
}

/* 支付状态：固定宽度，保证上下对齐 */
.pay-item-status {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;

  width: 60px;
  flex-shrink: 0;

  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

/* 操作按钮 */
.pay-item-right .el-button {
  margin-left: 0;
  flex-shrink: 0;
}

.pay-status-success {
  color: #16a34a;
}

.pay-status-failed {
  color: #ef4444;
}

.pay-status-processing {
  color: #d97706;
}

/* 手机端 */
@media (max-width: 700px) {
  .detail-pay-item {
    padding: 12px;
  }

  .pay-item-right {
    gap: 8px;
  }

  .pay-item-status {
    font-size: 11px;
  }

  .pay-item-right .el-button {
    font-size: 11px;
    padding: 0;
  }
}

/* ===== 首页专业化视觉（沿用项目原有 Element Plus 风格） ===== */
.home-page { 
  /* background: var(--app-bg-subtle);  */
  min-height: 100%; 
  padding-bottom: 28px; 
}
.home-en { font-size: 19px; font-weight: 500; color: var(--app-text-muted); }
.home-page .page-header { margin-bottom: 24px; }
.home-page .eyebrow { letter-spacing: 2.4px; color: var(--app-accent-strong); }
.home-page .statistics-grid { gap: 18px; margin-bottom: 24px; }
.home-page .stat-card { border: 1px solid #e8edf3; border-radius: 20px; box-shadow: 0 8px 24px rgba(36,66,115,.07); background: var(--app-bg-elevated); }
.home-page .stat-card:nth-child(1) { background: linear-gradient(135deg,var(--app-bg-elevated),#fff7ef); }
.home-page .stat-card:nth-child(2) { background: linear-gradient(135deg,var(--app-bg-elevated),#fff7ef); }
.home-page .stat-card:nth-child(3) { background: linear-gradient(135deg,var(--app-bg-elevated),#f3fcf6); }
.home-page .stat-card:nth-child(4) { background: linear-gradient(135deg,var(--app-bg-elevated),#fffaf1); }
.home-page .stat-card:nth-child(5) { background: linear-gradient(135deg,var(--app-bg-elevated),#fff4f5); }
.home-page .orders-card { border: 1px solid #e7ecf3; border-radius: 20px; box-shadow: 0 10px 30px rgba(36,66,115,.07); background: var(--app-bg-elevated); }
.home-page .order-scroll { overflow-x: auto !important; max-height: none !important; height: auto !important; overscroll-behavior: auto; }
.home-page .home-pagination { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; padding: 18px 20px; border-top: 1px solid var(--app-border); }
.home-page .pagination-total { font-size: 13px; color: var(--app-text-muted); }
.home-page .home-pagination :deep(.el-pagination.is-background .el-pager li.is-active) { background: var(--app-accent); }
@media(max-width: 768px) { .home-page .home-pagination { justify-content: center; } .home-page .home-pagination :deep(.el-pagination__jump) { display: none; } }
</style>

<!-- 深色主题覆盖（非 scoped）：首页统计卡片统一深灰底，浅色模式保持原渐变不变 -->
<style>
html.dark .home-page {
  background: #141518;
}

/* 订单日志：深色下用提亮的语义色，红点/红字不至于糊在深底上 */
html.dark .detail-log-section {
  --log-success: #34d399;
  --log-error: #f87171;
  --log-warn: #fbbf24;
  --log-info: #79828f;
  --log-line: #3f4048;
}

html.dark .home-page .stat-card {
  background: var(--app-bg-elevated) !important;
  border-color: var(--app-border) !important;
}


/* 深色状态标签：浅底改为半透明状态色，避免浅色块在深底上突兀 */
html.dark .channel-status.success,
html.dark .status-success,
html.dark .step-status-success,
html.dark .task-success {
  background: rgba(34, 197, 94, 0.14);
}

html.dark .channel-status.failed,
html.dark .status-failed,
html.dark .step-status-failed,
html.dark .task-failed,
html.dark .detail-pay-item-failed {
  background: rgba(239, 68, 68, 0.12);
}

html.dark .channel-status.processing,
html.dark .human-waiting,
html.dark .waiting-human-box,
html.dark .correct-result-box {
  background: rgba(245, 158, 11, 0.12);
}

html.dark .waiting-human-icon {
  background: rgba(245, 158, 11, 0.18);
}

html.dark .correct-result-box {
  border-color: rgba(245, 158, 11, 0.32);
}

html.dark .correct-result-desc {
  color: #fbbf24;
}
</style>