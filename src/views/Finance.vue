<template>
  <div class="finance-page">
    <!-- =========================
         页面标题
         ========================= -->
    <section class="page-header">
      <div class="header-left">
        <div class="page-title-row">
          <div class="title-icon">
            <el-icon><Wallet /></el-icon>
          </div>

          <div>
            <h1>财务管控</h1>
            <p>记录实际充值流水，统计各手机充值金额，与平台订单金额进行对账</p>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <div class="date-shortcuts">
          <button
              v-for="item in dateOptions"
              :key="item.value"
              class="date-btn"
              :class="{ active: activeDate === item.value }"
              @click="changeDate(item.value)"
          >
            {{ item.label }}
          </button>
        </div>

        <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            class="date-picker"
            @change="handleCustomDate"
        />
      </div>
    </section>

    <!-- =========================
         租户余额概览
         ========================= -->
    <section class="balance-panel" v-loading="balanceLoading">
      <div class="balance-header">
        <div>
          <h2>租户余额</h2>
          <p>{{ balanceInfo.tenantName || balanceInfo.tenantId || '当前租户' }}</p>
        </div>

        <el-button type="primary" @click="openRecharge">
          <el-icon><Plus /></el-icon>
          人工加款
        </el-button>
      </div>

      <div class="balance-metrics">
        <div class="balance-metric balance-metric-main">
          <span class="metric-label">可用额</span>
          <strong class="metric-value metric-value-main">¥{{ formatNumber(balanceInfo.available) }}</strong>
        </div>

        <div class="balance-metric">
          <span class="metric-label">余额</span>
          <strong class="metric-value">¥{{ formatNumber(balanceInfo.balance) }}</strong>
        </div>
      </div>
    </section>

    <!-- =========================
         财务统计卡
         ========================= -->
    <section class="stats-grid">
      <div class="stat-card stat-blue">
        <div class="stat-top">
          <div class="stat-icon">
            <el-icon><Document /></el-icon>
          </div>
          <span class="stat-label">平台订单总额</span>
        </div>

        <div class="stat-value">
          <span class="currency">¥</span>
          {{ formatNumber(summary.orderAmount) }}
        </div>

        <div class="stat-footer">
          <span>所选时间范围内的订单金额</span>
        </div>
      </div>

      <div class="stat-card stat-green">
        <div class="stat-top">
          <div class="stat-icon">
            <el-icon><Wallet /></el-icon>
          </div>
          <span class="stat-label">实际充值总额</span>
        </div>

        <div class="stat-value">
          <span class="currency">¥</span>
          {{ formatNumber(summary.payAmount) }}
        </div>

        <div class="stat-footer">
          <span>手机支付宝实际支付金额</span>
        </div>
      </div>

      <div class="stat-card stat-orange">
        <div class="stat-top">
          <div class="stat-icon">
            <el-icon><Coin /></el-icon>
          </div>
          <span class="stat-label">总差额</span>
        </div>

        <div
            class="stat-value"
            :class="getDiffClass(summary.difference)"
        >
          {{ summary.difference > 0 ? '+' : summary.difference < 0 ? '-' : '' }}
          <span class="currency">¥</span>
          {{ formatNumber(Math.abs(summary.difference)) }}
        </div>

        <div class="stat-footer">
          <span>平台订单金额 - 实际充值金额</span>
        </div>
      </div>

      <div class="stat-card stat-purple">
        <div class="stat-top">
          <div class="stat-icon">
            <el-icon><Tickets /></el-icon>
          </div>
          <span class="stat-label">成功充值笔数</span>
        </div>

        <div class="stat-value">
          {{ formatInteger(summary.totalCount) }}
        </div>

        <div class="stat-footer">
          <span>所选时间范围内的成功充值笔数</span>
        </div>
      </div>

      <div class="stat-card stat-cyan">
        <div class="stat-top">
          <div class="stat-icon">
            <el-icon><Iphone /></el-icon>
          </div>
          <span class="stat-label">充值设备数</span>
        </div>

        <div class="stat-value">
          {{ summary.deviceCount }}
        </div>

        <div class="stat-footer">
          <span>参与充值的手机设备数量</span>
        </div>
      </div>
    </section>

    <!-- =========================
         主内容
         ========================= -->
    <section class="content-card">
      <div class="tabs-header">
        <div class="custom-tabs">
          <div
              v-for="tab in tabs"
              :key="tab.value"
              class="tab-item"
              :class="{ active: activeTab === tab.value }"
              @click="changeTab(tab.value)"
          >
            <el-icon>
              <component :is="tab.icon" />
            </el-icon>

            <span>{{ tab.label }}</span>
          </div>
        </div>

        <el-button
            class="export-btn"
            :loading="exporting"
            :disabled="activeTab !== 'records'"
            @click="handleExport"
        >
          <el-icon v-if="!exporting"><Download /></el-icon>
          导出 Excel
        </el-button>
      </div>

      <!-- =========================
           充值流水
           ========================= -->
      <template v-if="activeTab === 'records'">
        <div class="filter-bar">
          <el-input
              v-model="filters.orderId"
              placeholder="请输入订单号"
              clearable
              class="filter-input"
              @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
              v-model="filters.platform"
              placeholder="全部平台"
              clearable
              class="filter-select"
          >
            <el-option
                v-for="item in platformOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>

          <el-select
              v-model="filters.deviceId"
              placeholder="全部手机设备"
              clearable
              class="filter-select"
          >
            <el-option
                v-for="item in deviceOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>

          <el-select
              v-model="filters.channel"
              placeholder="全部支付渠道"
              clearable
              class="filter-select"
          >
            <el-option label="PC 浏览器" value="pc" />
            <el-option label="Android 手机" value="android" />
          </el-select>

          <el-button
              type="primary"
              @click="handleSearch"
          >
            <el-icon><Search /></el-icon>
            查询
          </el-button>

          <el-button @click="handleReset">
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
        </div>

        <div class="table-container">
          <el-table
              v-loading="loading"
              :data="recordList"
              :row-class-name="getRecordRowClassName"
              stripe
              class="finance-table"
              empty-text="暂无充值流水"
          >
            <el-table-column
                prop="orderId"
                label="订单号"
                min-width="160"
                fixed="left"
            >
                <template #default="{ row }">
                  <span class="order-link">{{ row.orderId }}</span>
                </template>
            </el-table-column>

            <el-table-column
                label="充值平台"
                min-width="125"
            >
              <template #default="{ row }">
                <div class="platform-cell">
                  <span
                      class="platform-icon"
                      :style="{
                        background: getPlatformColor(row.platform)
                      }"
                  >
                    {{ getPlatformIcon(row.platform) }}
                  </span>

                  <span>{{ getPlatformName(row.platform) }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column
                prop="deviceName"
                label="手机设备"
                min-width="120"
            >
              <template #default="{ row }">
                <div class="device-cell">
                  <el-icon><Iphone /></el-icon>
                  <span>{{ row.deviceName }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column
                label="平台订单金额"
                min-width="145"
                align="right"
            >
              <template #default="{ row }">
                <span class="amount-text">
                  ¥{{ formatNumber(row.orderAmount) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column
                label="实际充值金额"
                min-width="145"
                align="right"
            >
              <template #default="{ row }">
                <span class="pay-amount">
                  ¥{{ formatNumber(row.payAmount) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column
                label="差额"
                min-width="115"
                align="right"
            >
              <template #default="{ row }">
                <el-tooltip
                    :content="getDifferenceHint(row)"
                    placement="top"
                >
                  <span
                      class="difference-text"
                      :class="getDiffClass(getDifference(row))"
                  >
                    {{ formatDifference(getDifference(row)) }}
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>

            <el-table-column
                label="允许亏损金额"
                min-width="145"
                align="right"
            >
              <template #default="{ row }">
                <span class="amount-text">
                  ¥{{ formatNumber(row.allowPrice) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column
                label="支付状态"
                width="110"
                align="center"
            >
              <template #default="{ row }">
                <el-tag
                    :type="
          row.payStatus === 2
            ? 'success'
            : row.payStatus === 3
              ? 'danger'
              : row.payStatus === 1
                ? 'warning'
                : 'info'
        "
                    size="small"
                >
                  {{
                    {
                      0: '待确认',
                      1: '处理中',
                      2: '支付成功',
                      3: '支付失败'
                    }[row.payStatus] || '未知'
                  }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column
                prop="payTime"
                label="充值时间"
                min-width="175"
            />

            <el-table-column
                label="操作"
                width="90"
                fixed="right"
                align="center"
            >
              <template #default="{ row }">
                <el-button
                    link
                    type="primary"
                    @click.stop="openDetail(row)"
                >
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="table-footer">
          <span class="total-text">
            共 {{ formatInteger(recordTotal) }} 条记录
          </span>

          <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="recordTotal"
              layout="sizes, prev, pager, next"
              background
              @size-change="loadRecords"
              @current-change="loadRecords"
          />
        </div>
      </template>

      <!-- =========================
           余额流水
           ========================= -->
      <template v-if="activeTab === 'balance'">
        <div class="filter-bar">
          <el-select
            v-model="ledgerFilters.changeType"
            placeholder="全部类型"
            clearable
            class="filter-select"
          >
            <el-option
              v-for="item in changeTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>

          <el-input
            v-model="ledgerFilters.orderId"
            placeholder="请输入订单号"
            clearable
            class="filter-input"
            @keyup.enter="handleLedgerSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-date-picker
            v-model="ledgerFilters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            class="ledger-date-range"
          />

          <el-button type="primary" @click="handleLedgerSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>

          <el-button @click="handleLedgerReset">
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
        </div>

        <div class="table-container">
          <el-table
            v-loading="ledgerLoading"
            :data="ledgerList"
            stripe
            class="finance-table"
            empty-text="暂无余额流水"
          >
            <el-table-column
              prop="createdAt"
              label="时间"
              min-width="160"
              fixed="left"
            />

            <el-table-column label="类型" min-width="120">
              <template #default="{ row }">
                <el-tag
                  :type="row.changeType === 'manual_recharge' ? 'success' : row.changeType === 'order_refund' ? 'warning' : 'info'"
                  effect="light"
                  round
                >
                  {{ row.changeTypeText }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column
              prop="orderId"
              label="订单号"
              min-width="160"
            />

            <el-table-column
              label="变动金额"
              min-width="130"
              align="right"
            >
              <template #default="{ row }">
                <span :class="getLedgerAmountClass(row.amount)">
                  {{ getLedgerAmountText(row.amount) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column
              label="变动前余额"
              min-width="130"
              align="right"
            >
              <template #default="{ row }">
                ¥{{ formatNumber(row.beforeBalance) }}
              </template>
            </el-table-column>

            <el-table-column
              label="变动后余额"
              min-width="130"
              align="right"
            >
              <template #default="{ row }">
                ¥{{ formatNumber(row.afterBalance) }}
              </template>
            </el-table-column>

            <el-table-column
              prop="remark"
              label="备注"
              min-width="180"
              show-overflow-tooltip
            />

            <el-table-column
              prop="operator"
              label="操作人"
              min-width="120"
            />
          </el-table>
        </div>

        <div class="table-footer">
          <span class="total-text">
            共 {{ formatInteger(ledgerTotal) }} 条记录
          </span>

          <el-pagination
            v-model:current-page="ledgerPagination.page"
            v-model:page-size="ledgerPagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="ledgerTotal"
            layout="sizes, prev, pager, next"
            background
            @size-change="loadBalanceLedger"
            @current-change="loadBalanceLedger"
          />
        </div>
      </template>

      <!-- =========================
           设备统计
           ========================= -->
      <template v-if="activeTab === 'devices'">
        <div class="device-section">

          <div class="device-toolbar">
            <div class="device-toolbar-left">
              <h3>设备支出统计</h3>
              <span>按 PC / Android 和设备编号独立统计</span>
            </div>

            <el-button
                type="primary"
                :loading="deviceLoading"
                @click="loadDevices"
            >
              刷新统计
            </el-button>
          </div>

          <el-table
              v-loading="deviceLoading"
              :data="deviceList"
              border
              stripe
              class="finance-table"
          >
            <el-table-column
                label="平台"
                width="110"
                align="center"
            >
              <template #default="{ row }">
                <el-tag :type="row.channel === 'android' ? 'success' : 'primary'">
                  {{ row.channel === 'android' ? 'Android' : 'PC' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column
                prop="deviceId"
                label="设备编号"
                min-width="120"
            />

            <el-table-column label="今日支出" min-width="125" align="right">
              <template #default="{ row }">
                <strong class="amount-primary">
                  ¥{{ formatMoney(row.todayAmount) }}
                </strong>
              </template>
            </el-table-column>

            <el-table-column label="昨日支出" min-width="125" align="right">
              <template #default="{ row }">
                ¥{{ formatMoney(row.yesterdayAmount) }}
              </template>
            </el-table-column>

            <el-table-column label="本周支出" min-width="125" align="right">
              <template #default="{ row }">
                ¥{{ formatMoney(row.weekAmount) }}
              </template>
            </el-table-column>

            <el-table-column label="本月支出" min-width="125" align="right">
              <template #default="{ row }">
                <strong class="amount-primary">
                  ¥{{ formatMoney(row.monthAmount) }}
                </strong>
              </template>
            </el-table-column>

            <el-table-column label="本年支出" min-width="125" align="right">
              <template #default="{ row }">
                ¥{{ formatMoney(row.yearAmount) }}
              </template>
            </el-table-column>

            <el-table-column label="累计支出" min-width="135" align="right">
              <template #default="{ row }">
                <strong class="amount-total">
                  ¥{{ formatMoney(row.totalAmount) }}
                </strong>
              </template>
            </el-table-column>

            <el-table-column
                prop="monthCount"
                label="本月笔数"
                width="110"
                align="center"
            />

            <el-table-column
                label="操作"
                width="180"
                fixed="right"
                align="center"
            >
              <template #default="{ row }">
                <el-button
                    type="primary"
                    link
                    @click="selectTrendDevice(row)"
                >
                  支出趋势
                </el-button>

                <el-button
                    link
                    @click="viewDeviceRecords(row)"
                >
                  查看流水
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 最近7天趋势 -->
          <div class="device-chart-section">
            <div class="device-chart-header">
              <div>
                <h3>最近 7 天支出趋势</h3>
                <p>
                  {{ selectedDeviceText }}
                </p>
              </div>

              <el-select
                  v-model="trendDeviceKey"
                  placeholder="请选择设备"
                  style="width: 220px"
                  @change="loadDeviceTrend"
              >
                <el-option
                    v-for="item in deviceList"
                    :key="`${item.channel}:${item.deviceId}`"
                    :label="`${item.channel.toUpperCase()} / ${item.deviceId}`"
                    :value="`${item.channel}:${item.deviceId}`"
                />
              </el-select>
            </div>

            <div
                v-loading="trendLoading"
                class="device-chart-container"
            >
              <div ref="deviceChartRef" class="device-chart"></div>
            </div>
          </div>

        </div>
      </template>

      <!-- =========================
           每日统计
           ========================= -->
      <template v-if="activeTab === 'daily'">

        <div class="section-description">
          <div>
            <h3>每日充值统计</h3>
            <p>Redis 实时统计 PC / Android 每日实际支付金额与充值笔数</p>
          </div>
        </div>

        <div class="table-container">
          <el-table
              v-loading="dailyLoading"
              :data="dailyList"
              stripe
              class="finance-table"
              empty-text="暂无每日统计"
          >

            <el-table-column
                prop="date"
                label="日期"
                min-width="160"
            />

            <el-table-column
                prop="totalCount"
                label="充值笔数"
                min-width="120"
                align="center"
            />

            <el-table-column
                label="实际充值总额"
                min-width="180"
                align="right"
            >
              <template #default="{ row }">
          <span class="pay-amount">
            ¥{{ formatNumber(row.payAmount) }}
          </span>
              </template>
            </el-table-column>

            <el-table-column
                label="操作"
                width="120"
                align="center"
            >
              <template #default="{ row }">
                <el-button
                    link
                    type="primary"
                    @click="viewDailyRecords(row)"
                >
                  查看流水
                </el-button>
              </template>
            </el-table-column>

          </el-table>
        </div>

      </template>
    </section>

    <!-- =========================
         财务流水详情
         ========================= -->
    <el-drawer
        v-model="detailVisible"
        size="520px"
        class="finance-detail-drawer"
    >
      <template #header>
        <div class="finance-detail-header">
          <span>财务流水详情</span>
          <div class="finance-detail-current">
            <span v-if="detailNavigation.index >= 0">
              第 {{ detailNavigation.index + 1 }} / {{ detailNavigation.total }} 条
            </span>
            <strong>{{ detailRecord?.orderId || detailRecord?.id || '正在切换…' }}</strong>
          </div>
          <div class="finance-detail-nav">
            <el-button
                size="small"
                :disabled="!detailNavigation.prev || detailLoading"
                @click.stop="openDetail(detailNavigation.prev)"
            >
              上一条
            </el-button>
            <el-button
                size="small"
                :disabled="!detailNavigation.next || detailLoading"
                @click.stop="openDetail(detailNavigation.next)"
            >
              下一条
            </el-button>
          </div>
        </div>
      </template>
      <div v-if="detailLoading" class="detail-switch-loading">
        <el-skeleton :rows="6" animated />
      </div>
      <div v-else-if="detailLoadError" class="detail-switch-error">
        {{ detailLoadError }}
      </div>
      <Transition name="finance-record-switch" mode="out-in">
        <div
            v-if="detailRecord && !detailLoading && !detailLoadError"
            :key="String(detailRecord.id)"
            class="detail-content"
        >

        <!-- =========================
             支付金额
             ========================= -->
        <div class="detail-amount-card">

      <span class="detail-amount-label">
        实际支付金额
      </span>

          <div class="detail-main-amount">
            ¥{{ formatNumber(detailRecord.payAmount) }}
          </div>

          <el-tag
              :type="getPayStatusType(detailRecord.payStatus)"
              effect="light"
              round
          >
            {{ getPayStatusText(detailRecord.payStatus) }}
          </el-tag>

        </div>

        <!-- =========================
             金额信息
             ========================= -->
        <div class="detail-section">

          <h4>金额信息</h4>

          <div class="detail-row">
            <span>平台订单金额</span>
            <strong>
              ¥{{ formatNumber(detailRecord.orderAmount) }}
            </strong>
          </div>

          <div class="detail-row">
            <span>实际支付金额</span>
            <strong class="pay-amount">
              ¥{{ formatNumber(detailRecord.payAmount) }}
            </strong>
          </div>

          <div class="detail-row">
            <span>允许亏损金额</span>
            <strong>
              ¥{{ formatNumber(detailRecord.allowPrice) }}
            </strong>
          </div>

          <div class="detail-row">
            <span>订单差额</span>

            <strong
                :class="getDiffClass(getDifference(detailRecord))"
            >
              {{ formatDifference(getDifference(detailRecord)) }}
            </strong>
          </div>

          <div class="detail-row">
            <span>亏损情况</span>

            <el-tag
                v-if="isOverLoss(detailRecord)"
                type="danger"
                size="small"
            >
              超出允许亏损
            </el-tag>

            <el-tag
                v-else-if="Number(detailRecord.payStatus) !== 2"
                type="info"
                size="small"
            >
              未完成支付
            </el-tag>

            <el-tag
                v-else
                type="success"
                size="small"
            >
              正常
            </el-tag>
          </div>

        </div>

        <!-- =========================
             系统订单信息
             ========================= -->
        <div class="detail-section">

          <h4>系统订单信息</h4>

          <div class="detail-row">
            <span>租户 ID</span>
            <strong>
              {{ detailRecord.tenantId }}
            </strong>
          </div>

          <div class="detail-row">
            <span>系统主订单号</span>

            <strong class="trade-no">
              {{ detailRecord.orderId || '-' }}
            </strong>
          </div>

          <div class="detail-row">
            <span>系统子订单号</span>

            <strong class="trade-no">
              {{ detailRecord.subOrderId || '-' }}
            </strong>
          </div>

          <div class="detail-row">
            <span>外部渠道订单号</span>

            <strong class="trade-no">
              {{ detailRecord.outerOrderId || '-' }}
            </strong>
          </div>

          <div class="detail-row">
            <span>充值平台</span>

            <strong>
              {{ getPlatformName(detailRecord.platform) }}
            </strong>
          </div>

        </div>

        <!-- =========================
             支付宝订单信息
             ========================= -->
        <div class="detail-section">

          <h4>支付宝交易信息</h4>

          <div class="detail-row">
            <span>支付宝交易订单号</span>

            <strong class="trade-no">
              {{ detailRecord.payTradeNo || '-' }}
            </strong>
          </div>

          <div class="detail-row">
            <span>支付宝商家订单号</span>

            <strong class="trade-no">
              {{ detailRecord.merchantOrderNo || '-' }}
            </strong>
          </div>

          <div class="detail-row">
            <span>支付状态</span>

            <el-tag
                :type="getPayStatusType(detailRecord.payStatus)"
                size="small"
            >
              {{ getPayStatusText(detailRecord.payStatus) }}
            </el-tag>
          </div>

          <div class="detail-row">
            <span>实际支付时间</span>

            <strong>
              {{ detailRecord.payTime || '-' }}
            </strong>
          </div>

        </div>

        <!-- =========================
             充值渠道与设备
             ========================= -->
        <div class="detail-section">

          <h4>充值渠道与设备</h4>

          <div class="detail-row">
            <span>支付渠道</span>

            <strong>
              {{ getChannelName(detailRecord.channel) }}
            </strong>
          </div>

          <div class="detail-row">
            <span>充值平台</span>

            <strong>
              {{ getPlatformName(detailRecord.platform) }}
            </strong>
          </div>

          <div class="detail-row">
            <span>设备 ID</span>

            <strong class="trade-no">
              {{ detailRecord.deviceId || '-' }}
            </strong>
          </div>

        </div>

        <!-- =========================
             财务流水信息
             ========================= -->
        <div class="detail-section">

          <h4>财务流水信息</h4>

          <div class="detail-row">
            <span>财务流水 ID</span>

            <strong>
              {{ detailRecord.id }}
            </strong>
          </div>

          <div class="detail-row">
            <span>财务流水编号</span>

            <strong class="trade-no">
              {{ detailRecord.financeNo || '-' }}
            </strong>
          </div>

        </div>

      </div>
      </Transition>
    </el-drawer>

    <!-- =========================
         人工加款
         ========================= -->
    <el-dialog
        v-model="rechargeVisible"
        title="人工加款"
        width="460px"
        destroy-on-close
        align-center
    >
      <el-form label-position="top">
        <el-form-item label="加款金额（元）">
          <el-input-number
              v-model="rechargeForm.amount"
              :min="0.01"
              :step="0.01"
              :precision="2"
              controls-position="right"
              style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="加款备注">
          <el-input
            v-model="rechargeForm.remark"
            type="textarea"
            :rows="3"
            maxlength="100"
            show-word-limit
            placeholder="例如：银行转账 2026-11-21"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="rechargeVisible = false">取消</el-button>
        <el-button
            type="primary"
            :loading="rechargeSaving"
            @click="saveRecharge"
        >
          确认加款
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick
} from 'vue'

import * as echarts from 'echarts'

import { ElMessage } from 'element-plus'

import {
  Wallet,
  Document,
  Coin,
  Tickets,
  Iphone,
  Search,
  RefreshRight,
  Download,
  ArrowRight,
  CircleCheckFilled,
  List,
  DataAnalysis,
  Calendar,
  Plus
} from '@element-plus/icons-vue'

import {
  getFinancePage,
  getFinanceStat,
  getFinanceDetail,
  exportFinance,

  getFinanceDeviceStat,
  getFinanceDeviceTrend,
  getFinanceDailyStat,

  tenantBalanceGet,
  tenantBalanceRecharge,
  tenantBalanceLedger
} from '@/api/api.js'

/* =========================
   日期
   ========================= */

const dateOptions = [
  { label: '今日', value: 'today' },
  { label: '昨日', value: 'yesterday' },
  { label: '近7天', value: '7days' },
  { label: '近30天', value: '30days' }
]

const activeDate = ref('today')
const dateRange = ref([])

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')

  return `${y}-${m}-${d}`
}

function changeDate(type) {
  activeDate.value = type

  const today = new Date()
  const start = new Date(today)
  const end = new Date(today)

  if (type === 'yesterday') {
    start.setDate(start.getDate() - 1)
    end.setDate(end.getDate() - 1)
  }

  if (type === '7days') {
    start.setDate(start.getDate() - 6)
  }

  if (type === '30days') {
    start.setDate(start.getDate() - 29)
  }

  dateRange.value = [
    formatDate(start),
    formatDate(end)
  ]

  refreshAll()
}

function handleCustomDate() {
  activeDate.value = ''
  refreshAll()
}

/* =========================
   Tab
   ========================= */

const tabs = [
  { label: '充值流水', value: 'records', icon: List },
  { label: '余额流水', value: 'balance', icon: Coin },
  { label: '设备统计', value: 'devices', icon: DataAnalysis },
  { label: '每日统计', value: 'daily', icon: Calendar }
]

const activeTab = ref('records')

// 离开设备统计时释放旧图表实例；无论通过 Tab 点击还是行内跳转切换，都避免残留旧画布。
watch(activeTab, (tab) => {
  if (tab !== 'devices') {
    clearDeviceChart()
  }
})

async function changeTab(tab) {
  if (activeTab.value === tab) {
    return
  }

  activeTab.value = tab

  // 离开设备统计时释放旧图表实例，避免 v-if 销毁容器后 ECharts 仍绑定旧画布。
  if (tab !== 'devices') {
    clearDeviceChart()
  }

  await nextTick()

  if (tab === 'records') {
    await loadRecords()
  } else if (tab === 'balance') {
    await loadBalanceLedger()
  } else if (tab === 'devices') {
    await loadDevices()
  } else if (tab === 'daily') {
    await loadDaily()
  }
}
/* =========================
   平台
   ========================= */

const platformOptions = [
  { label: 'Soul', value: 'soul', color: '#111827', icon: 'S' },
  { label: '小红书', value: 'xhs', color: '#ff2442', icon: '小' },
  { label: '蛋仔派对', value: 'eggie', color: '#f59e0b', icon: '蛋' },
  { label: '第五人格', value: 'd5rg', color: '#475569', icon: '五' },
  { label: '梦幻西游', value: 'mhxy', color: '#2563eb', icon: '梦' },
  { label: '他趣', value: 'taqu', color: '#dc2626', icon: '他' },
  { label: '克拉漫播', value: 'klmb', color: '#ea580c', icon: '克' },
  { label: '永劫无间-直充', value: 'yjwj_c', color: '#ea580c', icon: '永-C' },
  { label: '永劫无间-手游', value: 'yjwj_m', color: '#ea580c', icon: '永-M' },
  { label: '大话手游', value: 'dhxy_m', color: '#eaa40c', icon: '大话-M' },
  { label: '快手', value: 'kuai', color: '#ea400c', icon: '快' },
  { label: '抖音钻石', value: 'douyin', color: '#494e59', icon: '钻' },
]

function getPlatformName(code) {
  return platformOptions.find(item => item.value === code)?.label || code || '-'
}

function getPlatformColor(code) {
  return platformOptions.find(item => item.value === code)?.color || 'var(--app-accent-strong)'
}

function getPlatformIcon(code) {
  return platformOptions.find(item => item.value === code)?.icon || '充'
}

/* =========================
   状态
   ========================= */

const loading = ref(false)
const dailyLoading = ref(false)
const exporting = ref(false)

const recordList = ref([])
const deviceList = ref([])
const dailyList = ref([])

const recordTotal = ref(0)

const summary = reactive({
  orderAmount: 0,
  payAmount: 0,
  difference: 0,
  totalCount: 0,
  deviceCount: 0,

  pendingCount: 0,
  runningCount: 0,
  successCount: 0,
  failedCount: 0,

  allowPrice: 0,
  profitAmount: 0,
  lossAmount: 0,
  overLossCount: 0
})

const pagination = reactive({
  page: 1,
  pageSize: 20
})

const filters = reactive({
  orderId: '',
  platform: '',
  channel: '',
  deviceId: '',
  payAccount: '',
  tenantId: ''
})

const detailVisible = ref(false)
const detailRecord = ref(null)
const detailLoading = ref(false)
const detailLoadError = ref('')
const activeDetailId = ref('')

function getRecordRowClassName({ row }) {
  return String(row.id) === activeDetailId.value
      ? 'is-active'
      : ''
}

const detailNavigation = computed(() => {
  const index = recordList.value.findIndex(
      row => String(row.id) === activeDetailId.value
  )

  return {
    index,
    total: recordList.value.length,
    prev: index > 0 ? recordList.value[index - 1] : null,
    next: index >= 0 && index < recordList.value.length - 1
        ? recordList.value[index + 1]
        : null
  }
})

/* =========================
   租户余额
   ========================= */

const balanceLoading = ref(false)
const balanceInfo = reactive({
  tenantId: '',
  tenantName: '',
  balance: 0,
  creditBalance: 0,
  frozenBalance: 0,
  available: 0
})

const rechargeVisible = ref(false)
const rechargeSaving = ref(false)
const rechargeForm = reactive({
  amount: null,
  remark: ''
})

const ledgerLoading = ref(false)
const ledgerList = ref([])
const ledgerTotal = ref(0)
const ledgerPagination = reactive({
  page: 1,
  pageSize: 20
})

const ledgerFilters = reactive({
  changeType: '',
  orderId: '',
  dateRange: []
})

const changeTypeOptions = [
  { label: '人工加款', value: 'manual_recharge' },
  { label: '订单扣款', value: 'order_deduct' },
  { label: '订单退回', value: 'order_refund' }
]

const changeTypeMap = {
  manual_recharge: '人工加款',
  order_deduct: '订单扣款',
  order_refund: '订单退回'
}

/* =========================
   数据转换
   ========================= */

function normalizeFinance(item) {
  return {
    ...item,

    // 数据库主键
    id: item.id ?? item.ID,

    // 租户
    tenantId: item.tenantId,

    // 系统订单
    orderId: item.orderId,
    subOrderId: item.subOrderId,
    outerOrderId: item.outerOrderId,

    // 财务流水编号
    financeNo: item.sofFinanceNo,

    // 充值平台
    platform: item.sofPlatform,

    // 支付渠道 pc / android
    channel: item.sofChannel,

    // 设备
    deviceId: item.sofDeviceId,
    deviceName: item.sofDeviceId || '-',

    // 支付宝交易订单
    payTradeNo: item.sofPayOrder,
    merchantOrderNo: item.sofMerchantOrder,

    // 金额
    orderAmount: Number(item.sofOrderAmount || 0),
    payAmount: Number(item.sofPayAmount || 0),
    allowPrice: Number(item.sofAllowPrice || 0),
    difference: Number(item.sofDifference || 0),

    // 支付状态
    payStatus: Number(item.sofPayStatus ?? 0),

    // 支付时间
    payTime: item.sofPayTime
        ? String(item.sofPayTime).replace('T', ' ').substring(0, 19)
        : '-'
  }
}

/* =========================
   Redis 设备统计
   ========================= */

const deviceLoading = ref(false)

const deviceChartRef = ref(null)

// 格式：android:001 或 pc:001
const trendDeviceKey = ref('')

const trendLoading = ref(false)

let deviceChart = null
let chartResizeObserver = null

const selectedDeviceText = computed(() => {
  if (!trendDeviceKey.value) {
    return '请选择设备查看最近 7 天支出趋势'
  }

  const index = trendDeviceKey.value.indexOf(':')

  if (index === -1) {
    return '请选择设备'
  }

  const channel = trendDeviceKey.value.substring(0, index)

  const deviceId = trendDeviceKey.value.substring(index + 1)

  return `${channel.toUpperCase()} / ${deviceId} · 最近 7 天实际支出`
})

// 兼容模板中 formatMoney
function formatMoney(value) {
  return formatNumber(value)
}

// 支付状态
function getPayStatusText(status) {
  switch (Number(status)) {
    case 0:
      return '待确认'
    case 1:
      return '处理中'
    case 2:
      return '支付成功'
    case 3:
      return '支付失败'
    default:
      return '未知状态'
  }
}

// 支付状态颜色
function getPayStatusType(status) {
  switch (Number(status)) {
    case 0:
      return 'info'
    case 1:
      return 'warning'
    case 2:
      return 'success'
    case 3:
      return 'danger'
    default:
      return 'info'
  }
}

// 支付渠道
function getChannelName(channel) {
  switch (channel) {
    case 'pc':
      return 'PC 浏览器'
    case 'android':
      return 'Android 手机'
    default:
      return channel || '-'
  }
}

/* =========================
   主题色工具
   ========================= */

// 读取当前主题下的 CSS 变量；ECharts Canvas 不能直接使用 var()，需要先取成实际颜色值
function getThemeAccent(variable, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  return value || fallback
}

// 将十六进制颜色转为指定透明度的 rgba 字符串，用于图表渐变填充
function hexToRgba(hex, alpha) {
  let h = String(hex || '').replace('#', '')
  if (h.length === 3) {
    h = h.split('').map(char => char + char).join('')
  }
  const num = parseInt(h, 16)
  if (Number.isNaN(num)) {
    return hex
  }
  const red = (num >> 16) & 255
  const green = (num >> 8) & 255
  const blue = num & 255
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

/* =========================
   金额
   ========================= */

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatInteger(value) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function getDifference(row) {
  return Number(
      row.difference ??
      row.sofDifference ??
      (
          Number(row.orderAmount || 0) -
          Number(row.payAmount || 0)
      )
  )
}

function getDifferenceHint(row) {
  return Number(row.payStatus) === 2
      ? '差额 = 平台订单金额 - 实际充值金额；盈亏判断还需结合允许亏损金额。'
      : '差额 = 平台订单金额 - 实际充值金额。支付未成功时，此金额仅供核对，不代表已完成充值或盈亏。'
}

function formatDifference(value) {
  const amount = Math.abs(Number(value || 0))

  if (value > 0) {
    return `+¥${formatNumber(amount)}`
  }

  if (value < 0) {
    return `-¥${formatNumber(amount)}`
  }

  return `¥${formatNumber(0)}`
}

function getDiffClass(value) {
  if (value > 0) return 'diff-positive'
  if (value < 0) return 'diff-negative'
  return 'diff-zero'
}

function maskAccount(account) {
  if (!account) return '-'

  const value = String(account)

  if (value.length <= 7) return value

  return `${value.slice(0, 3)}****${value.slice(-4)}`
}

/* =========================
   设备选项
   ========================= */

const deviceOptions = computed(() => {
  const map = new Map()

  recordList.value.forEach(item => {
    if (item.deviceId) {
      map.set(item.deviceId, item.deviceName)
    }
  })

  return Array.from(map, ([value, label]) => ({
    value,
    label
  }))
})

/* =========================
   请求参数
   ========================= */

function buildParams() {
  const params = {
    pageNum: pagination.page,
    pageSize: pagination.pageSize,

    orderId: filters.orderId.trim(),

    sofPlatform: filters.platform,
    sofChannel: filters.channel,
    sofDeviceId: filters.deviceId,

    tenantId: Number(filters.tenantId || 0),

    startTime: '',
    endTime: ''
  }

  if (dateRange.value?.length === 2) {
    params.startTime = `${dateRange.value[0]} 00:00:00`
    params.endTime = `${dateRange.value[1]} 23:59:59`
  }

  return params
}

/* =========================
   响应解析
   ========================= */

function getResponseData(res) {
  if (res?.code !== undefined && res.code !== 0) {
    throw new Error(res.message || res.msg || '请求失败')
  }

  return res?.data ?? res
}

/* =========================
   财务统计
   ========================= */

async function loadSummary() {
  try {
    const res = await getFinanceStat(buildParams())
    const data = getResponseData(res)

    Object.assign(summary, {
      orderAmount: Number(data.orderAmount || 0),
      payAmount: Number(data.payAmount || 0),
      difference: Number(data.difference || 0),

      // 这里展示成功充值笔数
      totalCount: Number(data.successCount || 0),

      pendingCount: Number(data.pendingCount || 0),
      runningCount: Number(data.runningCount || 0),
      successCount: Number(data.successCount || 0),
      failedCount: Number(data.failedCount || 0),

      allowPrice: Number(data.allowPrice || 0),
      profitAmount: Number(data.profitAmount || 0),
      lossAmount: Number(data.lossAmount || 0),
      overLossCount: Number(data.overLossCount || 0),

      deviceCount: Number(data.deviceCount || 0)
    })
  } catch (err) {
    console.error('加载财务统计失败', err)
    ElMessage.error(err.message || '加载财务统计失败')
  }
}

/* =========================
   财务流水
   ========================= */

async function loadRecords() {
  loading.value = true

  try {
    const res = await getFinancePage(buildParams())
    const data = getResponseData(res)

    // 兼容 total 位于响应顶层或 data 内
    const list = Array.isArray(data)
        ? data
        : (data?.list || [])

    recordTotal.value = Number(
        res?.total ??
        res?.data?.total ??
        data?.total ??
        0
    )

    recordList.value = list.map(normalizeFinance)
  } catch (err) {
    console.error('加载财务流水失败', err)

    recordList.value = []
    recordTotal.value = 0

    ElMessage.error(err.message || '加载财务流水失败')
  } finally {
    loading.value = false
  }
}

/* =========================
   设备统计
   ========================= */

// 当前后端尚未提供设备统计接口。
// 不使用当前页流水计算全量设备统计，避免金额不准确。
/* =========================
   加载 Redis 设备统计
   ========================= */

async function loadDevices() {
  deviceLoading.value = true

  try {
    // Redis 统计不再区分租户和充值业务平台
    const res = await getFinanceDeviceStat({})

    const data = getResponseData(res)

    deviceList.value = Array.isArray(data)
        ? data
        : (data?.list || [])

    // 没有设备
    if (deviceList.value.length === 0) {
      trendDeviceKey.value = ''

      clearDeviceChart()

      return
    }

    // 检查当前选中的设备是否仍然存在
    const exists = deviceList.value.some(item => {
      const key = `${item.channel}:${item.deviceId}`

      return key === trendDeviceKey.value
    })

    // 不存在则默认选择第一台设备
    if (!exists) {
      const first = deviceList.value[0]

      trendDeviceKey.value =
          `${first.channel}:${first.deviceId}`
    }

    await nextTick()

    // 加载当前设备最近 7 天趋势
    await loadDeviceTrend()

  } catch (err) {
    console.error('加载 Redis 设备统计失败', err)

    deviceList.value = []

    trendDeviceKey.value = ''

    clearDeviceChart()

    ElMessage.error(
        err.message || '加载设备统计失败'
    )

  } finally {
    deviceLoading.value = false
  }
}

/* =========================
   Redis 设备最近7天趋势
   ========================= */

async function loadDeviceTrend() {
  if (!trendDeviceKey.value) {
    clearDeviceChart()
    return
  }

  const index = trendDeviceKey.value.indexOf(':')

  if (index === -1) {
    return
  }

  const channel = trendDeviceKey.value.substring(0, index)

  const deviceId = trendDeviceKey.value.substring(index + 1)

  if (!channel || !deviceId) {
    return
  }

  trendLoading.value = true

  try {
    const res = await getFinanceDeviceTrend({
      channel: channel,
      sofDeviceId: deviceId
    })

    const data = getResponseData(res)

    const list = Array.isArray(data)
        ? data
        : (data?.list || [])

    await nextTick()

    renderDeviceChart(list)

  } catch (err) {
    console.error('加载设备趋势失败', err)

    clearDeviceChart()

    ElMessage.error(
        err.message || '加载设备趋势失败'
    )

  } finally {
    trendLoading.value = false
  }
}

function renderDeviceChart(list) {
  if (!deviceChartRef.value) {
    return
  }

  // Tab 切换会通过 v-if 销毁并重建图表容器；旧 ECharts 实例仍绑定已移除的画布。
  // 发现 DOM 不一致时先释放旧实例，避免后续 setOption 画到脱离页面的旧画布上。
  if (deviceChart && deviceChart.getDom() !== deviceChartRef.value) {
    chartResizeObserver?.disconnect()
    chartResizeObserver = null
    deviceChart.dispose()
    deviceChart = null
  }

  if (!deviceChart) {
    deviceChart = echarts.init(deviceChartRef.value)
  }

  const dates = list.map(item => {
    return item.date.substring(5)
  })

  const amounts = list.map(item => {
    return Number(item.amount || 0)
  })

  const counts = list.map(item => {
    return Number(item.count || 0)
  })

  const accentStrong = getThemeAccent('--app-accent-strong', '#b84f05')

  const option = {

    backgroundColor: 'transparent',

    tooltip: {
      trigger: 'axis',

      backgroundColor: '#ffffff',

      borderColor: '#e5e7eb',

      borderWidth: 1,

      textStyle: {
        color: 'var(--app-text-primary)',
        fontSize: 12
      },

      formatter(params) {
        const index = params[0]?.dataIndex ?? 0

        return `
          <div style="padding:4px 2px">
            <div style="font-weight:600;margin-bottom:8px">
              ${list[index]?.date || ''}
            </div>

            <div style="margin-bottom:5px">
              实际支出：
              <strong style="color:var(--app-accent-strong)">
                ¥${formatNumber(amounts[index])}
              </strong>
            </div>

            <div>
              充值笔数：
              <strong>${counts[index]}</strong>
            </div>
          </div>
        `
      }
    },

    grid: {
      left: 20,
      right: 30,
      top: 40,
      bottom: 20,
      containLabel: true
    },

    xAxis: {
      type: 'category',

      boundaryGap: false,

      data: dates,

      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },

      axisTick: {
        show: false
      },

      axisLabel: {
        color: 'var(--app-text-muted)',
        fontSize: 12
      }
    },

    yAxis: {
      type: 'value',

      min: 0,

      splitNumber: 5,

      axisLine: {
        show: false
      },

      axisTick: {
        show: false
      },

      axisLabel: {
        color: '#94a3b8',

        formatter(value) {
          if (value >= 10000) {
            return `${(value / 10000).toFixed(1)}万`
          }

          return value
        }
      },

      splitLine: {
        lineStyle: {
          color: '#f1f5f9',
          type: 'dashed'
        }
      }
    },

    series: [
      {
        name: '实际支出',

        type: 'line',

        smooth: true,

        symbol: 'circle',

        symbolSize: 8,

        showSymbol: false,

        data: amounts,

        lineStyle: {
          width: 3,
          color: accentStrong
        },

        itemStyle: {
          color: accentStrong
        },

        areaStyle: {
          color: new echarts.graphic.LinearGradient(
              0, 0, 0, 1,
              [
                {
                  offset: 0,
                  color: hexToRgba(accentStrong, 0.25)
                },
                {
                  offset: 1,
                  color: hexToRgba(accentStrong, 0.01)
                }
              ]
          )
        },

        emphasis: {
          focus: 'series'
        }
      }
    ]
  }

  deviceChart.setOption(option, true)

  if (!chartResizeObserver) {
    chartResizeObserver = new ResizeObserver(() => {
      deviceChart?.resize()
    })

    chartResizeObserver.observe(deviceChartRef.value)
  }

  deviceChart.resize()
}

/* =========================
   点击设备查看趋势
   ========================= */

async function selectTrendDevice(row) {
  if (!row || !row.channel || !row.deviceId) {
    return
  }

  trendDeviceKey.value = `${row.channel}:${row.deviceId}`

  await loadDeviceTrend()

  await nextTick()

  deviceChartRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  })
}

function clearDeviceChart() {
  chartResizeObserver?.disconnect()
  chartResizeObserver = null

  if (deviceChart) {
    deviceChart.dispose()
    deviceChart = null
  }
}

/* =========================
   每日统计
   ========================= */

// 当前后端尚未提供每日统计接口。
async function loadDaily() {
  dailyLoading.value = true

  try {
    const params = buildParams()

    const res = await getFinanceDailyStat({
      startTime: params.startTime,
      endTime: params.endTime
    })

    const data = getResponseData(res)

    dailyList.value = Array.isArray(data)
        ? data
        : (data?.list || [])

  } catch (err) {
    console.error('加载每日统计失败', err)

    dailyList.value = []

    ElMessage.error(
        err.message || '加载每日统计失败'
    )

  } finally {
    dailyLoading.value = false
  }
}

/* =========================
   租户余额：概览 / 加款 / 流水
   ========================= */

function formatLedgerTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').substring(0, 19)
}

async function loadBalance() {
  balanceLoading.value = true

  try {
    const data = await tenantBalanceGet()
    const balance = Number(data?.balance || 0)
    const creditBalance = Number(data?.creditBalance || 0)
    const frozenBalance = Number(data?.frozenBalance || 0)
    const available = data?.available == null
      ? balance + creditBalance - frozenBalance
      : Number(data.available || 0)

    Object.assign(balanceInfo, {
      tenantId: data?.tenantId ?? '',
      tenantName: data?.tenantName ?? '',
      balance,
      creditBalance,
      frozenBalance,
      available
    })
  } catch (err) {
    console.error('加载租户余额失败', err)
    ElMessage.error(err.message || '加载租户余额失败')
  } finally {
    balanceLoading.value = false
  }
}

function openRecharge() {
  rechargeForm.amount = null
  rechargeForm.remark = ''
  rechargeVisible.value = true
}

async function saveRecharge() {
  const amount = Number(rechargeForm.amount)

  if (!(amount > 0)) {
    ElMessage.warning('加款金额必须大于 0')
    return
  }

  const remark = rechargeForm.remark.trim()

  if (!remark) {
    ElMessage.warning('请填写加款备注')
    return
  }

  rechargeSaving.value = true

  try {
    const res = await tenantBalanceRecharge({
      amount,
      remark
    })

    ElMessage.success(
      `加款成功，余额 ¥${formatNumber(res?.afterBalance ?? balanceInfo.balance)}`
    )

    rechargeVisible.value = false

    await Promise.all([
      loadBalance(),
      loadBalanceLedger()
    ])
  } catch (err) {
    console.error('人工加款失败', err)
    ElMessage.error(err.message || '人工加款失败')
  } finally {
    rechargeSaving.value = false
  }
}

function normalizeLedger(item) {
  return {
    ...item,
    amount: Number(item.amount || 0),
    beforeBalance: Number(item.beforeBalance || 0),
    afterBalance: Number(item.afterBalance || 0),
    orderId: item.orderId || '-',
    remark: item.remark || '-',
    operator: item.operator || '-',
    createdAt: formatLedgerTime(item.createdAt),
    changeType: item.changeType || '',
    changeTypeText: changeTypeMap[item.changeType] || item.changeType || '-'
  }
}

function buildLedgerParams() {
  const params = {
    pageIndex: ledgerPagination.page,
    pageSize: ledgerPagination.pageSize,
    changeType: ledgerFilters.changeType,
    orderId: ledgerFilters.orderId.trim(),
    startTime: '',
    endTime: ''
  }

  if (ledgerFilters.dateRange?.length === 2) {
    params.startTime = `${ledgerFilters.dateRange[0]} 00:00:00`
    params.endTime = `${ledgerFilters.dateRange[1]} 23:59:59`
  }

  return params
}

async function loadBalanceLedger() {
  ledgerLoading.value = true

  try {
    const res = await tenantBalanceLedger(buildLedgerParams())
    const data = getResponseData(res)
    const list = Array.isArray(data)
      ? data
      : (data?.list || [])

    ledgerTotal.value = Number(
      res?.total ??
      res?.data?.total ??
      data?.total ??
      0
    )

    ledgerList.value = list.map(normalizeLedger)
  } catch (err) {
    console.error('加载余额流水失败', err)
    ledgerList.value = []
    ledgerTotal.value = 0
    ElMessage.error(err.message || '加载余额流水失败')
  } finally {
    ledgerLoading.value = false
  }
}

function handleLedgerSearch() {
  ledgerPagination.page = 1
  loadBalanceLedger()
}

function handleLedgerReset() {
  ledgerFilters.changeType = ''
  ledgerFilters.orderId = ''
  ledgerFilters.dateRange = []
  ledgerPagination.page = 1
  loadBalanceLedger()
}

function getLedgerAmountClass(amount) {
  if (amount > 0) return 'ledger-amount-positive'
  if (amount < 0) return 'ledger-amount-negative'
  return ''
}

function getLedgerAmountText(amount) {
  const sign = amount > 0 ? '+' : ''
  return `${sign}¥${formatNumber(amount)}`
}

/* =========================
   查询
   ========================= */

function handleSearch() {
  pagination.page = 1
  refreshAll()
}

function handleReset() {
  filters.orderId = ''
  filters.platform = ''
  filters.channel = ''
  filters.deviceId = ''
  filters.payAccount = ''
  filters.tenantId = ''

  pagination.page = 1

  refreshAll()
}

async function refreshAll() {
  pagination.page = 1

  await Promise.all([
    loadSummary(),
    loadBalance()
  ])

  if (activeTab.value === 'records') {
    await loadRecords()
  } else if (activeTab.value === 'balance') {
    await loadBalanceLedger()
  } else if (activeTab.value === 'devices') {
    await loadDevices()
  } else {
    await loadDaily()
  }
}

/* =========================
   联动
   ========================= */

function viewDeviceRecords(row) {
  filters.orderId = ''
  filters.platform = ''
  filters.channel = row.channel || ''
  filters.deviceId = row.deviceId || ''
  filters.tenantId = ''

  activeTab.value = 'records'

  pagination.page = 1

  loadSummary()
  loadRecords()
}

function viewDailyRecords(row) {
  dateRange.value = [row.date, row.date]
  activeDate.value = ''

  activeTab.value = 'records'
  pagination.page = 1

  loadSummary()
  loadRecords()
}

/* =========================
   详情
   ========================= */

async function openDetail(row) {
  if (!row?.id) {
    ElMessage.error('财务流水ID不存在')
    return
  }

  const requestedId = String(row.id)
  activeDetailId.value = requestedId
  detailRecord.value = null
  detailLoadError.value = ''
  detailLoading.value = true
  detailVisible.value = true

  try {
    const res = await getFinanceDetail({
      id: row.id
    })

    const data = getResponseData(res)
    if (activeDetailId.value !== requestedId) {
      return
    }

    detailRecord.value = normalizeFinance(data)
  } catch (err) {
    console.error('获取财务详情失败', err)
    if (activeDetailId.value === requestedId) {
      detailLoadError.value = err.message || '获取财务详情失败'
      ElMessage.error(err.message || '获取财务详情失败')
    }
  } finally {
    if (activeDetailId.value === requestedId) {
      detailLoading.value = false
    }
  }
}

/* =========================
   Excel 导出
   ========================= */

async function handleExport() {
  if (exporting.value) return

  exporting.value = true

  try {
    const res = await exportFinance(buildParams())

    let blob = null

    if (res instanceof Blob) {
      blob = res
    } else if (res?.data instanceof Blob) {
      blob = res.data
    } else if (res instanceof ArrayBuffer) {
      blob = new Blob([res])
    }

    if (!blob || blob.size === 0) {
      throw new Error('导出文件为空或响应格式错误')
    }

    // 读取文件头，避免把 JSON 错误响应下载成 xlsx
    const header = new Uint8Array(
        await blob.slice(0, 4).arrayBuffer()
    )

    const isXlsx =
        header[0] === 0x50 &&
        header[1] === 0x4B

    if (!isXlsx) {
      const text = await blob.text()

      try {
        const result = JSON.parse(text)

        throw new Error(
            result.message ||
            result.msg ||
            result.error ||
            'Excel 导出失败'
        )
      } catch (err) {
        if (err instanceof SyntaxError) {
          throw new Error('后端未返回有效的 Excel 文件')
        }

        throw err
      }
    }

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url
    link.download = `财务流水_${formatDate(new Date())}.xlsx`

    document.body.appendChild(link)
    link.click()
    link.remove()

    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)

    ElMessage.success('导出成功')
  } catch (err) {
    console.error('财务导出失败：', err)

    ElMessage.error(
        err.message || '导出失败'
    )
  } finally {
    exporting.value = false
  }
}

// 是否超过允许亏损金额
function isOverLoss(row) {
  if (Number(row.payStatus) !== 2) {
    return false
  }

  const difference = Number(getDifference(row))
  const allowPrice = Number(row.allowPrice || 0)

  return difference < -allowPrice
}

/* =========================
   初始化
   ========================= */

onMounted(() => {
  changeDate('today')
})

onBeforeUnmount(() => {
  if (chartResizeObserver) {
    chartResizeObserver.disconnect()
    chartResizeObserver = null
  }

  if (deviceChart) {
    deviceChart.dispose()
    deviceChart = null
  }
})

</script>

<style scoped>
/* ==================================================
   页面
   ================================================== */

.finance-page {
  width: 100%;
  padding: 26px 30px 44px;
  color: var(--app-text-primary);
}

/* ==================================================
   标题
   ================================================== */

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 18px;
}

.page-title-row {
  display: flex;
  align-items: center;
  gap: 13px;
}

.title-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: var(--app-accent);
  font-size: 23px;
  background: var(--app-accent-soft);
}

.page-header h1 {
  margin: 0;
  font-size: 23px;
  font-weight: 650;
  color: var(--app-text-primary);
}

.page-header p {
  margin: 7px 0 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-shortcuts {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-btn {
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-bg-elevated);
  color: var(--app-text-secondary);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.date-btn:hover {
  border-color: var(--app-accent-border);
  color: var(--app-accent);
}

.date-btn.active {
  background: var(--app-accent);
  color: #fff;
  border-color: var(--app-accent);
}

.date-picker {
  width: 250px !important;
}

/* ==================================================
   租户余额概览
   ================================================== */

.balance-panel {
  margin-bottom: 18px;
  padding: 16px 18px;
  border: 1px solid var(--app-border);
  border-radius: 13px;
  background: var(--app-bg-elevated);
}

.balance-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.balance-header h2 {
  margin: 0 0 6px;
  font-size: 18px;
}

.balance-header p {
  margin: 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

.balance-metrics {
  display: grid;
  grid-template-columns: 1.4fr repeat(1, minmax(0, 1fr));
  gap: 16px;
}

.balance-metric {
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
}

.balance-metric-main {
  background: linear-gradient(135deg, var(--app-accent-soft), var(--app-bg-elevated));
}

.metric-label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--app-text-muted);
}

.metric-value {
  font-size: 22px;
  font-weight: 700;
}

.metric-value-main {
  color: var(--app-accent-strong);
}

.ledger-date-range {
  width: 260px;
}

.ledger-amount-positive {
  color: #059669;
  font-weight: 600;
}

.ledger-amount-negative {
  color: #dc2626;
  font-weight: 600;
}

/* ==================================================
   统计卡
   ================================================== */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  min-width: 0;
  padding: 17px 18px;
  border: 1px solid rgba(230, 235, 243, 0.65);
  border-radius: 13px;
  background: var(--app-bg-elevated);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(31, 45, 61, 0.06);
}

.stat-blue {
  background: linear-gradient(135deg, var(--app-bg-elevated) 0%, var(--app-accent-soft) 100%);
}

.stat-green {
  background: linear-gradient(135deg, var(--app-bg-elevated) 0%, #eafaf3 100%);
}

.stat-orange {
  background: linear-gradient(135deg, var(--app-bg-elevated) 0%, #fff5e8 100%);
}

.stat-purple {
  background: linear-gradient(135deg, var(--app-bg-elevated) 0%, #f5efff 100%);
}

.stat-cyan {
  background: linear-gradient(135deg, var(--app-bg-elevated) 0%, var(--app-accent-soft) 100%);
}

.stat-top {
  display: flex;
  align-items: center;
  gap: 11px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 21px;
}

.stat-blue .stat-icon {
  color: #fff;
  background: var(--app-accent-gradient);
}

.stat-green .stat-icon {
  color: #fff;
  background: linear-gradient(135deg, #62dba5, #28c783);
}

.stat-orange .stat-icon {
  color: #fff;
  background: linear-gradient(135deg, #ffc36b, #f59e0b);
}

.stat-purple .stat-icon {
  color: #fff;
  background: linear-gradient(135deg, #ff8a3d, #c95005);
}

.stat-cyan .stat-icon {
  color: #fff;
  background: var(--app-accent-gradient);
}

.stat-label {
  font-size: 13px;
  color: var(--app-text-secondary);
  font-weight: 500;
}

.stat-value {
  margin-top: 14px;
  font-size: clamp(22px, 1.8vw, 30px);
  font-weight: 700;
  color: var(--app-text-primary);
  letter-spacing: -0.5px;
  white-space: nowrap;
}

.stat-blue .stat-value {
  color: var(--app-accent-strong);
}

.stat-green .stat-value {
  color: #059669;
}

.stat-orange .stat-value {
  color: #d97706;
}

.stat-purple .stat-value {
  color: var(--app-accent-strong);
}

.stat-cyan .stat-value {
  color: var(--app-accent-strong);
}

.currency {
  font-size: 18px;
  font-weight: 600;
  margin-right: 2px;
}

.stat-footer {
  margin-top: 8px;
  font-size: 11px;
  color: var(--app-text-muted);
}

/* ==================================================
   主内容
   ================================================== */

.content-card {
  --finance-tabs-height: 58px;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 13px;
  overflow: visible;
}

.tabs-header {
  position: sticky;
  top: 68px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--app-bg-elevated);
  border-bottom: 1px solid var(--app-border);
  border-radius: 12px 12px 0 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.custom-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-item {
  position: relative;
  height: 57px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 18px;
  font-size: 13px;
  color: var(--app-text-muted);
  cursor: pointer;
  transition: color 0.2s;
  white-space: nowrap;
}

.tab-item:hover {
  color: var(--app-accent);
}

.tab-item.active {
  color: var(--app-accent);
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--app-accent);
}

.export-btn {
  color: var(--app-accent);
  border-color: var(--app-accent-border);
}

/* ==================================================
   筛选
   ================================================== */

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 18px 20px;
}

.content-card > .filter-bar {
  position: sticky;
  top: calc(68px + var(--finance-tabs-height));
  z-index: 19;
  background: var(--app-bg-elevated);
  border-bottom: 1px solid var(--app-border);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.035);
}

.filter-input {
  width: 200px;
}

.filter-select {
  width: 155px;
}

.filter-tenant {
  width: 130px;
}

.filter-bar :deep(.el-button + .el-button) {
  margin-left: 0;
}

.finance-detail-header {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.finance-detail-header > span {
  flex: 0 0 auto;
}

.finance-detail-current {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
  font-size: 11px;
  color: var(--app-text-muted);
}

.finance-detail-current strong {
  overflow: hidden;
  color: var(--app-text-primary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.finance-detail-nav {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

/* ==================================================
   表格
   ================================================== */

.table-container {
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box;
}

.finance-table {
  width: 100%;
  font-size: 12px;
}

.finance-table :deep(.el-table__header th) {
  background: var(--app-table-header-bg) !important;
  color: var(--app-text-secondary);
  font-weight: 600;
  height: 46px;
}

.finance-table :deep(.el-table__row td) {
  height: 51px;
}

.finance-table :deep(.el-table__cell) {
  padding: 8px 0;
}

.finance-table :deep(.el-table__body tr.is-active > td.el-table__cell) {
  background-color: color-mix(in srgb, var(--app-accent) 18%, var(--app-bg-elevated)) !important;
  box-shadow: inset 0 1px 0 var(--app-accent-border), inset 0 -1px 0 var(--app-accent-border);
}

.finance-table :deep(.el-table__body tr.is-active > td.el-table__cell:first-child) {
  box-shadow:
      inset 4px 0 0 var(--app-accent),
      inset 0 1px 0 var(--app-accent-border),
      inset 0 -1px 0 var(--app-accent-border);
}

.order-link {
  min-width: 0;
  color: var(--app-accent-strong);
  font-weight: 500;
  cursor: pointer;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}

.order-link:hover {
  text-decoration: underline;
}

.platform-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.platform-icon {
  width: 23px;
  height: 23px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 11px;
  color: #fff;
  font-weight: 600;
}

.device-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--app-text-secondary);
}

.device-cell > .el-icon {
  color: var(--app-accent);
  font-size: 15px;
}

.device-icon-box {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 16px;
}

.device-name {
  font-weight: 500;
  color: var(--app-text-primary);
}

.amount-text {
  color: var(--app-text-primary);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.pay-amount {
  color: var(--app-accent-strong) !important;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.difference-text {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  cursor: help;
}

.diff-positive {
  color: #059669 !important;
}

.diff-negative {
  color: #ef4444 !important;
}

.diff-zero {
  color: var(--app-text-muted) !important;
}

.count-text {
  font-weight: 600;
  color: var(--app-text-primary);
}

/* ==================================================
   分页
   ================================================== */

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.total-text {
  font-size: 12px;
  color: var(--app-text-muted);
}

/* ==================================================
   设备统计 / 每日统计
   ================================================== */

.section-description {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 18px;
}

.section-description h3 {
  margin: 0;
  font-size: 15px;
  color: var(--app-text-primary);
  font-weight: 600;
}

.section-description p {
  margin: 7px 0 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

/* ==================================================
   详情抽屉
   ================================================== */

.detail-content {
  padding: 0 2px 8px;
}

.detail-switch-loading {
  padding: 12px 4px;
}

.detail-switch-error {
  padding: 24px 12px;
  color: var(--app-danger, #ef4444);
  text-align: center;
}

.finance-record-switch-enter-active,
.finance-record-switch-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.finance-record-switch-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.finance-record-switch-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.detail-content .detail-amount-card {
  position: relative;
  margin-bottom: 16px;
  padding: 26px 20px 22px;
  overflow: hidden;
  border: 1px solid var(--app-accent-border);
  border-radius: 16px;
  background: linear-gradient(135deg, var(--app-accent-soft), var(--app-bg-elevated) 85%);
  text-align: center;
}

.detail-content .detail-amount-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 72px;
  height: 3px;
  transform: translateX(-50%);
  border-radius: 0 0 4px 4px;
  background: var(--app-accent);
}

.detail-content .detail-amount-label {
  font-size: 12px;
  letter-spacing: 1px;
  color: var(--app-text-muted);
}

.detail-content .detail-main-amount {
  margin: 10px 0 12px;
  font-size: 34px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 0.5px;
  font-variant-numeric: tabular-nums;
  color: var(--app-accent-strong);
}

.detail-content .detail-amount-card .el-tag {
  padding: 4px 12px;
  border: 0;
  font-size: 11px;
}

.detail-content .detail-section {
  margin-bottom: 14px;
  padding: 15px 16px 4px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-bg-elevated);
}

.detail-content .detail-section h4 {
  margin: 0 0 8px;
  padding-bottom: 11px;
  padding-left: 0;
  border-left: 0;
  border-bottom: 1px solid var(--app-border-light);
  font-size: 13px;
  font-weight: 650;
  color: var(--app-text-primary);
}

.detail-content .detail-section h4::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 13px;
  margin-right: 8px;
  vertical-align: -2px;
  border-radius: 3px;
  background: var(--app-accent);
}

.detail-content .detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 0;
  padding: 10px 0;
  border-bottom: 1px dashed var(--app-border-light);
  font-size: 12px;
  line-height: 1.5;
}

.detail-content .detail-row:last-child {
  border-bottom: 0;
}

.detail-content .detail-row > span {
  flex-shrink: 0;
  padding-top: 1px;
  color: var(--app-text-muted);
}

.detail-content .detail-row > strong {
  min-width: 0;
  color: var(--app-text-primary);
  font-weight: 550;
  font-variant-numeric: tabular-nums;
  text-align: right;
  overflow-wrap: anywhere;
}

.detail-content .detail-row .trade-no {
  max-width: 235px;
  font-size: 11px;
  letter-spacing: 0.1px;
  overflow-wrap: anywhere;
  word-break: break-all;
}

.detail-content .detail-row .el-tag {
  flex-shrink: 0;
  padding: 3px 9px;
  border: 0;
  font-size: 11px;
}

.detail-content .detail-row .pay-amount {
  font-size: 13px;
  font-weight: 650;
}

.detail-status-failed {
  background: #fef2f2;
  color: #dc2626;
}

.difference-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

/* ==================================================
   设备统计
   ================================================== */

.device-subtitle {
  margin-top: 5px;
  font-size: 11px;
  color: var(--app-text-muted);
}

.month-amount {
  color: var(--app-accent-strong);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.total-amount {
  color: #059669;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ==================================================
   设备趋势图
   ================================================== */

.device-chart-section {
  margin: 24px 20px 20px;
  padding: 22px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-bg-elevated);
}

.device-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.device-chart-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.device-chart-header p {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

.trend-device-select {
  width: 220px;
  flex-shrink: 0;
}

.device-chart-container {
  width: 100%;
  min-height: 360px;
}

.device-chart {
  width: 100%;
  height: 360px;
}

/* =========================
   Redis 设备统计
   ========================= */

.device-section {
  width: 100%;
  padding-top: 20px;
}

.device-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 20px 20px;
}

.device-toolbar-left h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.device-toolbar-left span {
  display: block;
  margin-top: 7px;
  font-size: 12px;
  color: var(--app-text-muted);
}

.amount-primary {
  color: var(--app-accent-strong);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.amount-total {
  color: #059669;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.device-section > .finance-table {
  width: calc(100% - 40px);
  margin: 0 20px;
}

@media (max-width: 700px) {
  .device-toolbar {
    padding: 0 12px 16px;
  }

  .device-section > .finance-table {
    width: calc(100% - 24px);
    margin: 0 12px;
  }
}

@media (max-width: 700px) {
  .device-chart-section {
    margin: 16px 10px;
    padding: 14px;
  }

  .device-chart-header {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }

  .trend-device-select {
    width: 100%;
  }

  .device-chart-container {
    min-height: 280px;
  }

  .device-chart {
    height: 280px;
  }
}

/* ==================================================
   平板
   ================================================== */

@media (max-width: 1400px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-input,
  .filter-select,
  .filter-tenant {
    flex: 1 1 160px;
    width: auto;
  }
}

/* ==================================================
   手机
   ================================================== */

@media (max-width: 700px) {
  .content-card {
    --finance-tabs-height: 51px;
  }

  .tabs-header {
    top: 108px;
  }

  .content-card > .filter-bar {
    top: calc(108px + var(--finance-tabs-height));
  }

  .page-header {
    margin-bottom: 18px;
  }

  .page-header h1 {
    font-size: 20px;
  }

  .page-header p {
    line-height: 1.6;
  }

  .finance-detail-header {
    flex-wrap: wrap;
  }

  .finance-detail-current {
    order: 3;
    flex-basis: 100%;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .date-shortcuts {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .date-btn {
    padding: 0 5px;
    font-size: 11px;
  }

  .date-picker {
    width: 100% !important;
  }

  .stats-grid {
    gap: 10px;
    margin-bottom: 16px;
  }

  .balance-panel {
    padding: 16px;
    margin-bottom: 16px;
  }

  .balance-header {
    flex-direction: column;
  }

  .balance-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .balance-metric {
    padding: 13px;
  }

  .metric-value {
    font-size: 18px;
  }

  .stat-card {
    padding: 16px 13px;
    border-radius: 10px;
  }

  .stat-top {
    gap: 7px;
  }

  .stat-icon {
    width: 31px;
    height: 31px;
    font-size: 16px;
    border-radius: 8px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-value {
    margin-top: 14px;
    font-size: 20px;
  }

  .currency {
    font-size: 14px;
  }

  .stat-footer {
    font-size: 10px;
    line-height: 1.5;
  }

  .tabs-header {
    padding: 0 10px;
  }

  .custom-tabs {
    gap: 0;
  }

  .tab-item {
    height: 50px;
    padding: 0 10px;
    font-size: 11px;
    gap: 4px;
  }

  .tab-item .el-icon {
    font-size: 13px;
  }

  .export-btn {
    padding: 7px 9px;
    font-size: 11px;
  }

  .filter-bar {
    padding: 14px 12px;
    gap: 8px;
  }

  .filter-input,
  .filter-select,
  .filter-tenant {
    flex: 1 1 calc(50% - 8px);
    min-width: 0;
  }

  .table-container {
    padding: 0 10px;
  }

  .table-footer {
    padding: 16px 10px;
    flex-direction: column;
    align-items: stretch;
  }

  .total-text {
    text-align: center;
  }

  .table-footer :deep(.el-pagination) {
    justify-content: center;
    flex-wrap: wrap;
  }

  .section-description {
    padding: 16px 12px;
  }

  .section-description h3 {
    font-size: 14px;
  }

  .section-description p {
    font-size: 11px;
  }

  :deep(.finance-detail-drawer) {
    width: 100% !important;
  }
}

body.desktop-app .finance-page .tabs-header {
  top: 0;
}

body.desktop-app .finance-page .content-card > .filter-bar {
  top: var(--finance-tabs-height);
}

@media (max-width: 380px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stat-value {
    font-size: 18px;
  }

  .tab-item {
    padding: 0 7px;
  }
}
</style>

<style>
/* 财务流水详情：标题固定，仅抽屉正文滚动 */
.finance-detail-drawer.el-drawer {
  overflow: hidden;
}

.finance-detail-drawer > .el-drawer__header {
  flex-shrink: 0;
}

.finance-detail-drawer > .el-drawer__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
</style>

<!-- 深色主题覆盖（非 scoped）：统计卡片统一深灰底，浅色模式保持原渐变不变 -->
<style>
html.dark .stat-card {
  border-color: var(--app-border) !important;
}

html.dark .stat-blue,
html.dark .stat-green,
html.dark .stat-orange,
html.dark .stat-purple,
html.dark .stat-cyan {
  background: var(--app-bg-elevated) !important;
}

/* 深色下数值彩色提亮，说明文字跟随次级文字色，保证在深底上可读 */
html.dark .stat-blue .stat-value { color: var(--app-accent-strong); }
html.dark .stat-green .stat-value { color: #34d399; }
html.dark .stat-orange .stat-value { color: #fbbf24; }
html.dark .stat-purple .stat-value { color: #a78bfa; }
html.dark .stat-cyan .stat-value { color: var(--app-accent-strong); }
html.dark .stat-footer { color: var(--app-text-secondary); }

/* 抽屉金额卡片、设备图标在深色下使用金色半透明底 */
html.dark .detail-amount-card {
  background: var(--app-accent-subtle) !important;
}

html.dark .device-icon-box {
  background: var(--app-accent-soft) !important;
  color: var(--app-accent-strong);
}

html.dark .success-badge {
  background: rgba(34, 197, 94, 0.14);
}

html.dark .detail-status-failed {
  background: rgba(239, 68, 68, 0.12);
}
</style>