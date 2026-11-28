<template>
  <div class="link-page">
    <section class="hero-banner">
      <div class="hero-left">
        <div class="hero-icon"><el-icon><Connection /></el-icon></div>
        <div class="hero-content">
          <div class="hero-title-row"><h1>WebSocket 链接管控中心</h1><span class="hero-live"><span class="live-dot"></span> LIVE</span></div>
          <p>实时管理 PC 页面端与 Android 移动端的 Worker 连接、任务调度与执行状态</p>
        </div>
      </div>
      <div class="hero-decoration"><div class="hero-orbit orbit-one"></div><div class="hero-orbit orbit-two"></div><div class="hero-cube"><el-icon><Link /></el-icon></div><div class="hero-cube-base"></div></div>
      <div class="hero-features"><div><el-icon><CircleCheck /></el-icon>实时连接监控</div><div><el-icon><CircleCheck /></el-icon>任务调度控制</div><div><el-icon><CircleCheck /></el-icon>指定 WorkID 执行</div></div>
    </section>

    <section class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue"><el-icon><Link /></el-icon></div><div class="stat-content"><span class="stat-title">在线连接总数</span><strong class="stat-number">{{ statistics.total }}</strong><span class="stat-desc green-text">● 实时在线</span></div></div>
      <div class="stat-card"><div class="stat-icon blue"><el-icon><Monitor /></el-icon></div><div class="stat-content"><span class="stat-title">PC 页面端</span><strong class="stat-number">{{ statistics.pc }}</strong><span class="stat-desc">空闲 {{ statistics.pcIdle }} · 执行中 {{ statistics.pcRunning }}</span></div></div>
      <div class="stat-card"><div class="stat-icon green"><el-icon><Iphone /></el-icon></div><div class="stat-content"><span class="stat-title">Android 移动端</span><strong class="stat-number">{{ statistics.android }}</strong><span class="stat-desc">空闲 {{ statistics.androidIdle }} · 执行中 {{ statistics.androidRunning }}</span></div></div>
      <div class="stat-card"><div class="stat-icon purple"><el-icon><User /></el-icon></div><div class="stat-content"><span class="stat-title">在线租户</span><strong class="stat-number">{{ statistics.tenants }}</strong><span class="stat-desc">当前活跃租户</span></div></div>
      <div class="stat-card running-stat"><div class="stat-icon green"><el-icon><DataAnalysis /></el-icon></div><div class="stat-content"><span class="stat-title">执行中 Worker</span><strong class="stat-number green-number">{{ statistics.running }}</strong><span class="stat-desc">空闲 {{ statistics.idle }} 个</span></div></div>
    </section>

    <section class="main-layout">
      <aside class="tenant-panel">
        <div class="tenant-header"><div class="panel-heading"><el-icon><Grid /></el-icon><span>租户列表</span></div><el-tooltip content="刷新数据"><button class="icon-button blue-button" @click="refreshData(true)"><el-icon><Refresh /></el-icon></button></el-tooltip></div>
        <div class="tenant-search"><el-input v-model="tenantKeyword" :prefix-icon="Search" placeholder="搜索租户 ID / 名称" clearable /></div>
        <div class="tenant-list">
          <div class="tenant-item all-tenant" :class="{ active: selectedTenant === null }" @click="selectTenant(null)">
            <div class="tenant-avatar all"><el-icon><UserFilled /></el-icon></div><div class="tenant-info"><strong>全部租户</strong><span>共 {{ statistics.total }} 个连接</span></div><span class="tenant-count">{{ statistics.total }}</span>
          </div>
          <div v-for="tenant in filteredTenants" :key="tenant.tenantId" class="tenant-item" :class="{ active: selectedTenant === tenant.tenantId }" @click="selectTenant(tenant.tenantId)">
            <div class="tenant-avatar"><span class="tenant-online-dot"></span></div><div class="tenant-info"><strong>{{ tenant.tenantId }} <small>{{ tenant.name }}</small></strong><span>在线 {{ tenant.total }} (PC {{ tenant.pc }} / Android {{ tenant.android }})</span></div><span class="tenant-count">{{ tenant.total }}</span>
          </div>
          <el-empty v-if="filteredTenants.length === 0" description="暂无租户" :image-size="70" />
        </div>
        <div class="tenant-footer"><span class="footer-dot"></span> 所有连接状态正常</div>
      </aside>

      <div class="worker-panel">
        <div class="worker-tabs-header">
          <div class="platform-tabs">
            <div class="platform-tab" :class="{ active: activePlatform === 'pc' }" @click="changePlatform('pc')"><el-icon><Monitor /></el-icon><span>PC 页面端</span><span class="platform-count">{{ statistics.pc }}</span></div>
            <div class="platform-tab" :class="{ active: activePlatform === 'android' }" @click="changePlatform('android')"><el-icon><Iphone /></el-icon><span>Android 移动端</span><span class="platform-count">{{ statistics.android }}</span></div>
          </div>
          <div class="worker-header-actions"><div class="auto-refresh"><span>自动刷新</span><el-switch v-model="autoRefresh" size="small" /></div><el-tooltip content="刷新"><button class="icon-button" :class="{ rotating: refreshing }" @click="refreshData(true)"><el-icon><Refresh /></el-icon></button></el-tooltip><el-tooltip content="全屏"><button class="icon-button" @click="toggleFullscreen"><el-icon><FullScreen /></el-icon></button></el-tooltip></div>
        </div>

        <div class="schedule-section">
          <div class="schedule-title"><strong>调度策略</strong><span>{{ selectedTenant === null ? '请选择租户配置' : `租户：${selectedTenant}` }}</span></div>
          <div class="schedule-modes">
            <div class="schedule-mode" :class="{ active: scheduleForm.mode === 'auto', disabled: selectedTenant === null }" @click="setScheduleMode('auto')"><div class="mode-radio"><span class="radio-circle" :class="{ checked: scheduleForm.mode === 'auto' }"></span></div><div class="mode-info"><strong>自动调度（默认）</strong><span>所有空闲 Worker 随机处理</span></div><el-icon class="mode-icon"><Operation /></el-icon></div>
            <div class="schedule-mode" :class="{ active: scheduleForm.mode === 'manual', disabled: selectedTenant === null }" @click="setScheduleMode('manual')"><div class="mode-radio"><span class="radio-circle" :class="{ checked: scheduleForm.mode === 'manual' }"></span></div><div class="mode-info"><strong>指定 WorkID 执行</strong><span>仅允许选中的 Worker 处理任务</span></div><el-icon class="mode-icon"><Aim /></el-icon></div>
            <div v-if="activePlatform === 'android'" class="schedule-mode" :class="{ active: scheduleForm.mode === 'group', disabled: selectedTenant === null }" @click="setScheduleMode('group')"><div class="mode-radio"><span class="radio-circle" :class="{ checked: scheduleForm.mode === 'group' }"></span></div><div class="mode-info"><strong>按组派单</strong><span>只从选中分组的在线设备派单</span></div><el-icon class="mode-icon"><Collection /></el-icon></div>
          </div>
          <div class="schedule-selected">
            <div class="selected-label">{{ scheduleForm.mode === 'group' ? '派单范围' : '执行范围' }}</div>
            <div class="selected-workers">
              <span v-if="selectedTenant === null" class="selected-placeholder">请先从左侧选择一个租户</span>
              <el-tag v-else-if="scheduleForm.mode === 'auto'" type="success" effect="plain" round>全部在线 Worker</el-tag>
              <template v-else-if="scheduleForm.mode === 'manual'">
                <el-tag v-for="workId in scheduleForm.workIds" :key="workId" closable size="small" @close="removeScheduleWorker(workId)">{{ workId }}</el-tag>
                <span v-if="scheduleForm.workIds.length === 0" class="selected-placeholder">尚未选择 Worker</span>
                <el-button size="small" plain :disabled="selectedTenant === null" @click="openWorkerSelector">选择 Worker</el-button>
              </template>
              <template v-else-if="scheduleForm.mode === 'group'">
                <el-select v-model="scheduleForm.groups" multiple collapse-tags collapse-tags-tooltip placeholder="选择派单分组" class="schedule-group-select" :disabled="selectedTenant === null" @change="scheduleDirty = true">
                  <el-option v-for="group in workerGroups" :key="group.name" :label="group.name" :value="group.name">
                    <div class="group-option"><span>{{ group.name }}</span><span class="group-option-online">在线 {{ group.onlineCount ?? 0 }}</span></div>
                  </el-option>
                </el-select>
              </template>
            </div>
            <el-tag v-if="scheduleDirty" size="small" type="warning" effect="plain">未保存</el-tag>
            <el-button v-if="scheduleDirty" size="small" @click="discardScheduleChanges">还原</el-button>
            <el-button type="primary" :icon="Check" :disabled="selectedTenant === null" :loading="scheduleSaving" @click="saveSchedule">保存配置</el-button>
          </div>
        </div>

        <div class="worker-toolbar"><div class="toolbar-left"><el-input v-model="workerKeyword" :prefix-icon="Search" placeholder="搜索 WorkID / 设备号 / 租户 / 任务" clearable class="worker-search" /><el-select v-model="statusFilter" placeholder="全部状态" clearable class="status-filter"><el-option label="空闲" value="idle" /><el-option label="执行中" value="running" /></el-select><el-select v-if="activePlatform === 'android'" v-model="groupFilter" placeholder="全部分组" clearable class="group-filter" @clear="groupFilter = ''"><el-option label="全部分组" value="" /><el-option label="未分组" value="__ungrouped__" /><el-option v-for="group in workerGroups" :key="group.name" :label="group.name" :value="group.name" /></el-select><el-button v-if="activePlatform === 'android'" size="small" @click="openGroupDialog">分组管理</el-button><el-button v-if="activePlatform === 'android'" size="small" type="primary" plain :icon="Tools" @click="openConfigDrawer">支付宝与设备管理</el-button><el-button v-if="activePlatform === 'android'" size="small" plain :icon="Aim" @click="openPriorityDrawer">上游公司 · 绑组</el-button></div><div class="toolbar-right"><span class="online-label"><span class="online-dot"></span> 当前在线 {{ filteredWorkers.length }}</span></div></div>

        <div class="worker-table">
          <el-table :data="pageWorkers" row-key="id" stripe :header-cell-style="tableHeaderStyle" empty-text="暂无在线 Worker">
            <el-table-column label="WorkID" min-width="190"><template #default="{ row }"><div class="worker-id-cell"><el-tooltip :content="row.workerKey" placement="top"><span class="order-link">{{ row.workerKey.split(':')[0].slice(0, 12) }}...</span></el-tooltip><el-icon class="copy-icon" title="复制 WorkID" @click="copyText(row.workerKey)"><CopyDocument /></el-icon></div></template></el-table-column>
            <el-table-column label="租户 ID" min-width="100"><template #default="{ row }">{{ row.tenantId }}</template></el-table-column>
            <el-table-column label="平台" min-width="95"><template #default="{ row }"><span class="platform-badge" :class="row.platform"><el-icon><Monitor v-if="row.platform === 'pc'" /><Iphone v-else /></el-icon>{{ row.platform === 'pc' ? 'PC' : 'Android' }}</span></template></el-table-column>
            <el-table-column v-if="activePlatform === 'android'" label="设备号" min-width="160"><template #default="{ row }"><div class="device-id-cell"><el-tooltip :content="row.deviceId || '未上报设备号'" placement="top"><span class="device-id">{{ row.deviceId || '-' }}</span></el-tooltip><el-icon v-if="row.deviceId" class="copy-icon" title="复制设备号" @click="copyText(row.deviceId)"><CopyDocument /></el-icon></div></template></el-table-column>
            <el-table-column v-if="activePlatform === 'android'" label="付款账号" min-width="145"><template #default="{ row }"><span v-if="row.payAccount" class="pay-account">{{ row.payAccount }}</span><span v-else class="pay-account unbound">未绑定</span></template></el-table-column>
            <el-table-column v-if="activePlatform === 'android'" label="分组" min-width="120"><template #default="{ row }"><span class="group-badge" :class="{ ungrouped: !row.group }">{{ row.group || '未分组' }}</span></template></el-table-column>
            <el-table-column label="连接状态" min-width="100"><template #default><span class="connection-status"><span class="online-dot"></span>在线</span></template></el-table-column>
            <el-table-column label="执行状态" min-width="100"><template #default="{ row }"><span class="running-badge" :class="row.isRunning ? 'busy' : 'idle'"><el-icon v-if="row.isRunning"><Loading /></el-icon>{{ row.isRunning ? '执行中' : '空闲' }}</span></template></el-table-column>
            <el-table-column label="当前任务" min-width="170"><template #default="{ row }"><span v-if="row.orderId" class="task-order-cell"><el-tooltip content="查看订单详情" placement="top"><button class="order-link task-order-link" @click="openOrder(row.orderId)">{{ row.orderId }}</button></el-tooltip><el-tooltip content="复制订单号" placement="top"><el-icon class="copy-icon" @click.stop="copyText(row.orderId)"><CopyDocument /></el-icon></el-tooltip></span><span v-else class="empty-value">-</span></template></el-table-column>
            <el-table-column label="调度权限" min-width="95"><template #default="{ row }"><span class="permission-badge" :class="isWorkerAllowed(row) ? 'allowed' : 'blocked'">{{ isWorkerAllowed(row) ? '允许' : '未选中' }}</span></template></el-table-column>
            <el-table-column label="连接时长" min-width="105"><template #default="{ row }">{{ formatDuration(row.connectedAt) }}</template></el-table-column>
            <el-table-column label="最后心跳" min-width="105"><template #default="{ row }"><span class="heartbeat-value" :class="getHeartbeatClass(row.lastHeartbeat)">{{ formatHeartbeat(row.lastHeartbeat) }}</span></template></el-table-column>
            <el-table-column label="操作" min-width="220" fixed="right" align="center"><template #default="{ row }"><div class="table-actions"><el-button v-if="row.platform === 'android'" size="small" type="warning" plain @click="openAssignDialog(row)">设组</el-button><el-tooltip content="仅允许该 Worker 执行"><el-button size="small" type="primary" plain @click="setOnlyWorker(row)">指定</el-button></el-tooltip><el-button size="small" type="danger" plain @click="disconnectWorker(row)">断开</el-button><el-button class="detail-action" size="small" @click="showDetail(row)">详情</el-button></div></template></el-table-column>
          </el-table>
        </div>

        <div class="mobile-worker-list">
          <div v-for="row in pageWorkers" :key="row.id" class="mobile-worker-card">
            <div class="mobile-worker-top"><div class="mobile-worker-name"><strong>{{ row.workId }}</strong></div><span class="running-badge" :class="row.isRunning ? 'busy' : 'idle'">{{ row.isRunning ? '执行中' : '空闲' }}</span></div>
            <div class="mobile-worker-info"><div><span>租户</span><strong>{{ row.tenantId }}</strong></div><div><span>平台</span><strong>{{ row.platform }}</strong></div><div v-if="row.platform === 'android'"><span>设备号</span><strong class="mono">{{ row.deviceId || '-' }}</strong></div><div v-if="row.platform === 'android'"><span>付款账号</span><strong :class="{ 'unbound-text': !row.payAccount }">{{ row.payAccount || '未绑定' }}</strong></div><div v-if="row.platform === 'android'"><span>分组</span><strong>{{ row.group || '未分组' }}</strong></div><div><span>当前任务</span><strong v-if="row.orderId" class="mobile-task-order"><button class="order-link task-order-link" @click="openOrder(row.orderId)">{{ row.orderId }}</button><el-icon class="copy-icon" title="复制订单号" @click.stop="copyText(row.orderId)"><CopyDocument /></el-icon></strong><strong v-else>-</strong></div><div><span>调度权限</span><span class="permission-badge" :class="isWorkerAllowed(row) ? 'allowed' : 'blocked'">{{ isWorkerAllowed(row) ? '允许' : '未选中' }}</span></div><div><span>连接时长</span><strong>{{ formatDuration(row.connectedAt) }}</strong></div><div><span>最后心跳</span><strong class="heartbeat-value" :class="getHeartbeatClass(row.lastHeartbeat)">{{ formatHeartbeat(row.lastHeartbeat) }}</strong></div></div>
            <div class="mobile-worker-actions"><el-button v-if="row.platform === 'android'" size="small" type="warning" plain @click="openAssignDialog(row)">设组</el-button><el-button size="small" type="primary" plain @click="setOnlyWorker(row)">指定执行</el-button><el-button class="detail-action" size="small" @click="showDetail(row)">详情</el-button><el-button size="small" type="danger" plain @click="disconnectWorker(row)">断开</el-button></div>
          </div>
          <el-empty v-if="pageWorkers.length === 0" description="暂无在线 Worker" />
        </div>
        <div class="pagination-row"><span>共 {{ filteredWorkers.length }} 条在线记录</span><el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredWorkers.length" :page-sizes="[10, 20, 50]" layout="sizes, prev, pager, next" background /></div>
      </div>
    </section>

    <el-dialog v-model="selectorVisible" title="选择允许执行的 Worker" width="520px" class="fixed-body-dialog" align-center append-to-body :close-on-click-modal="false">
      <div class="selector-description"><el-icon><InfoFilled /></el-icon><span>可以单独勾选一个或多个 Worker。选择多个时，转发中心从指定的在线 Worker 中选择连接。</span></div>
      <div class="selector-header"><span>租户 {{ selectedTenant }} · {{ activePlatform.toUpperCase() }}</span><el-checkbox :model-value="selectorAllSelected" :indeterminate="selectorIndeterminate" @change="toggleSelectorAll">全选</el-checkbox></div>
      <div class="selector-list">
        <div v-for="worker in scheduleAvailableWorkers" :key="worker.id" class="selector-item" @click="toggleSelectorWorker(worker.workId)">
          <el-checkbox :model-value="selectorWorkIds.includes(worker.workId)" @click.stop @change="() => toggleSelectorWorker(worker.workId)" />
          <div class="selector-worker-info"><strong>{{ worker.workId }}</strong><span v-if="worker.payAccount">{{ worker.payAccount }}</span></div>
          <span class="running-badge" :class="worker.isRunning ? 'busy' : 'idle'">{{ worker.isRunning ? '执行中' : '空闲' }}</span>
        </div>
        <el-empty v-if="scheduleAvailableWorkers.length === 0" description="暂无在线 Worker" :image-size="70" />
      </div>
      <template #footer><el-button @click="selectorVisible = false">取消</el-button><el-button type="primary" @click="confirmWorkerSelector">确定选择（{{ selectorWorkIds.length }}）</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="Worker 连接详情" width="500px" class="fixed-body-dialog worker-detail-dialog" align-center append-to-body>
      <div v-if="detailWorker" class="worker-detail">
        <div class="worker-detail-head">
          <div class="worker-detail-icon"><el-icon><Connection /></el-icon></div>
          <div class="worker-detail-info">
            <h3>{{ detailWorker.platform === 'pc' ? 'PC 连接' : 'Android 设备' }}</h3>
            <span class="worker-detail-sub">租户 {{ detailWorker.tenantId }} · {{ detailWorker.group || '未分组' }}</span>
          </div>
          <div class="worker-detail-status">
            <el-tag type="success">在线</el-tag>
            <el-tag :type="detailWorker.isRunning ? 'warning' : 'success'">{{ detailWorker.isRunning ? '执行中' : '空闲' }}</el-tag>
          </div>
        </div>

        <div class="worker-detail-section">
          <div class="detail-row"><span>WorkID</span><strong class="mono">{{ detailWorker.workId }}</strong></div>
          <div class="detail-row"><span>租户 ID</span><strong>{{ detailWorker.tenantId }}</strong></div>
          <div class="detail-row"><span>平台</span><strong>{{ detailWorker.platform === 'pc' ? 'PC' : 'Android' }}</strong></div>
          <div v-if="detailWorker.platform === 'android'" class="detail-row"><span>设备号</span><strong class="mono">{{ detailWorker.deviceId || '-' }}</strong></div>
          <div v-if="detailWorker.platform === 'android'" class="detail-row"><span>付款账号</span><strong :class="{ 'unbound-text': !detailWorker.payAccount }">{{ detailWorker.payAccount || '未绑定' }}</strong></div>
          <div v-if="detailWorker.platform === 'android'" class="detail-row"><span>分组</span><strong>{{ detailWorker.group || '未分组' }}</strong></div>
          <div class="detail-row"><span>当前任务</span><strong>{{ detailWorker.orderId || '-' }}</strong></div>
          <div class="detail-row"><span>连接时间</span><strong>{{ formatDate(detailWorker.connectedAt) }}</strong></div>
          <div class="detail-row"><span>最后心跳</span><strong>{{ formatHeartbeat(detailWorker.lastHeartbeat) }}</strong></div>
        </div>
      </div>
      <template #footer><el-button @click="detailVisible = false">关闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="groupDialogVisible" title="安卓设备分组" width="560px" class="fixed-body-dialog" align-center append-to-body>
      <div class="group-create-row">
        <el-input v-model="newGroupName" placeholder="输入新分组名称" maxlength="20" clearable @keyup.enter="createGroup" />
        <el-button type="primary" :loading="groupSaving" @click="createGroup">创建分组</el-button>
      </div>
      <div class="group-list">
        <div v-for="group in workerGroups" :key="group.name" class="group-row">
          <div class="group-row-main">
            <strong>{{ group.name }}</strong>
            <span>{{ group.onlineCount ?? 0 }} 在线 / {{ group.memberCount ?? 0 }} 成员</span>
          </div>
          <div class="group-row-actions">
            <el-button size="small" @click="openRenameGroup(group)">重命名</el-button>
            <el-button size="small" type="danger" plain @click="deleteGroup(group)">删除</el-button>
          </div>
        </div>
        <el-empty v-if="workerGroups.length === 0" description="暂无分组" :image-size="60" />
      </div>
    </el-dialog>

    <el-dialog v-model="assignVisible" title="设置设备分组" width="460px" class="fixed-body-dialog" align-center append-to-body>
      <div class="assign-info">
        <div><span>设备号</span><strong class="mono">{{ assignWorker?.deviceId || '-' }}</strong></div>
        <div><span>当前付款账号</span><strong :class="{ 'unbound-text': !assignWorker?.payAccount }">{{ assignWorker?.payAccount || '未绑定' }}</strong></div>
      </div>
      <div class="assign-hint">分组以设备号为准，换绑支付宝不会影响已有分组。</div>
      <el-select v-model="assignTarget" class="assign-select" @change="onAssignTargetChange">
        <el-option label="未分组" value="__ungrouped__" />
        <el-option v-for="group in workerGroups" :key="group.name" :label="group.name" :value="group.name" />
        <el-option label="新建分组" value="__new__" />
      </el-select>
      <el-input v-if="assignTarget === '__new__'" v-model="assignNewName" placeholder="输入新分组名称" maxlength="20" clearable @keyup.enter="confirmAssign" />
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" :loading="assignSaving" @click="confirmAssign">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="configDrawerVisible" title="支付宝与设备管理" size="860px" direction="rtl" append-to-body class="config-drawer">
      <div class="config-tenant">
        当前租户：<strong>{{ configTenantId || '未选择' }}</strong>
        <span v-if="!configTenantId" class="config-tenant-hint">请先在左侧选择具体租户，再进行账号与设备管理</span>
      </div>
      <el-tabs v-model="configActiveTab" class="config-tabs">
        <el-tab-pane label="支付宝账号与密码" name="alipay">
          <div class="threshold-panel">
            <div class="threshold-head"><strong>余额预警阈值</strong><span>租户级统一配置 · 按当前登录租户生效</span></div>
            <div class="threshold-body">
              <el-switch v-model="balanceEnabled" active-text="启用" inactive-text="关闭" :loading="thresholdLoading || thresholdSaving" />
              <el-input v-model="thresholdInput" type="number" min="0" placeholder="阈值金额" class="threshold-input" :disabled="!balanceEnabled" @keyup.enter="saveBalanceThreshold" />
              <el-button type="primary" :loading="thresholdSaving" @click="saveBalanceThreshold">保存</el-button>
              <span class="threshold-current">当前：{{ thresholdText }}</span>
            </div>
            <div class="threshold-hint">低于阈值时管理端弹窗预警（ALIPAY_BALANCE_LOW，同账号每小时一条），只告警不拦派单；真正余额不足仍走原有拦截。</div>
          </div>
          <div class="config-toolbar">
            <el-input v-model="alipayKeyword" :prefix-icon="Search" placeholder="搜索支付宝账号" clearable />
            <el-button :icon="Refresh" :loading="alipayLoading" @click="loadAlipayAccounts">刷新</el-button>
            <el-button type="primary" plain :icon="Plus" :disabled="!configTenantId" @click="openAccountDialog">新增账号</el-button>
          </div>
          <el-table :data="filteredAlipayAccounts" max-height="460" stripe empty-text="暂无支付宝账号">
            <el-table-column label="支付宝账号" min-width="165"><template #default="{ row }"><strong class="config-strong">{{ row.alipayAccount || '-' }}</strong></template></el-table-column>
            <el-table-column label="密码状态" min-width="100"><template #default="{ row }"><el-tag :type="row.hasPassword ? 'success' : 'warning'" effect="plain" size="small">{{ row.hasPassword ? '已设置' : '未设置' }}</el-tag></template></el-table-column>
            <el-table-column label="余额" min-width="165"><template #default="{ row }"><div class="balance-cell"><span :class="{ 'balance-low': row.belowThreshold, 'balance-unknown': !row.balanceText || row.balanceText === '暂未获取' }">{{ row.balanceText || '暂未获取' }}</span><el-tag v-if="row.belowThreshold" type="danger" effect="plain" size="small">低于阈值</el-tag></div><div v-if="row.balanceUpdatedAt" class="balance-time">{{ formatBoundAt(row.balanceUpdatedAt) }}</div></template></el-table-column>
            <el-table-column label="密码回显" min-width="100"><template #default="{ row }"><span class="config-mask">{{ row.passwordMask || '—' }}</span></template></el-table-column>
            <el-table-column label="操作" min-width="235" fixed="right" align="center"><template #default="{ row }"><div class="config-actions"><el-button size="small" type="primary" plain :icon="Key" :disabled="!configTenantId" @click="openPasswordDialog(row)">设置密码</el-button><el-button size="small" type="danger" plain :disabled="!configTenantId || !row.hasPassword" @click="clearAlipayPassword(row)">清空</el-button><el-button size="small" plain @click="openAccountLedger(row)">流水</el-button></div></template></el-table-column>
          </el-table>
          <div class="config-footnote">先新增账号并设密，再到「全部安卓设备」把账号绑定到设备；密码加密写入服务端，列表只返回掩码，前端不保存明文。</div>
        </el-tab-pane>
        <el-tab-pane label="全部安卓设备" name="device">
          <div class="config-toolbar">
            <el-input v-model="deviceKeyword" :prefix-icon="Search" placeholder="搜索设备号 / 支付宝账号" clearable />
            <el-select v-model="deviceGroupFilter" placeholder="全部分组" clearable><el-option label="全部分组" value="" /><el-option label="未分组" value="__ungrouped__" /><el-option v-for="group in workerGroups" :key="group.name" :label="group.name" :value="group.name" /></el-select>
            <el-select v-model="deviceOnlineFilter" placeholder="全部状态" clearable><el-option label="全部状态" value="" /><el-option label="在线" value="online" /><el-option label="离线" value="offline" /></el-select>
            <el-button :icon="Refresh" :loading="deviceLoading" @click="loadAndroidDevices">刷新</el-button>
          </div>
          <el-table :data="filteredAndroidDevices" max-height="520" stripe empty-text="暂无安卓设备">
            <el-table-column label="设备号" min-width="185"><template #default="{ row }"><div class="device-id-cell"><span class="device-id">{{ row.deviceId || '-' }}</span><el-icon v-if="row.deviceId" class="copy-icon" title="复制设备号" @click="copyText(row.deviceId)"><CopyDocument /></el-icon></div></template></el-table-column>
            <el-table-column label="当前支付宝" min-width="155"><template #default="{ row }"><span v-if="row.alipayAccount" class="config-strong">{{ row.alipayAccount }}</span><el-tag v-else type="warning" effect="plain" size="small">未绑定</el-tag></template></el-table-column>
            <el-table-column label="余额" min-width="165"><template #default="{ row }"><div class="balance-cell"><span :class="{ 'balance-low': row.belowThreshold, 'balance-unknown': !row.balanceText || row.balanceText === '暂未获取' }">{{ row.balanceText || '暂未获取' }}</span><el-tag v-if="row.belowThreshold" type="danger" effect="plain" size="small">低于阈值</el-tag></div><div v-if="row.balanceUpdatedAt" class="balance-time">{{ formatBoundAt(row.balanceUpdatedAt) }}</div></template></el-table-column>
            <el-table-column label="所在分组" min-width="115"><template #default="{ row }"><span class="group-badge" :class="{ ungrouped: !row.group }">{{ row.group || '未分组' }}</span></template></el-table-column>
            <el-table-column label="在线状态" min-width="95"><template #default="{ row }"><span class="device-status" :class="row.online ? 'online' : 'offline'"><span class="status-dot"></span>{{ row.online ? '在线' : '离线' }}</span></template></el-table-column>
            <el-table-column label="最近绑定" min-width="160"><template #default="{ row }">{{ formatBoundAt(row.boundAt) }}</template></el-table-column>
            <el-table-column label="操作" min-width="175" fixed="right" align="center"><template #default="{ row }"><div class="config-actions"><el-button size="small" type="primary" plain :disabled="!row.deviceId || !configTenantId" @click="openBindDialog(row)">绑定支付宝</el-button><el-button size="small" type="warning" plain :disabled="!row.deviceId || !configTenantId" @click="openDeviceAssignDialog(row)">设组</el-button></div></template></el-table-column>
          </el-table>
          <div class="config-footnote">设备列表包含离线设备；分组按设备号，派单按设备当前绑定的支付宝取支付密码，未绑定或未设密会导致支付失败。后绑覆盖、换绑不影响已有分组。</div>
        </el-tab-pane>
        <el-tab-pane label="人工充值 · 余额流水" name="manual">
          <div class="config-tenant manual-scope">
            按当前登录租户记账与查询；扣的是<strong>支付宝账号余额</strong>，不是财务页的「租户预付余额 / 人工加款」。记账前需先在左侧选择具体租户以加载账号列表。
          </div>

          <div class="manual-form-panel">
            <div class="manual-form-head"><strong>新建人工充值单</strong><span>手机人工支付完成后在此记账</span></div>
            <div class="manual-form-grid">
              <div class="manual-field"><span>支付宝账号</span>
                <el-select v-model="manualForm.alipayAccount" filterable clearable placeholder="选择付款支付宝账号" :disabled="!configTenantId" class="manual-field-control">
                  <el-option v-for="item in alipayAccounts" :key="item.alipayAccount" :label="`${item.alipayAccount}（${item.balanceText || '暂未获取'}）`" :value="item.alipayAccount" />
                </el-select>
              </div>
              <div class="manual-field"><span>实付金额</span>
                <el-input-number v-model="manualForm.amount" :min="0" :precision="2" :step="10" :controls="false" placeholder="大于 0 的金额" class="manual-field-control" />
              </div>
              <div class="manual-field"><span>设备号（可选）</span>
                <el-select v-model="manualForm.deviceId" filterable allow-create default-first-option clearable placeholder="可留空，或选择 / 输入设备号" class="manual-field-control">
                  <el-option v-for="item in androidDevices" :key="item.deviceId" :label="item.deviceId" :value="item.deviceId" />
                </el-select>
              </div>
            </div>
            <div class="manual-field manual-field-full"><span>备注（必填）</span><el-input v-model="manualForm.remark" placeholder="如：手机人工支付，订单备注 xxx" maxlength="200" clearable class="manual-field-control" @keyup.enter="submitManualRecharge" /></div>
            <div class="manual-form-actions">
              <el-button type="primary" :loading="manualSaving" :disabled="!configTenantId" @click="submitManualRecharge">提交记账</el-button>
              <el-button @click="resetManualForm">清空</el-button>
              <span v-if="!configTenantId" class="manual-form-tip">请先在左侧选择具体租户</span>
            </div>
            <div v-if="manualResult" class="manual-result">
              记账成功 · 单号 <strong class="mono">{{ manualResult.rechargeNo || '-' }}</strong>
              ｜ 扣前 <strong>{{ formatBalance(manualResult.beforeBalance) }}</strong>
              ｜ 扣后 <strong>{{ formatBalance(manualResult.afterBalance) }}</strong>
              <span v-if="manualResult.beforeBalance === null || manualResult.beforeBalance === undefined">（余额暂未获取，仍可记账）</span>
            </div>
          </div>

          <div class="manual-sub-switch">
            <el-button size="small" :type="manualSubView === 'orders' ? 'primary' : ''" @click="switchManualSubView('orders')">人工充值单</el-button>
            <el-button size="small" :type="manualSubView === 'ledger' ? 'primary' : ''" @click="switchManualSubView('ledger')">支付宝扣除流水</el-button>
          </div>

          <template v-if="manualSubView === 'orders'">
            <div class="config-toolbar manual-toolbar">
              <el-input v-model="rechargeFilters.alipayAccount" :prefix-icon="Search" placeholder="支付宝账号" clearable />
              <el-input v-model="rechargeFilters.deviceId" placeholder="设备号" clearable />
              <el-date-picker v-model="rechargeFilters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" format="YYYY-MM-DD" class="manual-date-range" />
              <el-button type="primary" :icon="Search" @click="searchRecharge">查询</el-button>
              <el-button :icon="Refresh" @click="resetRechargeFilters">重置</el-button>
            </div>
            <el-table :data="rechargeOrders" v-loading="rechargeLoading" max-height="420" stripe empty-text="暂无人工充值单">
              <el-table-column label="人工单号" min-width="175"><template #default="{ row }"><span class="config-mask">{{ row.rechargeNo || '-' }}</span></template></el-table-column>
              <el-table-column label="支付宝账号" min-width="150"><template #default="{ row }"><strong class="config-strong">{{ row.alipayAccount || '-' }}</strong></template></el-table-column>
              <el-table-column label="金额" min-width="100" align="right"><template #default="{ row }"><span class="amount-strong">¥{{ formatMoney(row.amount) }}</span></template></el-table-column>
              <el-table-column label="扣前 / 扣后" min-width="185"><template #default="{ row }"><div class="balance-pair"><span :class="{ 'balance-unknown-text': row.beforeBalance === null }">{{ formatBalance(row.beforeBalance) }}</span><span class="balance-arrow">→</span><span :class="{ 'balance-unknown-text': row.afterBalance === null }">{{ formatBalance(row.afterBalance) }}</span></div></template></el-table-column>
              <el-table-column label="设备号" min-width="150"><template #default="{ row }"><span class="device-id">{{ row.deviceId || '-' }}</span></template></el-table-column>
              <el-table-column label="备注" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ row.remark || '-' }}</template></el-table-column>
              <el-table-column label="操作人" min-width="100"><template #default="{ row }">{{ row.operator || '-' }}</template></el-table-column>
              <el-table-column label="时间" min-width="160"><template #default="{ row }">{{ formatBoundAt(row.createTime) }}</template></el-table-column>
            </el-table>
            <div class="manual-pagination"><span>共 {{ rechargeTotal }} 条</span><el-pagination v-model:current-page="rechargePagination.pageIndex" v-model:page-size="rechargePagination.pageSize" :total="rechargeTotal" :page-sizes="[10, 20, 50]" layout="sizes, prev, pager, next" background @size-change="loadRechargeOrders" @current-change="loadRechargeOrders" /></div>
          </template>

          <template v-else>
            <div class="config-toolbar manual-toolbar">
              <el-input v-model="ledgerFilters.alipayAccount" :prefix-icon="Search" placeholder="支付宝账号" clearable />
              <el-select v-model="ledgerFilters.changeType" placeholder="变动类型" class="manual-type-select"><el-option label="全部类型" value="" /><el-option label="人工扣款" value="manual_deduct" /></el-select>
              <el-date-picker v-model="ledgerFilters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" format="YYYY-MM-DD" class="manual-date-range" />
              <el-button type="primary" :icon="Search" @click="searchLedger">查询</el-button>
              <el-button :icon="Refresh" @click="resetLedgerFilters">重置</el-button>
            </div>
            <el-table :data="alipayLedgerList" v-loading="ledgerLoading" max-height="420" stripe empty-text="暂无扣除流水">
              <el-table-column label="关联单号" min-width="175"><template #default="{ row }"><span class="config-mask">{{ row.refNo || '-' }}</span></template></el-table-column>
              <el-table-column label="支付宝账号" min-width="150"><template #default="{ row }"><strong class="config-strong">{{ row.alipayAccount || '-' }}</strong></template></el-table-column>
              <el-table-column label="变动金额" min-width="110" align="right"><template #default="{ row }"><span :class="Number(row.amount) < 0 ? 'amount-negative' : 'amount-strong'">{{ Number(row.amount) < 0 ? '-¥' + formatMoney(Math.abs(row.amount)) : '¥' + formatMoney(row.amount) }}</span></template></el-table-column>
              <el-table-column label="扣前 / 扣后" min-width="185"><template #default="{ row }"><div class="balance-pair"><span :class="{ 'balance-unknown-text': row.beforeBalance === null }">{{ formatBalance(row.beforeBalance) }}</span><span class="balance-arrow">→</span><span :class="{ 'balance-unknown-text': row.afterBalance === null }">{{ formatBalance(row.afterBalance) }}</span></div></template></el-table-column>
              <el-table-column label="类型" min-width="105"><template #default="{ row }"><el-tag type="danger" effect="plain" size="small">{{ row.changeType === 'manual_deduct' ? '人工扣款' : (row.changeType || '-') }}</el-tag></template></el-table-column>
              <el-table-column label="备注" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ row.remark || '-' }}</template></el-table-column>
              <el-table-column label="操作人" min-width="100"><template #default="{ row }">{{ row.operator || '-' }}</template></el-table-column>
              <el-table-column label="时间" min-width="160"><template #default="{ row }">{{ formatBoundAt(row.createTime) }}</template></el-table-column>
            </el-table>
            <div class="manual-pagination"><span>共 {{ ledgerTotal }} 条</span><el-pagination v-model:current-page="ledgerPagination.pageIndex" v-model:page-size="ledgerPagination.pageSize" :total="ledgerTotal" :page-sizes="[10, 20, 50]" layout="sizes, prev, pager, next" background @size-change="loadAlipayLedger" @current-change="loadAlipayLedger" /></div>
          </template>

          <div class="config-footnote">余额暂未获取时仍可记账，扣前 / 扣后显示「暂未获取」，流水 before/after 为 null；余额已知时按 balance − amount 扣除，不足则拒单。提交成功后会刷新该账号余额与两份列表。</div>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>

    <!-- 上游公司 · 绑组：按登录 Token 推断租户 -->
    <el-drawer v-model="priorityDrawerVisible" title="上游公司 · 绑组" size="860px" direction="rtl" append-to-body class="config-drawer priority-drawer">
      <div class="config-tenant priority-scope">
        安卓派单优先级：<strong>充值平台绑定设备</strong> &gt; <strong>上游公司对应组</strong> &gt; 租户 schedule（auto / manual / group）。此处维护上游公司与本地组的绑定，按<strong>当前登录租户</strong>生效；充值平台的设备绑定请在「参数管控 → 平台」中配置。
      </div>
      <div class="config-toolbar">
        <el-input v-model="companyKeyword" :prefix-icon="Search" placeholder="搜索公司编号 / 名称 / 已绑组" clearable />
        <el-button :icon="Refresh" :loading="companyLoading" @click="loadUpstreamCompanies">刷新</el-button>
        <el-button type="primary" plain :loading="companySyncing" @click="syncUpstreamCompanies">同步公司</el-button>
      </div>
      <el-table :data="filteredUpstreamCompanies" max-height="520" stripe empty-text="暂无上游公司，请先同步">
        <el-table-column label="公司编号" min-width="135"><template #default="{ row }"><strong class="config-strong mono">{{ row.companyId || '-' }}</strong></template></el-table-column>
        <el-table-column label="公司名称" min-width="155"><template #default="{ row }">{{ row.companyName || '-' }}</template></el-table-column>
        <el-table-column label="状态" min-width="80"><template #default="{ row }"><el-tag effect="plain" size="small">{{ row.status ?? '-' }}</el-tag></template></el-table-column>
        <el-table-column label="已绑本地组" min-width="140"><template #default="{ row }"><span v-if="row.group" class="group-badge">{{ row.group }}</span><el-tag v-else type="info" effect="plain" size="small">未绑定</el-tag></template></el-table-column>
        <el-table-column label="同步时间" min-width="155"><template #default="{ row }">{{ formatBoundAt(row.syncedAt) }}</template></el-table-column>
        <el-table-column label="操作" min-width="205" fixed="right" align="center"><template #default="{ row }"><div class="config-actions">
          <template v-if="row.editing">
            <el-select v-model="row.editGroup" size="small" clearable placeholder="选择本地组" class="company-group-select"><el-option v-for="g in workerGroups" :key="g.name" :label="g.name" :value="g.name" /></el-select>
            <el-button size="small" type="primary" :loading="companySavingId === row.companyId" @click="saveCompanyGroup(row)">保存</el-button>
            <el-button size="small" @click="cancelCompanyEdit(row)">取消</el-button>
          </template>
          <template v-else>
            <el-button size="small" type="primary" plain @click="startCompanyEdit(row)">绑组</el-button>
            <el-button size="small" type="danger" plain :disabled="!row.group || companySavingId === row.companyId" @click="unbindCompanyGroup(row)">解绑</el-button>
          </template>
        </div></template></el-table-column>
      </el-table>
      <div class="config-footnote">一组只能绑一家公司；解绑传 group: ""。同步需先在外部货源设置配置 companyListUrl，也可由上游推送 /open/api/v1/company_sync。buy 带 outerCompanyId 时按公司对应组覆盖组调度。</div>
    </el-drawer>

    <el-dialog v-model="passwordDialogVisible" title="设置支付密码" width="430px" class="fixed-body-dialog" align-center append-to-body :close-on-click-modal="false">
      <div class="password-account">支付宝账号：<strong>{{ passwordForm.alipayAccount }}</strong></div>
      <el-input v-model="passwordForm.password" type="password" show-password placeholder="请输入支付密码明文" maxlength="32" clearable @keyup.enter="submitPassword" />
      <div class="password-hint">密码由后端加密入库，列表仅回显 ********，不会返回明文；请避免在公共环境输入。</div>
      <template #footer><el-button @click="passwordDialogVisible = false">取消</el-button><el-button type="primary" :loading="passwordSaving" @click="submitPassword">保存密码</el-button></template>
    </el-dialog>

    <el-dialog v-model="accountDialogVisible" title="新增支付宝账号" width="430px" class="fixed-body-dialog" align-center append-to-body :close-on-click-modal="false">
      <div class="dialog-form-row"><span>支付宝账号</span><el-input v-model="accountForm.alipayAccount" placeholder="请输入支付宝账号" maxlength="64" clearable @keyup.enter="submitAccount" /></div>
      <div class="dialog-form-row"><span>支付密码（可选）</span><el-input v-model="accountForm.password" type="password" show-password placeholder="可留空，创建后单独设密" maxlength="32" clearable @keyup.enter="submitAccount" /></div>
      <div class="password-hint">创建时可直接一并设密；留空则稍后在列表中点「设置密码」。密码加密入库，列表只回显掩码。</div>
      <template #footer><el-button @click="accountDialogVisible = false">取消</el-button><el-button type="primary" :loading="accountSaving" @click="submitAccount">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="bindDialogVisible" title="绑定 / 解绑支付宝" width="460px" class="fixed-body-dialog" align-center append-to-body :close-on-click-modal="false">
      <div class="password-account">设备号：<strong class="mono">{{ bindForm.deviceId || '-' }}</strong></div>
      <div class="password-account">当前绑定：<strong>{{ bindForm.currentAccount || '未绑定' }}</strong></div>
      <el-select v-model="bindForm.target" class="assign-select" filterable placeholder="选择要绑定的支付宝账号">
        <el-option v-for="item in alipayAccounts" :key="item.alipayAccount" :label="`${item.alipayAccount}${item.hasPassword ? '' : '（未设密）'}`" :value="item.alipayAccount" />
        <el-option label="解绑（清除当前绑定）" value="__unbind__" />
      </el-select>
      <div class="password-hint">绑定后设备派单将按该账号取支付密码；未设密的账号仍会导致支付失败。若账号不在列表中，请先在「支付宝账号与密码」中新增。设备在线时会同步内存中的付款账号，后绑覆盖。</div>
      <template #footer><el-button @click="bindDialogVisible = false">取消</el-button><el-button type="primary" :loading="bindSaving" @click="submitBind">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, Link, Monitor, Iphone, User, UserFilled, Grid, Refresh, Search, CircleCheck, DataAnalysis, FullScreen, Operation, Aim, Plus, Check, Loading, InfoFilled, CopyDocument, Collection, Tools, Key } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getWorkerList, saveWorkerSchedule, disconnectWorkerApi, androidGroupList, androidGroupSave, androidGroupDelete, androidGroupAssign, alipayAccountList, alipayAccountSave, setAlipayAccountPassword, androidDeviceList, androidDeviceBindAlipay, getAlipayBalanceThreshold, setAlipayBalanceThreshold, createManualRecharge, getManualRechargeList, getAlipayBalanceLedger, upstreamCompanyList, upstreamCompanyBindGroup, upstreamCompanySync } from '@/api/api.js'

const workers = ref([])
const scheduleConfigs = ref({})
const tenantNames = {} // 如有租户名称映射，可在此补充
const STORAGE_TENANT = 'worker_selected_tenant'
const STORAGE_PLATFORM = 'worker_active_platform'
const STORAGE_AUTO_REFRESH = 'worker_auto_refresh'
const savedTenant = localStorage.getItem(STORAGE_TENANT)
const selectedTenant = ref(savedTenant === null ? null : savedTenant)
const activePlatform = ref(localStorage.getItem(STORAGE_PLATFORM) === 'android' ? 'android' : 'pc')
function readAutoRefreshPreference() {
  try {
    return localStorage.getItem(STORAGE_AUTO_REFRESH) === 'true'
  } catch (error) {
    console.warn('读取自动刷新设置失败:', error)
    return false
  }
}
const tenantKeyword = ref('')
const workerKeyword = ref('')
const statusFilter = ref('')
const autoRefresh = ref(readAutoRefreshPreference())
const refreshing = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const selectorVisible = ref(false)
const selectorWorkIds = ref([])
const detailVisible = ref(false)
const detailWorker = ref(null)
const scheduleSaving = ref(false)
const scheduleForm = ref({ mode: 'auto', workIds: [], groups: [] })
const scheduleDirty = ref(false)
const authStore = useAuthStore()
const groupFilter = ref('')
const workerGroups = ref([])
const fallbackGroupNames = ref([])
const groupDialogVisible = ref(false)
const newGroupName = ref('')
const groupSaving = ref(false)
const assignVisible = ref(false)
const assignWorker = ref(null)
const assignTarget = ref('__ungrouped__')
const assignNewName = ref('')
const assignSaving = ref(false)
const configDrawerVisible = ref(false)
const configActiveTab = ref('alipay')
const alipayAccounts = ref([])
const alipayLoading = ref(false)
const alipayKeyword = ref('')
const androidDevices = ref([])
const deviceLoading = ref(false)
const deviceKeyword = ref('')
const deviceGroupFilter = ref('')
const deviceOnlineFilter = ref('')
const passwordDialogVisible = ref(false)
const passwordForm = ref({ alipayAccount: '', password: '' })
const passwordSaving = ref(false)
const accountDialogVisible = ref(false)
const accountForm = ref({ alipayAccount: '', password: '' })
const accountSaving = ref(false)
const bindDialogVisible = ref(false)
const bindForm = ref({ deviceId: '', currentAccount: '', target: '' })
const bindSaving = ref(false)
/* 上游公司 · 绑组；接口按登录 Token 推断租户 */
const priorityDrawerVisible = ref(false)
const upstreamCompanies = ref([])
const companyLoading = ref(false)
const companySyncing = ref(false)
const companySavingId = ref('')
const companyKeyword = ref('')
const balanceThreshold = ref(null)
const balanceEnabled = ref(false)
const thresholdInput = ref('')
const thresholdLoading = ref(false)
const thresholdSaving = ref(false)
/* 人工充值单 · 支付宝余额扣除流水：按登录 Token 推断租户，不随左侧租户选择变化 */
const manualForm = ref({ alipayAccount: '', amount: null, deviceId: '', remark: '' })
const manualSaving = ref(false)
const manualResult = ref(null)
const manualSubView = ref('orders')
const rechargeOrders = ref([])
const rechargeTotal = ref(0)
const rechargeLoading = ref(false)
const rechargePagination = reactive({ pageIndex: 1, pageSize: 20 })
const rechargeFilters = reactive({ alipayAccount: '', deviceId: '', dateRange: [] })
const alipayLedgerList = ref([])
const ledgerTotal = ref(0)
const ledgerLoading = ref(false)
const ledgerPagination = reactive({ pageIndex: 1, pageSize: 20 })
const ledgerFilters = reactive({ alipayAccount: '', changeType: 'manual_deduct', dateRange: [] })
const currentTime = ref(Date.now())
const router = useRouter()
let refreshTimer = null
let clockTimer = null

const filteredAlipayAccounts = computed(() => {
  const keyword = alipayKeyword.value.trim().toLowerCase()
  return keyword ? alipayAccounts.value.filter(item => item.alipayAccount.toLowerCase().includes(keyword)) : alipayAccounts.value
})
const filteredAndroidDevices = computed(() => {
  const keyword = deviceKeyword.value.trim().toLowerCase()
  let list = androidDevices.value
  if (keyword) list = list.filter(item => item.deviceId.toLowerCase().includes(keyword) || item.alipayAccount.toLowerCase().includes(keyword))
  if (deviceGroupFilter.value === '__ungrouped__') list = list.filter(item => !item.group)
  else if (deviceGroupFilter.value) list = list.filter(item => item.group === deviceGroupFilter.value)
  if (deviceOnlineFilter.value === 'online') list = list.filter(item => item.online)
  else if (deviceOnlineFilter.value === 'offline') list = list.filter(item => !item.online)
  return list
})

const thresholdText = computed(() => {
  if (!balanceEnabled.value || balanceThreshold.value === null || balanceThreshold.value === undefined) return '未启用'
  return String(balanceThreshold.value)
})

const filteredUpstreamCompanies = computed(() => {
  const keyword = companyKeyword.value.trim().toLowerCase()
  if (!keyword) return upstreamCompanies.value
  return upstreamCompanies.value.filter(item =>
    String(item.companyId).toLowerCase().includes(keyword) ||
    item.companyName.toLowerCase().includes(keyword) ||
    item.group.toLowerCase().includes(keyword)
  )
})

const statistics = computed(() => {
  const data = workers.value
  const pc = data.filter(item => item.platform === 'pc')
  const android = data.filter(item => item.platform === 'android')
  return {
    total: data.length, pc: pc.length, android: android.length,
    pcIdle: pc.filter(item => !item.isRunning).length,
    pcRunning: pc.filter(item => item.isRunning).length,
    androidIdle: android.filter(item => !item.isRunning).length,
    androidRunning: android.filter(item => item.isRunning).length,
    running: data.filter(item => item.isRunning).length,
    idle: data.filter(item => !item.isRunning).length,
    tenants: new Set(data.map(item => item.tenantId)).size
  }
})
const tenants = computed(() => {
  const map = new Map()
  for (const worker of workers.value) {
    if (!map.has(worker.tenantId)) map.set(worker.tenantId, { tenantId: worker.tenantId, name: tenantNames[worker.tenantId] || '未命名租户', total: 0, pc: 0, android: 0 })
    const tenant = map.get(worker.tenantId)
    tenant.total++
    if (worker.platform === 'pc') tenant.pc++
    else if (worker.platform === 'android') tenant.android++
  }
  return [...map.values()].sort((a, b) => Number(a.tenantId) - Number(b.tenantId))
})
const filteredTenants = computed(() => {
  const keyword = tenantKeyword.value.trim().toLowerCase()
  return keyword ? tenants.value.filter(item => String(item.tenantId).includes(keyword) || item.name.toLowerCase().includes(keyword)) : tenants.value
})
const currentTenantId = computed(() => String(selectedTenant.value || authStore.tenantId || workers.value[0]?.tenantId || ''))
// 配置类写操作必须明确选中租户：全部租户视图下不做写入，避免误改登录租户/首个连接租户的数据
const configTenantId = computed(() => selectedTenant.value === null ? '' : String(selectedTenant.value))
const filteredWorkers = computed(() => {
  let data = workers.value.filter(item => item.platform === activePlatform.value)
  if (selectedTenant.value !== null) data = data.filter(item => item.tenantId === String(selectedTenant.value))
  const keyword = workerKeyword.value.trim().toLowerCase()
  if (keyword) data = data.filter(item => item.workId.toLowerCase().includes(keyword) || item.deviceId.toLowerCase().includes(keyword) || item.tenantId.includes(keyword) || item.orderId.toLowerCase().includes(keyword) || item.payAccount.toLowerCase().includes(keyword))
  if (statusFilter.value === 'idle') data = data.filter(item => !item.isRunning)
  if (statusFilter.value === 'running') data = data.filter(item => item.isRunning)
  if (groupFilter.value === '__ungrouped__') data = data.filter(item => !item.group)
  else if (groupFilter.value) data = data.filter(item => item.group === groupFilter.value)
  return data
})
const pageWorkers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredWorkers.value.slice(start, start + pageSize.value)
})

function getScheduleKey(tenantId, platform) { return `${tenantId}:${platform}` }
function getWorkerSchedule(worker) { return scheduleConfigs.value[getScheduleKey(worker.tenantId, worker.platform)] || { mode: 'auto', workIds: [], groups: [] } }
function isWorkerAllowed(worker) {
  const config = getWorkerSchedule(worker)
  if (config.mode === 'auto') return true
  if (config.mode === 'manual') return Array.isArray(config.workIds) && config.workIds.includes(worker.workId)
  if (config.mode === 'group') return Boolean(worker.group) && Array.isArray(config.groups) && config.groups.includes(worker.group)
  return false
}
function loadSchedule() {
  const config = selectedTenant.value === null ? null : scheduleConfigs.value[getScheduleKey(selectedTenant.value, activePlatform.value)]
  const mode = ['auto', 'manual', 'group'].includes(config?.mode) ? config.mode : 'auto'
  scheduleForm.value = {
    mode,
    workIds: Array.isArray(config?.workIds) ? [...config.workIds] : [],
    groups: Array.isArray(config?.groups) ? [...config.groups] : [],
  }
  scheduleDirty.value = false
}
function setScheduleMode(mode) {
  if (selectedTenant.value === null) return ElMessage.warning('请先选择租户')
  if (mode === 'group' && activePlatform.value !== 'android') return ElMessage.warning('按组派单仅支持 Android 设备')
  if (scheduleForm.value.mode === mode) return
  scheduleForm.value.mode = mode
  scheduleDirty.value = true
}
async function confirmDiscardScheduleChanges(action = '切换') {
  if (!scheduleDirty.value) return true
  try {
    await ElMessageBox.confirm(
      `当前调度配置尚未保存，继续${action}将丢弃这些修改。`,
      '存在未保存的配置',
      {
        confirmButtonText: '放弃修改并继续',
        cancelButtonText: '继续编辑',
        type: 'warning',
      }
    )
    return true
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('确认放弃调度配置失败:', error)
      ElMessage.error('操作未完成，请重试')
    }
    return false
  }
}
function discardScheduleChanges() {
  if (!scheduleDirty.value) return
  loadSchedule()
  ElMessage.info('已还原为当前已保存配置')
}
const scheduleAvailableWorkers = computed(() => selectedTenant.value === null ? [] : workers.value.filter(item => item.tenantId === String(selectedTenant.value) && item.platform === activePlatform.value))
function removeScheduleWorker(workId) {
  scheduleForm.value.workIds = scheduleForm.value.workIds.filter(item => item !== workId)
  scheduleDirty.value = true
}
function openWorkerSelector() {
  if (selectedTenant.value === null) return ElMessage.warning('请先选择租户')
  selectorWorkIds.value = [...scheduleForm.value.workIds]
  selectorVisible.value = true
}
const selectorAllSelected = computed(() => scheduleAvailableWorkers.value.length > 0 && scheduleAvailableWorkers.value.every(item => selectorWorkIds.value.includes(item.workId)))
const selectorIndeterminate = computed(() => {
  const count = scheduleAvailableWorkers.value.filter(item => selectorWorkIds.value.includes(item.workId)).length
  return count > 0 && count < scheduleAvailableWorkers.value.length
})
function toggleSelectorWorker(workId) {
  const selected = new Set(selectorWorkIds.value)
  if (selected.has(workId)) selected.delete(workId)
  else selected.add(workId)
  selectorWorkIds.value = [...selected]
}
function toggleSelectorAll(checked) {
  const selected = new Set(selectorWorkIds.value)
  for (const worker of scheduleAvailableWorkers.value) {
    if (checked) selected.add(worker.workId)
    else selected.delete(worker.workId)
  }
  selectorWorkIds.value = [...selected]
}
function confirmWorkerSelector() {
  if (!selectorWorkIds.value.length) return ElMessage.warning('请至少选择一个 Worker')
  scheduleForm.value = { mode: 'manual', workIds: [...selectorWorkIds.value], groups: [...scheduleForm.value.groups] }
  scheduleDirty.value = true
  selectorVisible.value = false
}

async function saveSchedule() {
  if (selectedTenant.value === null) return ElMessage.warning('请先选择租户')
  const form = scheduleForm.value
  if (form.mode === 'manual' && !form.workIds.length) return ElMessage.warning('请至少选择一个 Worker')
  if (form.mode === 'group' && !form.groups.length) return ElMessage.warning('请至少选择一个分组')
  if (scheduleSaving.value) return
  const payload = {
    tenantId: String(selectedTenant.value),
    platform: activePlatform.value,
    mode: form.mode,
    workIds: form.mode === 'manual' ? [...new Set(form.workIds)] : [],
    groups: form.mode === 'group' ? [...new Set(form.groups)] : [],
  }
  scheduleSaving.value = true
  try {
    await saveWorkerSchedule(payload)
    scheduleConfigs.value = {
      ...scheduleConfigs.value,
      [getScheduleKey(payload.tenantId, payload.platform)]: { mode: payload.mode, workIds: [...payload.workIds], groups: [...payload.groups] },
    }
    loadSchedule()
    ElMessage.success('调度配置保存成功')
  } catch (error) {
    console.error('保存调度配置失败:', error)
    ElMessage.error(error?.message || '保存调度配置失败')
  } finally { scheduleSaving.value = false }
}
async function setOnlyWorker(worker) {
  if (!await confirmDiscardScheduleChanges('指定 Worker')) return
  try {
    await ElMessageBox.confirm(`确定将租户 ${worker.tenantId} 的 ${worker.platform.toUpperCase()} 任务仅指定给当前 Worker 吗？`, '指定 Worker', { confirmButtonText: '确定指定', cancelButtonText: '取消', type: 'warning' })
  } catch { return }
  if (scheduleSaving.value) return
  scheduleSaving.value = true
  try {
    const payload = { tenantId: String(worker.tenantId), platform: worker.platform, mode: 'manual', workIds: [worker.workId] }
    await saveWorkerSchedule(payload)
    scheduleConfigs.value = { ...scheduleConfigs.value, [getScheduleKey(payload.tenantId, payload.platform)]: { mode: 'manual', workIds: [...payload.workIds], groups: [] } }
    selectedTenant.value = payload.tenantId
    activePlatform.value = payload.platform
    loadSchedule()
    ElMessage.success('指定 Worker 成功')
  } catch (error) {
    console.error('指定 Worker 失败:', error)
    ElMessage.error(error?.message || '指定 Worker 失败')
  } finally { scheduleSaving.value = false }
}
async function selectTenant(tenantId) {
  const nextTenantId = tenantId === null ? null : String(tenantId)
  if (nextTenantId === selectedTenant.value) return
  if (scheduleSaving.value) return ElMessage.warning('调度配置正在保存，请稍后再切换')
  if (!await confirmDiscardScheduleChanges('切换租户')) return
  selectedTenant.value = nextTenantId
  currentPage.value = 1
  groupFilter.value = ''
  loadSchedule()
  await loadGroupList()
}
async function changePlatform(platform) {
  if (platform === activePlatform.value) return
  if (scheduleSaving.value) return ElMessage.warning('调度配置正在保存，请稍后再切换')
  if (!await confirmDiscardScheduleChanges('切换平台')) return
  activePlatform.value = platform
  currentPage.value = 1
  workerKeyword.value = ''
  statusFilter.value = ''
  groupFilter.value = ''
  loadSchedule()
  if (platform === 'pc' && scheduleForm.value.mode === 'group') {
    scheduleForm.value.mode = 'auto'
  }
}
watch(selectedTenant, value => {
  if (value === null) localStorage.removeItem(STORAGE_TENANT)
  else localStorage.setItem(STORAGE_TENANT, String(value))
  // 切换租户时清空配置缓存；抽屉打开则立即按新租户重新加载，避免残留/误改其他租户数据
  alipayAccounts.value = []
  androidDevices.value = []
  // 记账表单的账号/设备来自上面两份列表，租户变了必须清掉，避免提交到不属于新租户的账号
  manualForm.value.alipayAccount = ''
  manualForm.value.deviceId = ''
  manualResult.value = null
  if (configDrawerVisible.value) {
    loadAlipayAccounts()
    loadAndroidDevices()
  }
})
watch(activePlatform, value => localStorage.setItem(STORAGE_PLATFORM, value))
// 切到「人工充值 · 余额流水」时才加载列表，避免每次打开抽屉都发多余请求
watch(configActiveTab, tab => {
  if (tab !== 'manual') return
  if (manualSubView.value === 'orders') loadRechargeOrders()
  else loadAlipayLedger()
})

async function disconnectWorker(worker) {
  try {
    await ElMessageBox.confirm(`确定断开 Worker：${worker.workId} 吗？`, '断开连接', { confirmButtonText: '确定断开', cancelButtonText: '取消', type: 'warning' })
  } catch { return }
  try {
    await disconnectWorkerApi({ tenantId: String(worker.tenantId), platform: worker.platform, workId: worker.workId })
    ElMessage.success('Worker 已断开')
    await refreshData()
  } catch (error) {
    console.error('断开 Worker 失败:', error)
    ElMessage.error(error?.message || '断开 Worker 失败')
  }
}
function showDetail(worker) { detailWorker.value = { ...worker }; detailVisible.value = true }

async function loadGroupList() {
  if (!currentTenantId.value) return
  try {
    const res = await androidGroupList({ tenantId: currentTenantId.value })
    const groupMap = new Map()
    const rawGroups = Array.isArray(res?.groups) ? res.groups : []
    for (const group of rawGroups) {
      if (typeof group === 'string') groupMap.set(group, { name: group, memberCount: 0, onlineCount: 0 })
      else if (group?.name) groupMap.set(group.name, { name: group.name, memberCount: Number(group.memberCount ?? 0), onlineCount: Number(group.onlineCount ?? 0) })
    }
    // 接口文档契约：members[] = { deviceId, group }，据此统计组成员
    const rawMembers = Array.isArray(res?.members) ? res.members : []
    const memberCounts = new Map()
    for (const member of rawMembers) {
      const name = typeof member === 'string' ? member : String(member?.group || '')
      if (!name) continue
      memberCounts.set(name, (memberCounts.get(name) || 0) + 1)
      if (!groupMap.has(name)) groupMap.set(name, { name, memberCount: 0, onlineCount: 0 })
    }
    if (!rawGroups.length) {
      for (const [name, count] of memberCounts) groupMap.get(name).memberCount = count
    }
    for (const name of fallbackGroupNames.value) {
      if (name && !groupMap.has(name)) groupMap.set(name, { name, memberCount: 0, onlineCount: 0 })
    }
    // 在线数统一以实时 Worker 列表为准（worker_list 只返回在线连接）
    const onlineCounts = new Map()
    for (const worker of workers.value) {
      if (!worker.group) continue
      onlineCounts.set(worker.group, (onlineCounts.get(worker.group) || 0) + 1)
      if (!groupMap.has(worker.group)) groupMap.set(worker.group, { name: worker.group, memberCount: 1, onlineCount: 0 })
    }
    for (const [name, count] of onlineCounts) groupMap.get(name).onlineCount = count
    workerGroups.value = [...groupMap.values()]
  } catch (error) {
    console.warn('获取安卓分组失败:', error)
  }
}

function openGroupDialog() {
  if (selectedTenant.value === null) return ElMessage.warning('请先从左侧选择具体租户')
  newGroupName.value = ''
  groupDialogVisible.value = true
}

async function createGroup() {
  if (selectedTenant.value === null) return ElMessage.warning('请先从左侧选择具体租户')
  const name = newGroupName.value.trim()
  if (!name) return ElMessage.warning('请输入分组名称')
  if (workerGroups.value.some(group => group.name === name)) return ElMessage.warning('分组已存在')
  groupSaving.value = true
  try {
    await androidGroupSave({ tenantId: configTenantId.value, group: name })
    newGroupName.value = ''
    await loadGroupList()
    ElMessage.success('分组创建成功')
  } catch (error) {
    console.error('创建分组失败:', error)
    ElMessage.error(error?.message || '创建分组失败')
  } finally { groupSaving.value = false }
}

async function openRenameGroup(group) {
  if (selectedTenant.value === null) return ElMessage.warning('请先从左侧选择具体租户')
  try {
    const { value } = await ElMessageBox.prompt('请输入新分组名称', '重命名分组', {
      inputValue: group.name,
      inputValidator: value => Boolean(value?.trim()) || '分组名称不能为空',
    })
    const newName = value.trim()
    if (workerGroups.value.some(item => item.name === newName)) return ElMessage.warning('目标分组已存在')
    await androidGroupSave({ tenantId: configTenantId.value, group: group.name, newName })
    await refreshData()
    ElMessage.success('分组重命名成功')
  } catch (error) {
    if (error?.action !== 'cancel') {
      console.error('重命名分组失败:', error)
      ElMessage.error(error?.message || '重命名分组失败')
    }
  }
}

async function deleteGroup(group) {
  if (selectedTenant.value === null) return ElMessage.warning('请先从左侧选择具体租户')
  try {
    await ElMessageBox.confirm(`确定删除分组「${group.name}」吗？删除后组内设备将变为未分组。`, '删除分组', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch { return }
  try {
    await androidGroupDelete({ tenantId: configTenantId.value, group: group.name })
    scheduleForm.value.groups = scheduleForm.value.groups.filter(item => item !== group.name)
    await refreshData()
    ElMessage.success('分组已删除')
  } catch (error) {
    console.error('删除分组失败:', error)
    ElMessage.error(error?.message || '删除分组失败')
  }
}

function openAssignDialog(worker) {
  if (!worker.deviceId) return ElMessage.warning('该 Worker 未上报设备号，无法设置分组')
  assignWorker.value = worker
  assignTarget.value = worker.group || '__ungrouped__'
  assignNewName.value = ''
  assignVisible.value = true
}

function onAssignTargetChange() {
  assignNewName.value = ''
}

async function confirmAssign() {
  const worker = assignWorker.value
  if (!worker?.deviceId) return ElMessage.warning('该 Worker 未上报设备号，无法设置分组')
  let groupName = ''
  if (assignTarget.value === '__ungrouped__') {
    groupName = ''
  } else if (assignTarget.value === '__new__') {
    groupName = assignNewName.value.trim()
    if (!groupName) return ElMessage.warning('请输入新分组名称')
    if (workerGroups.value.some(group => group.name === groupName)) return ElMessage.warning('分组已存在，请直接选择该分组')
  } else {
    groupName = assignTarget.value
  }
  assignSaving.value = true
  try {
    const tenantId = String(worker.tenantId || currentTenantId.value)
    if (assignTarget.value === '__new__') {
      await androidGroupSave({ tenantId, group: groupName })
    }
    // 分组只认 deviceId，不再传 payAccount；换绑支付宝不影响已有分组
    await androidGroupAssign({ tenantId, deviceId: worker.deviceId, group: groupName })
    assignVisible.value = false
    await refreshData()
    if (configDrawerVisible.value) await loadAndroidDevices()
    ElMessage.success('设备分组已更新')
  } catch (error) {
    console.error('分配设备分组失败:', error)
    ElMessage.error(error?.message || '分配设备分组失败')
  } finally { assignSaving.value = false }
}

function openConfigDrawer() {
  configDrawerVisible.value = true
  loadBalanceThreshold()
  loadAlipayAccounts()
  loadAndroidDevices()
}

/* ===== 上游公司 · 绑组 ===== */
function openPriorityDrawer() {
  priorityDrawerVisible.value = true
  loadUpstreamCompanies()
}

async function loadUpstreamCompanies() {
  companyLoading.value = true
  try {
    const res = await upstreamCompanyList()
    const list = Array.isArray(res?.list) ? res.list : (Array.isArray(res) ? res : [])
    upstreamCompanies.value = list.map(item => ({
      companyId: String(item.companyId || item.id || ''),
      companyName: String(item.companyName || item.name || ''),
      status: item.status ?? '-',
      group: String(item.group || ''),
      syncedAt: item.syncedAt || '',
      editing: false,
      editGroup: '',
    }))
  } catch (error) {
    console.error('获取上游公司列表失败:', error)
    ElMessage.error(error?.message || '获取上游公司列表失败')
  } finally { companyLoading.value = false }
}

async function syncUpstreamCompanies() {
  if (companySyncing.value) return
  companySyncing.value = true
  try {
    await upstreamCompanySync()
    ElMessage.success('上游公司同步完成')
    await loadUpstreamCompanies()
  } catch (error) {
    console.error('同步上游公司失败:', error)
    ElMessage.error(error?.message || '同步上游公司失败')
  } finally { companySyncing.value = false }
}

function startCompanyEdit(row) {
  row.editGroup = row.group || ''
  row.editing = true
}

function cancelCompanyEdit(row) {
  row.editing = false
  row.editGroup = ''
}

async function saveCompanyGroup(row) {
  const group = String(row.editGroup || '').trim()
  if (!group) return ElMessage.warning('请选择本地组')
  // 文档规则：一组只能绑一家公司，本地先拦一道，避免后端报错
  const occupied = upstreamCompanies.value.find(item => item.companyId !== row.companyId && item.group === group)
  if (occupied) return ElMessage.warning(`分组「${group}」已绑定公司「${occupied.companyName || occupied.companyId}」`)
  if (companySavingId.value) return
  companySavingId.value = row.companyId
  try {
    await upstreamCompanyBindGroup({ companyId: row.companyId, group })
    ElMessage.success('公司分组已绑定')
    await loadUpstreamCompanies()
  } catch (error) {
    console.error('绑定上游公司分组失败:', error)
    ElMessage.error(error?.message || '绑定上游公司分组失败')
  } finally { companySavingId.value = '' }
}

async function unbindCompanyGroup(row) {
  if (!row.group) return
  try {
    await ElMessageBox.confirm(
      `确定解绑公司「${row.companyName || row.companyId}」与分组「${row.group}」的绑定吗？解绑后该公司订单不再按对应组派单。`,
      '解绑上游公司分组',
      { confirmButtonText: '确认解绑', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }
  if (companySavingId.value) return
  companySavingId.value = row.companyId
  try {
    await upstreamCompanyBindGroup({ companyId: row.companyId, group: '' })
    ElMessage.success('已解绑')
    await loadUpstreamCompanies()
  } catch (error) {
    console.error('解绑上游公司分组失败:', error)
    ElMessage.error(error?.message || '解绑上游公司分组失败')
  } finally { companySavingId.value = '' }
}

async function loadAlipayAccounts() {
  if (!configTenantId.value) { alipayAccounts.value = []; return }
  alipayLoading.value = true
  try {
    const res = await alipayAccountList({ tenantId: configTenantId.value })
    const list = Array.isArray(res?.list) ? res.list : (Array.isArray(res) ? res : [])
    // 列表 data.threshold 与 threshold/get 一致；belowThreshold 直接采用后端判定，前端不重复计算
    alipayAccounts.value = list.map(item => ({
      alipayAccount: String(item.alipayAccount || ''),
      hasPassword: Boolean(item.hasPassword),
      passwordMask: String(item.passwordMask || (item.hasPassword ? '********' : '')),
      balance: item.balance === null || item.balance === undefined ? null : Number(item.balance),
      balanceText: String(item.balanceText || (item.balance == null ? '暂未获取' : String(item.balance))),
      balanceUpdatedAt: item.balanceUpdatedAt || '',
      belowThreshold: Boolean(item.belowThreshold),
    }))
  } catch (error) {
    console.error('获取支付宝账号列表失败:', error)
    ElMessage.error(error?.message || '获取支付宝账号列表失败')
  } finally { alipayLoading.value = false }
}

async function loadAndroidDevices() {
  if (!configTenantId.value) { androidDevices.value = []; return }
  deviceLoading.value = true
  try {
    const res = await androidDeviceList({ tenantId: configTenantId.value })
    const list = Array.isArray(res?.list) ? res.list : (Array.isArray(res) ? res : [])
    androidDevices.value = list.map(item => ({
      deviceId: String(item.deviceId || ''),
      alipayAccount: String(item.alipayAccount || ''),
      group: String(item.group || ''),
      online: Boolean(item.online),
      boundAt: item.boundAt || '',
      balance: item.balance === null || item.balance === undefined ? null : Number(item.balance),
      balanceText: String(item.balanceText || (item.balance == null ? '暂未获取' : String(item.balance))),
      balanceUpdatedAt: item.balanceUpdatedAt || '',
      belowThreshold: Boolean(item.belowThreshold),
    }))
  } catch (error) {
    console.error('获取安卓设备列表失败:', error)
    ElMessage.error(error?.message || '获取安卓设备列表失败')
  } finally { deviceLoading.value = false }
}

function formatBoundAt(value) {
  if (!value) return '-'
  const num = Number(value)
  if (Number.isFinite(num) && num > 0) {
    const ms = num < 1e12 ? num * 1000 : num
    return new Date(ms).toLocaleString('zh-CN', { hour12: false })
  }
  return String(value)
}

function openPasswordDialog(row) {
  passwordForm.value = { alipayAccount: row.alipayAccount, password: '' }
  passwordDialogVisible.value = true
}

async function submitPassword() {
  const password = passwordForm.value.password
  if (!password) return ElMessage.warning('请输入支付密码')
  const ok = await applyAlipayPassword(passwordForm.value.alipayAccount, password, '支付密码设置成功')
  if (ok) passwordDialogVisible.value = false
}

async function applyAlipayPassword(account, password, successText) {
  if (!configTenantId.value) { ElMessage.warning('请先在左侧选择具体租户'); return false }
  if (!account || passwordSaving.value) return false
  passwordSaving.value = true
  try {
    await setAlipayAccountPassword({ tenantId: configTenantId.value, alipayAccount: account, password })
    passwordForm.value.password = ''
    ElMessage.success(successText)
    await loadAlipayAccounts()
    return true
  } catch (error) {
    console.error('设置支付宝密码失败:', error)
    ElMessage.error(error?.message || '设置支付宝密码失败')
    return false
  } finally { passwordSaving.value = false }
}

async function clearAlipayPassword(row) {
  if (!row.hasPassword) return
  try {
    await ElMessageBox.confirm(
      `确定清空支付宝账号「${row.alipayAccount}」的支付密码吗？清空后该账号将无法用于自动支付。`,
      '清空支付密码',
      { confirmButtonText: '确认清空', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }
  await applyAlipayPassword(row.alipayAccount, '', '支付密码已清空')
}

function openDeviceAssignDialog(row) {
  if (!configTenantId.value) return ElMessage.warning('请先在左侧选择具体租户')
  openAssignDialog({
    deviceId: row.deviceId,
    payAccount: row.alipayAccount,
    tenantId: configTenantId.value,
    group: row.group,
    platform: 'android',
  })
}

function openAccountDialog() {
  if (!configTenantId.value) return ElMessage.warning('请先在左侧选择具体租户')
  accountForm.value = { alipayAccount: '', password: '' }
  accountDialogVisible.value = true
}

async function submitAccount() {
  if (!configTenantId.value) return ElMessage.warning('请先在左侧选择具体租户')
  const alipayAccount = accountForm.value.alipayAccount.trim()
  if (!alipayAccount) return ElMessage.warning('请输入支付宝账号')
  if (alipayAccounts.value.some(item => item.alipayAccount === alipayAccount)) return ElMessage.warning('该支付宝账号已存在，如需改密请用「设置密码」')
  if (accountSaving.value) return
  accountSaving.value = true
  try {
    const payload = { tenantId: configTenantId.value, alipayAccount }
    // password 可选：创建时一并设密；留空则不传，避免被后端当成清空
    if (accountForm.value.password) payload.password = accountForm.value.password
    await alipayAccountSave(payload)
    accountDialogVisible.value = false
    accountForm.value = { alipayAccount: '', password: '' }
    ElMessage.success('支付宝账号已新增')
    await loadAlipayAccounts()
  } catch (error) {
    console.error('新增支付宝账号失败:', error)
    ElMessage.error(error?.message || '新增支付宝账号失败')
  } finally { accountSaving.value = false }
}

function openBindDialog(row) {
  if (!configTenantId.value) return ElMessage.warning('请先在左侧选择具体租户')
  if (!row.deviceId) return ElMessage.warning('该设备未上报设备号')
  bindForm.value = { deviceId: row.deviceId, currentAccount: row.alipayAccount || '', target: row.alipayAccount || '' }
  bindDialogVisible.value = true
}

async function submitBind() {
  if (!configTenantId.value) return ElMessage.warning('请先在左侧选择具体租户')
  const target = bindForm.value.target
  if (!target) return ElMessage.warning('请选择要绑定的支付宝账号，或选择解绑')
  if (bindSaving.value) return
  const alipayAccount = target === '__unbind__' ? '' : target
  if (alipayAccount === bindForm.value.currentAccount) return ElMessage.warning('绑定关系未变化')
  const isUnbind = !alipayAccount
  if (isUnbind) {
    try {
      await ElMessageBox.confirm(
        '确定解除该设备当前绑定的支付宝吗？解绑后该设备派单将取不到支付密码，支付会失败。',
        '解绑支付宝',
        { confirmButtonText: '确认解绑', cancelButtonText: '取消', type: 'warning' }
      )
    } catch { return }
  }
  bindSaving.value = true
  try {
    await androidDeviceBindAlipay({ tenantId: configTenantId.value, deviceId: bindForm.value.deviceId, alipayAccount })
    bindDialogVisible.value = false
    ElMessage.success(isUnbind ? '已解绑支付宝' : '支付宝绑定成功')
    await loadAndroidDevices()
    // 设备在线时后端会同步内存中的付款账号，刷新 Worker 列表让 payAccount 立即更新
    await refreshData()
  } catch (error) {
    console.error('绑定设备支付宝失败:', error)
    ElMessage.error(error?.message || '绑定设备支付宝失败')
  } finally { bindSaving.value = false }
}

/* ===== 余额预警阈值：get / set 不接受 tenantId，按登录 Token 推断租户 ===== */
async function loadBalanceThreshold() {
  thresholdLoading.value = true
  try {
    const res = await getAlipayBalanceThreshold()
    const raw = res?.threshold
    const value = raw === null || raw === undefined || raw === '' ? null : Number(raw)
    balanceThreshold.value = Number.isFinite(value) ? value : null
    balanceEnabled.value = res?.enabled !== undefined
      ? Boolean(res.enabled)
      : (balanceThreshold.value !== null && balanceThreshold.value > 0)
    thresholdInput.value = balanceThreshold.value === null ? '' : String(balanceThreshold.value)
  } catch (error) {
    // 阈值读取失败不阻塞抽屉其余功能
    console.warn('获取余额预警阈值失败:', error)
  } finally { thresholdLoading.value = false }
}

async function saveBalanceThreshold() {
  if (thresholdSaving.value) return
  let payload
  if (!balanceEnabled.value) {
    payload = { threshold: null }
  } else {
    const value = Number(thresholdInput.value)
    if (thresholdInput.value === '' || !Number.isFinite(value) || value < 0) return ElMessage.warning('请输入有效的阈值金额（≥ 0）')
    payload = { threshold: value }
  }
  thresholdSaving.value = true
  try {
    await setAlipayBalanceThreshold(payload)
    balanceThreshold.value = payload.threshold
    thresholdInput.value = payload.threshold === null ? '' : String(payload.threshold)
    ElMessage.success(payload.threshold === null ? '余额预警已关闭' : '余额预警阈值已保存')
    // 阈值变化会影响列表 belowThreshold，刷新两份列表
    await Promise.all([loadAlipayAccounts(), loadAndroidDevices()])
  } catch (error) {
    console.error('设置余额预警阈值失败:', error)
    ElMessage.error(error?.message || '设置余额预警阈值失败')
  } finally { thresholdSaving.value = false }
}

/* ===== 人工充值单 · 支付宝余额扣除流水 ===== */
function formatMoney(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(2) : '-'
}

/** before/afterBalance 为 null 表示余额暂未获取，不能显示成 ¥0.00 */
function formatBalance(value) {
  if (value === null || value === undefined || value === '') return '暂未获取'
  const num = Number(value)
  return Number.isFinite(num) ? `¥${num.toFixed(2)}` : String(value)
}

function buildTimeParams(range) {
  if (Array.isArray(range) && range.length === 2 && range[0] && range[1]) {
    return { startTime: `${range[0]} 00:00:00`, endTime: `${range[1]} 23:59:59` }
  }
  return { startTime: '', endTime: '' }
}

/** 兼容 data.list[] / 顶层数组两种响应；total 缺失时退回本页条数 */
function extractPagedList(res) {
  const list = Array.isArray(res?.list) ? res.list : (Array.isArray(res) ? res : [])
  const rawTotal = Number(res?.total ?? res?.count ?? list.length)
  return { list, total: Number.isFinite(rawTotal) ? rawTotal : list.length }
}

function resetManualForm() {
  manualForm.value = { alipayAccount: '', amount: null, deviceId: '', remark: '' }
  manualResult.value = null
}

async function submitManualRecharge() {
  if (!configTenantId.value) return ElMessage.warning('请先在左侧选择具体租户，以加载支付宝账号')
  const alipayAccount = manualForm.value.alipayAccount
  if (!alipayAccount) return ElMessage.warning('请选择支付宝账号')
  const amount = Number(manualForm.value.amount)
  if (!Number.isFinite(amount) || amount <= 0) return ElMessage.warning('请输入大于 0 的实付金额')
  const remark = manualForm.value.remark.trim()
  if (!remark) return ElMessage.warning('备注必填')
  if (manualSaving.value) return
  manualSaving.value = true
  try {
    const payload = { alipayAccount, amount, remark }
    const deviceId = String(manualForm.value.deviceId || '').trim()
    if (deviceId) payload.deviceId = deviceId
    const res = await createManualRecharge(payload)
    manualResult.value = {
      rechargeNo: String(res?.rechargeNo || ''),
      beforeBalance: res?.beforeBalance ?? null,
      afterBalance: res?.afterBalance ?? null,
    }
    manualForm.value.amount = null
    manualForm.value.remark = ''
    ElMessage.success('人工充值单记账成功')
    // 文档要求：提交成功后刷新该账号 balance / balanceText，并同步两份列表
    await Promise.all([loadAlipayAccounts(), loadRechargeOrders(), loadAlipayLedger()])
  } catch (error) {
    console.error('新建人工充值单失败:', error)
    ElMessage.error(error?.message || '新建人工充值单失败')
  } finally { manualSaving.value = false }
}

async function loadRechargeOrders() {
  rechargeLoading.value = true
  try {
    const res = await getManualRechargeList({
      alipayAccount: rechargeFilters.alipayAccount.trim(),
      deviceId: rechargeFilters.deviceId.trim(),
      ...buildTimeParams(rechargeFilters.dateRange),
      pageIndex: rechargePagination.pageIndex,
      pageSize: rechargePagination.pageSize,
    })
    const { list, total } = extractPagedList(res)
    rechargeOrders.value = list.map(item => ({
      rechargeNo: String(item.rechargeNo || ''),
      alipayAccount: String(item.alipayAccount || ''),
      deviceId: String(item.deviceId || ''),
      amount: item.amount ?? 0,
      beforeBalance: item.beforeBalance ?? null,
      afterBalance: item.afterBalance ?? null,
      remark: String(item.remark || ''),
      operator: String(item.operator || ''),
      createTime: item.createTime || '',
    }))
    rechargeTotal.value = total
  } catch (error) {
    console.error('读取人工充值单列表失败:', error)
    ElMessage.error(error?.message || '读取人工充值单列表失败')
  } finally { rechargeLoading.value = false }
}

async function loadAlipayLedger() {
  ledgerLoading.value = true
  try {
    const res = await getAlipayBalanceLedger({
      alipayAccount: ledgerFilters.alipayAccount.trim(),
      changeType: ledgerFilters.changeType,
      ...buildTimeParams(ledgerFilters.dateRange),
      pageIndex: ledgerPagination.pageIndex,
      pageSize: ledgerPagination.pageSize,
    })
    const { list, total } = extractPagedList(res)
    alipayLedgerList.value = list.map(item => ({
      refNo: String(item.refNo || ''),
      alipayAccount: String(item.alipayAccount || ''),
      amount: Number(item.amount ?? 0),
      beforeBalance: item.beforeBalance ?? null,
      afterBalance: item.afterBalance ?? null,
      changeType: String(item.changeType || ''),
      remark: String(item.remark || ''),
      operator: String(item.operator || ''),
      createTime: item.createTime || '',
    }))
    ledgerTotal.value = total
  } catch (error) {
    console.error('读取支付宝余额流水失败:', error)
    ElMessage.error(error?.message || '读取支付宝余额流水失败')
  } finally { ledgerLoading.value = false }
}

function searchRecharge() {
  rechargePagination.pageIndex = 1
  loadRechargeOrders()
}

function resetRechargeFilters() {
  rechargeFilters.alipayAccount = ''
  rechargeFilters.deviceId = ''
  rechargeFilters.dateRange = []
  searchRecharge()
}

function searchLedger() {
  ledgerPagination.pageIndex = 1
  loadAlipayLedger()
}

function resetLedgerFilters() {
  ledgerFilters.alipayAccount = ''
  ledgerFilters.changeType = 'manual_deduct'
  ledgerFilters.dateRange = []
  searchLedger()
}

function switchManualSubView(view) {
  if (manualSubView.value === view) return
  manualSubView.value = view
  if (view === 'orders') loadRechargeOrders()
  else loadAlipayLedger()
}

/** 账号列表「流水」：跳到人工充值 Tab 并预填账号，加载由 configActiveTab 的 watch 触发 */
function openAccountLedger(row) {
  ledgerFilters.alipayAccount = row.alipayAccount
  ledgerPagination.pageIndex = 1
  manualSubView.value = 'ledger'
  configActiveTab.value = 'manual'
}

async function refreshData(showMessage = false) {
  if (refreshing.value) return
  refreshing.value = true
  try {
    const res = await getWorkerList()
    const list = Array.isArray(res?.workers) ? res.workers : []
    workers.value = list.map(item => ({
      id: String(item.workerKey || ''), workId: String(item.workerKey || ''), workerKey: String(item.workerKey || ''),
      tenantId: String(item.tenantId ?? ''), platform: String(item.platform || '').toLowerCase(),
      deviceId: String(item.deviceId || item.device || ''),
      payAccount: String(item.payAccount || ''), group: String(item.group || ''), isRunning: Boolean(item.isRunning), orderId: String(item.orderId || ''),
      connectedAt: Number(item.connectedAt || 0) * 1000, lastHeartbeat: Number(item.lastHeartbeat || 0) * 1000
    }))
    scheduleConfigs.value = res?.schedules && typeof res.schedules === 'object' ? res.schedules : {}
    const rawFallbackGroups = Array.isArray(res?.groups) ? res.groups : []
    const scheduleGroupNames = Object.values(scheduleConfigs.value).flatMap(config => config.groups || [])
    fallbackGroupNames.value = [...new Set([...rawFallbackGroups.map(group => typeof group === 'string' ? group : group?.name).filter(Boolean), ...scheduleGroupNames])]
    await loadGroupList()
    // 只在没有未保存修改时同步后端配置；即使开启自动刷新也能恢复。
    if (!scheduleDirty.value) loadSchedule()
    currentTime.value = Date.now()
    if (showMessage) ElMessage.success(`连接列表刷新成功，当前在线 ${workers.value.length} 个 Worker`)
  } catch (error) {
    console.error('获取 Worker 列表失败:', error)
    if (showMessage) ElMessage.error(error?.message || '获取 Worker 列表失败')
  } finally { refreshing.value = false }
}
watch(autoRefresh, enabled => {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
  try {
    localStorage.setItem(STORAGE_AUTO_REFRESH, String(enabled))
  } catch (error) {
    console.warn('保存自动刷新设置失败:', error)
  }
  if (enabled) refreshTimer = setInterval(() => refreshData(), 3000)
}, { immediate: true })
watch([workerKeyword, statusFilter, groupFilter, pageSize], () => { currentPage.value = 1 })
watch(filteredWorkers, data => { const maxPage = Math.max(1, Math.ceil(data.length / pageSize.value)); if (currentPage.value > maxPage) currentPage.value = maxPage })
function formatDuration(timestamp) {
  if (!timestamp) return '-'
  const diff = Math.max(0, Math.floor((currentTime.value - timestamp) / 1000))
  return [Math.floor(diff / 3600), Math.floor((diff % 3600) / 60), diff % 60].map(item => String(item).padStart(2, '0')).join(':')
}
function formatHeartbeat(timestamp) {
  if (!timestamp) return '-'
  const seconds = Math.max(0, Math.floor((currentTime.value - timestamp) / 1000))
  return seconds < 60 ? `${seconds} 秒前` : `${Math.floor(seconds / 60)} 分钟前`
}
function getHeartbeatClass(timestamp) {
  if (!timestamp) return 'unknown'
  const ageSeconds = Math.max(0, (currentTime.value - timestamp) / 1000)
  if (ageSeconds >= 60) return 'stale'
  if (ageSeconds >= 30) return 'delayed'
  return 'healthy'
}
function openOrder(orderId) {
  const value = String(orderId || '').trim()
  if (!value) return
  router.push({ name: 'Home', query: { orderId: value } })
}
function formatDate(timestamp) { return timestamp ? new Date(timestamp).toLocaleString('zh-CN', { hour12: false }) : '-' }
async function copyText(value) { try { await navigator.clipboard.writeText(value); ElMessage.success('复制成功') } catch { ElMessage.warning('复制失败') } }
function toggleFullscreen() {
  const element = document.querySelector('.link-page')
  if (!document.fullscreenElement) element?.requestFullscreen?.().catch(() => ElMessage.warning('当前环境不支持全屏'))
  else document.exitFullscreen?.()
}
const tableHeaderStyle = { background: 'var(--app-table-header-bg)', color: 'var(--app-text-secondary)', fontSize: '12px', fontWeight: '600', height: '48px' }
onMounted(() => { refreshData(); clockTimer = setInterval(() => { currentTime.value = Date.now() }, 1000) })
onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer); if (clockTimer) clearInterval(clockTimer) })
</script>

<style scoped>
.link-page{--primary:var(--app-accent-strong);--text-primary:var(--app-text-primary);--text-secondary:var(--app-text-secondary);width:100%;min-height:100%;padding: 26px 30px 44px;;color:var(--text-primary);font-size:13px}.link-page *{box-sizing:border-box}
.hero-banner{position:relative;display:flex;align-items:center;justify-content:space-between;min-height:132px;padding:25px 40px;margin-bottom:22px;overflow:hidden;border-radius:17px;background:var(--app-accent-gradient);box-shadow:0 10px 26px rgba(0,0,0,.16)}
.hero-left{position:relative;z-index:2;display:flex;align-items:center;gap:20px;min-width:0}.hero-icon{width:60px;height:60px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:15px;background:rgba(255,255,255,.12);color:#fff;font-size:30px}.hero-content{min-width:0}.hero-title-row{display:flex;align-items:center;gap:12px}.hero-content h1{margin:0;color:#fff;font-size:25px;font-weight:650}.hero-content p{margin:12px 0 0;color:rgba(255,255,255,.82);font-size:12px;line-height:1.7}.hero-live{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:20px;background:rgba(20,184,166,.16);color:#80f4ce;font-size:10px;font-weight:600}.live-dot{width:6px;height:6px;border-radius:50%;background:#36e7b1;box-shadow:0 0 8px #36e7b1}
.hero-decoration{position:absolute;top:0;right:19%;width:260px;height:100%;pointer-events:none}.hero-orbit{position:absolute;width:260px;height:90px;border:1px solid rgba(255,255,255,.35);border-radius:50%;transform:rotate(-18deg)}.orbit-one{top:30px;left:-30px}.orbit-two{top:45px;left:15px;border-color:rgba(255,255,255,.18)}.hero-cube{position:absolute;top:18px;left:98px;display:flex;align-items:center;justify-content:center;width:76px;height:76px;border:1px solid rgba(255,255,255,.55);border-radius:20px;transform:rotate(-8deg);background:rgba(255,255,255,.18);color:#fff;font-size:36px;box-shadow:0 12px 30px rgba(0,0,0,.18),inset 0 1px 12px rgba(255,255,255,.25)}.hero-cube-base{position:absolute;top:96px;left:76px;width:120px;height:16px;border-radius:50%;background:rgba(255,255,255,.32);filter:blur(12px)}.hero-features{position:relative;z-index:2;display:flex;flex-direction:column;gap:12px;padding:13px 16px;border-radius:12px;background:rgba(0,0,0,.22)}.hero-features>div{display:flex;align-items:center;gap:9px;color:#fff;white-space:nowrap;font-size:12px}.hero-features .el-icon{color:#fff;font-size:15px}
.stats-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px;margin-bottom:22px}.stat-card{display:flex;align-items:center;gap:15px;min-width:0;min-height:116px;padding:20px;border: 1px solid var(--app-border);border-radius:16px;background: linear-gradient(145deg,var(--app-bg-elevated),var(--app-bg-subtle));box-shadow:0 7px 22px rgba(49,86,153,.055);transition:transform .2s,box-shadow .2s}.stat-card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(49,86,153,.1)}.stat-icon{display:flex;align-items:center;justify-content:center;width:65px;height:65px;flex-shrink:0;border-radius:50%;font-size:29px}.stat-icon.blue{color:var(--app-accent-strong);background:var(--app-accent-soft)}.stat-icon.green{color:#13b969;background:#e7f8f0}.stat-icon.purple{color:var(--app-accent-strong);background:var(--app-accent-soft)}.stat-content{display:flex;flex-direction:column;gap:6px;min-width:0}.stat-title{font-size:12px;font-weight:500;color: var(--app-text-secondary)}.stat-number{font-size:27px;font-weight:700;line-height:1.2;color:var(--app-text-primary)}.stat-desc{color: var(--app-text-secondary);font-size:11px;white-space:nowrap}.green-text{color:#12ae62}.green-number{color:#0bad65}.running-stat{border-color:#d5f0e3;background:linear-gradient(135deg,var(--app-bg-elevated),#f2fbf7)}
.main-layout{display:grid;grid-template-columns:292px minmax(0,1fr);align-items:stretch;gap:16px}.tenant-panel,.worker-panel{min-width:0;border: 1px solid var(--app-border);border-radius:17px;background: var(--app-bg-elevated);box-shadow:0 8px 26px rgba(49,86,153,.055)}.tenant-panel{display:flex;flex-direction:column;overflow:hidden}.worker-panel{overflow:hidden}.tenant-header{display:flex;align-items:center;justify-content:space-between;padding:19px 18px 12px}.panel-heading{display:flex;align-items:center;gap:9px;color: var(--app-text-primary);font-size:15px;font-weight:600}.panel-heading .el-icon{color: var(--app-text-secondary);font-size:18px}.icon-button{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border:none;border-radius:8px;background:transparent;color:var(--app-text-secondary);font-size:17px;cursor:pointer}.icon-button:hover{background:var(--app-accent-soft);color:var(--app-accent-strong)}.blue-button{color:#fff;background:var(--app-accent-gradient);box-shadow:0 3px 9px rgba(0,0,0,.18)}.blue-button:hover{color:#fff;background:var(--app-accent-strong)}.tenant-search{padding:4px 16px 14px}.tenant-search :deep(.el-input__wrapper){border-radius:9px;background: var(--app-bg-subtle);box-shadow:0 0 0 1px var(--app-border) inset}.tenant-list{flex:1;padding:0 12px 20px}.tenant-item{display:flex;align-items:center;gap:12px;min-height:72px;padding:12px 10px;border-bottom: 1px solid var(--app-border);border-radius:9px;cursor:pointer;transition:background .2s}.tenant-item:hover{background: var(--app-bg-subtle)}.tenant-item.active{background:var(--app-accent-soft);border-left:3px solid var(--app-accent)}.tenant-item.all-tenant{margin-bottom:7px;border-bottom:none}.tenant-avatar{display:flex;align-items:center;justify-content:center;width:35px;height:35px;flex-shrink:0;border-radius:50%;background:#eaf9f0}.tenant-avatar.all{color:var(--app-accent-strong);background:var(--app-accent-subtle);font-size:19px}.tenant-online-dot{width:10px;height:10px;border-radius:50%;background:#1ac36c;box-shadow:0 0 0 5px #d9f7e7}.tenant-info{display:flex;flex:1;flex-direction:column;gap:6px;min-width:0}.tenant-info strong{display:flex;align-items:center;flex-wrap:wrap;gap:7px;font-size:12px;font-weight:600;color: var(--app-text-primary)}.tenant-info small{color: var(--app-text-secondary);font-size:10px;font-weight:400}.tenant-info>span{color: var(--app-text-secondary);font-size:10px;white-space:nowrap}.tenant-count{color: var(--app-text-muted);font-size:11px}.tenant-footer{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:auto;padding:17px;border-top: 1px solid var(--app-border);color: var(--app-text-secondary);font-size:11px}.footer-dot,.online-dot{display:inline-block;width:8px;height:8px;flex-shrink:0;border-radius:50%;background:#16c477}
.worker-tabs-header{display:flex;align-items:center;justify-content:space-between;min-height:64px;padding:0 20px;border-bottom: 1px solid var(--app-border)}.platform-tabs{display:flex;align-items:center;gap:10px;height:64px}.platform-tab{position:relative;display:flex;align-items:center;gap:9px;height:49px;padding:0 20px;border-radius:10px 10px 0 0;color:var(--app-text-regular);font-size:13px;font-weight:500;white-space:nowrap;cursor:pointer}.platform-tab .el-icon{font-size:18px}.platform-tab.active{background:var(--app-accent-soft);color:var(--app-accent-strong)}.platform-tab.active::after{position:absolute;right:0;bottom:0;left:0;height:3px;border-radius:3px 3px 0 0;background:var(--app-accent);content:''}.platform-count{font-size:11px}.worker-header-actions{display:flex;align-items:center;gap:15px}.auto-refresh{display:flex;align-items:center;gap:9px;color: var(--app-text-secondary);font-size:11px;white-space:nowrap}.rotating .el-icon{animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.schedule-section{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom: 1px solid var(--app-border)}.schedule-title{display:flex;flex-direction:column;justify-content:center;gap:5px;width:86px;flex-shrink:0}.schedule-title strong{font-size:12px;color: var(--app-text-primary)}.schedule-title span{color: var(--app-text-secondary);font-size:10px;white-space:nowrap}.schedule-modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;flex:1.35;min-width:0}.schedule-mode{display:flex;align-items:center;gap:8px;min-height:62px;padding:9px 10px;border: 1px solid var(--app-border);border-radius:10px;background: var(--app-bg-subtle);cursor:pointer;transition:all .2s}.schedule-mode.active{border-color:var(--app-accent-border);background:var(--app-accent-soft);box-shadow:0 0 0 1px var(--app-accent-subtle)}.schedule-mode.disabled{opacity:.55;cursor:not-allowed}.radio-circle{display:block;width:16px;height:16px;border:1.5px solid #b4c1d7;border-radius:50%;background: var(--app-bg-elevated);flex-shrink:0}.radio-circle.checked{border:5px solid var(--app-accent)}.mode-info{display:flex;flex-direction:column;gap:4px;min-width:0}.mode-info strong{color: var(--app-text-primary);font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.schedule-mode.active .mode-info strong{color:var(--app-accent-strong)}.mode-info span{color: var(--app-text-secondary);font-size:10px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.mode-icon{margin-left:auto;color:#b6c4da;flex-shrink:0;font-size:16px}.schedule-selected{flex:1;min-width:0;min-height:62px;display:flex;align-items:center;gap:10px;padding:9px 11px;border: 1px solid var(--app-border);border-radius:10px;background: var(--app-bg-subtle)}.selected-label{display:flex;align-items:center;gap:5px;flex-shrink:0;color: var(--app-text-primary);font-size:11px;font-weight:600;white-space:nowrap}.selected-label span{color: var(--app-text-secondary);font-weight:400}.selected-workers{flex:1;min-width:0;display:flex;align-items:center;flex-wrap:wrap;gap:6px;min-height:32px}.selected-workers :deep(.el-tag){padding: 6px;max-width:100%;height:auto;white-space:normal;overflow-wrap:anywhere}.selected-placeholder{color: var(--app-text-muted);font-size:11px}.schedule-selected>.el-button{flex-shrink:0}
.worker-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 20px}.toolbar-left{display:flex;align-items:center;gap:10px}.worker-search{width:250px}.status-filter{width:125px}.toolbar-right{display:flex;align-items:center}.online-label{display:flex;align-items:center;gap:7px;color: var(--app-text-muted);font-size:11px;white-space:nowrap}.worker-table{padding:0 20px}.worker-table :deep(.el-table){--el-table-border-color: var(--app-border);--el-table-row-hover-bg-color:var(--app-accent-soft);color: var(--app-text-primary);font-size:12px}.worker-table :deep(.el-table td.el-table__cell){height:51px}.platform-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:7px;font-size:11px}.platform-badge.pc{color:var(--app-accent-strong);background:var(--app-accent-soft)}.platform-badge.android{color:#169c5c;background:#e7f8ed}.pay-account{font-size:11px;color:var(--app-text-secondary)}.connection-status{display:inline-flex;align-items:center;gap:7px;color:#10a85e;font-size:11px}.running-badge{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:5px 10px;border-radius:7px;font-size:11px;white-space:nowrap}.running-badge.busy{color:var(--app-accent-strong);background:var(--app-accent-soft)}.running-badge.idle{color: var(--app-text-muted);background: var(--app-bg-subtle)}.order-link{color:var(--app-accent-strong);cursor:pointer;font-size:11px}.order-link:hover{text-decoration:underline}.empty-value{color:var(--app-text-placeholder)}.permission-badge{display:inline-flex;align-items:center;padding:5px 11px;border-radius:7px;font-size:11px}.permission-badge.allowed{color:#12a65f;background:#e5f8ed}.permission-badge.blocked{color:#7b89a2;background:#eef1f6}.table-actions{display:flex;align-items:center;justify-content:center;gap:5px}.table-actions .el-button{margin-left:0}.worker-id-cell{display:flex;align-items:center;gap:6px}.copy-icon{font-size:14px;color:var(--app-text-muted);cursor:pointer;transition:color .18s}.copy-icon:hover{color:var(--app-accent)}.pagination-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 20px 18px}.pagination-row>span{color: var(--app-text-secondary);font-size:11px}
.group-filter{width:150px}.group-badge{display:inline-flex;align-items:center;padding:4px 9px;border-radius:7px;font-size:11px;color:var(--app-accent-strong);background:var(--app-accent-soft)}.group-badge.ungrouped{color:#7b89a2;background:#eef1f6}.group-create-row{display:flex;gap:10px;margin-bottom:16px}.group-create-row .el-input{flex:1}.group-list{max-height:max(160px,calc(100dvh - 250px));overflow-y:auto}.group-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 0;border-bottom:1px solid var(--app-border)}.group-row-main{display:flex;flex-direction:column;gap:5px;min-width:0}.group-row-main strong{font-size:13px;color:var(--app-text-primary)}.group-row-main span{font-size:11px;color:var(--app-text-muted)}.group-row-actions{display:flex;gap:8px;flex-shrink:0}.assign-info{display:flex;flex-direction:column;gap:2px;margin-bottom:8px;padding:10px 12px;border:1px solid var(--app-border);border-radius:9px;background:var(--app-bg-subtle);font-size:12px;color:var(--app-text-secondary)}.assign-info>div{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0}.assign-info span{flex-shrink:0}.assign-info strong{color:var(--app-text-primary);font-weight:500;text-align:right;overflow-wrap:anywhere}.assign-hint{margin-bottom:12px;font-size:11px;color:var(--app-text-muted)}.assign-select{width:100%;margin-bottom:12px}.schedule-group-select{width:100%;max-width:260px}
.selector-description{display:flex;align-items:flex-start;gap:8px;padding:13px;margin-bottom:18px;border-radius:9px;background:var(--app-accent-soft);color:var(--app-accent-strong);font-size:12px;line-height:1.7}.selector-description .el-icon{margin-top:3px;flex-shrink:0}.selector-header{display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom: 1px solid var(--app-border);background: var(--app-bg-subtle);color: var(--app-text-secondary);font-size:12px}.selector-list{max-height:max(160px,calc(100dvh - 310px));overflow-y:auto}.selector-item{display:flex;align-items:center;gap:12px;padding:14px 12px;border-bottom: 1px solid var(--app-border);cursor:pointer}.selector-item:hover{background: var(--app-bg-subtle)}.selector-worker-info{display:flex;flex:1;flex-direction:column;gap:5px;min-width:0}.selector-worker-info strong{font-size:12px;color: var(--app-text-primary);overflow-wrap:anywhere}.selector-worker-info span{color: var(--app-text-secondary);font-size:11px}
.worker-detail-dialog .el-dialog__body{padding:20px 22px 18px}
.worker-detail-head{display:flex;align-items:center;gap:14px;padding:16px;margin-bottom:18px;background:var(--app-bg-subtle);border:1px solid var(--app-border);border-radius:16px}
.worker-detail-icon{width:46px;height:46px;flex:0 0 46px;display:grid;place-items:center;border-radius:14px;background:var(--app-accent-gradient);color:#fff;font-size:22px;box-shadow:0 8px 18px rgba(184,79,5,.22),inset 0 1px 0 rgba(255,255,255,.18)}
.worker-detail-info{flex:1;min-width:0}
.worker-detail-info h3{margin:0 0 5px;font-size:16px;font-weight:600;color:var(--app-text-primary)}
.worker-detail-sub{font-size:12px;color:var(--app-text-secondary)}
.worker-detail-status{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}
.worker-detail-section{display:flex;flex-direction:column}
.detail-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--app-border)}
.detail-row:last-child{border-bottom:none}
.detail-row>span{flex-shrink:0;color:var(--app-text-secondary);font-size:12px}
.detail-row>strong{color:var(--app-text-primary);font-size:12px;font-weight:500;text-align:right;overflow-wrap:anywhere}
.detail-row .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px}
.mobile-worker-list{display:none}.mobile-worker-card{margin-bottom:12px;padding:14px;border: 1px solid var(--app-border);border-radius:11px;background: var(--app-bg-elevated)}.mobile-worker-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:12px;border-bottom: 1px solid var(--app-border)}.mobile-worker-name{display:flex;align-items:center;gap:10px;min-width:0}.mobile-worker-name strong{color: var(--app-text-primary);font-size:13px;overflow-wrap:anywhere}.mobile-worker-info{padding:9px 0}.mobile-worker-info>div{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0}.mobile-worker-info>div>span:first-child{color: var(--app-text-secondary);font-size:11px}.mobile-worker-info strong{color: var(--app-text-primary);font-size:11px;font-weight:500;text-align:right;overflow-wrap:anywhere}.mobile-worker-actions{display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top: 1px solid var(--app-border)}.mobile-worker-actions .el-button{margin-left:0}
@media(max-width:1500px){.stats-grid{gap:12px}.stat-card{padding:15px}.stat-icon{width:52px;height:52px;font-size:24px}.main-layout{grid-template-columns:260px minmax(0,1fr)}.schedule-modes{min-width:0}}
@media(max-width:1200px){.stats-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.main-layout{grid-template-columns:220px minmax(0,1fr)}.tenant-info small{display:none}.hero-features{display:none}.hero-decoration{right:4%}.schedule-section{flex-wrap:wrap}.schedule-selected{flex-basis:100%}}
@media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.main-layout{grid-template-columns:1fr}.tenant-panel{max-height:250px}.tenant-list{overflow-y:auto}.tenant-footer{display:none}.hero-decoration{opacity:.5}}
@media(max-width:700px){.hero-banner{min-height:110px;padding:20px;border-radius:13px}.hero-left{gap:12px}.hero-icon{width:42px;height:42px;font-size:22px}.hero-content h1{font-size:17px}.hero-content p{font-size:10px;line-height:1.6}.hero-live,.hero-decoration{display:none}.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.stat-card{min-height:95px;gap:10px;padding:13px;border-radius:12px}.stat-icon{width:39px;height:39px;font-size:19px}.stat-title{font-size:10px}.stat-number{font-size:21px}.stat-desc{font-size:9px}.running-stat{grid-column:span 2}.worker-tabs-header{padding:0 12px}.platform-tabs{gap:0}.platform-tab{gap:5px;padding:0 10px;font-size:11px}.platform-tab .el-icon{font-size:15px}.auto-refresh span{display:none}.worker-header-actions{gap:7px}.schedule-section{padding:14px;gap:10px}.schedule-title{width:100%}.schedule-modes{min-width:0;grid-template-columns:1fr}.schedule-mode{min-width:0}.mode-info strong{font-size:10px}.mode-info span{white-space:normal;font-size:9px}.mode-icon{display:none}.schedule-selected{flex-wrap:wrap}.selected-workers{flex-basis:100%}.schedule-selected>.el-button{margin-left:auto}.worker-toolbar{padding:14px;flex-wrap:wrap}.toolbar-left{width:100%}.worker-search{flex:1;min-width:0}.status-filter{width:110px}.worker-table{display:none}.mobile-worker-list{display:block;padding:0 14px}.pagination-row{justify-content:center;padding:0 14px 18px}.pagination-row>span,.pagination-row :deep(.el-pagination__sizes){display:none}}
@media(max-width:380px){.stat-card{padding:10px}.stat-icon{width:33px;height:33px;font-size:17px}.platform-tab{padding:0 7px}}

.link-page{padding:18px 22px 30px}
.hero-banner{min-height:94px;padding:16px 28px;margin-bottom:14px}
.hero-icon{width:48px;height:48px;font-size:25px}
.hero-content h1{font-size:22px}
.hero-content p{margin-top:7px}
.stats-grid{gap:12px;margin-bottom:14px}
.stat-card{min-height:84px;padding:13px;gap:11px}
.stat-icon{width:48px;height:48px;font-size:23px}
.stat-number{font-size:24px}
.main-layout{gap:14px}
.worker-tabs-header,.platform-tabs{min-height:50px;height:50px}
.platform-tab{height:40px}
.schedule-section{padding:9px 14px}
.schedule-mode,.schedule-selected{min-height:52px}
.worker-toolbar{padding:10px 16px}
.worker-table{padding:0 16px}
.worker-table :deep(.el-table td.el-table__cell){height:44px}
.worker-table :deep(.el-table__body-wrapper){max-height:min(420px,max(220px,calc(100dvh - 480px)));overflow-y:auto}
.pagination-row{padding:10px 16px 12px}
.task-order-cell,.mobile-task-order{display:inline-flex;align-items:center;gap:7px;min-width:0;max-width:100%}
.task-order-link{padding:0;border:0;background:transparent;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.task-order-link:hover{color:var(--app-accent);text-decoration:underline}
.mobile-task-order{max-width:68%}
.heartbeat-value{font-size:11px;font-variant-numeric:tabular-nums;white-space:nowrap}
.heartbeat-value.healthy{color:var(--app-text-secondary)}
.heartbeat-value.delayed{color:#b7791f;font-weight:600}
.heartbeat-value.stale{color:#dc4c4c;font-weight:700}
.heartbeat-value.unknown{color:var(--app-text-muted)}
.table-actions .detail-action,.mobile-worker-actions .detail-action{--el-button-text-color:var(--app-text-secondary);--el-button-bg-color:transparent;--el-button-border-color:transparent;--el-button-hover-text-color:var(--app-accent-strong);--el-button-hover-bg-color:var(--app-accent-soft);--el-button-hover-border-color:transparent}
@media(max-width:1100px){.hero-decoration{display:none}}
@media(max-width:700px){
  .link-page{padding:14px 14px 24px}
  .hero-banner{min-height:94px;padding:15px}
  .hero-content h1{font-size:17px}
  .stats-grid{gap:10px}
  .stat-card{min-height:82px;padding:11px}
  .worker-tabs-header,.platform-tabs{min-height:48px;height:48px}
  .platform-tab{height:40px}
  .schedule-section{padding:10px 14px}
  .worker-toolbar{padding:10px 14px}
  .pagination-row{padding:0 14px 14px}
}

.worker-table :deep(.el-table__body-wrapper tr td.el-table-fixed-column--right){background-color:var(--app-bg-elevated)!important}
.worker-table :deep(.el-table__body-wrapper tr.el-table__row--striped td.el-table-fixed-column--right){background-color:var(--app-bg-subtle)!important}
.worker-table :deep(.el-table__body-wrapper tr.hover-row td.el-table-fixed-column--right),
.worker-table :deep(.el-table__body-wrapper tr:hover td.el-table-fixed-column--right){background-color:var(--app-bg-hover)!important}
</style>

<!-- 深色主题覆盖（非 scoped）：链接管控统计卡片统一深灰底，浅色模式保持原样 -->
<style>
html.dark .running-stat {
  background: var(--app-bg-elevated) !important;
  border-color: var(--app-border) !important;
}

html.dark .stat-number { color: var(--app-text-primary); }

html.dark .stat-icon.blue { background: var(--app-accent-soft) !important; color: var(--app-accent-strong); }
html.dark .stat-icon.green { background: rgba(19, 185, 105, 0.16) !important; color: #34d399; }
html.dark .stat-icon.purple { background: rgba(132, 91, 255, 0.16) !important; color: #a78bfa; }

html.dark .green-number,
html.dark .green-text { color: #34d399; }

/* 深色下表格行 hover / 选中背景改为深灰，避免白色突兀 */
html.dark .worker-table .el-table {
  --el-table-row-hover-bg-color: var(--app-bg-hover);
  --el-table-current-row-bg-color: var(--app-bg-subtle);
}

/* 深色调度卡片与结果面板：避免亮蓝卡片在深色背景中突兀 */
html.dark .schedule-mode {
  background: var(--app-bg-subtle);
  border-color: var(--app-border);
}

html.dark .schedule-mode.active {
  background: var(--app-accent-soft);
  border-color: var(--app-accent-border);
  box-shadow: 0 0 0 1px var(--app-accent-subtle);
}

html.dark .schedule-mode.active .mode-info strong,
html.dark .schedule-mode.active .mode-icon {
  color: var(--app-accent-strong);
}

html.dark .schedule-selected {
  background: var(--app-bg-subtle);
  border-color: var(--app-border);
}

/* 深色选中态：页签和租户项使用深蓝半透明底，避免浅色块突兀 */
html.dark .platform-tab.active {
  background: var(--app-accent-soft);
  color: var(--app-accent-strong);
}

html.dark .platform-tab.active::after {
  background: var(--app-accent);
}

html.dark .tenant-item.active {
  background: var(--app-accent-soft);
  border-left-color: var(--app-accent);
}

html.dark .tenant-item.active .tenant-info strong {
  color: var(--app-accent-strong);
}

/* 分组标签深色适配：避免和 Android 平台绿色标签连在一起 */
html.dark .group-badge {
  color: var(--app-accent-strong);
  background: var(--app-accent-soft);
}

html.dark .group-badge.ungrouped {
  color: var(--app-text-secondary);
  background: var(--app-bg-hover);
}

/* 暗黑横幅改用深棕金渐变，避免大面积亮黄色压过深色界面 */
html.dark .hero-banner {
  background: linear-gradient(135deg, #6b5316 0%, #43330f 52%, #261d08 100%);
  border: 1px solid rgba(212, 175, 55, 0.22);
}

html.dark .platform-badge.android { background: rgba(34, 160, 107, 0.14); }
html.dark .permission-badge.allowed { background: rgba(34, 160, 107, 0.14); }
html.dark .permission-badge.blocked {
  color: var(--app-text-secondary);
  background: var(--app-bg-hover);
  border: 1px solid var(--app-border);
}

/* 支付宝与设备管理抽屉：抽屉内容 teleport 到 body，样式放全局并用类前缀限定 */
.config-drawer .el-drawer__body { padding-top: 12px; }
/* 按组派单下拉：选中 tag 仍显示组名，下拉项额外展示该组在线设备数（popper 同样 teleport 到 body） */
.group-option { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.group-option-online { color: var(--app-text-muted); font-size: 11px; }
.config-tenant { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; padding: 10px 12px; border: 1px solid var(--app-border); border-radius: 9px; background: var(--app-bg-subtle); color: var(--app-text-secondary); font-size: 12px; }
.config-tenant strong { color: var(--app-text-primary); font-weight: 600; }
.config-tenant-hint { color: #b7791f; }
.config-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 12px; }
.config-toolbar .el-input { width: 230px; }
.config-toolbar .el-select { width: 140px; }
.config-strong { color: var(--app-text-primary); font-size: 12px; font-weight: 500; }
.config-mask { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: 2px; color: var(--app-text-secondary); }
.config-actions { display: flex; justify-content: center; gap: 6px; }
.config-actions .el-button { margin-left: 0; }
.config-footnote { margin-top: 10px; color: var(--app-text-muted); font-size: 11px; line-height: 1.6; }
/* 余额预警阈值面板 */
.threshold-panel { margin-bottom: 14px; padding: 12px 14px; border: 1px solid var(--app-border); border-radius: 9px; background: var(--app-bg-subtle); }
.threshold-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; }
.threshold-head strong { font-size: 13px; color: var(--app-text-primary); }
.threshold-head span { font-size: 11px; color: var(--app-text-muted); }
.threshold-body { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.threshold-input { width: 150px; }
.threshold-current { font-size: 11px; color: var(--app-text-secondary); }
.threshold-hint { margin-top: 8px; font-size: 11px; line-height: 1.6; color: var(--app-text-muted); }
/* 余额列：暂未获取灰色、低于阈值红色 */
.balance-cell { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 12px; color: var(--app-text-primary); }
.balance-cell .balance-low { color: var(--el-color-danger); font-weight: 600; }
.balance-cell .balance-unknown { color: var(--app-text-muted); }
.balance-time { margin-top: 2px; font-size: 10px; color: var(--app-text-muted); }
.device-id-cell { display: flex; align-items: center; gap: 6px; min-width: 0; }
.device-id { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; color: var(--app-text-primary); }
.device-status { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; }
.device-status.online { color: #10a85e; }
.device-status.offline { color: var(--app-text-muted); }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.password-account { margin-bottom: 12px; font-size: 12px; color: var(--app-text-secondary); }
.password-account strong { color: var(--app-text-primary); font-weight: 600; }
.password-hint { margin-top: 10px; font-size: 11px; line-height: 1.7; color: var(--app-text-muted); }
/* 弹窗表单行：dialog 内容 append-to-body，样式必须放全局 style */
.dialog-form-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.dialog-form-row > span { width: 110px; flex: none; font-size: 12px; color: var(--app-text-secondary); }
.dialog-form-row .el-input { flex: 1; }
.pay-account.unbound, .unbound-text { color: #b7791f; }
.assign-info .mono, .mobile-worker-info .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; }
.config-drawer .group-badge { display: inline-flex; align-items: center; padding: 4px 9px; border-radius: 7px; font-size: 11px; color: var(--app-accent-strong); background: var(--app-accent-soft); }
.config-drawer .group-badge.ungrouped { color: var(--app-text-secondary); background: var(--app-bg-hover); }
.config-drawer .copy-icon { font-size: 14px; color: var(--app-text-muted); cursor: pointer; }
.config-drawer .copy-icon:hover { color: var(--app-accent-strong); }
/* 人工充值单 · 支付宝余额扣除流水 */
.manual-scope { margin-bottom: 12px; line-height: 1.7; }
.manual-scope strong { color: var(--app-text-primary); }
.manual-form-panel { margin-bottom: 16px; padding: 12px 14px; border: 1px solid var(--app-border); border-radius: 9px; background: var(--app-bg-subtle); }
.manual-form-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; }
.manual-form-head strong { font-size: 13px; color: var(--app-text-primary); }
.manual-form-head span { font-size: 11px; color: var(--app-text-muted); }
.manual-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; }
.manual-field { display: flex; align-items: center; gap: 8px; min-width: 0; }
.manual-field > span { width: 96px; flex: none; font-size: 12px; color: var(--app-text-secondary); }
.manual-field-control { flex: 1; min-width: 0; }
.manual-field-full { margin-top: 10px; }
.manual-form-actions { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.manual-form-tip { font-size: 11px; color: #b7791f; }
.manual-result { margin-top: 10px; padding: 8px 10px; border-radius: 7px; font-size: 11px; line-height: 1.7; color: var(--app-text-secondary); background: var(--app-bg-hover); }
.manual-result strong { color: var(--app-text-primary); }
.manual-result .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; }
.manual-sub-switch { display: flex; gap: 8px; margin-bottom: 12px; }
.manual-sub-switch .el-button { margin-left: 0; }
.manual-toolbar .el-input { width: 170px; }
.manual-toolbar .el-select { width: 150px; }
.manual-toolbar .manual-type-select { width: 140px; }
.manual-date-range { width: 240px; }
.manual-pagination { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; font-size: 11px; color: var(--app-text-muted); }
.amount-strong { font-weight: 600; color: var(--app-text-primary); }
.amount-negative { font-weight: 600; color: var(--el-color-danger); }
.balance-pair { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; font-size: 11px; color: var(--app-text-secondary); }
.balance-arrow { color: var(--app-text-muted); }
.balance-unknown-text { color: var(--app-text-muted); }
/* 上游公司 · 绑组抽屉 */
.priority-scope { line-height: 1.7; white-space: normal; }
.priority-scope strong { color: var(--app-text-primary); }
.company-group-select { width: 128px; }
@media(max-width:700px){
  .config-toolbar .el-input{width:100%}
  .config-toolbar .el-select{flex:1;min-width:120px}
  .company-group-select{width:110px}
  .manual-form-grid{grid-template-columns:1fr}
  .manual-field>span{width:86px}
  .manual-date-range{width:100%}
  .manual-pagination{flex-direction:column;align-items:flex-start;gap:8px}
}
</style>
