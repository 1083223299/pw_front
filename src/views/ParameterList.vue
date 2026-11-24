<template>
  <div class="parameter-list-page">

    <!-- =========================
         顶部
         ========================= -->
    <section class="page-header">
      <div class="header-left">
        <div class="breadcrumb">
          <span class="breadcrumb-link" @click="goBack">
            参数管控
          </span>

          <el-icon>
            <ArrowRight />
          </el-icon>
          <span>{{ platformInfo.name }}</span>
        </div>


        <div class="title-row">
          <div
              class="platform-icon"
              :class="platformInfo.color"
          >
            {{ platformInfo.icon }}
          </div>

          <div>
            <h1>{{ platformInfo.name }}</h1>
            <p>{{ platformInfo.description || '平台参数配置' }}</p>
          </div>

        </div>

      </div>


      <div class="header-actions">

        <el-button
            class="app-back-btn"
            @click="goBack"
        >
          <el-icon>
            <ArrowLeft />
          </el-icon>

          返回
        </el-button>


        <el-button
            type="primary"
            @click="openAdd"
        >
          <el-icon>
            <Plus />
          </el-icon>

          添加配置
        </el-button>

      </div>

    </section>


    <!-- =========================
         Soul 说明
         ========================= -->
    <div v-if="isSoul" class="notice">
      <div class="notice-icon">
        <el-icon>
          <InfoFilled />
        </el-icon>
      </div>


      <div class="notice-content">
        <strong>
          充值配置说明
        </strong>

        <span>
          每个配置只能绑定一个充值档位。
          修改充值档位时，会直接替换原来的档位。
        </span>
        <div>配置的时候复制 Code 到系统内外部货源场景参数绑定。</div>
      </div>

    </div>


    <!-- =========================
         蛋仔说明
         ========================= -->
    <div v-if="isEgg" class="notice egg-notice">
      <div class="notice-icon">
        <el-icon>
          <InfoFilled />
        </el-icon>
      </div>

      <div class="notice-content">
        <strong>蛋币充值配置</strong>
        <span>
          每个配置只能绑定一个蛋币充值档位。
          修改充值档位时，会直接替换原来的档位。
        </span>
        <div>配置的时候复制 Code 到系统内外部货源场景参数绑定。</div>

      </div>
    </div>


    <!-- =========================
         工具栏
         ========================= -->
    <section class="toolbar">
      <div class="toolbar-left">
        <div class="result-count">
          共
          <strong>
            {{ filteredConfigs.length }}
          </strong>
          个配置
        </div>
      </div>


      <div class="toolbar-right">
        <el-button
            v-if="selectedConfigs.length > 0"
            type="danger"
            plain
            :loading="saving"
            @click="batchDeleteConfigs"
        >
          批量删除{{ selectedConfigs.length ? `（${selectedConfigs.length}）` : '' }}
        </el-button>

        <el-input
            v-model="keyword"
            clearable
            placeholder="搜索配置名称 / ID"
            class="search-input"
        >

          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>
    </section>


    <!-- =========================
         配置列表
         ========================= -->
    <section>

      <!-- =========================
           PC 表格
           ========================= -->
      <div v-if="filteredConfigs.length" class="config-table-wrapper">
        <el-table
            ref="configTable"
            :data="filteredConfigs"
            class="config-table"
            stripe
            :show-header="true"
            @selection-change="handleSelectionChange"
        >

          <el-table-column type="selection" width="48" fixed="left" :selectable="isRowSelectable"/>

          <!-- =========================
               配置名称
               ========================= -->
          <el-table-column label="配置名称" min-width="180">
            <template #default="{ row }">
              <div class="config-name-cell">
                <div class="config-dot">
                  <span></span>
                </div>

                <div>
                  <div class="config-name">{{ row.name }}</div>
                </div>

              </div>
            </template>

          </el-table-column>


          <!-- =========================
               配置 Code（可复制）
               ========================= -->
          <el-table-column label="配置 Code" min-width="180">
            <template #default="{ row }">
              <div
                  class="id-cell"
                  title="点击复制 Code"
                  @click="copyCode(row.socCode)"
              >
                <span class="id-value">
                  {{ row.socCode || '-' }}
                </span>
                <el-icon class="copy-icon">
                  <DocumentCopy />
                </el-icon>
              </div>
            </template>
          </el-table-column>


          <!-- =========================
               面值
               ========================= -->
          <el-table-column label="面值" min-width="140">
            <template #default="{ row }">
              <span class="face-value">
                {{ row.faceValue || '-' }}
              </span>
            </template>
          </el-table-column>


          <!-- =========================
               金额
               ========================= -->
          <el-table-column label="金额" min-width="140">
            <template #default="{ row }">
              <span class="amount-value">
                ¥{{ row.amount || '0' }}
              </span>
            </template>
          </el-table-column>

          <!-- 最大支付金额 / 比例 -->
          <el-table-column label="支付上限" min-width="160">
            <template #default="{ row }">
              <div class="pay-limit-cell">
                <span class="pay-limit-amount">
                  ¥{{ (Number(row.amount || 0) * Number(row.payRatio ?? 1)).toFixed(2) }}
                </span>
                <span class="pay-limit-ratio">
                  {{ (Number(row.payRatio ?? 1) * 100).toFixed(2) }}%
                </span>
              </div>
            </template>
          </el-table-column>


          <!-- =========================
               状态
               ========================= -->
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag
                  v-if="row.enabled !== false"
                  type="success"
                  effect="light"
                  round
              >
                已启用
              </el-tag>


              <el-tag
                  v-else
                  type="info"
                  effect="light"
                  round
              >
                已停用
              </el-tag>
            </template>
          </el-table-column>


          <!-- =========================
               创建时间
               ========================= -->
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              <span class="time-text">
                {{ formatTime(row.createTime) }}
              </span>
            </template>
          </el-table-column>


          <!-- =========================
               操作
               ========================= -->
          <el-table-column label="操作" width="190" fixed="right">

            <template #default="{ row }">

              <div class="actions">

                <el-button
                    link
                    type="primary"
                    @click="editConfig(row)"
                >
                  编辑
                </el-button>

                <el-button
                    link
                    :type="
                    row.enabled !== false
                      ? 'warning'
                      : 'success'
                  "
                    @click="toggleConfig(row)"
                >
                  {{
                    row.enabled !== false
                        ? '停用'
                        : '启用'
                  }}
                </el-button>

                <el-button link type="danger" @click="deleteConfig(row)">
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

      </div>

      <!-- =========================
           空状态
           ========================= -->
      <div v-else class="empty-container">
        <el-empty
            :description="
            keyword
              ? '没有找到匹配的配置'
              : '暂无配置'
          "
        >

          <el-button
              v-if="!keyword"
              type="primary"
              @click="openAdd"
          >
            添加第一个配置
          </el-button>
        </el-empty>

      </div>
    </section>


    <!-- =========================
         添加 / 编辑配置
         ========================= -->
    <el-dialog
        v-model="dialogVisible"
        :title="
        editingConfig
          ? '编辑配置'
          : '添加配置'
      "
        destroy-on-close
        width="640px"
        class="config-dialog"
    >

      <el-form
          ref="configFormRef"
          :model="configForm"
          :rules="configRules"
          label-position="top"
      >

        <!-- =========================
             配置名称：编辑时 + 非固定档位平台新增时显示
             ========================= -->
        <el-form-item
            v-if="editingConfig || !isFixedOptionsPlatform"
            label="配置名称"
            prop="name"
        >
          <el-input
              v-model="configForm.name"
              placeholder="请输入配置名称"
              maxlength="50"
              show-word-limit
          />
          <div v-if="!editingConfig && !isFixedOptionsPlatform" class="form-tip">
            非固定档位平台需要手动填写配置名称
          </div>
        </el-form-item>


        <!-- =========================
             Soul 充值档位（多选）
             ========================= -->
        <el-form-item
            v-if="isSoul"
            label="充值档位（可多选，最多 20 个）"
            prop="rechargeIds"
        >
          <div class="options-header">
            <div class="selected-tip">
              已选 <strong>{{ configForm.rechargeIds.length }}</strong> / {{ maxSelectCount }} 个档位
            </div>

            <el-button
                v-if="!editingConfig"
                link
                type="primary"
                size="small"
                @click="toggleSelectAll"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
          </div>

          <div class="recharge-options">
            <div
                v-for="item in soulRechargeOptions"
                :key="item.id"
                class="recharge-option"
                :class="{
                  active: configForm.rechargeIds.includes(item.id),
                  'is-intelligence': item.intelligence,
                  'is-locked': !!editingConfig
                }"
                @click="handleOptionClick(item)"
            >
              <div class="radio">
                <span v-if="configForm.rechargeIds.includes(item.id)"></span>
              </div>

              <div class="recharge-info">
                <div class="recharge-coins">
                  {{ item.coins }}
                  <span>币</span>
                </div>

                <div class="recharge-price">
                  ¥{{ item.price }}
                </div>
              </div>

              <div v-if="item.intelligence" class="intelligence-badge">
                智能
              </div>
              <div v-if="isOptionDisabled(item)" class="exists-badge">
                已添加
              </div>
            </div>
          </div>
        </el-form-item>


        <!-- =========================
             蛋仔充值档位（多选）
             ========================= -->
        <el-form-item
            v-if="isEgg"
            label="蛋币档位（可多选，最多 20 个）"
            prop="rechargeIds"
        >
          <div class="options-header">
            <div class="selected-tip">
              已选 <strong>{{ configForm.rechargeIds.length }}</strong> / {{ maxSelectCount }} 个档位
            </div>

            <el-button
                v-if="!editingConfig"
                link
                type="primary"
                size="small"
                @click="toggleSelectAll"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
          </div>

          <div class="recharge-options">
            <div
                v-for="item in eggRechargeOptions"
                :key="item.id"
                class="recharge-option"
                :class="{
                  active: configForm.rechargeIds.includes(item.id),
                  'is-intelligence': item.intelligence,
                  'is-locked': !!editingConfig
                }"
                @click="handleOptionClick(item)"
            >
              <div class="radio">
                <span v-if="configForm.rechargeIds.includes(item.id)"></span>
              </div>

              <div class="recharge-info">
                <div class="recharge-coins">
                  {{ item.coins }}
                </div>
                <div class="recharge-price">
                  ¥{{ item.price }}
                </div>
              </div>

              <div v-if="item.intelligence" class="intelligence-badge">
                智能
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- =========================
             小红书充值档位（多选）
             ========================= -->
        <el-form-item
            v-if="isXhs"
            label="充值档位（可多选，最多 20 个）"
            prop="rechargeIds"
        >
          <div class="options-header">
            <div class="selected-tip">
              已选 <strong>{{ configForm.rechargeIds.length }}</strong> / {{ maxSelectCount }} 个档位
            </div>

            <el-button
                v-if="!editingConfig"
                link
                type="primary"
                size="small"
                @click="toggleSelectAll"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
          </div>

          <div class="recharge-options">
            <div
                v-for="item in xhsRechargeOptions"
                :key="item.id"
                class="recharge-option"
                :class="{
                  active: configForm.rechargeIds.includes(item.id),
                  'is-intelligence': item.intelligence,
                  'is-locked': !!editingConfig
                }"
                @click="handleOptionClick(item)"
            >
              <div class="radio">
                <span v-if="configForm.rechargeIds.includes(item.id)"></span>
              </div>

              <div class="recharge-info">
                <div class="recharge-coins">
                  {{ item.coins }}
                  <span>薯币</span>
                </div>
                <div class="recharge-price">
                  ¥{{ item.price }}
                </div>
              </div>

              <div v-if="item.intelligence" class="intelligence-badge">
                智能
              </div>
              <div v-if="isOptionDisabled(item)" class="exists-badge">
                已添加
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- =========================
             他趣充值档位（多选）
             ========================= -->
        <el-form-item
            v-if="isTaqu"
            label="充值档位（可多选，最多 20 个）"
            prop="rechargeIds"
        >
          <div class="options-header">
            <div class="selected-tip">
              已选 <strong>{{ configForm.rechargeIds.length }}</strong> / {{ maxSelectCount }} 个档位
            </div>

            <el-button
                v-if="!editingConfig"
                link
                type="primary"
                size="small"
                @click="toggleSelectAll"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
          </div>

          <div class="recharge-options">
            <div
                v-for="item in taquRechargeOptions"
                :key="item.id"
                class="recharge-option"
                :class="{
                  active: configForm.rechargeIds.includes(item.id),
                  'is-intelligence': item.intelligence,
                  'is-locked': !!editingConfig
                }"
                @click="handleOptionClick(item)"
            >
              <div class="radio">
                <span v-if="configForm.rechargeIds.includes(item.id)"></span>
              </div>

              <div class="recharge-info">
                <div class="recharge-coins">
                  {{ item.coins }}
                  <span>趣币</span>
                </div>
                <div class="recharge-price">
                  ¥{{ item.price }}
                </div>
              </div>

              <div v-if="item.intelligence" class="intelligence-badge">
                智能
              </div>
              <div v-if="isOptionDisabled(item)" class="exists-badge">
                已添加
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- =========================
             克拉克拉充值档位（多选）
             ========================= -->
        <el-form-item
            v-if="isKlmb"
            label="充值档位（可多选，最多 20 个）"
            prop="rechargeIds"
        >
          <div class="options-header">
            <div class="selected-tip">
              已选 <strong>{{ configForm.rechargeIds.length }}</strong> / {{ maxSelectCount }} 个档位
            </div>

            <el-button
                v-if="!editingConfig"
                link
                type="primary"
                size="small"
                @click="toggleSelectAll"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
          </div>

          <div class="recharge-options">
            <div
                v-for="item in klmbRechargeOptions"
                :key="item.id"
                class="recharge-option"
                :class="{
                  active: configForm.rechargeIds.includes(item.id),
                  'is-intelligence': item.intelligence,
                  'is-locked': !!editingConfig
                }"
                @click="handleOptionClick(item)"
            >
              <div class="radio">
                <span v-if="configForm.rechargeIds.includes(item.id)"></span>
              </div>

              <div class="recharge-info">
                <div class="recharge-coins">
                  {{ item.coins }}
                  <span v-if="!item.intelligence">红豆</span>
                </div>
                <div class="recharge-price">
                  ¥{{ item.price }}
                </div>
              </div>

              <div v-if="item.intelligence" class="intelligence-badge">
                智能
              </div>
              <div v-if="isOptionDisabled(item)" class="exists-badge">
                已添加
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- =========================
             第五人格充值档位（多选）
             ========================= -->
        <el-form-item
            v-if="isD5rg"
            label="充值档位（可多选，最多 20 个）"
            prop="rechargeIds"
        >
          <div class="options-header">
            <div class="selected-tip">
              已选 <strong>{{ configForm.rechargeIds.length }}</strong> / {{ maxSelectCount }} 个档位
            </div>

            <el-button
                v-if="!editingConfig"
                link
                type="primary"
                size="small"
                @click="toggleSelectAll"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
          </div>

          <div class="recharge-options">
            <div
                v-for="item in d5rgRechargeOptions"
                :key="item.id"
                class="recharge-option"
                :class="{
                  active: configForm.rechargeIds.includes(item.id),
                  'is-intelligence': item.intelligence,
                  'is-locked': !!editingConfig
                }"
                @click="handleOptionClick(item)"
            >
              <div class="radio">
                <span v-if="configForm.rechargeIds.includes(item.id)"></span>
              </div>

              <div class="recharge-info">
                <div class="recharge-coins">
                  {{ item.coins }}
                </div>
                <div class="recharge-price">
                  ¥{{ item.price }}
                </div>
              </div>

              <div v-if="item.intelligence" class="intelligence-badge">
                智能
              </div>
              <div v-if="isOptionDisabled(item)" class="exists-badge">
                已添加
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- =========================
             梦幻西游充值档位（多选）
             ========================= -->
        <el-form-item
            v-if="isMhxy"
            label="充值档位（可多选，最多 20 个）"
            prop="rechargeIds"
        >
          <div class="options-header">
            <div class="selected-tip">
              已选 <strong>{{ configForm.rechargeIds.length }}</strong> / {{ maxSelectCount }} 个档位
            </div>

            <el-button
                v-if="!editingConfig"
                link
                type="primary"
                size="small"
                @click="toggleSelectAll"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
          </div>

          <div class="recharge-options">
            <div
                v-for="item in mhxyRechargeOptions"
                :key="item.id"
                class="recharge-option"
                :class="{
                  active: configForm.rechargeIds.includes(item.id),
                  'is-intelligence': item.intelligence,
                  'is-locked': !!editingConfig
                }"
                @click="handleOptionClick(item)"
            >
              <div class="radio">
                <span v-if="configForm.rechargeIds.includes(item.id)"></span>
              </div>
              <div class="recharge-info">
                <div class="recharge-coins">
                  {{ item.coins }}
                </div>
                <div class="recharge-price">
                  ¥{{ item.price }}
                </div>
              </div>
              <div v-if="item.intelligence" class="intelligence-badge">
                智能
              </div>
              <div v-if="isOptionDisabled(item)" class="exists-badge">
                已添加
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- =========================
             永劫无间-直充档位（多选）
             ========================= -->
        <el-form-item
            v-if="isYjwjC"
            label="充值档位（可多选，最多 20 个）"
            prop="rechargeIds"
        >
          <div class="options-header">
            <div class="selected-tip">
              已选 <strong>{{ configForm.rechargeIds.length }}</strong> / {{ maxSelectCount }} 个档位
            </div>

            <el-button
                v-if="!editingConfig"
                link
                type="primary"
                size="small"
                @click="toggleSelectAll"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
          </div>

          <div class="recharge-options">
            <div
                v-for="item in yjwjCRechargeOptions"
                :key="item.id"
                class="recharge-option"
                :class="{
                  active: configForm.rechargeIds.includes(item.id),
                  'is-intelligence': item.intelligence,
                  'is-locked': !!editingConfig
                }"
                @click="handleOptionClick(item)"
            >
              <div class="radio">
                <span v-if="configForm.rechargeIds.includes(item.id)"></span>
              </div>
              <div class="recharge-info">
                <div class="recharge-coins">{{ item.coins }}</div>
                <div class="recharge-price">¥{{ item.price }}</div>
              </div>
              <div v-if="item.intelligence" class="intelligence-badge">智能</div>
              <div v-if="isOptionDisabled(item)" class="exists-badge">已添加</div>
            </div>
          </div>
        </el-form-item>

        <!-- =========================
             永劫无间-手游档位（多选）
             ========================= -->
        <el-form-item
            v-if="isYjwjM"
            label="充值档位（可多选，最多 20 个）"
            prop="rechargeIds"
        >
          <div class="options-header">
            <div class="selected-tip">
              已选 <strong>{{ configForm.rechargeIds.length }}</strong> / {{ maxSelectCount }} 个档位
            </div>

            <el-button
                v-if="!editingConfig"
                link
                type="primary"
                size="small"
                @click="toggleSelectAll"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
          </div>

          <div class="recharge-options">
            <div
                v-for="item in yjwjMRechargeOptions"
                :key="item.id"
                class="recharge-option"
                :class="{
                  active: configForm.rechargeIds.includes(item.id),
                  'is-intelligence': item.intelligence,
                  'is-locked': !!editingConfig
                }"
                @click="handleOptionClick(item)"
            >
              <div class="radio">
                <span v-if="configForm.rechargeIds.includes(item.id)"></span>
              </div>
              <div class="recharge-info">
                <div class="recharge-coins">{{ item.coins }}</div>
                <div class="recharge-price">¥{{ item.price }}</div>
              </div>
              <div v-if="item.intelligence" class="intelligence-badge">智能</div>
              <div v-if="isOptionDisabled(item)" class="exists-badge">已添加</div>
            </div>
          </div>
        </el-form-item>



        <!-- =========================
             大话手游
             ========================= -->
        <el-form-item
            v-if="isDhxyM"
            label="充值档位（可多选，最多 20 个）"
            prop="rechargeIds"
        >
          <div class="options-header">
            <div class="selected-tip">
              已选 <strong>{{ configForm.rechargeIds.length }}</strong> / {{ maxSelectCount }} 个档位
            </div>

            <el-button
                v-if="!editingConfig"
                link
                type="primary"
                size="small"
                @click="toggleSelectAll"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
          </div>

          <div class="recharge-options">
            <div
                v-for="item in dhsyRechargeOptions"
                :key="item.id"
                class="recharge-option"
                :class="{
                  active: configForm.rechargeIds.includes(item.id),
                  'is-intelligence': item.intelligence,
                  'is-locked': !!editingConfig
                }"
                @click="handleOptionClick(item)"
            >
              <div class="radio">
                <span v-if="configForm.rechargeIds.includes(item.id)"></span>
              </div>
              <div class="recharge-info">
                <div class="recharge-coins">{{ item.coins }}</div>
                <div class="recharge-price">¥{{ item.price }}</div>
              </div>
              <div v-if="item.intelligence" class="intelligence-badge">智能</div>
              <div v-if="isOptionDisabled(item)" class="exists-badge">已添加</div>
            </div>
          </div>
        </el-form-item>

        <!-- =========================
             快手
             ========================= -->
        <el-form-item
            v-if="isKuai"
            label="充值档位（可多选，最多 20 个）"
            prop="rechargeIds"
        >
          <div class="options-header">
            <div class="selected-tip">
              已选 <strong>{{ configForm.rechargeIds.length }}</strong> / {{ maxSelectCount }} 个档位
            </div>

            <el-button
                v-if="!editingConfig"
                link
                type="primary"
                size="small"
                @click="toggleSelectAll"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
          </div>

          <div class="recharge-options">
            <div
                v-for="item in kuaiRechargeOptions"
                :key="item.id"
                class="recharge-option"
                :class="{
                  active: configForm.rechargeIds.includes(item.id),
                  'is-intelligence': item.intelligence,
                  'is-locked': !!editingConfig
                }"
                @click="handleOptionClick(item)"
            >
              <div class="radio">
                <span v-if="configForm.rechargeIds.includes(item.id)"></span>
              </div>
              <div class="recharge-info">
                <div class="recharge-coins">{{ item.coins }}</div>
                <div class="recharge-price">¥{{ item.price }}</div>
              </div>
              <div v-if="item.intelligence" class="intelligence-badge">智能</div>
              <div v-if="isOptionDisabled(item)" class="exists-badge">已添加</div>
            </div>
          </div>
        </el-form-item>

        <!-- =========================
             抖音钻石
             ========================= -->
        <el-form-item
            v-if="isDouYin"
            label="充值档位"
            prop="rechargeIds"
        >
          <div class="options-header">
            <div class="selected-tip">
              已选 <strong>{{ configForm.rechargeIds.length }}</strong> / {{ maxSelectCount }} 个档位
            </div>

            <el-button
                v-if="!editingConfig"
                link
                type="primary"
                size="small"
                @click="toggleSelectAll"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
          </div>

          <div class="recharge-options">
            <div
                v-for="item in douyinRechargeOptions"
                :key="item.id"
                class="recharge-option"
                :class="{
                  active: configForm.rechargeIds.includes(item.id),
                  'is-intelligence': item.intelligence,
                  'is-locked': !!editingConfig
                }"
                @click="handleOptionClick(item)"
            >
              <div class="radio">
                <span v-if="configForm.rechargeIds.includes(item.id)"></span>
              </div>
              <div class="recharge-info">
                <div class="recharge-coins">{{ item.coins }}</div>
                <div class="recharge-price">¥{{ item.price }}</div>
              </div>
              <div v-if="item.intelligence" class="intelligence-badge">智能</div>
              <div v-if="isOptionDisabled(item)" class="exists-badge">已添加</div>
            </div>
          </div>
        </el-form-item>


        <!-- =========================
             非固定档位平台：手动填面值 / 金额
             ========================= -->
        <template v-if="!isFixedOptionsPlatform">
          <el-form-item
              label="面值"
              prop="faceValue"
          >
            <el-input
                v-model="configForm.faceValue"
                placeholder="例如：648"
                maxlength="20"
            />
          </el-form-item>

          <el-form-item label="金额" prop="amount">
            <el-input
                v-model="configForm.amount"
                placeholder="例如：648"
                maxlength="20"
            />
          </el-form-item>
        </template>


        <!-- =========================
     最大支付比例
     ========================= -->
        <el-form-item
            label="最大支付比例"
            prop="payRatio"
        >
          <el-input-number
              v-model="configForm.payRatio"
              :min="0.01"
              :max="1"
              :step="0.01"
              :precision="4"
              controls-position="right"
              style="width: 100%"
          />

          <div class="form-tip">
            默认 1（100%），例如填写 0.97 表示最多支付配置金额的 97%。
          </div>

          <div
              v-if="Number(configForm.amount) > 0 && Number(configForm.payRatio) > 0"
              class="pay-preview"
          >
            <span>预计最大支付金额：</span>

            <strong>
              ¥{{ (
                Number(configForm.amount) *
                Number(configForm.payRatio)
            ).toFixed(2) }}
            </strong>
          </div>

          <div
              v-else-if="isFixedOptionsPlatform && configForm.rechargeIds.length > 1"
              class="form-tip"
          >
            批量添加时，所有选中的档位将使用此支付比例。
          </div>
        </el-form-item>

        <!-- =========================
             差额亏损限制
             ========================= -->
        <el-form-item label="差额亏损限制">
          <el-radio-group v-model="configForm.lossLimitMode">
            <el-radio :value="0">跟全局</el-radio>
            <el-radio :value="1">固定差额</el-radio>
            <el-radio :value="2">百分比</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
            v-if="configForm.lossLimitMode === 1"
            label="允许亏损金额（元）"
        >
          <el-input-number
              v-model="configForm.lossLimitFixed"
              :min="0"
              :step="0.01"
              :precision="2"
              controls-position="right"
              style="width: 100%"
          />
        </el-form-item>

        <el-form-item
            v-if="configForm.lossLimitMode === 2"
            label="允许亏损百分比（%）"
        >
          <el-input-number
              v-model="configForm.lossLimitPercent"
              :min="0"
              :max="100"
              :step="1"
              :precision="2"
              controls-position="right"
              style="width: 100%"
          />
        </el-form-item>

        <!-- =========================
             状态
             ========================= -->
        <el-form-item label="">
          <el-switch
              v-model="configForm.enabled"
              active-text="启用"
              inactive-text="停用"
          />
        </el-form-item>

      </el-form>


      <!-- =========================
           Footer
           ========================= -->
      <template #footer>

        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveConfig">
          保存配置
        </el-button>
      </template>

    </el-dialog>

  </div>
</template>


<script>

import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Search,
  InfoFilled,
  DocumentCopy,
} from '@element-plus/icons-vue'

import {
  ElMessage,
  ElMessageBox,
} from 'element-plus'


import {
  platformList,
  configList,
  configSave,
  configDelete,
} from '@/api/api.js'
import {generateSocCode} from "@/api/utils.js";


// ============================================================
// 档位数组粘贴区：把各自的数组内容粘到 [] 里即可
// 字段要求：{ id, coins, price, intelligence }
// - id 必须唯一
// - coins 必须唯一（用于反查档位）
// ============================================================


// =========================
// Soul 固定充值档位（写死）
// =========================

const SOUL_RECHARGE_OPTIONS = [
  { id: '1', coins: '数量组合1元面值', price: 1 , intelligence: true},
  { id: '36',    coins: 36,    price: 6      , intelligence: false},
  { id: '108',   coins: 108,   price: 18     , intelligence: false},
  { id: '213',   coins: 213,   price: 32     , intelligence: false},
  { id: '564',   coins: 564,   price: 80     , intelligence: false},
  { id: '2436',  coins: 2436,  price: 330    , intelligence: false},
  { id: '5319',  coins: 5319,  price: 670    , intelligence: false},
  { id: '12817', coins: 12817, price: 1580   , intelligence: false},
  { id: '24263', coins: 24263, price: 2970   , intelligence: false},
  { id: '49011', coins: 49011, price: 5800   , intelligence: false},
  { id: '92300', coins: 92300, price: 10400  , intelligence: false},
  { id: '272285',coins: 272285,price: 30666  , intelligence: false},

]


// =========================
// 蛋仔固定充值档位（写死）
// =========================

const EGG_RECHARGE_OPTIONS = [
  { id: '蛋币-1', coins: '数量组合1元面值', price: 1 , intelligence: true},
  { id: '蛋币-10 1元', coins: '蛋币-10', price: 1, intelligence: false },
  { id: '蛋币-60 6元', coins: '蛋币-60', price: 6, intelligence: false },
  { id: '蛋币-300 30元', coins: '蛋币-300', price: 30, intelligence: false },
  { id: '蛋币-680 68元', coins: '蛋币-680', price: 68, intelligence: false },
  { id: '蛋币-1280 128元', coins: '蛋币-1280', price: 128, intelligence: false },
  { id: '蛋币-1980 198元', coins: '蛋币-1980', price: 198, intelligence: false },
  { id: '蛋币-3280 328元', coins: '蛋币-3280', price: 328, intelligence: false },
  { id: '蛋币-6480 648元', coins: '蛋币-6480', price: 648, intelligence: false },

  { id: '假期特惠每日礼包 6元', coins: '礼包-假期特惠每日礼包', price: 6, intelligence: false },
  { id: '假期特惠基础礼包 68元', coins: '礼包-假期特惠基础礼包', price: 68, intelligence: false },
  { id: '假期特惠高级礼包 128元', coins: '礼包-假期特惠高级礼包', price: 128, intelligence: false },
  { id: '蛋仔派对呦会员 12元', coins: '礼包-蛋仔派对呦会员', price: 12, intelligence: false },

  { id: '森林童话季快乐礼 6元', coins: '礼包-森林童话季快乐礼', price: 6, intelligence: false },
  { id: '森林童话季冲刺礼 12元', coins: '礼包-森林童话季冲刺礼', price: 12, intelligence: false },
  { id: '会员赛季礼 6元', coins: '礼包-会员赛季礼', price: 6, intelligence: false },
  { id: '1元好礼购 1元', coins: '1元好礼购', price: 1, intelligence: false },
  { id: '妙脆角 1元', coins: '妙脆角', price: 1, intelligence: false },

  { id: '好礼购月卡 30元', coins: '好礼购月卡', price: 30, intelligence: false },
  { id: '变形术·小飞龙 30元', coins: '变形术·小飞龙', price: 30, intelligence: false },
  { id: '快乐的泡泡·甜浪 6元', coins: '快乐的泡泡·甜浪', price: 6, intelligence: false },
  { id: '龙卷风· 狂潮 6元', coins: '龙卷风· 狂潮', price: 6, intelligence: false },
  { id: '小猪佩奇个人主页装扮礼包 95元', coins: '小猪佩奇个人主页装扮礼包', price: 95, intelligence: false },
  { id: '雪球滚滚·星砂 6元', coins: '雪球滚滚·星砂', price: 6, intelligence: false },
  { id: '幽魂追踪·幻梦蝶 30元', coins: '幽魂追踪·幻梦蝶', price: 30, intelligence: false },
  { id: '狗狗眼镜 1元', coins: '狗狗眼镜', price: 1, intelligence: false },
  { id: '像素眼镜 40元', coins: '像素眼镜', price: 40, intelligence: false },
  { id: '热恋眼镜 40元', coins: '热恋眼镜', price: 40, intelligence: false },
  { id: 'EMO 10元', coins: 'EMO', price: 10, intelligence: false },
  { id: '发芽啦 10元', coins: '发芽啦', price: 10, intelligence: false },
  { id: '信号 10元', coins: '信号', price: 10, intelligence: false },
  { id: '加油鸭 10元', coins: '加油鸭', price: 10, intelligence: false },
  { id: '惊讶 10元', coins: '惊讶', price: 10, intelligence: false },
  { id: '卡机 10元', coins: '卡机', price: 10, intelligence: false },
  { id: '萌宠腰包 30元', coins: '萌宠腰包', price: 30, intelligence: false },
  { id: '情绪稳定 10元', coins: '情绪稳定', price: 10, intelligence: false },
  { id: '求暴富 10元', coins: '求暴富', price: 10, intelligence: false },
  { id: '生人勿近 10元', coins: '生人勿近', price: 10, intelligence: false },
  { id: '问号 10元', coins: '问号', price: 10, intelligence: false },
  { id: '闪耀王冠配饰 1元', coins: '闪耀王冠配饰', price: 1, intelligence: false },
  { id: '花苞单丸子头 6元', coins: '花苞单丸子头', price: 6, intelligence: false },
  { id: '许愿币配饰 1元', coins: '许愿币配饰', price: 1, intelligence: false },
  { id: '小女孩发型 6元', coins: '小女孩发型', price: 6, intelligence: false },
  { id: '斜刘海短发 6元', coins: '斜刘海短发', price: 6, intelligence: false },
  { id: '甜酷双丸子头 6元', coins: '甜酷双丸子头', price: 6, intelligence: false },
  { id: '爱神之翼 50元', coins: '爱神之翼', price: 50, intelligence: false },
  { id: '充气锤 25元', coins: '充气锤', price: 25, intelligence: false },
  { id: '金铲子 6元', coins: '金铲子', price: 6, intelligence: false },
  { id: '聚宝袋 50元', coins: '聚宝袋', price: 50, intelligence: false },
  { id: '美味便当 50元', coins: '美味便当', price: 50, intelligence: false },
  { id: '暗夜摩羯座 50元', coins: '暗夜摩羯座', price: 50, intelligence: false },
  { id: '璀璨狮子座 50元', coins: '璀璨狮子座', price: 50, intelligence: false },
  { id: '典雅天秤座 50元', coins: '典雅天秤座', price: 50, intelligence: false },
  { id: '鬼马双子座 50元', coins: '鬼马双子座', price: 50, intelligence: false },
  { id: '灵动水瓶座 50元', coins: '灵动水瓶座', price: 50, intelligence: false },
  { id: '旅者射手座 50元', coins: '旅者射手座', price: 50, intelligence: false },
  { id: '梦幻白羊座 50元', coins: '梦幻白羊座', price: 50, intelligence: false },
  { id: '绮梦双鱼座 50元', coins: '绮梦双鱼座', price: 50, intelligence: false },
  { id: '神秘天蝎座 50元', coins: '神秘天蝎座', price: 50, intelligence: false },
  { id: '圣洁处女座 50元', coins: '圣洁处女座', price: 50, intelligence: false },
  { id: '曙光金牛座 50元', coins: '曙光金牛座', price: 50, intelligence: false },
  { id: '温柔巨蟹座 50元', coins: '温柔巨蟹座', price: 50, intelligence: false },
  { id: '定海神针 50元', coins: '定海神针', price: 50, intelligence: false },
  { id: '六角恐龙 30元', coins: '六角恐龙', price: 30, intelligence: false },
  { id: '捧花 30元', coins: '捧花', price: 30, intelligence: false },
  { id: '西瓜雪糕 30元', coins: '西瓜雪糕', price: 30, intelligence: false },
  { id: '金秋滚动特效礼包 236元', coins: '金秋滚动特效礼包', price: 236, intelligence: false },
  { id: '鹊桥相会 80元', coins: '鹊桥相会', price: 80, intelligence: false },
  { id: '半鱼人汉顿火车礼包 52元', coins: '半鱼人汉顿火车礼包', price: 52, intelligence: false },
  { id: '星河相依 80元', coins: '星河相依', price: 80, intelligence: false },
  { id: '苍蓝龙拳 43元', coins: '苍蓝龙拳', price: 43, intelligence: false },
  { id: '脆脆糖话筒 48元', coins: '脆脆糖话筒', price: 48, intelligence: false },
  { id: '喵呜快照礼包 43元', coins: '喵呜快照礼包', price: 43, intelligence: false },
  { id: '凤鸣唢呐 48元', coins: '凤鸣唢呐', price: 48, intelligence: false },
  { id: '无限滑板礼包 82元', coins: '无限滑板礼包', price: 82, intelligence: false },
  { id: '花花鸭召唤器 30元', coins: '花花鸭召唤器', price: 30, intelligence: false },
  { id: '幻晶小提琴 48元', coins: '幻晶小提琴', price: 48, intelligence: false },
  { id: '解压木鱼 30元', coins: '解压木鱼', price: 30, intelligence: false },
  { id: '失重电吉他 48元', coins: '失重电吉他', price: 48, intelligence: false },
  { id: '动作<为你心动> 1元', coins: '动作<为你心动>', price: 1, intelligence: false },
  { id: '动作<我要验牌> 1元', coins: '动作<我要验牌>', price: 1, intelligence: false },
  { id: '玩具<袋你走> 1元', coins: '玩具<袋你走>', price: 1, intelligence: false },
  { id: '甜蜜贴贴气球 30元', coins: '甜蜜贴贴气球', price: 30, intelligence: false },
  { id: '动作<摇摇舞> 1元', coins: '动作<摇摇舞>', price: 1, intelligence: false },
  { id: '动作<箭随心动> 30元', coins: '动作<箭随心动>', price: 30, intelligence: false },
  { id: '夜咏手风琴 48元', coins: '夜咏手风琴', price: 48, intelligence: false },
  { id: '动作<我愿意> 1元', coins: '动作<我愿意>', price: 1, intelligence: false },
  { id: '月落古筝 48元', coins: '月落古筝', price: 48, intelligence: false },
  { id: '诶呀我摔倒了 15元', coins: '诶呀我摔倒了', price: 15, intelligence: false },
  { id: '静静听 30元', coins: '静静听', price: 30, intelligence: false },
  { id: '来一杯佳饮 15元', coins: '来一杯佳饮', price: 15, intelligence: false },
  { id: '甩手舞 30元', coins: '甩手舞', price: 30, intelligence: false },
  { id: '趁热打铁 10元', coins: '趁热打铁', price: 10, intelligence: false },
  { id: '该喝水了 10元', coins: '该喝水了', price: 10, intelligence: false },
  { id: '困到恍惚 10元', coins: '困到恍惚', price: 10, intelligence: false },
  { id: '小猪佩奇礼包 146元', coins: '小猪佩奇礼包', price: 146, intelligence: false },
  { id: '连连赞叹 10元', coins: '连连赞叹', price: 10, intelligence: false },
  { id: '巫山之月礼包 69元', coins: '巫山之月礼包', price: 69, intelligence: false },
  { id: '小猪乔治礼包 146元', coins: '小猪乔治礼包', price: 146, intelligence: false },
  { id: '钱来 10元', coins: '钱来', price: 10, intelligence: false },
  { id: '猩红奏鸣组合礼包 12元', coins: '猩红奏鸣组合礼包', price: 12, intelligence: false },
  { id: '甩掉烦恼 10元', coins: '甩掉烦恼', price: 10, intelligence: false },
  { id: '轮滑兔泡泡礼包 234元', coins: '轮滑兔泡泡礼包', price: 234, intelligence: false },
  { id: '吸福 10元', coins: '吸福', price: 10, intelligence: false },
  { id: '下次还敢 10元', coins: '下次还敢', price: 10, intelligence: false },
  { id: '自我抢救 10元', coins: '自我抢救', price: 10, intelligence: false },
  { id: '松饼汪 40元', coins: '松饼汪', price: 40, intelligence: false },
  { id: '瑰影 6元', coins: '瑰影', price: 6, intelligence: false },
  { id: '皎玉礼包 12元', coins: '皎玉礼包', price: 12, intelligence: false },
  { id: '矮人工匠托尔 80元', coins: '矮人工匠托尔', price: 80, intelligence: false },
  { id: '嗷嗷 80元', coins: '嗷嗷', price: 80, intelligence: false },
  { id: '冰激凌企鹅 40元', coins: '冰激凌企鹅', price: 40, intelligence: false },
  { id: '布偶狮雷格 40元', coins: '布偶狮雷格', price: 40, intelligence: false },
  { id: '彩色爆炸头套装 18元', coins: '彩色爆炸头套装', price: 18, intelligence: false },
  { id: '沉眠的螺壶 80元', coins: '沉眠的螺壶', price: 80, intelligence: false },
  { id: '锤头鲨 40元', coins: '锤头鲨', price: 40, intelligence: false },
  { id: '大橘大利套装 18元', coins: '大橘大利套装', price: 18, intelligence: false },
  { id: '发芽喵喵蒜 40元', coins: '发芽喵喵蒜', price: 40, intelligence: false },
  { id: '粉驴倔倔 40元', coins: '粉驴倔倔', price: 40, intelligence: false },
  { id: '红果小浣熊 40元', coins: '红果小浣熊', price: 40, intelligence: false },
  { id: '吼吼 80元', coins: '吼吼', price: 80, intelligence: false },
  { id: '胡桃可露丽 80元', coins: '胡桃可露丽', price: 80, intelligence: false },
  { id: '虎皮卷大灰狼 80元', coins: '虎皮卷大灰狼', price: 80, intelligence: false },
  { id: '僵尸博士 80元', coins: '僵尸博士', price: 80, intelligence: false },
  { id: '焦香鲷鱼烧 40元', coins: '焦香鲷鱼烧', price: 40, intelligence: false },
  { id: '蕉朋友 40元', coins: '蕉朋友', price: 40, intelligence: false },
  { id: '街头一霸骐哥 80元', coins: '街头一霸骐哥', price: 80, intelligence: false },
  { id: '考拉阿哦 80元', coins: '考拉阿哦', price: 80, intelligence: false },
  { id: '鲤鱼姬小锦 80元', coins: '鲤鱼姬小锦', price: 80, intelligence: false },
  { id: '旅行家渡渡 80元', coins: '旅行家渡渡', price: 80, intelligence: false },
  { id: '玫瑰骑士 80元', coins: '玫瑰骑士', price: 80, intelligence: false },
  { id: '面包狗松松 80元', coins: '面包狗松松', price: 80, intelligence: false },
  { id: '奶油樱 40元', coins: '奶油樱', price: 40, intelligence: false },
  { id: '暖暖棉袄 40元', coins: '暖暖棉袄', price: 40, intelligence: false },
  { id: '齐天大圣 80元', coins: '齐天大圣', price: 80, intelligence: false },
  { id: '千金少女纸鹤 40元', coins: '千金少女纸鹤', price: 40, intelligence: false },
  { id: '饶舌小子 80元', coins: '饶舌小子', price: 80, intelligence: false },
  { id: '绒绒小红狐 40元', coins: '绒绒小红狐', price: 40, intelligence: false },
  { id: '圣诞小星星 40元', coins: '圣诞小星星', price: 40, intelligence: false },
  { id: '水蜜桃 40元', coins: '水蜜桃', price: 40, intelligence: false },
  { id: '松饼小红帽 80元', coins: '松饼小红帽', price: 80, intelligence: false },
  { id: '太阳花灿灿 40元', coins: '太阳花灿灿', price: 40, intelligence: false },
  { id: '糖心蛋总 80元', coins: '糖心蛋总', price: 80, intelligence: false },
  { id: '糖心公主 80元', coins: '糖心公主', price: 80, intelligence: false },
  { id: '淘气妹妹 80元', coins: '淘气妹妹', price: 80, intelligence: false },
  { id: '顽皮小丑鱼 40元', coins: '顽皮小丑鱼', price: 40, intelligence: false },
  { id: '万圣南小瓜 40元', coins: '万圣南小瓜', price: 40, intelligence: false },
  { id: '小福袋添运 80元', coins: '小福袋添运', price: 80, intelligence: false },
  { id: '小公鸡唐唐 40元', coins: '小公鸡唐唐', price: 40, intelligence: false },
  { id: '小黄鸡雨衣 40元', coins: '小黄鸡雨衣', price: 40, intelligence: false },
  { id: '小太阳葵葵 60元', coins: '小太阳葵葵', price: 60, intelligence: false },
  { id: '阳光套装 18元', coins: '阳光套装', price: 18, intelligence: false },
  { id: '月兔球 40元', coins: '月兔球', price: 40, intelligence: false },
  { id: '炸虾脆脆 40元', coins: '炸虾脆脆', price: 40, intelligence: false },
  { id: '紫霄仙子 40元', coins: '紫霄仙子', price: 40, intelligence: false },
  { id: '改名卡 18元', coins: '改名卡', price: 18, intelligence: false },
  { id: '房间卡 2元', coins: '房间卡', price: 2, intelligence: false },
  { id: '豪华莓果蛋糕 2元', coins: '豪华莓果蛋糕', price: 2, intelligence: false },
  { id: '青提奶油蛋糕 1元', coins: '青提奶油蛋糕', price: 1, intelligence: false },
  { id: '礼花枪 1元', coins: '礼花枪', price: 1, intelligence: false },
  { id: '爱心啾啾烟花 1元', coins: '爱心啾啾烟花', price: 1, intelligence: false },
  { id: '枫叶啾啾烟花 1元', coins: '枫叶啾啾烟花', price: 1, intelligence: false },
  { id: '泡泡啾啾烟花 1元', coins: '泡泡啾啾烟花', price: 1, intelligence: false },
  { id: '星星啾啾烟花 1元', coins: '星星啾啾烟花', price: 1, intelligence: false },
  { id: '幸运啾啾烟花 1元', coins: '幸运啾啾烟花', price: 1, intelligence: false },
  { id: '音波啾啾烟花 1元', coins: '音波啾啾烟花', price: 1, intelligence: false },
  { id: '音符啾啾烟花 1元', coins: '音符啾啾烟花', price: 1, intelligence: false },
]

// =========================
// 小红书固定充值档位（写死）
// 只有一个智能组合 1 元面值
// =========================
const XHS_RECHARGE_OPTIONS = [
  { id: '1', coins: '数量组合1元面值', price: 1, intelligence: true },
  { id: '60',    coins: '60薯币',    price: 6,    intelligence: false },
  { id: '400',    coins: '400薯币',    price: 40,    intelligence: false },
  { id: '680',    coins: '680薯币',    price: 68,    intelligence: false },
  { id: '980',    coins: '980薯币',    price: 98,    intelligence: false },
  { id: '1980',    coins: '1980薯币',    price: 198,    intelligence: false },
  { id: '6980',    coins: '6980薯币',    price: 698,    intelligence: false },
  { id: '14980',    coins: '14980薯币',    price: 1498,    intelligence: false },
  { id: '26980',    coins: '26980薯币',    price: 2698,    intelligence: false },
  { id: '59980',    coins: '59980薯币',    price: 5998,    intelligence: false },
  { id: '129980',    coins: '129980薯币',    price: 12998,    intelligence: false },
  { id: '366660',    coins: '366660薯币',    price: 36666,    intelligence: false },
]

// =========================
// 他趣固定充值档位（写死）
// =========================
const TAQU_RECHARGE_OPTIONS = [
  { id: '1', coins: '数量组合1元面值', price: 1, intelligence: true },
  { id: '600',    coins: '600',    price: 6,    intelligence: false },
  { id: '900',    coins: '900',    price: 9,    intelligence: false },
  { id: '3000',   coins: '3000',   price: 30,   intelligence: false },
  { id: '9800',   coins: '9800',   price: 98,   intelligence: false },
  { id: '29800',  coins: '29800',  price: 298,  intelligence: false },
  { id: '58800',  coins: '58800',  price: 588,  intelligence: false },
  { id: '119800', coins: '119800', price: 1198, intelligence: false },
]

// =========================
// 克拉克拉固定充值档位（写死）
// =========================
const KLMB_RECHARGE_OPTIONS = [
  { id: '1',       coins: '数量组合1元面值', price: 1,     intelligence: true },
  { id: '100',     coins: '100',     price: 1,     intelligence: false },
  { id: '600',     coins: '600',     price: 6,     intelligence: false },
  { id: '1200',    coins: '1200',    price: 12,    intelligence: false },
  { id: '3000',    coins: '3000',    price: 30,    intelligence: false },
  { id: '9800',    coins: '9800',    price: 98,    intelligence: false },
  { id: '51800',   coins: '51800',   price: 518,   intelligence: false },
  { id: '99800',   coins: '99800',   price: 998,   intelligence: false },
  { id: '299800',  coins: '299800',  price: 2998,  intelligence: false },
  { id: '999800',  coins: '999800',  price: 9998,  intelligence: false },
  { id: '4999800', coins: '4999800', price: 49998, intelligence: false },
]

// =========================
// 第五人格固定充值档位（写死）
// =========================
const D5RG_RECHARGE_OPTIONS = [
  { id: '1',    coins: '数量组合1元面值', price: 1,    intelligence: true },
  { id: '10',   coins: '10回声',    price: 1,   intelligence: false },
  { id: '60',   coins: '60回声',    price: 6,   intelligence: false },
  { id: '300',  coins: '300回声',   price: 30,  intelligence: false },
  { id: '680',  coins: '680回声',   price: 68,  intelligence: false },
  { id: '1280', coins: '1280回声',  price: 128, intelligence: false },
  { id: '1980', coins: '1980回声',  price: 198, intelligence: false },
  { id: '3280', coins: '3280回声',  price: 328, intelligence: false },
  { id: '6480', coins: '6480回声',  price: 648, intelligence: false },
  // 礼包
  { id: '【礼包】1元特惠灵感礼包',  coins: '【礼包】1元特惠灵感礼包',  price: 1,  intelligence: false },
  { id: '【礼包】1元特惠线索礼包',  coins: '【礼包】1元特惠线索礼包',  price: 1,  intelligence: false },
  { id: '【礼包】-灵感礼包',     coins: '【礼包】-灵感礼包',         price: 6,  intelligence: false },
  { id: '【礼包】-线索礼包',     coins: '【礼包】-线索礼包',         price: 30, intelligence: false },
  { id: '【礼包】-珍宝礼包',     coins: '【礼包】-珍宝礼包',         price: 68, intelligence: false },
  //时装
  { id: '【时装】“囚徒”-宾虚',     coins: '【时装】“囚徒”-宾虚',         price: 128, intelligence: false },
  { id: '【时装】佣兵-弹簧手',     coins: '【时装】佣兵-弹簧手',         price: 128, intelligence: false },
  { id: '【时装】入殓师-哈姆雷特',     coins: '【时装】入殓师-哈姆雷特',         price: 128, intelligence: false },
  { id: '【时装】慈善家-领头羊',     coins: '【时装】慈善家-领头羊',         price: 128, intelligence: false },
  { id: '【时装】厂长-永恒之王',     coins: '【时装】厂长-永恒之王',         price: 128, intelligence: false },
  { id: '【时装】勘探员-黑郁金香',     coins: '【时装】勘探员-黑郁金香',         price: 128, intelligence: false },
  { id: '【时装】杰克-斯文加利',     coins: '【时装】杰克-斯文加利',         price: 128, intelligence: false },
  { id: '【时装】机械师-咫尺天涯',     coins: '【时装】机械师-咫尺天涯',         price: 128, intelligence: false },
  { id: '【时装】调香师-致命温柔',     coins: '【时装】调香师-致命温柔',         price: 128, intelligence: false },
  { id: '【时装】牛仔-部族勇士',     coins: '【时装】牛仔-部族勇士',         price: 128, intelligence: false },
  { id: '【时装】佣兵-寄生',     coins: '【时装】佣兵-寄生',         price: 128, intelligence: false },
  { id: '【时装】医生-雨中曲',     coins: '【时装】医生-雨中曲',         price: 128, intelligence: false },
  { id: '【时装】前锋-蛮牛之力',     coins: '【时装】前锋-蛮牛之力',         price: 128, intelligence: false },
  { id: '【时装】红蝶-罗生门',     coins: '【时装】红蝶-罗生门',         price: 128, intelligence: false },
  { id: '【时装】空军-琼楼遗恨',     coins: '【时装】空军-琼楼遗恨',         price: 128, intelligence: false },
  { id: '【时装】调香师-红菱艳',     coins: '【时装】调香师-红菱艳',         price: 128, intelligence: false },
  { id: '【时装】红蝶-绿孔雀',     coins: '【时装】红蝶-绿孔雀',         price: 128, intelligence: false },
  { id: '【时装】佣兵-达克斯上校',     coins: '【时装】佣兵-达克斯上校',         price: 128, intelligence: false },
  { id: '【时装】祭司-撒玛拉',     coins: '【时装】祭司-撒玛拉',         price: 128, intelligence: false },
  { id: '【时装】鹿头-蒸汽朋克',     coins: '【时装】鹿头-蒸汽朋克',         price: 128, intelligence: false },
  { id: '【时装】杰克-绿纹大触',     coins: '【时装】杰克-绿纹大触',         price: 128, intelligence: false },
  { id: '【时装】医生-光天使',     coins: '【时装】医生-光天使',         price: 128, intelligence: false },
  { id: '【时装】园丁-兰闺惊梦',     coins: '【时装】园丁-兰闺惊梦',         price: 128, intelligence: false },
  { id: '【时装】红夫人-斯嘉丽',     coins: '【时装】红夫人-斯嘉丽',         price: 128, intelligence: false },
  { id: '【时装】摄影师-浮士德',     coins: '【时装】摄影师-浮士德',         price: 128, intelligence: false },
  { id: '【时装】先知-独行者',     coins: '【时装】先知-独行者',         price: 128, intelligence: false },
  { id: '【时装】宿伞之魂-残花泪',     coins: '【时装】宿伞之魂-残花泪',         price: 128, intelligence: false },
  { id: '【时装】黄衣之主-奠柏',     coins: '【时装】黄衣之主-奠柏',         price: 128, intelligence: false },
  { id: '【时装】杰克-白纹大触',     coins: '【时装】杰克-白纹大触',         price: 128, intelligence: false },
  { id: '【时装】咒术师-祖祖',     coins: '【时装】咒术师-祖祖',         price: 128, intelligence: false },
  { id: '【时装】渔女-百万人鱼',     coins: '【时装】渔女-百万人鱼',         price: 128, intelligence: false },
  { id: '【时装】舞女-莎乐美',     coins: '【时装】舞女-莎乐美',         price: 128, intelligence: false },
  { id: '【时装】画家-达芬奇',     coins: '【时装】画家-达芬奇',         price: 128, intelligence: false },
  { id: '【时装】祭司-引路人',     coins: '【时装】祭司-引路人',         price: 268, intelligence: false },
  { id: '【时装】机械师-小红帽',     coins: '【时装】机械师-小红帽',         price: 268, intelligence: false },
  { id: '【时装】红蝶-花嫁',     coins: '【时装】红蝶-花嫁',         price: 268, intelligence: false },
  { id: '【时装】摄影师-亚兹拉尔',     coins: '【时装】摄影师-亚兹拉尔',         price: 268, intelligence: false },
  { id: '【时装】魔术师-寻宝贵族',     coins: '【时装】魔术师-寻宝贵族',         price: 268, intelligence: false },
  { id: '【时装】小丑-小丑皇',     coins: '【时装】小丑-小丑皇',         price: 268, intelligence: false },
  { id: '【时装】“博士”-征服',     coins: '【时装】“博士”-征服',         price: 268, intelligence: false },
  { id: '【时装】园丁-幽灵公主',     coins: '【时装】园丁-幽灵公主',         price: 268, intelligence: false },
  { id: '【时装】舞女-女武神',     coins: '【时装】舞女-女武神',         price: 268, intelligence: false },
  { id: '【时装】调香师-花序',     coins: '【时装】调香师-花序',         price: 268, intelligence: false },
  { id: '【时装】红蝶-竹华',     coins: '【时装】红蝶-竹华',         price: 268, intelligence: false },

]

// =========================
// 梦幻西游固定充值档位（写死）
// =========================
const MHXY_RECHARGE_OPTIONS = [
  { id: '1', coins: '数量组合1元面值', price: 1, intelligence: true },
  // TODO: 换成梦幻西游真实档位
  { id: '60仙玉',   coins: '60仙玉',   price: 6,   intelligence: false },
  { id: '300仙玉',  coins: '300仙玉',  price: 30,  intelligence: false },
  { id: '500仙玉',  coins: '500仙玉',  price: 50,  intelligence: false },
  { id: '980仙玉', coins: '980仙玉', price: 98, intelligence: false },
  { id: '1980仙玉', coins: '1980仙玉', price: 198, intelligence: false },
  { id: '2980仙玉', coins: '2980仙玉', price: 298, intelligence: false },
  { id: '4880仙玉', coins: '4880仙玉', price: 488, intelligence: false },
  { id: '6480仙玉', coins: '6480仙玉', price: 648, intelligence: false },
  { id: '12980仙玉', coins: '12980仙玉', price: 1298, intelligence: false },
  { id: '32980仙玉', coins: '32980仙玉', price: 3298, intelligence: false },
  { id: '64980仙玉', coins: '64980仙玉', price: 6498, intelligence: false },
  { id: '摆摊拓展卡', coins: '摆摊拓展卡', price: 28, intelligence: false },
]

// =========================
// 永劫无间-直充固定充值档位（写死）
// =========================
const YJWJ_C_RECHARGE_OPTIONS = [
  { id: '1', coins: '数量组合1元面值', price: 1, intelligence: true },
  // TODO: 换成永劫无间真实档位，coins 必须唯一
  { id: '120金块',     coins: '120金块',     price: 6,   intelligence: false },
  { id: '1200金块',    coins: '1200金块',    price: 60,  intelligence: false },
  { id: '3000金块',    coins: '3000金块',    price: 150,  intelligence: false },
  { id: '6000金块',   coins: '6000金块',   price: 300, intelligence: false },
  { id: '12960金块',   coins: '12960金块',   price: 648, intelligence: false },

  // 以下按 JSON goods_list 原顺序追加
  { id: '白泽月卡 30元', coins: '白泽月卡', price: 30, intelligence: false },
  { id: '吞天拓展包 99元', coins: '吞天拓展包', price: 99, intelligence: false },
  { id: '月光宝券 30元', coins: '月光宝券', price: 30, intelligence: false },
  { id: '振奋秘匣 6元', coins: '振奋秘匣', price: 6, intelligence: false },
  { id: '神骏宝炉*1 12元', coins: '神骏宝炉*1', price: 12, intelligence: false },
  { id: '满打满灌 15元', coins: '满打满灌', price: 15, intelligence: false },
  { id: '砥砺筋骨·活力套装 40元', coins: '砥砺筋骨·活力套装', price: 40, intelligence: false },
  { id: '甜心震荡 75元', coins: '甜心震荡', price: 75, intelligence: false },
  { id: '西游秘匣 6元', coins: '西游秘匣', price: 6, intelligence: false },
  { id: '寂刃·通用捆绑包 60元', coins: '寂刃·通用捆绑包', price: 60, intelligence: false },
  { id: '琉璃香槟·崔三娘捆绑包 90元', coins: '琉璃香槟·崔三娘捆绑包', price: 90, intelligence: false },
  { id: '碎月缎光·席拉捆绑包 115元', coins: '碎月缎光·席拉捆绑包', price: 115, intelligence: false },
  { id: '幻梦寻奇·玉玲珑捆绑包 125元', coins: '幻梦寻奇·玉玲珑捆绑包', price: 125, intelligence: false },
  { id: '荒诞盛宴·无尘捆绑包 125元', coins: '荒诞盛宴·无尘捆绑包', price: 125, intelligence: false },
  { id: '玫瑰火焰·宁红夜捆绑包 125元', coins: '玫瑰火焰·宁红夜捆绑包', price: 125, intelligence: false },
  { id: '白兔先生 210元', coins: '白兔先生', price: 210, intelligence: false },
  { id: '琉璃晶*10 25元', coins: '琉璃晶*10', price: 25, intelligence: false },
  { id: '甜夜安眠·幻梦鲸彩 240元', coins: '甜夜安眠·幻梦鲸彩', price: 240, intelligence: false },
  { id: '惊世先生·万钧捆绑包 105元', coins: '惊世先生·万钧捆绑包', price: 105, intelligence: false },
  { id: '【挑染】代号·冷萃 75元', coins: '【挑染】代号·冷萃', price: 75, intelligence: false },
  { id: '清浪 15元', coins: '清浪', price: 15, intelligence: false },
  { id: '吞天隐族秘藏卡 60元', coins: '吞天隐族秘藏卡', price: 60, intelligence: false },
  { id: '吞天荣耀秘藏卡 142元', coins: '吞天荣耀秘藏卡', price: 142, intelligence: false },
  { id: '观山海·炎野 40元', coins: '观山海·炎野', price: 40, intelligence: false },
  { id: '锦鳞宝囊*100 1200元', coins: '锦鳞宝囊*100', price: 1200, intelligence: false },
  { id: '锦鳞宝囊*10首单版 120元', coins: '锦鳞宝囊*10首单版', price: 120, intelligence: false },
  { id: '锦鳞宝囊*10 120元', coins: '锦鳞宝囊*10', price: 120, intelligence: false },
  { id: '锦鳞宝囊*1 12元', coins: '锦鳞宝囊*1', price: 12, intelligence: false },
  { id: '初见礼包 12元', coins: '初见礼包', price: 12, intelligence: false },
  { id: '2674·初代机·甜酷黑 50元', coins: '2674·初代机·甜酷黑', price: 50, intelligence: false },
  { id: '沙砾 40元', coins: '沙砾', price: 40, intelligence: false },
  { id: '神骏宝炉*10 120元', coins: '神骏宝炉*10', price: 120, intelligence: false },
  { id: '神骏宝炉*100 1200元', coins: '神骏宝炉*100', price: 1200, intelligence: false },
  { id: '甜夜安眠·琉璃香槟 90元', coins: '甜夜安眠·琉璃香槟', price: 90, intelligence: false },
  { id: '甜夜安眠·碎月缎光 90元', coins: '甜夜安眠·碎月缎光', price: 90, intelligence: false },
  { id: '惊世袍 90元', coins: '惊世袍', price: 90, intelligence: false },
  { id: '甜夜安眠·银辉小熊 45元', coins: '甜夜安眠·银辉小熊', price: 45, intelligence: false },
  { id: '英雄币*100 30元', coins: '英雄币*100', price: 30, intelligence: false },
  { id: '幸运扑克 75元', coins: '幸运扑克', price: 75, intelligence: false },
  { id: '龙之道·灵心 120元', coins: '龙之道·灵心', price: 120, intelligence: false },
  { id: '春日序曲·晨风 90元', coins: '春日序曲·晨风', price: 90, intelligence: false },
  { id: '春日序曲·赤羽 90元', coins: '春日序曲·赤羽', price: 90, intelligence: false },
  { id: '春日序曲·寒芷 90元', coins: '春日序曲·寒芷', price: 90, intelligence: false },
  { id: '春日序曲·朝颜 90元', coins: '春日序曲·朝颜', price: 90, intelligence: false },
  { id: '春日序曲·协光 90元', coins: '春日序曲·协光', price: 90, intelligence: false },
  { id: '春日序曲·夜汐 90元', coins: '春日序曲·夜汐', price: 90, intelligence: false },
  { id: '兰庭月 90元', coins: '兰庭月', price: 90, intelligence: false },
  { id: '银狼裘 90元', coins: '银狼裘', price: 90, intelligence: false },
  { id: '无常白袍 90元', coins: '无常白袍', price: 90, intelligence: false },
  { id: '西行劫·蜘蛛精 90元', coins: '西行劫·蜘蛛精', price: 90, intelligence: false },
  { id: '西行劫·悟净 90元', coins: '西行劫·悟净', price: 90, intelligence: false },
  { id: '春雪 90元', coins: '春雪', price: 90, intelligence: false },
  { id: '新倩女幽魂·花间影 90元', coins: '新倩女幽魂·花间影', price: 90, intelligence: false },
  { id: '未济袍 90元', coins: '未济袍', price: 90, intelligence: false },
  { id: '花之倾奇 90元', coins: '花之倾奇', price: 90, intelligence: false },
  { id: '百战·断链 90元', coins: '百战·断链', price: 90, intelligence: false },
  { id: '梨园传奇·小青 90元', coins: '梨园传奇·小青', price: 90, intelligence: false },
  { id: '梨园传奇·素贞 90元', coins: '梨园传奇·素贞', price: 90, intelligence: false },
  { id: '英雄袍 90元', coins: '英雄袍', price: 90, intelligence: false },
  { id: '夜吻 90元', coins: '夜吻', price: 90, intelligence: false },
  { id: '绝伦袍 90元', coins: '绝伦袍', price: 90, intelligence: false },
  { id: '金沙·梦蜀 90元', coins: '金沙·梦蜀', price: 90, intelligence: false },
  { id: '龙门·飞天 90元', coins: '龙门·飞天', price: 90, intelligence: false },
  { id: '华夏宝甲·秦风 90元', coins: '华夏宝甲·秦风', price: 90, intelligence: false },
  { id: '逆水寒·鸢纱 90元', coins: '逆水寒·鸢纱', price: 90, intelligence: false },
  { id: '正法袍 90元', coins: '正法袍', price: 90, intelligence: false },
  { id: '代号丝莼·季莹莹捆绑包 97.5元', coins: '代号丝莼·季莹莹捆绑包', price: 97.5, intelligence: false },
  { id: '不凡·幻梦秘匙 180元', coins: '不凡·幻梦秘匙', price: 180, intelligence: false },
  { id: '代号·炊烟 60元', coins: '代号·炊烟', price: 60, intelligence: false },
  { id: '衔月 75元', coins: '衔月', price: 75, intelligence: false },
  { id: '雪残梅 75元', coins: '雪残梅', price: 75, intelligence: false },
  { id: '魂花晶 75元', coins: '魂花晶', price: 75, intelligence: false },
  { id: '神龙刀 75元', coins: '神龙刀', price: 75, intelligence: false },
  { id: '优昙华 75元', coins: '优昙华', price: 75, intelligence: false },
  { id: '赤云之刃 90元', coins: '赤云之刃', price: 90, intelligence: false },
  { id: '代号·丝莼 90元', coins: '代号·丝莼', price: 90, intelligence: false },
  { id: '代号·玉脍 90元', coins: '代号·玉脍', price: 90, intelligence: false },
  { id: '怀金袍 90元', coins: '怀金袍', price: 90, intelligence: false },
  { id: '怀金袍·刘炼捆绑包 135元', coins: '怀金袍·刘炼捆绑包', price: 135, intelligence: false },
  { id: '青枝瓷·妖刀姬捆绑包 144元', coins: '青枝瓷·妖刀姬捆绑包', price: 144, intelligence: false },
  { id: '强身健体 15元', coins: '强身健体', price: 15, intelligence: false },
  { id: '活力四射 15元', coins: '活力四射', price: 15, intelligence: false },
  { id: '纳福 75元', coins: '纳福', price: 75, intelligence: false },
  { id: '千秋匠心·杜虎符 90元', coins: '千秋匠心·杜虎符', price: 90, intelligence: false },
  { id: '杜虎符·胡为捆绑包 90元', coins: '杜虎符·胡为捆绑包', price: 90, intelligence: false },
  { id: '惊奇盒 6元', coins: '惊奇盒', price: 6, intelligence: false },
  { id: '化龙宝珠*1 12元', coins: '化龙宝珠*1', price: 12, intelligence: false },
  { id: '蛙蛙敬礼 15元', coins: '蛙蛙敬礼', price: 15, intelligence: false },
  { id: '斩祟行 15元', coins: '斩祟行', price: 15, intelligence: false },
  { id: '楚韵九歌·晓露轻 20元', coins: '楚韵九歌·晓露轻', price: 20, intelligence: false },
  { id: '御祥云 25元', coins: '御祥云', price: 25, intelligence: false },
  { id: '柴柴 30元', coins: '柴柴', price: 30, intelligence: false },
  { id: '沙暴苍狼·特木尔捆绑包 30元', coins: '沙暴苍狼·特木尔捆绑包', price: 30, intelligence: false },
  { id: '春日序曲·玄瑛 40元', coins: '春日序曲·玄瑛', price: 40, intelligence: false },
  { id: '春日序曲·心跳信号 45元', coins: '春日序曲·心跳信号', price: 45, intelligence: false },
  { id: '春日序曲·小狐狸 45元', coins: '春日序曲·小狐狸', price: 45, intelligence: false },
  { id: '蹦蹦跳跳 45元', coins: '蹦蹦跳跳', price: 45, intelligence: false },
  { id: '柔云狐 60元', coins: '柔云狐', price: 60, intelligence: false },
  { id: '见鹿台 60元', coins: '见鹿台', price: 60, intelligence: false },
  { id: '汪汪 60元', coins: '汪汪', price: 60, intelligence: false },
  { id: '2674·控制台 60元', coins: '2674·控制台', price: 60, intelligence: false },
  { id: '锦鲤化龙·落樱 75元', coins: '锦鲤化龙·落樱', price: 75, intelligence: false },
  { id: '美食家 75元', coins: '美食家', price: 75, intelligence: false },
  { id: '武道无穷·潜龙 75元', coins: '武道无穷·潜龙', price: 75, intelligence: false },
  { id: '跃龙门·寂兮 75元', coins: '跃龙门·寂兮', price: 75, intelligence: false },
  { id: '锦鲤化龙·冲天 75元', coins: '锦鲤化龙·冲天', price: 75, intelligence: false },
  { id: '锦鲤化龙·竹叶青 75元', coins: '锦鲤化龙·竹叶青', price: 75, intelligence: false },
  { id: '镇恶 75元', coins: '镇恶', price: 75, intelligence: false },
  { id: '百战·粉璃 75元', coins: '百战·粉璃', price: 75, intelligence: false },
  { id: '决战平安京·朔夜游方 85元', coins: '决战平安京·朔夜游方', price: 85, intelligence: false },
  { id: '武道无穷·八极 90元', coins: '武道无穷·八极', price: 90, intelligence: false },
  { id: '千秋匠心·素瓷 90元', coins: '千秋匠心·素瓷', price: 90, intelligence: false },
  { id: '灵心·蓝梦捆绑包 95元', coins: '灵心·蓝梦捆绑包', price: 95, intelligence: false },
  { id: '冥天魂使·特木尔捆绑包 97.5元', coins: '冥天魂使·特木尔捆绑包', price: 97.5, intelligence: false },
  { id: '古冢行·张起灵捆绑包 97.5元', coins: '古冢行·张起灵捆绑包', price: 97.5, intelligence: false },
  { id: '雪猫耳+雪猫尾 105元', coins: '雪猫耳+雪猫尾', price: 105, intelligence: false },
  { id: '狼耳+狼尾 105元', coins: '狼耳+狼尾', price: 105, intelligence: false },
  { id: '天渊御水·岳山捆绑包 110元', coins: '天渊御水·岳山捆绑包', price: 110, intelligence: false },
  { id: '越野帽衫·张起灵捆绑包 115元', coins: '越野帽衫·张起灵捆绑包', price: 115, intelligence: false },
  { id: '龙之道·自知 120元', coins: '龙之道·自知', price: 120, intelligence: false },
  { id: '龙之道·求真 120元', coins: '龙之道·求真', price: 120, intelligence: false },
  { id: '龙之道·无拘 120元', coins: '龙之道·无拘', price: 120, intelligence: false },
  { id: '风卫天翎·武田信忠捆绑包 120元', coins: '风卫天翎·武田信忠捆绑包', price: 120, intelligence: false },
  { id: '决战平安京·恋念私语 120元', coins: '决战平安京·恋念私语', price: 120, intelligence: false },
  { id: '化龙宝珠*10首单折扣 120元', coins: '化龙宝珠*10首单折扣', price: 120, intelligence: false },
  { id: '化龙宝珠*10 120元', coins: '化龙宝珠*10', price: 120, intelligence: false },
  { id: '朝颜·殷紫萍捆绑包 120元', coins: '朝颜·殷紫萍捆绑包', price: 120, intelligence: false },
  { id: '寒芷·顾清寒捆绑包 120元', coins: '寒芷·顾清寒捆绑包', price: 120, intelligence: false },
  { id: '玲珑·玉玲珑捆绑包 135元', coins: '玲珑·玉玲珑捆绑包', price: 135, intelligence: false },
  { id: '极夜天曦·魏轻捆绑包 144元', coins: '极夜天曦·魏轻捆绑包', price: 144, intelligence: false },
  { id: '天禄瑞光·殷紫萍捆绑包 144元', coins: '天禄瑞光·殷紫萍捆绑包', price: 144, intelligence: false },
  { id: '玄喵夜行·胡为捆绑包 144元', coins: '玄喵夜行·胡为捆绑包', price: 144, intelligence: false },
  { id: '玄喵夜行·沈妙捆绑包 144元', coins: '玄喵夜行·沈妙捆绑包', price: 144, intelligence: false },
  { id: '软暖甜梦·胡桃捆绑包 150元', coins: '软暖甜梦·胡桃捆绑包', price: 150, intelligence: false },
  { id: '群星光彩·顾清寒捆绑包 150元', coins: '群星光彩·顾清寒捆绑包', price: 150, intelligence: false },
  { id: '启明之辉·席拉捆绑包 160元', coins: '启明之辉·席拉捆绑包', price: 160, intelligence: false },
  { id: '悦彩游裳·沈妙捆绑包 170元', coins: '悦彩游裳·沈妙捆绑包', price: 170, intelligence: false },
  { id: '封神录·赤莲 180元', coins: '封神录·赤莲', price: 180, intelligence: false },
  { id: '珥冰 25元', coins: '珥冰', price: 25, intelligence: false },
  { id: '负手傲立 15元', coins: '负手傲立', price: 15, intelligence: false },
  { id: '鸿图大斩 15元', coins: '鸿图大斩', price: 15, intelligence: false },
  { id: '盛夏沙滩 20元', coins: '盛夏沙滩', price: 20, intelligence: false },
  { id: '泠霜 40元', coins: '泠霜', price: 40, intelligence: false },
  { id: '飒爽 40元', coins: '飒爽', price: 40, intelligence: false },
  { id: '卫律冠 60元', coins: '卫律冠', price: 60, intelligence: false },
  { id: '冷香 75元', coins: '冷香', price: 75, intelligence: false },
  { id: '西行劫·阴阳二气瓶 75元', coins: '西行劫·阴阳二气瓶', price: 75, intelligence: false },
  { id: '怦然心动·软暖甜梦 90元', coins: '怦然心动·软暖甜梦', price: 90, intelligence: false },
  { id: '协光·席拉捆绑包 90元', coins: '协光·席拉捆绑包', price: 90, intelligence: false },
  { id: '逆水寒·玄喵 90元', coins: '逆水寒·玄喵', price: 90, intelligence: false },
  { id: '爆裂鼓点·特木尔捆绑包 90元', coins: '爆裂鼓点·特木尔捆绑包', price: 90, intelligence: false },
  { id: '百战·玲珑 90元', coins: '百战·玲珑', price: 90, intelligence: false },
  { id: '夜汐·季莹莹捆绑包 120元', coins: '夜汐·季莹莹捆绑包', price: 120, intelligence: false },
  { id: '彩云衣·蓝梦捆绑包 140元', coins: '彩云衣·蓝梦捆绑包', price: 140, intelligence: false },
  { id: '羽影·季莹莹捆绑包 160元', coins: '羽影·季莹莹捆绑包', price: 160, intelligence: false },
  { id: '绿野守护·竹韵悠 260元', coins: '绿野守护·竹韵悠', price: 260, intelligence: false },
  { id: '拓印筒*108 1080元', coins: '拓印筒*108', price: 1080, intelligence: false },
  { id: '拓印筒 10元', coins: '拓印筒', price: 10, intelligence: false },
  { id: '英雄币*100 30元', coins: '英雄币*100', price: 30, intelligence: false },
  { id: '雪霜姿 230元', coins: '雪霜姿', price: 230, intelligence: false },
  { id: '神乌造像 240元', coins: '神乌造像', price: 240, intelligence: false },
  { id: '惊魂索命妆容礼包 7.5元', coins: '惊魂索命妆容礼包', price: 7.5, intelligence: false },
  { id: '煞势滔天 10元', coins: '煞势滔天', price: 10, intelligence: false },
  { id: '地煞鬼 10元', coins: '地煞鬼', price: 10, intelligence: false },
  { id: '悦漾 15元', coins: '悦漾', price: 15, intelligence: false },
  { id: '悠浮 15元', coins: '悠浮', price: 15, intelligence: false },
  { id: '凝审 15元', coins: '凝审', price: 15, intelligence: false },
  { id: '魅惑 15元', coins: '魅惑', price: 15, intelligence: false },
  { id: '春日序曲·回望 15元', coins: '春日序曲·回望', price: 15, intelligence: false },
  { id: '春日序曲·求索 15元', coins: '春日序曲·求索', price: 15, intelligence: false },
  { id: '草莓酱 15元', coins: '草莓酱', price: 15, intelligence: false },
  { id: '闲摇捆绑包 15元', coins: '闲摇捆绑包', price: 15, intelligence: false },
  { id: '闲摇 15元', coins: '闲摇', price: 15, intelligence: false },
  { id: '通行曲 15元', coins: '通行曲', price: 15, intelligence: false },
  { id: '破风爆破 15元', coins: '破风爆破', price: 15, intelligence: false },
  { id: '晒阳 15元', coins: '晒阳', price: 15, intelligence: false },
  { id: '纸飞机 15元', coins: '纸飞机', price: 15, intelligence: false },
  { id: '逆浪 15元', coins: '逆浪', price: 15, intelligence: false },
  { id: '跃叶间 15元', coins: '跃叶间', price: 15, intelligence: false },
  { id: '惺忪 15元', coins: '惺忪', price: 15, intelligence: false },
  { id: '武道无穷·咏 20元', coins: '武道无穷·咏', price: 20, intelligence: false },
  { id: '武道无穷·烈 20元', coins: '武道无穷·烈', price: 20, intelligence: false },
  { id: '染膏*8 20元', coins: '染膏*8', price: 20, intelligence: false },
  { id: '暗幽阵 20元', coins: '暗幽阵', price: 20, intelligence: false },
  { id: '2674·全息舞伎 25元', coins: '2674·全息舞伎', price: 25, intelligence: false },
  { id: '月翩跹 30元', coins: '月翩跹', price: 30, intelligence: false },
  { id: '桃枝满 30元', coins: '桃枝满', price: 30, intelligence: false },
  { id: '璀璨歌星 30元', coins: '璀璨歌星', price: 30, intelligence: false },
  { id: '五色石*16 40元', coins: '五色石*16', price: 40, intelligence: false },
  { id: '幻梦 40元', coins: '幻梦', price: 40, intelligence: false },
  { id: '星谜 40元', coins: '星谜', price: 40, intelligence: false },
  { id: '辰辉 40元', coins: '辰辉', price: 40, intelligence: false },
  { id: '晓梦 40元', coins: '晓梦', price: 40, intelligence: false },
  { id: '傲寒 40元', coins: '傲寒', price: 40, intelligence: false },
  { id: '莺月 40元', coins: '莺月', price: 40, intelligence: false },
  { id: '春日序曲·冰露 40元', coins: '春日序曲·冰露', price: 40, intelligence: false },
  { id: '春日序曲·蜜芙 40元', coins: '春日序曲·蜜芙', price: 40, intelligence: false },
  { id: '怦然心动·恋歌 40元', coins: '怦然心动·恋歌', price: 40, intelligence: false },
  { id: '春日序曲·柔雅 40元', coins: '春日序曲·柔雅', price: 40, intelligence: false },
  { id: '春日序曲·夜澜 40元', coins: '春日序曲·夜澜', price: 40, intelligence: false },
  { id: '焚羽 40元', coins: '焚羽', price: 40, intelligence: false },
  { id: '逆水寒·夜 40元', coins: '逆水寒·夜', price: 40, intelligence: false },
  { id: '逆水寒·玄 40元', coins: '逆水寒·玄', price: 40, intelligence: false },
  { id: '百战·星焰 40元', coins: '百战·星焰', price: 40, intelligence: false },
  { id: '欢蹦乱跳 45元', coins: '欢蹦乱跳', price: 45, intelligence: false },
  { id: '吓到了吧 45元', coins: '吓到了吧', price: 45, intelligence: false },
  { id: '好振 45元', coins: '好振', price: 45, intelligence: false },
  { id: '娇态 45元', coins: '娇态', price: 45, intelligence: false },
  { id: '应龙号·光翼 45元', coins: '应龙号·光翼', price: 45, intelligence: false },
  { id: '爆炒 45元', coins: '爆炒', price: 45, intelligence: false },
  { id: '幻音 45元', coins: '幻音', price: 45, intelligence: false },
  { id: '绣球戏 45元', coins: '绣球戏', price: 45, intelligence: false },
  { id: '摇摆不挑曲 45元', coins: '摇摆不挑曲', price: 45, intelligence: false },
  { id: '怦然心动·请收下 45元', coins: '怦然心动·请收下', price: 45, intelligence: false },
  { id: '春日序曲·婉拒 45元', coins: '春日序曲·婉拒', price: 45, intelligence: false },
  { id: '春日序曲·小得意 45元', coins: '春日序曲·小得意', price: 45, intelligence: false },
  { id: '激昂 45元', coins: '激昂', price: 45, intelligence: false },
  { id: '梦幻甜心 45元', coins: '梦幻甜心', price: 45, intelligence: false },
  { id: '占领地盘 45元', coins: '占领地盘', price: 45, intelligence: false },
  { id: '逆水寒·玄喵尾 45元', coins: '逆水寒·玄喵尾', price: 45, intelligence: false },
  { id: '撼梁之音 45元', coins: '撼梁之音', price: 45, intelligence: false },
  { id: '你没事吧 45元', coins: '你没事吧', price: 45, intelligence: false },
  { id: '甜夜安眠·绸光轻旋 45元', coins: '甜夜安眠·绸光轻旋', price: 45, intelligence: false },
  { id: '龙之意·洪拳 45元', coins: '龙之意·洪拳', price: 45, intelligence: false },
  { id: '百战·心狐 45元', coins: '百战·心狐', price: 45, intelligence: false },
  { id: '扭扭乐 45元', coins: '扭扭乐', price: 45, intelligence: false },
  { id: '蜜蜂小狗捆绑包 52.5元', coins: '蜜蜂小狗捆绑包', price: 52.5, intelligence: false },
  { id: '2674·寒冰生物 60元', coins: '2674·寒冰生物', price: 60, intelligence: false },
  { id: '2674·昆仑公司 60元', coins: '2674·昆仑公司', price: 60, intelligence: false },
  { id: '武道无穷·无我 60元', coins: '武道无穷·无我', price: 60, intelligence: false },
  { id: '意牵良缘 60元', coins: '意牵良缘', price: 60, intelligence: false },
  { id: '情寄锦书 60元', coins: '情寄锦书', price: 60, intelligence: false },
  { id: '春日序曲·千金眼镜 60元', coins: '春日序曲·千金眼镜', price: 60, intelligence: false },
  { id: '春日序曲·绵糖兔 60元', coins: '春日序曲·绵糖兔', price: 60, intelligence: false },
  { id: '长歌诗韵·驾长车 60元', coins: '长歌诗韵·驾长车', price: 60, intelligence: false },
  { id: '逆水寒·玄喵耳 60元', coins: '逆水寒·玄喵耳', price: 60, intelligence: false },
  { id: '逆水寒·夜行耳 60元', coins: '逆水寒·夜行耳', price: 60, intelligence: false },
  { id: '璃狐逐音 60元', coins: '璃狐逐音', price: 60, intelligence: false },
  { id: '百战·灵子 60元', coins: '百战·灵子', price: 60, intelligence: false },
  { id: '霜翎 65元', coins: '霜翎', price: 65, intelligence: false },
  { id: '良缘·通用捆绑包 65元', coins: '良缘·通用捆绑包', price: 65, intelligence: false },
  { id: '鸢纱·崔三娘捆绑包 68元', coins: '鸢纱·崔三娘捆绑包', price: 68, intelligence: false },
  { id: '染烟·季沧海捆绑包 68元', coins: '染烟·季沧海捆绑包', price: 68, intelligence: false },
  { id: '百战·无限 75元', coins: '百战·无限', price: 75, intelligence: false },
  { id: '盗墓笔记·黑金古刀 75元', coins: '盗墓笔记·黑金古刀', price: 75, intelligence: false },
  { id: '破劫·蜜蜂小狗 75元', coins: '破劫·蜜蜂小狗', price: 75, intelligence: false },
  { id: '百战·紫月 75元', coins: '百战·紫月', price: 75, intelligence: false },
  { id: '疑梦 75元', coins: '疑梦', price: 75, intelligence: false },
  { id: '斩怨 75元', coins: '斩怨', price: 75, intelligence: false },
  { id: '刺冥 75元', coins: '刺冥', price: 75, intelligence: false },
  { id: '光启之矛 75元', coins: '光启之矛', price: 75, intelligence: false },
  { id: '勾魂 75元', coins: '勾魂', price: 75, intelligence: false },
  { id: '幽冥吟 75元', coins: '幽冥吟', price: 75, intelligence: false },
  { id: '偶像手杖 75元', coins: '偶像手杖', price: 75, intelligence: false },
  { id: '暴击甜心 75元', coins: '暴击甜心', price: 75, intelligence: false },
  { id: '拂雪绒 75元', coins: '拂雪绒', price: 75, intelligence: false },
  { id: '百战·惊锋 75元', coins: '百战·惊锋', price: 75, intelligence: false },
  { id: '墨绒羽扇 75元', coins: '墨绒羽扇', price: 75, intelligence: false },
  { id: '音浪震荡·幽蓝回响 75元', coins: '音浪震荡·幽蓝回响', price: 75, intelligence: false },
  { id: '击浪捆绑包 80元', coins: '击浪捆绑包', price: 80, intelligence: false },
  { id: '承云兰寿 90元', coins: '承云兰寿', price: 90, intelligence: false },
  { id: '姑射真人 90元', coins: '姑射真人', price: 90, intelligence: false },
  { id: '怒浪 90元', coins: '怒浪', price: 90, intelligence: false },
  { id: '沙海之鸠·哈迪捆绑包 90元', coins: '沙海之鸠·哈迪捆绑包', price: 90, intelligence: false },
  { id: '武道无穷·咏春 90元', coins: '武道无穷·咏春', price: 90, intelligence: false },
  { id: '铸神·天禄瑞光 90元', coins: '铸神·天禄瑞光', price: 90, intelligence: false },
  { id: '铸神·风卫天翎 90元', coins: '铸神·风卫天翎', price: 90, intelligence: false },
  { id: '铸神·冥天魂使 90元', coins: '铸神·冥天魂使', price: 90, intelligence: false },
  { id: '铸神·天渊御水 90元', coins: '铸神·天渊御水', price: 90, intelligence: false },
  { id: '古冢行 90元', coins: '古冢行', price: 90, intelligence: false },
  { id: '盗墓笔记·越野帽衫 90元', coins: '盗墓笔记·越野帽衫', price: 90, intelligence: false },
  { id: '青灯 90元', coins: '青灯', price: 90, intelligence: false },
  { id: '羽影 90元', coins: '羽影', price: 90, intelligence: false },
  { id: '冥渊 90元', coins: '冥渊', price: 90, intelligence: false },
  { id: '启明之辉 90元', coins: '启明之辉', price: 90, intelligence: false },
  { id: '阎罗 90元', coins: '阎罗', price: 90, intelligence: false },
  { id: '决战平安京·梦枕 90元', coins: '决战平安京·梦枕', price: 90, intelligence: false },
  { id: '怦然心动·悦彩游裳 90元', coins: '怦然心动·悦彩游裳', price: 90, intelligence: false },
  { id: '彩云衣 90元', coins: '彩云衣', price: 90, intelligence: false },
  { id: '逆水寒·夜行 90元', coins: '逆水寒·夜行', price: 90, intelligence: false },
  { id: '音浪震荡·紫色琴键 90元', coins: '音浪震荡·紫色琴键', price: 90, intelligence: false },
  { id: '音浪震荡·爆裂鼓点 90元', coins: '音浪震荡·爆裂鼓点', price: 90, intelligence: false },
  { id: '音浪震荡·永远年轻 90元', coins: '音浪震荡·永远年轻', price: 90, intelligence: false },
  { id: '音浪震荡·群星光彩 90元', coins: '音浪震荡·群星光彩', price: 90, intelligence: false },
  { id: '梨园青峰·顾清寒捆绑包 92.5元', coins: '梨园青峰·顾清寒捆绑包', price: 92.5, intelligence: false },
  { id: '梨园白素·宁红夜捆绑包 92.5元', coins: '梨园白素·宁红夜捆绑包', price: 92.5, intelligence: false },
  { id: '蜘蛛精·宁红夜捆绑包 100元', coins: '蜘蛛精·宁红夜捆绑包', price: 100, intelligence: false },
  { id: '绿野守护·竹萌 100元', coins: '绿野守护·竹萌', price: 100, intelligence: false },
  { id: '旋舞 100元', coins: '旋舞', price: 100, intelligence: false },
  { id: '白无常·季莹莹捆绑包 105元', coins: '白无常·季莹莹捆绑包', price: 105, intelligence: false },
  { id: '镇冥司 105元', coins: '镇冥司', price: 105, intelligence: false },
  { id: '晨风·土御门胡桃捆绑包 112.5元', coins: '晨风·土御门胡桃捆绑包', price: 112.5, intelligence: false },
  { id: '咏春·沈妙捆绑包 120元', coins: '咏春·沈妙捆绑包', price: 120, intelligence: false },
  { id: '赤羽·玉玲珑捆绑包 120元', coins: '赤羽·玉玲珑捆绑包', price: 120, intelligence: false },
  { id: '千秋匠心·青枝瓷 120元', coins: '千秋匠心·青枝瓷', price: 120, intelligence: false },
  { id: '热力节拍·魏轻捆绑包 120元', coins: '热力节拍·魏轻捆绑包', price: 120, intelligence: false },
  { id: '音浪震荡·纯真朋克 120元', coins: '音浪震荡·纯真朋克', price: 120, intelligence: false },
  { id: '执金·魏轻捆绑包 125元', coins: '执金·魏轻捆绑包', price: 125, intelligence: false },
  { id: '悟净·天海捆绑包 130元', coins: '悟净·天海捆绑包', price: 130, intelligence: false },
  { id: '决魅捆绑包 130元', coins: '决魅捆绑包', price: 130, intelligence: false },
  { id: '断链·季莹莹捆绑包 130元', coins: '断链·季莹莹捆绑包', price: 130, intelligence: false },
  { id: '阎罗·刘炼捆绑包 130元', coins: '阎罗·刘炼捆绑包', price: 130, intelligence: false },
  { id: '流火映真·妖刀姬捆绑包 144元', coins: '流火映真·妖刀姬捆绑包', price: 144, intelligence: false },
  { id: '八极·季莹莹捆绑包 144元', coins: '八极·季莹莹捆绑包', price: 144, intelligence: false },
  { id: '正法·魏轻捆绑包 144元', coins: '正法·魏轻捆绑包', price: 144, intelligence: false },
  { id: '纯真朋克·妖刀姬捆绑包 144元', coins: '纯真朋克·妖刀姬捆绑包', price: 144, intelligence: false },
  { id: '永远年轻·蓝梦捆绑包 145元', coins: '永远年轻·蓝梦捆绑包', price: 145, intelligence: false },
  { id: '恋念私语·妖刀姬捆绑包 150元', coins: '恋念私语·妖刀姬捆绑包', price: 150, intelligence: false },
  { id: '音律织光·季莹莹捆绑包 155元', coins: '音律织光·季莹莹捆绑包', price: 155, intelligence: false },
  { id: '青灯·土御门胡桃捆绑包 160元', coins: '青灯·土御门胡桃捆绑包', price: 160, intelligence: false },
  { id: '冥渊·哈迪捆绑包 160元', coins: '冥渊·哈迪捆绑包', price: 160, intelligence: false },
  { id: '墨影·玉玲珑捆绑包 160元', coins: '墨影·玉玲珑捆绑包', price: 160, intelligence: false },
  { id: '夜蔷薇 180元', coins: '夜蔷薇', price: 180, intelligence: false },
  { id: '2674·初代机·甜酷黑捆绑包 190元', coins: '2674·初代机·甜酷黑捆绑包', price: 190, intelligence: false },
  { id: '幽翎·哈迪捆绑包 190元', coins: '幽翎·哈迪捆绑包', price: 190, intelligence: false },
  { id: '飞鼠 210元', coins: '飞鼠', price: 210, intelligence: false },
  { id: '劫妹飞船 210元', coins: '劫妹飞船', price: 210, intelligence: false },
  { id: '炎烈珠 230元', coins: '炎烈珠', price: 230, intelligence: false },
  { id: '彩俑娃娃 240元', coins: '彩俑娃娃', price: 240, intelligence: false },
  { id: '百战·枷锁 240元', coins: '百战·枷锁', price: 240, intelligence: false },
  { id: '噬骨 240元', coins: '噬骨', price: 240, intelligence: false },
  { id: '燃空·妖刀姬捆绑包 242.5元', coins: '燃空·妖刀姬捆绑包', price: 242.5, intelligence: false },
  { id: '楚韵九歌·四海 260元', coins: '楚韵九歌·四海', price: 260, intelligence: false },
  { id: '2674·初代机 260元', coins: '2674·初代机', price: 260, intelligence: false },
  { id: '西行劫·神君印 290元', coins: '西行劫·神君印', price: 290, intelligence: false },
  { id: '绒狮 30元', coins: '绒狮', price: 30, intelligence: false },
  { id: '撼龙 75元', coins: '撼龙', price: 75, intelligence: false },
  { id: '皎若龙 15元', coins: '皎若龙', price: 15, intelligence: false },
  { id: '春日序曲·清雅 60元', coins: '春日序曲·清雅', price: 60, intelligence: false },
  { id: '姿翩然 15元', coins: '姿翩然', price: 15, intelligence: false },
  { id: '意气扬 15元', coins: '意气扬', price: 15, intelligence: false },
  { id: '团雀帽 60元', coins: '团雀帽', price: 60, intelligence: false },
  { id: '灰玉*10 10元', coins: '灰玉*10', price: 10, intelligence: false },
  { id: '整肃 10元', coins: '整肃', price: 10, intelligence: false },
  { id: '顽猫猫 10元', coins: '顽猫猫', price: 10, intelligence: false },
  { id: '星运 10元', coins: '星运', price: 10, intelligence: false },
  { id: '音浪震荡·粉梦 10元', coins: '音浪震荡·粉梦', price: 10, intelligence: false },
  { id: '音浪震荡·蓝调 10元', coins: '音浪震荡·蓝调', price: 10, intelligence: false },
  { id: '不收徒 10元', coins: '不收徒', price: 10, intelligence: false },
  { id: '音浪震荡·符潮 10元', coins: '音浪震荡·符潮', price: 10, intelligence: false },
  { id: '尬武 15元', coins: '尬武', price: 15, intelligence: false },
  { id: '凭栏 15元', coins: '凭栏', price: 15, intelligence: false },
  { id: '云影纵 15元', coins: '云影纵', price: 15, intelligence: false },
  { id: '倚剑 15元', coins: '倚剑', price: 15, intelligence: false },
  { id: '琴剑 15元', coins: '琴剑', price: 15, intelligence: false },
  { id: '砺刃 15元', coins: '砺刃', price: 15, intelligence: false },
  { id: '娉娉袅袅 15元', coins: '娉娉袅袅', price: 15, intelligence: false },
  { id: '冷眸 15元', coins: '冷眸', price: 15, intelligence: false },
  { id: '入魔 15元', coins: '入魔', price: 15, intelligence: false },
  { id: '音浪震荡·琴韵 15元', coins: '音浪震荡·琴韵', price: 15, intelligence: false },
  { id: '音浪震荡·弦舞 15元', coins: '音浪震荡·弦舞', price: 15, intelligence: false },
  { id: '音浪震荡·嗨唱 15元', coins: '音浪震荡·嗨唱', price: 15, intelligence: false },
  { id: '激荡节拍 15元', coins: '激荡节拍', price: 15, intelligence: false },
  { id: '星星咩 15元', coins: '星星咩', price: 15, intelligence: false },
  { id: '打歌台 20元', coins: '打歌台', price: 20, intelligence: false },
  { id: '挥汗台 20元', coins: '挥汗台', price: 20, intelligence: false },
  { id: '月息 20元', coins: '月息', price: 20, intelligence: false },
  { id: '皮猫猫 20元', coins: '皮猫猫', price: 20, intelligence: false },
  { id: '镇蛇祟 20元', coins: '镇蛇祟', price: 20, intelligence: false },
  { id: '春日序曲·早樱 25元', coins: '春日序曲·早樱', price: 25, intelligence: false },
  { id: '销兵镝遗 25元', coins: '销兵镝遗', price: 25, intelligence: false },
  { id: '有点意思捆绑包 30元', coins: '有点意思捆绑包', price: 30, intelligence: false },
  { id: '绿野守护·萌熊 30元', coins: '绿野守护·萌熊', price: 30, intelligence: false },
  { id: '绿野守护·晴岚 30元', coins: '绿野守护·晴岚', price: 30, intelligence: false },
  { id: '琉璃窗 30元', coins: '琉璃窗', price: 30, intelligence: false },
  { id: '冥主 30元', coins: '冥主', price: 30, intelligence: false },
  { id: '金灵展羽 30元', coins: '金灵展羽', price: 30, intelligence: false },
  { id: '佳月圆 30元', coins: '佳月圆', price: 30, intelligence: false },
  { id: '娴雅 30元', coins: '娴雅', price: 30, intelligence: false },
  { id: '长歌诗韵·踏破 30元', coins: '长歌诗韵·踏破', price: 30, intelligence: false },
  { id: '阴神 30元', coins: '阴神', price: 30, intelligence: false },
  { id: '龙之景·空谷问竹 30元', coins: '龙之景·空谷问竹', price: 30, intelligence: false },
  { id: '夺冠 40元', coins: '夺冠', price: 40, intelligence: false },
  { id: '护世四法·净天 40元', coins: '护世四法·净天', price: 40, intelligence: false },
  { id: '护世四法·妙音 40元', coins: '护世四法·妙音', price: 40, intelligence: false },
  { id: '赤泉 40元', coins: '赤泉', price: 40, intelligence: false },
  { id: '白鸦 40元', coins: '白鸦', price: 40, intelligence: false },
  { id: '金谷风 40元', coins: '金谷风', price: 40, intelligence: false },
  { id: '辉耀 40元', coins: '辉耀', price: 40, intelligence: false },
  { id: '凤仪 40元', coins: '凤仪', price: 40, intelligence: false },
  { id: '霸者 40元', coins: '霸者', price: 40, intelligence: false },
  { id: '景云 40元', coins: '景云', price: 40, intelligence: false },
  { id: '月魄 40元', coins: '月魄', price: 40, intelligence: false },
  { id: '沉夜 40元', coins: '沉夜', price: 40, intelligence: false },
  { id: '云鬓 40元', coins: '云鬓', price: 40, intelligence: false },
  { id: '肃飒 40元', coins: '肃飒', price: 40, intelligence: false },
  { id: '琴心 40元', coins: '琴心', price: 40, intelligence: false },
  { id: '糖雪 40元', coins: '糖雪', price: 40, intelligence: false },
  { id: '剑霄 40元', coins: '剑霄', price: 40, intelligence: false },
  { id: '怦然心动·灵丽 40元', coins: '怦然心动·灵丽', price: 40, intelligence: false },
  { id: '燎原火 40元', coins: '燎原火', price: 40, intelligence: false },
  { id: '溢彩 40元', coins: '溢彩', price: 40, intelligence: false },
  { id: '音浪震荡·顽骨 40元', coins: '音浪震荡·顽骨', price: 40, intelligence: false },
  { id: '龙之术·随性 40元', coins: '龙之术·随性', price: 40, intelligence: false },
  { id: '甜夜安眠·夜歌 40元', coins: '甜夜安眠·夜歌', price: 40, intelligence: false },
  { id: '金砂 40元', coins: '金砂', price: 40, intelligence: false },
  { id: '倒反阴阳·焚枷 40元', coins: '倒反阴阳·焚枷', price: 40, intelligence: false },
  { id: '惊世 40元', coins: '惊世', price: 40, intelligence: false },
  { id: '西行者 40元', coins: '西行者', price: 40, intelligence: false },
  { id: '碎金笑 40元', coins: '碎金笑', price: 40, intelligence: false },
  { id: '铸神·灵瑞尾 45元', coins: '铸神·灵瑞尾', price: 45, intelligence: false },
  { id: '铸神·灵瑞羽 45元', coins: '铸神·灵瑞羽', price: 45, intelligence: false },
  { id: '斩魔 45元', coins: '斩魔', price: 45, intelligence: false },
  { id: '藤鬼舞 45元', coins: '藤鬼舞', price: 45, intelligence: false },
  { id: '悬丝偶 45元', coins: '悬丝偶', price: 45, intelligence: false },
  { id: '衔穗璟 45元', coins: '衔穗璟', price: 45, intelligence: false },
  { id: '璇霄 45元', coins: '璇霄', price: 45, intelligence: false },
  { id: '启寐 45元', coins: '启寐', price: 45, intelligence: false },
  { id: '轻舞 45元', coins: '轻舞', price: 45, intelligence: false },
  { id: '狂想舞 45元', coins: '狂想舞', price: 45, intelligence: false },
  { id: '寒芒现 45元', coins: '寒芒现', price: 45, intelligence: false },
  { id: '假意投降 45元', coins: '假意投降', price: 45, intelligence: false },
  { id: '怦然心动·喵尾 45元', coins: '怦然心动·喵尾', price: 45, intelligence: false },
  { id: '曼妙舞 45元', coins: '曼妙舞', price: 45, intelligence: false },
  { id: '开辟鸿蒙·月照江 45元', coins: '开辟鸿蒙·月照江', price: 45, intelligence: false },
  { id: '逆水寒·夜行尾 45元', coins: '逆水寒·夜行尾', price: 45, intelligence: false },
  { id: '摇香 45元', coins: '摇香', price: 45, intelligence: false },
  { id: '音浪震荡·炽弦终章 45元', coins: '音浪震荡·炽弦终章', price: 45, intelligence: false },
  { id: '龙之意·醉拳 45元', coins: '龙之意·醉拳', price: 45, intelligence: false },
  { id: '极速啾援 45元', coins: '极速啾援', price: 45, intelligence: false },
  { id: '沈妙·悦彩游裳语音包 50元', coins: '沈妙·悦彩游裳语音包', price: 50, intelligence: false },
  { id: '胡桃·软暖甜梦语音包 50元', coins: '胡桃·软暖甜梦语音包', price: 50, intelligence: false },
  { id: '2674·游隼 60元', coins: '2674·游隼', price: 60, intelligence: false },
  { id: '逆水寒·无烬白 60元', coins: '逆水寒·无烬白', price: 60, intelligence: false },
  { id: '千秋匠心·凶虎 60元', coins: '千秋匠心·凶虎', price: 60, intelligence: false },
  { id: '铸神·庚辰角 60元', coins: '铸神·庚辰角', price: 60, intelligence: false },
  { id: '铸神·冥狼冠 60元', coins: '铸神·冥狼冠', price: 60, intelligence: false },
  { id: '绿野守护·滚滚 60元', coins: '绿野守护·滚滚', price: 60, intelligence: false },
  { id: '苍角 60元', coins: '苍角', price: 60, intelligence: false },
  { id: '荆冕 60元', coins: '荆冕', price: 60, intelligence: false },
  { id: '烈犬座 60元', coins: '烈犬座', price: 60, intelligence: false },
  { id: '晨曦桂冠 60元', coins: '晨曦桂冠', price: 60, intelligence: false },
  { id: '夜珀 60元', coins: '夜珀', price: 60, intelligence: false },
  { id: '神宫羽 60元', coins: '神宫羽', price: 60, intelligence: false },
  { id: '凤焰台 60元', coins: '凤焰台', price: 60, intelligence: false },
  { id: '冬暖座 60元', coins: '冬暖座', price: 60, intelligence: false },
  { id: '梦之彩 60元', coins: '梦之彩', price: 60, intelligence: false },
  { id: '鱼龙戏春 60元', coins: '鱼龙戏春', price: 60, intelligence: false },
  { id: '栖芳庭 60元', coins: '栖芳庭', price: 60, intelligence: false },
  { id: '逆水寒·夜行镜 60元', coins: '逆水寒·夜行镜', price: 60, intelligence: false },
  { id: '逆水寒·玄喵镜 60元', coins: '逆水寒·玄喵镜', price: 60, intelligence: false },
  { id: '音浪震荡·绝版耳返 60元', coins: '音浪震荡·绝版耳返', price: 60, intelligence: false },
  { id: '龙之景·墨染九霄 60元', coins: '龙之景·墨染九霄', price: 60, intelligence: false },
  { id: '铸神·冥神权杖 75元', coins: '铸神·冥神权杖', price: 75, intelligence: false },
  { id: '破劫·炫日 75元', coins: '破劫·炫日', price: 75, intelligence: false },
  { id: '【挑染】音浪震荡·梦笛 75元', coins: '【挑染】音浪震荡·梦笛', price: 75, intelligence: false },
  { id: '【挑染】音浪震荡·黯星 75元', coins: '【挑染】音浪震荡·黯星', price: 75, intelligence: false },
  { id: '【挑染】甜夜安眠·夕霞 75元', coins: '【挑染】甜夜安眠·夕霞', price: 75, intelligence: false },
  { id: '霜天红叶 90元', coins: '霜天红叶', price: 90, intelligence: false },
  { id: '沙海之鸠 90元', coins: '沙海之鸠', price: 90, intelligence: false },
  { id: '百战·执金 90元', coins: '百战·执金', price: 90, intelligence: false },
  { id: '墨行衣 90元', coins: '墨行衣', price: 90, intelligence: false },
  { id: '怦然心动·热力节拍 90元', coins: '怦然心动·热力节拍', price: 90, intelligence: false },
  { id: '怦然心动·音律织光 90元', coins: '怦然心动·音律织光', price: 90, intelligence: false },
  { id: '百战·破荆者 100元', coins: '百战·破荆者', price: 100, intelligence: false },
  { id: '禁咒 100元', coins: '禁咒', price: 100, intelligence: false },
  { id: '甜夜安眠·月安 100元', coins: '甜夜安眠·月安', price: 100, intelligence: false },
  { id: '兔耳+兔尾 105元', coins: '兔耳+兔尾', price: 105, intelligence: false },
  { id: '灵狐耳+阴阳灵狐 105元', coins: '灵狐耳+阴阳灵狐', price: 105, intelligence: false },
  { id: '豹耳+豹尾 105元', coins: '豹耳+豹尾', price: 105, intelligence: false },
  { id: '流火映真 120元', coins: '流火映真', price: 120, intelligence: false },
  { id: '护世四法·威能 40元', coins: '护世四法·威能', price: 40, intelligence: false },
  { id: '武道无穷·八极拳 45元', coins: '武道无穷·八极拳', price: 45, intelligence: false },
  { id: '护世四法·琵琶 45元', coins: '护世四法·琵琶', price: 45, intelligence: false },
  { id: '百战·天线 60元', coins: '百战·天线', price: 60, intelligence: false },
  { id: '西行劫·蛛魅 10元', coins: '西行劫·蛛魅', price: 10, intelligence: false },
  { id: '梨园传奇·山醉梦 10元', coins: '梨园传奇·山醉梦', price: 10, intelligence: false },
  { id: '梨园传奇·伤春埋 10元', coins: '梨园传奇·伤春埋', price: 10, intelligence: false },
  { id: '天罗 10元', coins: '天罗', price: 10, intelligence: false },
  { id: '炎霄 10元', coins: '炎霄', price: 10, intelligence: false },
  { id: '龙渊 10元', coins: '龙渊', price: 10, intelligence: false },
  { id: '欢悦 10元', coins: '欢悦', price: 10, intelligence: false },
  { id: '枕云 15元', coins: '枕云', price: 15, intelligence: false },
  { id: '梨园传奇·呖呖莺 20元', coins: '梨园传奇·呖呖莺', price: 20, intelligence: false },
  { id: '梨园传奇·生生燕 20元', coins: '梨园传奇·生生燕', price: 20, intelligence: false },
  { id: '梨园传奇·月云高 20元', coins: '梨园传奇·月云高', price: 20, intelligence: false },
  { id: '马尾 20元', coins: '马尾', price: 20, intelligence: false },
  { id: '西行劫·流沙 25元', coins: '西行劫·流沙', price: 25, intelligence: false },
  { id: '静伺 25元', coins: '静伺', price: 25, intelligence: false },
  { id: '青铜门 30元', coins: '青铜门', price: 30, intelligence: false },
  { id: '观山海·钦天 30元', coins: '观山海·钦天', price: 30, intelligence: false },
  { id: '云麒 30元', coins: '云麒', price: 30, intelligence: false },
  { id: '封神录·沉檀 30元', coins: '封神录·沉檀', price: 30, intelligence: false },
  { id: '封神录·惊海 30元', coins: '封神录·惊海', price: 30, intelligence: false },
  { id: '狩月 30元', coins: '狩月', price: 30, intelligence: false },
  { id: '轻青 30元', coins: '轻青', price: 30, intelligence: false },
  { id: '鹿跃林间 30元', coins: '鹿跃林间', price: 30, intelligence: false },
  { id: '铸神·乾元 40元', coins: '铸神·乾元', price: 40, intelligence: false },
  { id: '铸神·骋望 40元', coins: '铸神·骋望', price: 40, intelligence: false },
  { id: '铸神·燕起 40元', coins: '铸神·燕起', price: 40, intelligence: false },
  { id: '铸神·解邪 40元', coins: '铸神·解邪', price: 40, intelligence: false },
  { id: '蛋仔派对·蛋小蓝 40元', coins: '蛋仔派对·蛋小蓝', price: 40, intelligence: false },
  { id: '观山海·治狱 40元', coins: '观山海·治狱', price: 40, intelligence: false },
  { id: '蛋仔派对·像素眼镜 40元', coins: '蛋仔派对·像素眼镜', price: 40, intelligence: false },
  { id: '蛋仔派对·蛋小粉 40元', coins: '蛋仔派对·蛋小粉', price: 40, intelligence: false },
  { id: '蛋仔派对·蛋小绿 40元', coins: '蛋仔派对·蛋小绿', price: 40, intelligence: false },
  { id: '蛋仔派对·蛋小黄 40元', coins: '蛋仔派对·蛋小黄', price: 40, intelligence: false },
  { id: '静流 40元', coins: '静流', price: 40, intelligence: false },
  { id: '观山海·哀汛天 40元', coins: '观山海·哀汛天', price: 40, intelligence: false },
  { id: '蛋仔派对·像素眼镜·男 40元', coins: '蛋仔派对·像素眼镜·男', price: 40, intelligence: false },
  { id: '百战·傲采 40元', coins: '百战·傲采', price: 40, intelligence: false },
  { id: '青萤 40元', coins: '青萤', price: 40, intelligence: false },
  { id: '聆神音 40元', coins: '聆神音', price: 40, intelligence: false },
  { id: '人间戏 40元', coins: '人间戏', price: 40, intelligence: false },
  { id: '西行劫·铃音 45元', coins: '西行劫·铃音', price: 45, intelligence: false },
  { id: '西行劫·蛛缘 45元', coins: '西行劫·蛛缘', price: 45, intelligence: false },
  { id: '梨园传奇·婉指 45元', coins: '梨园传奇·婉指', price: 45, intelligence: false },
  { id: '梨园传奇·转扇 45元', coins: '梨园传奇·转扇', price: 45, intelligence: false },
  { id: '利刃出鞘 45元', coins: '利刃出鞘', price: 45, intelligence: false },
  { id: '蛋仔派对·甩手舞 45元', coins: '蛋仔派对·甩手舞', price: 45, intelligence: false },
  { id: '封神录·待潮 45元', coins: '封神录·待潮', price: 45, intelligence: false },
  { id: '昼辉 45元', coins: '昼辉', price: 45, intelligence: false },
  { id: '爱的鼓励 45元', coins: '爱的鼓励', price: 45, intelligence: false },
  { id: '疯狂一下 45元', coins: '疯狂一下', price: 45, intelligence: false },
  { id: '妖刀姬·恋念私语语音包 50元', coins: '妖刀姬·恋念私语语音包', price: 50, intelligence: false },
  { id: '魏轻·热力节拍语音包 50元', coins: '魏轻·热力节拍语音包', price: 50, intelligence: false },
  { id: '季莹莹·音律织光语音包 50元', coins: '季莹莹·音律织光语音包', price: 50, intelligence: false },
  { id: '西行劫·骨惑 60元', coins: '西行劫·骨惑', price: 60, intelligence: false },
  { id: '西行劫·悟能帽 60元', coins: '西行劫·悟能帽', price: 60, intelligence: false },
  { id: '西行劫·柔姿 60元', coins: '西行劫·柔姿', price: 60, intelligence: false },
  { id: '楚韵九歌·芳馨 60元', coins: '楚韵九歌·芳馨', price: 60, intelligence: false },
  { id: '观山海·毒穴 60元', coins: '观山海·毒穴', price: 60, intelligence: false },
  { id: '麒麟火 60元', coins: '麒麟火', price: 60, intelligence: false },
  { id: '观山海·顶触台 60元', coins: '观山海·顶触台', price: 60, intelligence: false },
  { id: '百战·御冕 60元', coins: '百战·御冕', price: 60, intelligence: false },
  { id: '封神录·怒莲 60元', coins: '封神录·怒莲', price: 60, intelligence: false },
  { id: '封神录·雪鳞龙 60元', coins: '封神录·雪鳞龙', price: 60, intelligence: false },
  { id: '灯莲台 60元', coins: '灯莲台', price: 60, intelligence: false },
  { id: '墨影冠 60元', coins: '墨影冠', price: 60, intelligence: false },
  { id: '玄绶罗衣 90元', coins: '玄绶罗衣', price: 90, intelligence: false },
  { id: '逆水寒·染烟 90元', coins: '逆水寒·染烟', price: 90, intelligence: false },
  { id: '恋晶 100元', coins: '恋晶', price: 100, intelligence: false },
  { id: '剪纸·彩刀 120元', coins: '剪纸·彩刀', price: 120, intelligence: false },
  { id: '信手斩龙 120元', coins: '信手斩龙', price: 120, intelligence: false },
  { id: '逆水寒·极夜天曦 120元', coins: '逆水寒·极夜天曦', price: 120, intelligence: false },
  { id: '决战平安京·御神之刃 120元', coins: '决战平安京·御神之刃', price: 120, intelligence: false },
  { id: '长歌诗韵·五方狮 180元', coins: '长歌诗韵·五方狮', price: 180, intelligence: false },
  { id: '观山海·夜游 40元', coins: '观山海·夜游', price: 40, intelligence: false },
  { id: '不蛊 40元', coins: '不蛊', price: 40, intelligence: false },
  { id: '百战·漆刃 40元', coins: '百战·漆刃', price: 40, intelligence: false },
  { id: '长歌诗韵·星桥 40元', coins: '长歌诗韵·星桥', price: 40, intelligence: false },
  { id: '麒麟 40元', coins: '麒麟', price: 40, intelligence: false },
  { id: '春日序曲·雪糕 45元', coins: '春日序曲·雪糕', price: 45, intelligence: false },
  { id: '端午龙 60元', coins: '端午龙', price: 60, intelligence: false },
  { id: '长歌诗韵·蓬舞 40元', coins: '长歌诗韵·蓬舞', price: 40, intelligence: false },
  { id: '逆水寒·染 40元', coins: '逆水寒·染', price: 40, intelligence: false },
  { id: '逆水寒·鸢 40元', coins: '逆水寒·鸢', price: 40, intelligence: false },
  { id: '露华 40元', coins: '露华', price: 40, intelligence: false },
  { id: '红绡 40元', coins: '红绡', price: 40, intelligence: false },
  { id: '街头狂欢·撞色艺术 40元', coins: '街头狂欢·撞色艺术', price: 40, intelligence: false },
  { id: '啸风 40元', coins: '啸风', price: 40, intelligence: false },
  { id: '千秋匠心·疏狂 40元', coins: '千秋匠心·疏狂', price: 40, intelligence: false },
  { id: '无瑕 40元', coins: '无瑕', price: 40, intelligence: false },
  { id: '楚韵九歌·潺湲 40元', coins: '楚韵九歌·潺湲', price: 40, intelligence: false },
  { id: '楚韵九歌·烂漫 40元', coins: '楚韵九歌·烂漫', price: 40, intelligence: false },
  { id: '铸神·玄鳞 40元', coins: '铸神·玄鳞', price: 40, intelligence: false },
  { id: '铸神·自慢 40元', coins: '铸神·自慢', price: 40, intelligence: false },
  { id: '铸神·降香 40元', coins: '铸神·降香', price: 40, intelligence: false },
  { id: '悦动·左 60元', coins: '悦动·左', price: 60, intelligence: false },
  { id: '悦动·右 60元', coins: '悦动·右', price: 60, intelligence: false },
  { id: '逆水寒·极夜 60元', coins: '逆水寒·极夜', price: 60, intelligence: false },
  { id: '浮沫消 15元', coins: '浮沫消', price: 15, intelligence: false },
  { id: '观山海·忘忧 40元', coins: '观山海·忘忧', price: 40, intelligence: false },
  { id: '魅影特攻 15元', coins: '魅影特攻', price: 15, intelligence: false },
  { id: '风雷啸涌 30元', coins: '风雷啸涌', price: 30, intelligence: false },
  { id: '天地惊霆 40元', coins: '天地惊霆', price: 40, intelligence: false },
  { id: '晦明翎 120元', coins: '晦明翎', price: 120, intelligence: false },
  { id: '机芯旋舞 45元', coins: '机芯旋舞', price: 45, intelligence: false },
  { id: '恬淡悠然 10元', coins: '恬淡悠然', price: 10, intelligence: false },
  { id: '绻倚 15元', coins: '绻倚', price: 15, intelligence: false },
  { id: '思梦 20元', coins: '思梦', price: 20, intelligence: false },
  { id: '镜中迷梦 30元', coins: '镜中迷梦', price: 30, intelligence: false },
  { id: '雷爪惊霆 60元', coins: '雷爪惊霆', price: 60, intelligence: false },
  { id: '鹅绒软帐 60元', coins: '鹅绒软帐', price: 60, intelligence: false },
  { id: '佩服 1元', coins: '佩服', price: 1, intelligence: false },
  { id: '激乐电动盲盒 1元', coins: '激乐电动盲盒', price: 1, intelligence: false },
  { id: '染料福罐 1元', coins: '染料福罐', price: 1, intelligence: false },
  { id: '崇拜 5元', coins: '崇拜', price: 5, intelligence: false },
  { id: '秋季赛加速礼包 5元', coins: '秋季赛加速礼包', price: 5, intelligence: false },
  { id: '潜水盲盒 6元', coins: '潜水盲盒', price: 6, intelligence: false },
  { id: '秉烛夜话妆容礼包 7.5元', coins: '秉烛夜话妆容礼包', price: 7.5, intelligence: false },
  { id: '洋场旧梦 10元', coins: '洋场旧梦', price: 10, intelligence: false },
  { id: '幽冥院 10元', coins: '幽冥院', price: 10, intelligence: false },
  { id: '蔚蓝海域 10元', coins: '蔚蓝海域', price: 10, intelligence: false },
  { id: '倒反阴阳·狐现 10元', coins: '倒反阴阳·狐现', price: 10, intelligence: false },
  { id: '祖火深庭 10元', coins: '祖火深庭', price: 10, intelligence: false },
  { id: '倒反阴阳·鹤归 10元', coins: '倒反阴阳·鹤归', price: 10, intelligence: false },
  { id: '6 10元', coins: '6', price: 10, intelligence: false },
  { id: '秦时明月·神女 10元', coins: '秦时明月·神女', price: 10, intelligence: false },
  { id: '秦时明月·红颜 10元', coins: '秦时明月·红颜', price: 10, intelligence: false },
  { id: '天行九歌·如焰 10元', coins: '天行九歌·如焰', price: 10, intelligence: false },
  { id: '神骏宝炉*1 12元', coins: '神骏宝炉*1', price: 12, intelligence: false },
  { id: '枕边偶秘匣 12元', coins: '枕边偶秘匣', price: 12, intelligence: false },
  { id: '花露 12.5元', coins: '花露', price: 12.5, intelligence: false },
  { id: '破劫·冠世 15元', coins: '破劫·冠世', price: 15, intelligence: false },
  { id: '例不虚发 15元', coins: '例不虚发', price: 15, intelligence: false },
  { id: '拂柳 15元', coins: '拂柳', price: 15, intelligence: false },
  { id: '断风 15元', coins: '断风', price: 15, intelligence: false },
  { id: '绾云镜 15元', coins: '绾云镜', price: 15, intelligence: false },
  { id: '墨染千秋·扇舞 15元', coins: '墨染千秋·扇舞', price: 15, intelligence: false },
  { id: '刘炼·转金 15元', coins: '刘炼·转金', price: 15, intelligence: false },
  { id: '大侠饶命 15元', coins: '大侠饶命', price: 15, intelligence: false },
  { id: '叽哔你 15元', coins: '叽哔你', price: 15, intelligence: false },
  { id: '扶镜听风 15元', coins: '扶镜听风', price: 15, intelligence: false },
  { id: '致命 15元', coins: '致命', price: 15, intelligence: false },
  { id: '破局 15元', coins: '破局', price: 15, intelligence: false },
  { id: '暴打大朋友 15元', coins: '暴打大朋友', price: 15, intelligence: false },
  { id: '告白 15元', coins: '告白', price: 15, intelligence: false },
  { id: '嫣然 15元', coins: '嫣然', price: 15, intelligence: false },
  { id: '决胜时刻 15元', coins: '决胜时刻', price: 15, intelligence: false },
  { id: '秦时明月·红莲倚 15元', coins: '秦时明月·红莲倚', price: 15, intelligence: false },
  { id: '秦时明月·飞花 15元', coins: '秦时明月·飞花', price: 15, intelligence: false },
  { id: '秦时明月·纵横 15元', coins: '秦时明月·纵横', price: 15, intelligence: false },
  { id: '天行九歌·灵动 15元', coins: '天行九歌·灵动', price: 15, intelligence: false },
  { id: '破劫·煌霆 15元', coins: '破劫·煌霆', price: 15, intelligence: false },
  { id: '财神到 18元', coins: '财神到', price: 18, intelligence: false },
  { id: '冰爽盲盒 18元', coins: '冰爽盲盒', price: 18, intelligence: false },
  { id: '千机神杯*1 18元', coins: '千机神杯*1', price: 18, intelligence: false },
  { id: '浮华余音 20元', coins: '浮华余音', price: 20, intelligence: false },
  { id: '倒反阴阳·碧玉灵 20元', coins: '倒反阴阳·碧玉灵', price: 20, intelligence: false },
  { id: '引灯台 20元', coins: '引灯台', price: 20, intelligence: false },
  { id: '倒反阴阳·修心池 20元', coins: '倒反阴阳·修心池', price: 20, intelligence: false },
  { id: '定海锚 20元', coins: '定海锚', price: 20, intelligence: false },
  { id: '炎州之焰 20元', coins: '炎州之焰', price: 20, intelligence: false },
  { id: '随心萌动捆绑包 26元', coins: '随心萌动捆绑包', price: 26, intelligence: false },
  { id: '晃头晃脑 30元', coins: '晃头晃脑', price: 30, intelligence: false },
  { id: '破劫·暗潮 30元', coins: '破劫·暗潮', price: 30, intelligence: false },
  { id: '时光悠悠 30元', coins: '时光悠悠', price: 30, intelligence: false },
  { id: '玄武怒涛 30元', coins: '玄武怒涛', price: 30, intelligence: false },
  { id: '承武·辉煌 30元', coins: '承武·辉煌', price: 30, intelligence: false },
  { id: '共赴无间·玉杵影 30元', coins: '共赴无间·玉杵影', price: 30, intelligence: false },
  { id: '未形之形 30元', coins: '未形之形', price: 30, intelligence: false },
  { id: '花楹 30元', coins: '花楹', price: 30, intelligence: false },
  { id: '幻光听澜 30元', coins: '幻光听澜', price: 30, intelligence: false },
  { id: '列宿分芒·眠月 30元', coins: '列宿分芒·眠月', price: 30, intelligence: false },
  { id: '绚妙幻彩 30元', coins: '绚妙幻彩', price: 30, intelligence: false },
  { id: '共赴无间·含情 30元', coins: '共赴无间·含情', price: 30, intelligence: false },
  { id: '共赴无间·欲语 30元', coins: '共赴无间·欲语', price: 30, intelligence: false },
  { id: '聚魄骨 30元', coins: '聚魄骨', price: 30, intelligence: false },
  { id: '瀛洲云庭 30元', coins: '瀛洲云庭', price: 30, intelligence: false },
  { id: '千机行 30元', coins: '千机行', price: 30, intelligence: false },
  { id: '全职高手·一穿三 30元', coins: '全职高手·一穿三', price: 30, intelligence: false },
  { id: '秦时明月·合纵连横 30元', coins: '秦时明月·合纵连横', price: 30, intelligence: false },
  { id: '秉烛夜话·欲光璃境 30元', coins: '秉烛夜话·欲光璃境', price: 30, intelligence: false },
  { id: '破劫·鹤月寒城 30元', coins: '破劫·鹤月寒城', price: 30, intelligence: false },
  { id: '不凡·童真 40元', coins: '不凡·童真', price: 40, intelligence: false },
  { id: '不凡·棋境 40元', coins: '不凡·棋境', price: 40, intelligence: false },
  { id: '不凡·炽烈 40元', coins: '不凡·炽烈', price: 40, intelligence: false },
  { id: '不凡·誓约 40元', coins: '不凡·誓约', price: 40, intelligence: false },
  { id: '不凡·献礼 40元', coins: '不凡·献礼', price: 40, intelligence: false },
  { id: '不凡·卓然 40元', coins: '不凡·卓然', price: 40, intelligence: false },
  { id: '不凡·撒娇 40元', coins: '不凡·撒娇', price: 40, intelligence: false },
  { id: '江山如画 40元', coins: '江山如画', price: 40, intelligence: false },
  { id: '辰絮 40元', coins: '辰絮', price: 40, intelligence: false },
  { id: '倾国倾城·遮云 40元', coins: '倾国倾城·遮云', price: 40, intelligence: false },
  { id: '问侠情 40元', coins: '问侠情', price: 40, intelligence: false },
  { id: '倾国倾城·春棠 40元', coins: '倾国倾城·春棠', price: 40, intelligence: false },
  { id: '古龙江湖·寻梅 40元', coins: '古龙江湖·寻梅', price: 40, intelligence: false },
  { id: '风纪 40元', coins: '风纪', price: 40, intelligence: false },
  { id: '暖冬诞雪 40元', coins: '暖冬诞雪', price: 40, intelligence: false },
  { id: '承武·挽月 40元', coins: '承武·挽月', price: 40, intelligence: false },
  { id: '墨染千秋·松烟 40元', coins: '墨染千秋·松烟', price: 40, intelligence: false },
  { id: '江山胜景·花信 40元', coins: '江山胜景·花信', price: 40, intelligence: false },
  { id: '蔷薇愿 40元', coins: '蔷薇愿', price: 40, intelligence: false },
  { id: '倾天河 40元', coins: '倾天河', price: 40, intelligence: false },
  { id: '墨染千秋·采薇 40元', coins: '墨染千秋·采薇', price: 40, intelligence: false },
  { id: '墨染千秋·青痕 40元', coins: '墨染千秋·青痕', price: 40, intelligence: false },
  { id: '灵翎 40元', coins: '灵翎', price: 40, intelligence: false },
  { id: '倒反阴阳·恣意 40元', coins: '倒反阴阳·恣意', price: 40, intelligence: false },
  { id: '碎云霄 40元', coins: '碎云霄', price: 40, intelligence: false },
  { id: '倒反阴阳·绝尘 40元', coins: '倒反阴阳·绝尘', price: 40, intelligence: false },
  { id: '碧空 40元', coins: '碧空', price: 40, intelligence: false },
  { id: '璇枢引 40元', coins: '璇枢引', price: 40, intelligence: false },
  { id: '暮羽 40元', coins: '暮羽', price: 40, intelligence: false },
  { id: '赤浪伏潮 40元', coins: '赤浪伏潮', price: 40, intelligence: false },
  { id: '梵铃 40元', coins: '梵铃', price: 40, intelligence: false },
  { id: '步天歌 40元', coins: '步天歌', price: 40, intelligence: false },
  { id: '春日序曲·光年 40元', coins: '春日序曲·光年', price: 40, intelligence: false },
  { id: '四时之歌 40元', coins: '四时之歌', price: 40, intelligence: false },
  { id: '秋日序曲·清芬 40元', coins: '秋日序曲·清芬', price: 40, intelligence: false },
  { id: '金石秘藏 40元', coins: '金石秘藏', price: 40, intelligence: false },
  { id: '龙之术·笃行 40元', coins: '龙之术·笃行', price: 40, intelligence: false },
  { id: '古岛异闻·紫鸢 40元', coins: '古岛异闻·紫鸢', price: 40, intelligence: false },
  { id: '克烈·打吗打吗 40元', coins: '克烈·打吗打吗', price: 40, intelligence: false },
  { id: '克烈·躲啦 40元', coins: '克烈·躲啦', price: 40, intelligence: false },
  { id: '不会捏蓝·让一让 40元', coins: '不会捏蓝·让一让', price: 40, intelligence: false },
  { id: '克烈·吃了吗 40元', coins: '克烈·吃了吗', price: 40, intelligence: false },
  { id: '不会捏蓝·这是什么 40元', coins: '不会捏蓝·这是什么', price: 40, intelligence: false },
  { id: '不会捏蓝·私人大笑 40元', coins: '不会捏蓝·私人大笑', price: 40, intelligence: false },
  { id: '全职高手·秋痕 40元', coins: '全职高手·秋痕', price: 40, intelligence: false },
  { id: '全职高手·孤叶 40元', coins: '全职高手·孤叶', price: 40, intelligence: false },
  { id: '古岛异闻·幻生翼 40元', coins: '古岛异闻·幻生翼', price: 40, intelligence: false },
  { id: 'Mike·麦式谦虚 40元', coins: 'Mike·麦式谦虚', price: 40, intelligence: false },
  { id: 'Spider·不是哥们儿 40元', coins: 'Spider·不是哥们儿', price: 40, intelligence: false },
  { id: 'Mike·虐你如呼吸 40元', coins: 'Mike·虐你如呼吸', price: 40, intelligence: false },
  { id: 'Spider·准备壁击 40元', coins: 'Spider·准备壁击', price: 40, intelligence: false },
  { id: 'Mike·什么闪 40元', coins: 'Mike·什么闪', price: 40, intelligence: false },
  { id: 'Spider·我不想玩辣 40元', coins: 'Spider·我不想玩辣', price: 40, intelligence: false },
  { id: '西行劫·大圣 40元', coins: '西行劫·大圣', price: 40, intelligence: false },
  { id: '亚运·扬威 40元', coins: '亚运·扬威', price: 40, intelligence: false },
  { id: '砥砺筋骨·韵动 40元', coins: '砥砺筋骨·韵动', price: 40, intelligence: false },
  { id: '亚运·疾影 40元', coins: '亚运·疾影', price: 40, intelligence: false },
  { id: '亚运·逐光 40元', coins: '亚运·逐光', price: 40, intelligence: false },
  { id: '秦时明月·侠骨 40元', coins: '秦时明月·侠骨', price: 40, intelligence: false },
  { id: '秦时明月·紫蔓垂缨 40元', coins: '秦时明月·紫蔓垂缨', price: 40, intelligence: false },
  { id: '天行九歌·焰影 40元', coins: '天行九歌·焰影', price: 40, intelligence: false },
  { id: '秦时明月·垂绾 40元', coins: '秦时明月·垂绾', price: 40, intelligence: false },
  { id: '秦时明月·寒霜 40元', coins: '秦时明月·寒霜', price: 40, intelligence: false },
  { id: '秉烛夜话·缄梦 40元', coins: '秉烛夜话·缄梦', price: 40, intelligence: false },
  { id: '秉烛夜话·南音 40元', coins: '秉烛夜话·南音', price: 40, intelligence: false },
  { id: '爷胡了 45元', coins: '爷胡了', price: 45, intelligence: false },
  { id: '愿者上钩 45元', coins: '愿者上钩', price: 45, intelligence: false },
  { id: '边走边摇 45元', coins: '边走边摇', price: 45, intelligence: false },
  { id: '起来跳舞 45元', coins: '起来跳舞', price: 45, intelligence: false },
  { id: '心动奇袭 45元', coins: '心动奇袭', price: 45, intelligence: false },
  { id: '灵翩 45元', coins: '灵翩', price: 45, intelligence: false },
  { id: '心驰神往 45元', coins: '心驰神往', price: 45, intelligence: false },
  { id: '一赞再赞 45元', coins: '一赞再赞', price: 45, intelligence: false },
  { id: '爱 45元', coins: '爱', price: 45, intelligence: false },
  { id: '岁律盘 45元', coins: '岁律盘', price: 45, intelligence: false },
  { id: '舞意禅 45元', coins: '舞意禅', price: 45, intelligence: false },
  { id: '焊卫者 45元', coins: '焊卫者', price: 45, intelligence: false },
  { id: '春日序曲·星历 45元', coins: '春日序曲·星历', price: 45, intelligence: false },
  { id: '一鼓作气 45元', coins: '一鼓作气', price: 45, intelligence: false },
  { id: '示警 45元', coins: '示警', price: 45, intelligence: false },
  { id: '龙之意·游身八卦掌 45元', coins: '龙之意·游身八卦掌', price: 45, intelligence: false },
  { id: '第一刀 45元', coins: '第一刀', price: 45, intelligence: false },
  { id: '古岛异闻·百幻翼 45元', coins: '古岛异闻·百幻翼', price: 45, intelligence: false },
  { id: '随心萌动 45元', coins: '随心萌动', price: 45, intelligence: false },
  { id: '随心摇 45元', coins: '随心摇', price: 45, intelligence: false },
  { id: '广播体操 45元', coins: '广播体操', price: 45, intelligence: false },
  { id: '天行九歌·焰灵迷舞 45元', coins: '天行九歌·焰灵迷舞', price: 45, intelligence: false },
  { id: '恰恰摇 45元', coins: '恰恰摇', price: 45, intelligence: false },
  { id: '跳舞不是罪过 45元', coins: '跳舞不是罪过', price: 45, intelligence: false },
  { id: '南客翎·迦南捆绑包 50元', coins: '南客翎·迦南捆绑包', price: 50, intelligence: false },
  { id: '迦南·赤练语音包 50元', coins: '迦南·赤练语音包', price: 50, intelligence: false },
  { id: '刘炼·盖聂语音包 50元', coins: '刘炼·盖聂语音包', price: 50, intelligence: false },
  { id: '特木尔·卫庄语音包 50元', coins: '特木尔·卫庄语音包', price: 50, intelligence: false },
  { id: '季莹莹·焰灵姬语音包 50元', coins: '季莹莹·焰灵姬语音包', price: 50, intelligence: false },
  { id: '名人堂·不会捏蓝捆绑包 52元', coins: '名人堂·不会捏蓝捆绑包', price: 52, intelligence: false },
  { id: '名人堂·克烈捆绑包 52元', coins: '名人堂·克烈捆绑包', price: 52, intelligence: false },
  { id: '名人堂·Mike捆绑包 52元', coins: '名人堂·Mike捆绑包', price: 52, intelligence: false },
  { id: '名人堂·Spider捆绑包 52元', coins: '名人堂·Spider捆绑包', price: 52, intelligence: false },
  { id: '踏山河·刘炼捆绑包 52元', coins: '踏山河·刘炼捆绑包', price: 52, intelligence: false },
  { id: '不凡·蓝蝶 60元', coins: '不凡·蓝蝶', price: 60, intelligence: false },
  { id: '不凡·礼帽 60元', coins: '不凡·礼帽', price: 60, intelligence: false },
  { id: '不凡·冠冕 60元', coins: '不凡·冠冕', price: 60, intelligence: false },
  { id: '破劫·海神座 60元', coins: '破劫·海神座', price: 60, intelligence: false },
  { id: '庭院深深 60元', coins: '庭院深深', price: 60, intelligence: false },
  { id: '玄冥幽座 60元', coins: '玄冥幽座', price: 60, intelligence: false },
  { id: '承武·灿烂 60元', coins: '承武·灿烂', price: 60, intelligence: false },
  { id: '共赴无间·青芝盏 60元', coins: '共赴无间·青芝盏', price: 60, intelligence: false },
  { id: '电量不足 60元', coins: '电量不足', price: 60, intelligence: false },
  { id: '混沌洲 60元', coins: '混沌洲', price: 60, intelligence: false },
  { id: '照影坠 60元', coins: '照影坠', price: 60, intelligence: false },
  { id: '曦庭 60元', coins: '曦庭', price: 60, intelligence: false },
  { id: '螺钿栖波 60元', coins: '螺钿栖波', price: 60, intelligence: false },
  { id: '阿啾 60元', coins: '阿啾', price: 60, intelligence: false },
  { id: '喷绘飞艇 60元', coins: '喷绘飞艇', price: 60, intelligence: false },
  { id: '列宿分芒·衔星 60元', coins: '列宿分芒·衔星', price: 60, intelligence: false },
  { id: '共赴无间·玫心言 60元', coins: '共赴无间·玫心言', price: 60, intelligence: false },
  { id: '共赴无间·瑰心誓 60元', coins: '共赴无间·瑰心誓', price: 60, intelligence: false },
  { id: '魂灵台 60元', coins: '魂灵台', price: 60, intelligence: false },
  { id: '激情滑庆 60元', coins: '激情滑庆', price: 60, intelligence: false },
  { id: '瀛波玉台 60元', coins: '瀛波玉台', price: 60, intelligence: false },
  { id: '金劫宝名人堂·不会捏蓝 60元', coins: '金劫宝名人堂·不会捏蓝', price: 60, intelligence: false },
  { id: '金劫宝名人堂·克烈 60元', coins: '金劫宝名人堂·克烈', price: 60, intelligence: false },
  { id: '百战·终端面甲 60元', coins: '百战·终端面甲', price: 60, intelligence: false },
  { id: 'NBPL名人堂·Mike 60元', coins: 'NBPL名人堂·Mike', price: 60, intelligence: false },
  { id: 'NBPL名人堂·Spider 60元', coins: 'NBPL名人堂·Spider', price: 60, intelligence: false },
  { id: '砥砺筋骨·遮阳帽 60元', coins: '砥砺筋骨·遮阳帽', price: 60, intelligence: false },
  { id: '秦时明月·天下棋局 60元', coins: '秦时明月·天下棋局', price: 60, intelligence: false },
  { id: '破劫·墨梅云台 60元', coins: '破劫·墨梅云台', price: 60, intelligence: false },
  { id: '秉烛夜话·心蚀幻阵 60元', coins: '秉烛夜话·心蚀幻阵', price: 60, intelligence: false },
  { id: '凌峰无界捆绑包 60元', coins: '凌峰无界捆绑包', price: 60, intelligence: false },
  { id: '裁决之星 65元', coins: '裁决之星', price: 65, intelligence: false },
  { id: '古岛异闻·栖冰枝 65元', coins: '古岛异闻·栖冰枝', price: 65, intelligence: false },
  { id: '秦时明月·归朴 65元', coins: '秦时明月·归朴', price: 65, intelligence: false },
  { id: '秉烛夜话·绛心秘契 65元', coins: '秉烛夜话·绛心秘契', price: 65, intelligence: false },
  { id: '红砂征神令秘藏卡 68元', coins: '红砂征神令秘藏卡', price: 68, intelligence: false },
  { id: '破劫·寂刃 75元', coins: '破劫·寂刃', price: 75, intelligence: false },
  { id: '手术刀 75元', coins: '手术刀', price: 75, intelligence: false },
  { id: '羿之影 75元', coins: '羿之影', price: 75, intelligence: false },
  { id: '朱嵌 75元', coins: '朱嵌', price: 75, intelligence: false },
  { id: '百战·淬锋 75元', coins: '百战·淬锋', price: 75, intelligence: false },
  { id: '泼墨 75元', coins: '泼墨', price: 75, intelligence: false },
  { id: '单线流 75元', coins: '单线流', price: 75, intelligence: false },
  { id: '醉骨 75元', coins: '醉骨', price: 75, intelligence: false },
  { id: '木澜钓竿 75元', coins: '木澜钓竿', price: 75, intelligence: false },
  { id: '白狩 75元', coins: '白狩', price: 75, intelligence: false },
  { id: '衔曜 75元', coins: '衔曜', price: 75, intelligence: false },
  { id: '亚运·扶摇金羽 75元', coins: '亚运·扶摇金羽', price: 75, intelligence: false },
  { id: '我在永劫很想你 75元', coins: '我在永劫很想你', price: 75, intelligence: false },
  { id: '秦时明月·链蛇软剑 75元', coins: '秦时明月·链蛇软剑', price: 75, intelligence: false },
  { id: '秦时明月·鲨齿 75元', coins: '秦时明月·鲨齿', price: 75, intelligence: false },
  { id: '秉烛夜话·赤蕊凝寒 75元', coins: '秉烛夜话·赤蕊凝寒', price: 75, intelligence: false },
  { id: '破劫·断界 75元', coins: '破劫·断界', price: 75, intelligence: false },
  { id: '御宅花织 90元', coins: '御宅花织', price: 90, intelligence: false },
  { id: '不凡·荒诞盛宴 90元', coins: '不凡·荒诞盛宴', price: 90, intelligence: false },
  { id: '不凡·玫瑰火焰 90元', coins: '不凡·玫瑰火焰', price: 90, intelligence: false },
  { id: '不凡·幻梦寻奇 90元', coins: '不凡·幻梦寻奇', price: 90, intelligence: false },
  { id: '古龙江湖·浪子侠情 90元', coins: '古龙江湖·浪子侠情', price: 90, intelligence: false },
  { id: '灵弓镇厄 90元', coins: '灵弓镇厄', price: 90, intelligence: false },
  { id: '雷云敕雨令 90元', coins: '雷云敕雨令', price: 90, intelligence: false },
  { id: '金牌门将·蓝梦捆绑包 90元', coins: '金牌门将·蓝梦捆绑包', price: 90, intelligence: false },
  { id: '砥砺筋骨·金牌门将 90元', coins: '砥砺筋骨·金牌门将', price: 90, intelligence: false },
  { id: '绚妙喷瓶 90元', coins: '绚妙喷瓶', price: 90, intelligence: false },
  { id: '司天璇星 90元', coins: '司天璇星', price: 90, intelligence: false },
  { id: '春日序曲·天极 90元', coins: '春日序曲·天极', price: 90, intelligence: false },
  { id: '秋日序曲·翩云 90元', coins: '秋日序曲·翩云', price: 90, intelligence: false },
  { id: '秋日裁 90元', coins: '秋日裁', price: 90, intelligence: false },
  { id: '翩云·蓝梦捆绑包 90元', coins: '翩云·蓝梦捆绑包', price: 90, intelligence: false },
  { id: '古岛异闻·越海蝶 90元', coins: '古岛异闻·越海蝶', price: 90, intelligence: false },
  { id: '全职高手·散人 90元', coins: '全职高手·散人', price: 90, intelligence: false },
  { id: '散人·叶修捆绑包 90元', coins: '散人·叶修捆绑包', price: 90, intelligence: false },
  { id: '百战·雷曜之芯 90元', coins: '百战·雷曜之芯', price: 90, intelligence: false },
  { id: '锋芒无拘·胡桃捆绑包 90元', coins: '锋芒无拘·胡桃捆绑包', price: 90, intelligence: false },
  { id: '亚运·踏山河 90元', coins: '亚运·踏山河', price: 90, intelligence: false },
  { id: '亚运·破晓无畏 90元', coins: '亚运·破晓无畏', price: 90, intelligence: false },
  { id: '砥砺筋骨·最妙后援 90元', coins: '砥砺筋骨·最妙后援', price: 90, intelligence: false },
  { id: '亚运·锋芒无拘 90元', coins: '亚运·锋芒无拘', price: 90, intelligence: false },
  { id: '破晓无畏·岳山捆绑包 90元', coins: '破晓无畏·岳山捆绑包', price: 90, intelligence: false },
  { id: '秦时明月·赤练 90元', coins: '秦时明月·赤练', price: 90, intelligence: false },
  { id: '木曜·甘璇捆绑包 90元', coins: '木曜·甘璇捆绑包', price: 90, intelligence: false },
  { id: '天行九歌·焰灵姬 90元', coins: '天行九歌·焰灵姬', price: 90, intelligence: false },
  { id: '秦时明月·卫庄 90元', coins: '秦时明月·卫庄', price: 90, intelligence: false },
  { id: '秦时明月·木曜 90元', coins: '秦时明月·木曜', price: 90, intelligence: false },
  { id: '秦时明月·盖聂 90元', coins: '秦时明月·盖聂', price: 90, intelligence: false },
  { id: '秉烛夜话·瓷梦绮罗 90元', coins: '秉烛夜话·瓷梦绮罗', price: 90, intelligence: false },
  { id: '瓷梦绮罗·胡桃捆绑包 90元', coins: '瓷梦绮罗·胡桃捆绑包', price: 90, intelligence: false },
  { id: '秉烛夜话·碧裳幽影 90元', coins: '秉烛夜话·碧裳幽影', price: 90, intelligence: false },
  { id: '秉烛夜话·墨刃裁魂 90元', coins: '秉烛夜话·墨刃裁魂', price: 90, intelligence: false },
  { id: '碧裳幽影·季莹莹捆绑包 90元', coins: '碧裳幽影·季莹莹捆绑包', price: 90, intelligence: false },
  { id: '求索·顾清寒捆绑包 95元', coins: '求索·顾清寒捆绑包', price: 95, intelligence: false },
  { id: '吊瓶战徽 100元', coins: '吊瓶战徽', price: 100, intelligence: false },
  { id: '古龙江湖·空折枝 100元', coins: '古龙江湖·空折枝', price: 100, intelligence: false },
  { id: '心动共振 100元', coins: '心动共振', price: 100, intelligence: false },
  { id: '蒜鸟蒜鸟 100元', coins: '蒜鸟蒜鸟', price: 100, intelligence: false },
  { id: '缤纷创心捆绑包 100元', coins: '缤纷创心捆绑包', price: 100, intelligence: false },
  { id: '两星好评 100元', coins: '两星好评', price: 100, intelligence: false },
  { id: '青丘残魄 100元', coins: '青丘残魄', price: 100, intelligence: false },
  { id: '眠云 100元', coins: '眠云', price: 100, intelligence: false },
  { id: '雷曜之芯·万钧捆绑包 100元', coins: '雷曜之芯·万钧捆绑包', price: 100, intelligence: false },
  { id: '西行志·玉液琼浆 100元', coins: '西行志·玉液琼浆', price: 100, intelligence: false },
  { id: '最妙后援·沈妙捆绑包 100元', coins: '最妙后援·沈妙捆绑包', price: 100, intelligence: false },
  { id: '浪子侠情·李寻欢捆绑包 110元', coins: '浪子侠情·李寻欢捆绑包', price: 110, intelligence: false },
  { id: '天极·甘璇捆绑包 110元', coins: '天极·甘璇捆绑包', price: 110, intelligence: false },
  { id: '越海蝶·蓝梦捆绑包 110元', coins: '越海蝶·蓝梦捆绑包', price: 110, intelligence: false },
  { id: '卫庄·特木尔捆绑包 110元', coins: '卫庄·特木尔捆绑包', price: 110, intelligence: false },
  { id: '焰灵姬·季莹莹捆绑包 110元', coins: '焰灵姬·季莹莹捆绑包', price: 110, intelligence: false },
  { id: '赤练·迦南捆绑包 110元', coins: '赤练·迦南捆绑包', price: 110, intelligence: false },
  { id: '盖聂·刘炼捆绑包 110元', coins: '盖聂·刘炼捆绑包', price: 110, intelligence: false },
  { id: '樱律·妖刀姬捆绑包 120元', coins: '樱律·妖刀姬捆绑包', price: 120, intelligence: false },
  { id: '秋日序曲·樱律 120元', coins: '秋日序曲·樱律', price: 120, intelligence: false },
  { id: '龙之道·求索 120元', coins: '龙之道·求索', price: 120, intelligence: false },
  { id: '墨影龙游 120元', coins: '墨影龙游', price: 120, intelligence: false },
  { id: '紫翼流绯·妖刀姬捆绑包 120元', coins: '紫翼流绯·妖刀姬捆绑包', price: 120, intelligence: false },
  { id: '秉烛夜话·紫翼流绯 120元', coins: '秉烛夜话·紫翼流绯', price: 120, intelligence: false },
  { id: '灵弓镇厄·巫真捆绑包 125元', coins: '灵弓镇厄·巫真捆绑包', price: 125, intelligence: false },
  { id: '司天璇星·甘璇捆绑包 125元', coins: '司天璇星·甘璇捆绑包', price: 125, intelligence: false },
  { id: '剑圣无双·盖聂捆绑包 140元', coins: '剑圣无双·盖聂捆绑包', price: 140, intelligence: false },
  { id: '玄夜摄心·妖刀姬捆绑包 150元', coins: '玄夜摄心·妖刀姬捆绑包', price: 150, intelligence: false },
  { id: '枯寒·李寻欢捆绑包 175元', coins: '枯寒·李寻欢捆绑包', price: 175, intelligence: false },
  { id: '冰蝶纪·蓝梦捆绑包 175元', coins: '冰蝶纪·蓝梦捆绑包', price: 175, intelligence: false },
  { id: '狩猎都市·缠缠 180元', coins: '狩猎都市·缠缠', price: 180, intelligence: false },
  { id: '古龙江湖·残雪琉璃瓠 180元', coins: '古龙江湖·残雪琉璃瓠', price: 180, intelligence: false },
  { id: '倒反阴阳·金鸾镜 180元', coins: '倒反阴阳·金鸾镜', price: 180, intelligence: false },
  { id: '故翎佩 180元', coins: '故翎佩', price: 180, intelligence: false },
  { id: '千机神杯*10 180元', coins: '千机神杯*10', price: 180, intelligence: false },
  { id: '千机神杯*10 180元（折扣）', coins: '千机神杯*10', price: 180, intelligence: false },
  { id: '秦时明月·百步飞剑 180元', coins: '秦时明月·百步飞剑', price: 180, intelligence: false },
  { id: '秉烛夜话·玄蝠衔珠 185元', coins: '秉烛夜话·玄蝠衔珠', price: 185, intelligence: false },
  { id: '天启·哈迪捆绑包 190元', coins: '天启·哈迪捆绑包', price: 190, intelligence: false },
  { id: '辰龙·万钧捆绑包 195元', coins: '辰龙·万钧捆绑包', price: 195, intelligence: false },
  { id: '齐天撼世·胡为捆绑包 210元', coins: '齐天撼世·胡为捆绑包', price: 210, intelligence: false },
  { id: '天启辉光 240元', coins: '天启辉光', price: 240, intelligence: false },
  { id: '灵麒佑 240元', coins: '灵麒佑', price: 240, intelligence: false },
  { id: '古岛异闻·赤冥佩 240元', coins: '古岛异闻·赤冥佩', price: 240, intelligence: false },
  { id: '古岛异闻·蝶月录 240元', coins: '古岛异闻·蝶月录', price: 240, intelligence: false },
  { id: '辰龙坠 250元', coins: '辰龙坠', price: 250, intelligence: false },
  { id: '西行志·仙宫蟠桃 290元', coins: '西行志·仙宫蟠桃', price: 290, intelligence: false },
  { id: '千机神杯*100 1800元', coins: '千机神杯*100', price: 1800, intelligence: false },
]

// =========================
// 永劫无间手游固定充值档位（写死）
// =========================
const YJWJ_M_RECHARGE_OPTIONS = [
  { id: '1', coins: '数量组合1元面值', price: 1, intelligence: true },

  // 元宝
  { id: '60元宝',    coins: '60元宝',    price: 6,   intelligence: false },
  { id: '600元宝',   coins: '600元宝',   price: 60,  intelligence: false },
  { id: '1500元宝',  coins: '1500元宝',  price: 150, intelligence: false },
  { id: '3000元宝',  coins: '3000元宝',  price: 300, intelligence: false },
  { id: '6480元宝',  coins: '6480元宝',  price: 648, intelligence: false },

  // 道具 / 礼包
  { id: '月光宝券',        coins: '月光宝券',        price: 30,   intelligence: false },
  { id: '吞天拓展包',      coins: '吞天拓展包',      price: 99,   intelligence: false },
  { id: '吞天高级宝卷卡',  coins: '吞天高级宝卷卡',  price: 60,   intelligence: false },
  { id: '吞天典藏宝卷卡',  coins: '吞天典藏宝卷卡',  price: 142,  intelligence: false },
  { id: '白泽月卡',        coins: '白泽月卡',        price: 30,   intelligence: false },
  { id: '佩服',            coins: '佩服',            price: 1,    intelligence: false },
  { id: '飞天礼花',        coins: '飞天礼花',        price: 20,   intelligence: false },
  { id: '浓情蜜意',        coins: '浓情蜜意',        price: 52,   intelligence: false },
  { id: '心愿灯语',        coins: '心愿灯语',        price: 66.6, intelligence: false },
  { id: '崇拜',            coins: '崇拜',            price: 5,    intelligence: false },
  { id: '千机神杯*1',      coins: '千机神杯*1',      price: 18,   intelligence: false },
  { id: '千机神杯*10',     coins: '千机神杯*10',     price: 180,  intelligence: false },
  { id: '千机神杯*100',    coins: '千机神杯*100',    price: 1800, intelligence: false },
  { id: '冰爽盲盒',        coins: '冰爽盲盒',        price: 18,   intelligence: false },
  { id: '激乐电动盲盒',    coins: '激乐电动盲盒',    price: 1,    intelligence: false },
  { id: '瑞霖宝箱*1',      coins: '瑞霖宝箱*1',      price: 6,    intelligence: false },
  { id: '瑞霖宝箱*10',     coins: '瑞霖宝箱*10',     price: 60,   intelligence: false },
  { id: '瑞霖宝箱*10（首单9折）', coins: '瑞霖宝箱*10（首单9折）', price: 60, intelligence: false },
  { id: '瑞霖宝箱*100',    coins: '瑞霖宝箱*100',    price: 600,  intelligence: false },
  { id: '灵玉宝莲*1',      coins: '灵玉宝莲*1',      price: 6,    intelligence: false },
  { id: '灵玉宝莲*10',     coins: '灵玉宝莲*10',     price: 60,   intelligence: false },
  { id: '灵玉宝莲*100',    coins: '灵玉宝莲*100',    price: 600,  intelligence: false },
  { id: '瑞玉宝箱任选礼',  coins: '瑞玉宝箱任选礼',  price: 6,    intelligence: false },
  { id: '潜水盲盒',        coins: '潜水盲盒',        price: 6,    intelligence: false },
  { id: '枕边偶秘匣',      coins: '枕边偶秘匣',      price: 12,   intelligence: false },
  { id: '琉璃晶*6',        coins: '琉璃晶*6',        price: 15,   intelligence: false },
  { id: '琉璃晶*10',       coins: '琉璃晶*10',       price: 25,   intelligence: false },
  { id: '琉璃晶*12',       coins: '琉璃晶*12',       price: 30,   intelligence: false },
  { id: '琉璃晶*50',       coins: '琉璃晶*50',       price: 125,  intelligence: false },
  { id: '琉璃晶*60',       coins: '琉璃晶*60',       price: 150,  intelligence: false },
  { id: '琉璃晶*100',      coins: '琉璃晶*100',      price: 250,  intelligence: false },
  { id: '琉璃晶*760',      coins: '琉璃晶*760',      price: 1900, intelligence: false },
  { id: '赤链福袋',        coins: '赤链福袋',        price: 15,   intelligence: false },
  { id: '振奋秘匣',        coins: '振奋秘匣',        price: 90,   intelligence: false },

  // 展示 / 动作 / 发型 / 挂饰 / 外观 / 武器等（按 name 去重，保留首个价格）
  { id: '春日序曲·早樱',       coins: '春日序曲·早樱',       price: 25,    intelligence: false },
  { id: '飞鼠',               coins: '飞鼠',               price: 210,   intelligence: false },
  { id: '萌虎',               coins: '萌虎',               price: 60,    intelligence: false },
  { id: '表情动作 尬武',       coins: '表情动作 尬武',       price: 15,    intelligence: false },
  { id: '枯寒捆绑包',         coins: '枯寒捆绑包',         price: 175,   intelligence: false },
  { id: '古龙江湖·残雪琉璃瓠', coins: '古龙江湖·残雪琉璃瓠', price: 180,   intelligence: false },
  { id: '古龙江湖·空折枝',     coins: '古龙江湖·空折枝',     price: 100,   intelligence: false },
  { id: '劫妹飞船',           coins: '劫妹飞船',           price: 210,   intelligence: false },
  { id: '炎烈珠',             coins: '炎烈珠',             price: 230,   intelligence: false },
  { id: '西行劫·神君印',       coins: '西行劫·神君印',       price: 290,   intelligence: false },
  { id: '御祥云',             coins: '御祥云',             price: 25,    intelligence: false },
  { id: '金人俑',             coins: '金人俑',             price: 25,    intelligence: false },
  { id: '金焰狐舞',           coins: '金焰狐舞',           price: 60,    intelligence: false },
  { id: '千秋匠心·凶虎',       coins: '千秋匠心·凶虎',       price: 60,    intelligence: false },
  { id: '雷震九天',           coins: '雷震九天',           price: 180,   intelligence: false },
  { id: '封神录·赤莲',         coins: '封神录·赤莲',         price: 180,   intelligence: false },
  { id: '幻梦奇谭·蕊歌',       coins: '幻梦奇谭·蕊歌',       price: 180,   intelligence: false },
  { id: '谋弈纵横',           coins: '谋弈纵横',           price: 180,   intelligence: false },
  { id: '御海之灵',           coins: '御海之灵',           price: 240,   intelligence: false },
  { id: '神乌造像',           coins: '神乌造像',           price: 240,   intelligence: false },
  { id: '绿野守护·竹韵悠',     coins: '绿野守护·竹韵悠',     price: 260,   intelligence: false },
  { id: '百战·枷锁',           coins: '百战·枷锁',           price: 240,   intelligence: false },
  { id: '瀚海',               coins: '瀚海',               price: 10,    intelligence: false },
  { id: '幽客',               coins: '幽客',               price: 10,    intelligence: false },
  { id: '游园会',             coins: '游园会',             price: 10,    intelligence: false },
  { id: '典雅剧场',           coins: '典雅剧场',           price: 10,    intelligence: false },
  { id: '地煞鬼',             coins: '地煞鬼',             price: 10,    intelligence: false },
  { id: '蝶语迷钟',           coins: '蝶语迷钟',           price: 10,    intelligence: false },
  { id: '爆裂都市',           coins: '爆裂都市',           price: 10,    intelligence: false },
  { id: '秋日序曲·铃曦',       coins: '秋日序曲·铃曦',       price: 10,    intelligence: false },
  { id: '浮光榭',             coins: '浮光榭',             price: 10,    intelligence: false },
  { id: '蜜莓茶歇',           coins: '蜜莓茶歇',           price: 10,    intelligence: false },
  { id: '欢悦',               coins: '欢悦',               price: 10,    intelligence: false },
  { id: '恬淡悠然',           coins: '恬淡悠然',           price: 10,    intelligence: false },
  { id: '天行九歌·如焰',       coins: '天行九歌·如焰',       price: 10,    intelligence: false },
  { id: '秦时明月·神女',       coins: '秦时明月·神女',       price: 10,    intelligence: false },
  { id: '秦时明月·红颜',       coins: '秦时明月·红颜',       price: 10,    intelligence: false },
  { id: '拊掌相迎',           coins: '拊掌相迎',           price: 15,    intelligence: false },
  { id: '拊掌',               coins: '拊掌',               price: 15,    intelligence: false },
  { id: '有点意思',           coins: '有点意思',           price: 15,    intelligence: false },
  { id: '有意思',             coins: '有意思',             price: 15,    intelligence: false },
  { id: '西行劫·定海神珍',     coins: '西行劫·定海神珍',     price: 15,    intelligence: false },
  { id: '西行劫·神君慧眼',     coins: '西行劫·神君慧眼',     price: 15,    intelligence: false },
  { id: '春日序曲·傲立',       coins: '春日序曲·傲立',       price: 15,    intelligence: false },
  { id: '春日序曲·娇俏',       coins: '春日序曲·娇俏',       price: 15,    intelligence: false },
  { id: '闲摇',               coins: '闲摇',               price: 15,    intelligence: false },
  { id: '闲摇捆绑包',         coins: '闲摇捆绑包',         price: 15,    intelligence: false },
  { id: '草莓酱',             coins: '草莓酱',             price: 15,    intelligence: false },
  { id: '通行曲',             coins: '通行曲',             price: 15,    intelligence: false },
  { id: '糯米糍',             coins: '糯米糍',             price: 15,    intelligence: false },
  { id: '倾城姿',             coins: '倾城姿',             price: 15,    intelligence: false },
  { id: '观山海·神鹿',         coins: '观山海·神鹿',         price: 15,    intelligence: false },
  { id: '纸飞机',             coins: '纸飞机',             price: 15,    intelligence: false },
  { id: '幻梦奇谭·安眠',       coins: '幻梦奇谭·安眠',       price: 15,    intelligence: false },
  { id: '耀眼特攻',           coins: '耀眼特攻',           price: 15,    intelligence: false },
  { id: '优雅特攻',           coins: '优雅特攻',           price: 15,    intelligence: false },
  { id: '华美特攻',           coins: '华美特攻',           price: 15,    intelligence: false },
  { id: '魅影特攻',           coins: '魅影特攻',           price: 15,    intelligence: false },
  { id: '天鹅舞',             coins: '天鹅舞',             price: 15,    intelligence: false },
  { id: '绘灵卷',             coins: '绘灵卷',             price: 15,    intelligence: false },
  { id: '裂空暴击',           coins: '裂空暴击',           price: 15,    intelligence: false },
  { id: '猫狗奇遇·盒子喵',     coins: '猫狗奇遇·盒子喵',     price: 15,    intelligence: false },
  { id: '清浪',               coins: '清浪',               price: 15,    intelligence: false },
  { id: '柔骨',               coins: '柔骨',               price: 15,    intelligence: false },
  { id: '猫狗奇遇·骨头汪',     coins: '猫狗奇遇·骨头汪',     price: 15,    intelligence: false },
  { id: '冰鹿召唤',           coins: '冰鹿召唤',           price: 15,    intelligence: false },
  { id: '挽弓',               coins: '挽弓',               price: 15,    intelligence: false },
  { id: '无间游戏·擎天',       coins: '无间游戏·擎天',       price: 15,    intelligence: false },
  { id: '拂柳',               coins: '拂柳',               price: 15,    intelligence: false },
  { id: '断风',               coins: '断风',               price: 15,    intelligence: false },
  { id: '叽哔你',             coins: '叽哔你',             price: 15,    intelligence: false },
  { id: '烬焚刺',             coins: '烬焚刺',             price: 15,    intelligence: false },
  { id: '冷眸',               coins: '冷眸',               price: 15,    intelligence: false },
  { id: '暴打大朋友',         coins: '暴打大朋友',         price: 15,    intelligence: false },
  { id: '手势',               coins: '手势',               price: 15,    intelligence: false },
  { id: '绻倚',               coins: '绻倚',               price: 15,    intelligence: false },
  { id: '墨染千秋·扇舞',       coins: '墨染千秋·扇舞',       price: 15,    intelligence: false },
  { id: '大侠饶命',           coins: '大侠饶命',           price: 15,    intelligence: false },
  { id: '决胜时刻',           coins: '决胜时刻',           price: 15,    intelligence: false },
  { id: '负手傲立',           coins: '负手傲立',           price: 15,    intelligence: false },
  { id: '秦时明月·红莲倚',     coins: '秦时明月·红莲倚',     price: 15,    intelligence: false },
  { id: '秦时明月·飞花',       coins: '秦时明月·飞花',       price: 15,    intelligence: false },
  { id: '天行九歌·灵动',       coins: '天行九歌·灵动',       price: 15,    intelligence: false },
  { id: '秦时明月·纵横',       coins: '秦时明月·纵横',       price: 15,    intelligence: false },
  { id: '破劫·煌霆',           coins: '破劫·煌霆',           price: 15,    intelligence: false },
  { id: '惊声鸡叫捆绑包',     coins: '惊声鸡叫捆绑包',     price: 18,    intelligence: false },
  { id: '灵狐假面',           coins: '灵狐假面',           price: 20,    intelligence: false },
  { id: '兰芷',               coins: '兰芷',               price: 20,    intelligence: false },
  { id: '有狐',               coins: '有狐',               price: 20,    intelligence: false },
  { id: '蛋糕诱惑',           coins: '蛋糕诱惑',           price: 20,    intelligence: false },
  { id: '时光回响',           coins: '时光回响',           price: 20,    intelligence: false },
  { id: '暗幽阵',             coins: '暗幽阵',             price: 20,    intelligence: false },
  { id: '禁止通行',           coins: '禁止通行',           price: 20,    intelligence: false },
  { id: '卫冕',               coins: '卫冕',               price: 20,    intelligence: false },
  { id: '打歌台',             coins: '打歌台',             price: 20,    intelligence: false },
  { id: '思梦',               coins: '思梦',               price: 20,    intelligence: false },
  { id: '西行劫·探路',         coins: '西行劫·探路',         price: 25,    intelligence: false },
  { id: '有点意思捆绑包',     coins: '有点意思捆绑包',     price: 30,    intelligence: false },
  { id: '甘露霞光',           coins: '甘露霞光',           price: 30,    intelligence: false },
  { id: '谪仙颂·万古',         coins: '谪仙颂·万古',         price: 30,    intelligence: false },
  { id: '露华浓',             coins: '露华浓',             price: 30,    intelligence: false },
  { id: '封神录·三山仙岛',     coins: '封神录·三山仙岛',     price: 30,    intelligence: false },
  { id: '冥夜照',             coins: '冥夜照',             price: 30,    intelligence: false },
  { id: '凤亭命缘',           coins: '凤亭命缘',           price: 30,    intelligence: false },
  { id: '封神录·沉檀',         coins: '封神录·沉檀',         price: 30,    intelligence: false },
  { id: '封神录·惊海',         coins: '封神录·惊海',         price: 30,    intelligence: false },
  { id: '2674·幻域',           coins: '2674·幻域',           price: 30,    intelligence: false },
  { id: 'iQOO·战神',           coins: 'iQOO·战神',           price: 30,    intelligence: false },
  { id: '锦梦',               coins: '锦梦',               price: 30,    intelligence: false },
  { id: '幻梦奇谭·华庭',       coins: '幻梦奇谭·华庭',       price: 30,    intelligence: false },
  { id: '逆水寒·绒兔献礼',     coins: '逆水寒·绒兔献礼',     price: 30,    intelligence: false },
  { id: '逆水寒·甜兔巡礼',     coins: '逆水寒·甜兔巡礼',     price: 30,    intelligence: false },
  { id: '绿野守护·萌熊',       coins: '绿野守护·萌熊',       price: 30,    intelligence: false },
  { id: '龙之景·空谷问竹',     coins: '龙之景·空谷问竹',     price: 30,    intelligence: false },
  { id: '绿野守护·晴岚',       coins: '绿野守护·晴岚',       price: 30,    intelligence: false },
  { id: '云麒',               coins: '云麒',               price: 30,    intelligence: false },
  { id: '墨染金莲',           coins: '墨染金莲',           price: 30,    intelligence: false },
  { id: '风雷啸涌',           coins: '风雷啸涌',           price: 30,    intelligence: false },
  { id: '猫狗奇遇·喵一夏',     coins: '猫狗奇遇·喵一夏',     price: 30,    intelligence: false },
  { id: '凤衔金稻',           coins: '凤衔金稻',           price: 30,    intelligence: false },
  { id: '呆呆二哈',           coins: '呆呆二哈',           price: 30,    intelligence: false },
  { id: '盯盯猫',             coins: '盯盯猫',             price: 30,    intelligence: false },
  { id: '猫狗奇遇·暖馨柴窝',   coins: '猫狗奇遇·暖馨柴窝',   price: 30,    intelligence: false },
  { id: '明月影纱',           coins: '明月影纱',           price: 30,    intelligence: false },
  { id: '璇玑阶',             coins: '璇玑阶',             price: 30,    intelligence: false },
  { id: '绒狮',               coins: '绒狮',               price: 30,    intelligence: false },
  { id: '花楹',               coins: '花楹',               price: 30,    intelligence: false },
  { id: '未形之形',           coins: '未形之形',           price: 30,    intelligence: false },
  { id: '阴神',               coins: '阴神',               price: 30,    intelligence: false },
  { id: '镜中迷梦',           coins: '镜中迷梦',           price: 30,    intelligence: false },
  { id: '聚魄骨',             coins: '聚魄骨',             price: 30,    intelligence: false },
  { id: '共赴无间·玉杵影',     coins: '共赴无间·玉杵影',     price: 30,    intelligence: false },
  { id: '观山海·十日',         coins: '观山海·十日',         price: 30,    intelligence: false },
  { id: '瀛洲云庭',           coins: '瀛洲云庭',           price: 30,    intelligence: false },
  { id: '全职高手·一穿三',     coins: '全职高手·一穿三',     price: 30,    intelligence: false },
  { id: '秉烛夜话·欲光璃境',   coins: '秉烛夜话·欲光璃境',   price: 30,    intelligence: false },
  { id: '秦时明月·合纵连横',   coins: '秦时明月·合纵连横',   price: 30,    intelligence: false },
  { id: '绚妙幻彩',           coins: '绚妙幻彩',           price: 30,    intelligence: false },
  { id: '破劫·鹤月寒城',       coins: '破劫·鹤月寒城',       price: 30,    intelligence: false },

  // 发型 / 外观（40 元档）
  { id: '桀骜',               coins: '桀骜',               price: 40, intelligence: false },
  { id: '炽焰',               coins: '炽焰',               price: 40, intelligence: false },
  { id: '法影',               coins: '法影',               price: 40, intelligence: false },
  { id: '惊鸿',               coins: '惊鸿',               price: 40, intelligence: false },
  { id: '发型 2674·无畏',       coins: '发型 2674·无畏',       price: 40, intelligence: false },
  { id: '倩棠',               coins: '倩棠',               price: 40, intelligence: false },
  { id: '华绮',               coins: '华绮',               price: 40, intelligence: false },
  { id: '朝颜',               coins: '朝颜',               price: 40, intelligence: false },
  { id: '诸天',               coins: '诸天',               price: 40, intelligence: false },
  { id: '啸风',               coins: '啸风',               price: 40, intelligence: false },
  { id: '铸神·玄鳞',           coins: '铸神·玄鳞',           price: 40, intelligence: false },
  { id: '观山海·炎野',         coins: '观山海·炎野',         price: 40, intelligence: false },
  { id: '长歌诗韵·蓬舞',       coins: '长歌诗韵·蓬舞',       price: 40, intelligence: false },
  { id: '长歌诗韵·星桥',       coins: '长歌诗韵·星桥',       price: 40, intelligence: false },
  { id: '巳辰新禧·普渡',       coins: '巳辰新禧·普渡',       price: 40, intelligence: false },
  { id: '苍生',               coins: '苍生',               price: 40, intelligence: false },
  { id: '紫芙',               coins: '紫芙',               price: 40, intelligence: false },
  { id: '西行劫·大圣',         coins: '西行劫·大圣',         price: 40, intelligence: false },
  { id: '春日序曲·蜜芙',       coins: '春日序曲·蜜芙',       price: 40, intelligence: false },
  { id: '春日序曲·柔雅',       coins: '春日序曲·柔雅',       price: 40, intelligence: false },
  { id: '春日序曲·玄瑛',       coins: '春日序曲·玄瑛',       price: 40, intelligence: false },
  { id: '春日序曲·冰露',       coins: '春日序曲·冰露',       price: 40, intelligence: false },
  { id: '封神录·鸿鹄',         coins: '封神录·鸿鹄',         price: 40, intelligence: false },
  { id: '封神录·墨辉',         coins: '封神录·墨辉',         price: 40, intelligence: false },
  { id: '封神录·碧落吟',       coins: '封神录·碧落吟',       price: 40, intelligence: false },
  { id: '封神录·武成',         coins: '封神录·武成',         price: 40, intelligence: false },
  { id: '降鬼',               coins: '降鬼',               price: 40, intelligence: false },
  { id: '忘川',               coins: '忘川',               price: 40, intelligence: false },
  { id: '2674·水母泪',         coins: '2674·水母泪',         price: 40, intelligence: false },
  { id: '2674·械光',           coins: '2674·械光',           price: 40, intelligence: false },
  { id: '2674·绻影',           coins: '2674·绻影',           price: 40, intelligence: false },
  { id: '拂衣客',             coins: '拂衣客',             price: 40, intelligence: false },
  { id: '观山海·忘忧',         coins: '观山海·忘忧',         price: 40, intelligence: false },
  { id: '观山海·守山',         coins: '观山海·守山',         price: 40, intelligence: false },
  { id: '幻梦奇谭·灿烂',       coins: '幻梦奇谭·灿烂',       price: 40, intelligence: false },
  { id: '怦然心动·恋歌',       coins: '怦然心动·恋歌',       price: 40, intelligence: false },
  { id: '虎掠',               coins: '虎掠',               price: 40, intelligence: false },
  { id: '辨涛声',             coins: '辨涛声',             price: 40, intelligence: false },
  { id: '露华',               coins: '露华',               price: 40, intelligence: false },
  { id: '龙之术·随性',         coins: '龙之术·随性',         price: 40, intelligence: false },
  { id: '冬日绮韵·甜心',       coins: '冬日绮韵·甜心',       price: 40, intelligence: false },
  { id: '剑霄',               coins: '剑霄',               price: 40, intelligence: false },
  { id: '红绡',               coins: '红绡',               price: 40, intelligence: false },
  { id: '清夜',               coins: '清夜',               price: 40, intelligence: false },
  { id: '神算',               coins: '神算',               price: 40, intelligence: false },
  { id: '无间游戏·夜影',       coins: '无间游戏·夜影',       price: 40, intelligence: false },
  { id: '猫狗奇遇·金丝绒',     coins: '猫狗奇遇·金丝绒',     price: 40, intelligence: false },
  { id: '揽芳',               coins: '揽芳',               price: 40, intelligence: false },
  { id: '猫狗奇遇·慵眠',       coins: '猫狗奇遇·慵眠',       price: 40, intelligence: false },
  { id: '魅影蝶',             coins: '魅影蝶',             price: 40, intelligence: false },
  { id: '猫狗奇遇·璨阳',       coins: '猫狗奇遇·璨阳',       price: 40, intelligence: false },
  { id: '观山海·月仪',         coins: '观山海·月仪',         price: 40, intelligence: false },
  { id: '流云髻',             coins: '流云髻',             price: 40, intelligence: false },
  { id: '秋日序曲·清芬',       coins: '秋日序曲·清芬',       price: 40, intelligence: false },
  { id: '百战·傲采',           coins: '百战·傲采',           price: 40, intelligence: false },
  { id: '西行劫·灵鼠',         coins: '西行劫·灵鼠',         price: 40, intelligence: false },
  { id: '西行劫·蝎尾',         coins: '西行劫·蝎尾',         price: 40, intelligence: false },
  { id: '冰雪聪明',           coins: '冰雪聪明',           price: 40, intelligence: false },
  { id: '冬日绮韵·曜灵绾',     coins: '冬日绮韵·曜灵绾',     price: 40, intelligence: false },
  { id: '糖莓',               coins: '糖莓',               price: 40, intelligence: false },
  { id: '塔罗序·烬星',         coins: '塔罗序·烬星',         price: 40, intelligence: false },
  { id: '塔罗序·灵月',         coins: '塔罗序·灵月',         price: 40, intelligence: false },
  { id: '塔罗序·蜜语',         coins: '塔罗序·蜜语',         price: 40, intelligence: false },
  { id: '幽梦',               coins: '幽梦',               price: 40, intelligence: false },
  { id: '落梅',               coins: '落梅',               price: 40, intelligence: false },
  { id: '鸣扬',               coins: '鸣扬',               price: 40, intelligence: false },
  { id: '赤豆雪团',           coins: '赤豆雪团',           price: 40, intelligence: false },
  { id: '美食家·海盐卷',       coins: '美食家·海盐卷',       price: 40, intelligence: false },
  { id: '碧空',               coins: '碧空',               price: 40, intelligence: false },
  { id: '悠融',               coins: '悠融',               price: 40, intelligence: false },
  { id: '观山海·瑞宁',         coins: '观山海·瑞宁',         price: 40, intelligence: false },
  { id: '诗画四友·意竹',       coins: '诗画四友·意竹',       price: 40, intelligence: false },
  { id: '诗画四友·泛霞',       coins: '诗画四友·泛霞',       price: 40, intelligence: false },
  { id: '小队·诗画四友',       coins: '小队·诗画四友',       price: 40, intelligence: false },
  { id: '溢彩',               coins: '溢彩',               price: 40, intelligence: false },
  { id: '诗画四友·雁书',       coins: '诗画四友·雁书',       price: 40, intelligence: false },
  { id: '诗画四友·璎珞',       coins: '诗画四友·璎珞',       price: 40, intelligence: false },
  { id: '食月',               coins: '食月',               price: 40, intelligence: false },
  { id: '绀青云',             coins: '绀青云',             price: 40, intelligence: false },
  { id: '春日序曲·晚思',       coins: '春日序曲·晚思',       price: 40, intelligence: false },
  { id: '焚羽',               coins: '焚羽',               price: 40, intelligence: false },
  { id: '倒反阴阳·焚枷',       coins: '倒反阴阳·焚枷',       price: 40, intelligence: false },
  { id: '琴心',               coins: '琴心',               price: 40, intelligence: false },
  { id: '游园会',             coins: '游园会',             price: 40, intelligence: false },
  { id: '甜夜安眠·夜歌',       coins: '甜夜安眠·夜歌',       price: 40, intelligence: false },
  { id: '无间游戏·秘情',       coins: '无间游戏·秘情',       price: 40, intelligence: false },
  { id: '观山海·御日',         coins: '观山海·御日',         price: 40, intelligence: false },
  { id: '龙之道·笃行',         coins: '龙之道·笃行',         price: 40, intelligence: false },
  { id: '金石秘藏',           coins: '金石秘藏',           price: 40, intelligence: false },
  { id: '古岛异闻·紫鸢',       coins: '古岛异闻·紫鸢',       price: 40, intelligence: false },
  { id: '古岛异闻·幻生翼',     coins: '古岛异闻·幻生翼',     price: 40, intelligence: false },
  { id: '全职高手·秋痕',       coins: '全职高手·秋痕',       price: 40, intelligence: false },
  { id: '全职高手·孤叶',       coins: '全职高手·孤叶',       price: 40, intelligence: false },
  { id: '倒反阴阳·恣意',       coins: '倒反阴阳·恣意',       price: 40, intelligence: false },
  { id: '炉石传说·哇喔',       coins: '炉石传说·哇喔',       price: 40, intelligence: false },
  { id: '亚运·疾影',           coins: '亚运·疾影',           price: 40, intelligence: false },
  { id: '凤衔千丝',           coins: '凤衔千丝',           price: 40, intelligence: false },
  { id: '亚运·逐光',           coins: '亚运·逐光',           price: 40, intelligence: false },
  { id: '亚运·扬威',           coins: '亚运·扬威',           price: 40, intelligence: false },
  { id: '砥砺筋骨·韵动',       coins: '砥砺筋骨·韵动',       price: 40, intelligence: false },
  { id: '秦时明月·垂绾',       coins: '秦时明月·垂绾',       price: 40, intelligence: false },
  { id: '秉烛夜话·浮生',       coins: '秉烛夜话·浮生',       price: 40, intelligence: false },
  { id: '天行九歌·焰影',       coins: '天行九歌·焰影',       price: 40, intelligence: false },
  { id: '秦时明月·寒霜',       coins: '秦时明月·寒霜',       price: 40, intelligence: false },
  { id: '秦时明月·紫蔓垂缨',   coins: '秦时明月·紫蔓垂缨',   price: 40, intelligence: false },
  { id: '秉烛夜话·南音',       coins: '秉烛夜话·南音',       price: 40, intelligence: false },
  { id: '秦时明月·侠骨',       coins: '秦时明月·侠骨',       price: 40, intelligence: false },
  { id: '秉烛夜话·缄梦',       coins: '秉烛夜话·缄梦',       price: 40, intelligence: false },

  // 45 元档
  { id: '业舞',               coins: '业舞',               price: 45, intelligence: false },
  { id: '驰援',               coins: '驰援',               price: 45, intelligence: false },
  { id: '有求币应',           coins: '有求币应',           price: 45, intelligence: false },
  { id: '占领地盘',           coins: '占领地盘',           price: 45, intelligence: false },
  { id: '巳辰新禧·金螭帔',     coins: '巳辰新禧·金螭帔',     price: 45, intelligence: false },
  { id: '巳辰新禧·福神',       coins: '巳辰新禧·福神',       price: 45, intelligence: false },
  { id: '谪仙颂·梦狂',         coins: '谪仙颂·梦狂',         price: 45, intelligence: false },
  { id: '巳辰新禧·伞舞',       coins: '巳辰新禧·伞舞',       price: 45, intelligence: false },
  { id: '春日序曲·雪糕',       coins: '春日序曲·雪糕',       price: 45, intelligence: false },
  { id: '春日序曲·小狐狸',     coins: '春日序曲·小狐狸',     price: 45, intelligence: false },
  { id: '春日序曲·心跳信号',   coins: '春日序曲·心跳信号',   price: 45, intelligence: false },
  { id: '元气满满',           coins: '元气满满',           price: 45, intelligence: false },
  { id: '蓝莓奶冻',           coins: '蓝莓奶冻',           price: 45, intelligence: false },
  { id: '怦然心动·请收下',     coins: '怦然心动·请收下',     price: 45, intelligence: false },
  { id: '恶魔尾巴',           coins: '恶魔尾巴',           price: 45, intelligence: false },
  { id: '蜜桃泡芙',           coins: '蜜桃泡芙',           price: 45, intelligence: false },
  { id: '梦幻甜心',           coins: '梦幻甜心',           price: 45, intelligence: false },
  { id: '猫咪尾巴',           coins: '猫咪尾巴',           price: 45, intelligence: false },
  { id: '狗狗尾巴',           coins: '狗狗尾巴',           price: 45, intelligence: false },
  { id: '爱心支援',           coins: '爱心支援',           price: 45, intelligence: false },
  { id: '封神录·剑凝霜',       coins: '封神录·剑凝霜',       price: 45, intelligence: false },
  { id: '封神录·锦绫舞',       coins: '封神录·锦绫舞',       price: 45, intelligence: false },
  { id: '封神录·化生',         coins: '封神录·化生',         price: 45, intelligence: false },
  { id: '封神录·苍葭',         coins: '封神录·苍葭',         price: 45, intelligence: false },
  { id: '狂想曲',             coins: '狂想曲',             price: 45, intelligence: false },
  { id: '冷月',               coins: '冷月',               price: 45, intelligence: false },
  { id: '悍勇将',             coins: '悍勇将',             price: 45, intelligence: false },
  { id: '封神录·待潮',         coins: '封神录·待潮',         price: 45, intelligence: false },
  { id: '摇摆不挑曲',         coins: '摇摆不挑曲',         price: 45, intelligence: false },
  { id: '启寐',               coins: '启寐',               price: 45, intelligence: false },
  { id: '2674·贴心关怀',       coins: '2674·贴心关怀',       price: 45, intelligence: false },
  { id: '假意投降',           coins: '假意投降',           price: 45, intelligence: false },
  { id: '2674·电尾',           coins: '2674·电尾',           price: 45, intelligence: false },
  { id: '2674·漫摇',           coins: '2674·漫摇',           price: 45, intelligence: false },
  { id: '你没事吧',           coins: '你没事吧',           price: 45, intelligence: false },
  { id: '逆水寒·甜心方剂',     coins: '逆水寒·甜心方剂',     price: 45, intelligence: false },
  { id: '逆水寒·绚梦倾心',     coins: '逆水寒·绚梦倾心',     price: 45, intelligence: false },
  { id: '龙之意·虚',           coins: '龙之意·虚',           price: 45, intelligence: false },
  { id: '龙之意·飒',           coins: '龙之意·飒',           price: 45, intelligence: false },
  { id: '龙之意·洪拳',         coins: '龙之意·洪拳',         price: 45, intelligence: false },
  { id: '龙之意·醉拳',         coins: '龙之意·醉拳',         price: 45, intelligence: false },
  { id: '清摇',               coins: '清摇',               price: 45, intelligence: false },
  { id: '利刃出鞘',           coins: '利刃出鞘',           price: 45, intelligence: false },
  { id: '龙之意·劲',           coins: '龙之意·劲',           price: 45, intelligence: false },
  { id: '龙之意·霸',           coins: '龙之意·霸',           price: 45, intelligence: false },
  { id: '河图戏鲤',           coins: '河图戏鲤',           price: 45, intelligence: false },
  { id: '共游画间',           coins: '共游画间',           price: 45, intelligence: false },
  { id: '无间游戏·断魂',       coins: '无间游戏·断魂',       price: 45, intelligence: false },
  { id: '彻夜摇光',           coins: '彻夜摇光',           price: 45, intelligence: false },
  { id: '彻夜摇音',           coins: '彻夜摇音',           price: 45, intelligence: false },
  { id: '猫狗奇遇·金箔',       coins: '猫狗奇遇·金箔',       price: 45, intelligence: false },
  { id: '猫狗奇遇·喵爪舞',     coins: '猫狗奇遇·喵爪舞',     price: 45, intelligence: false },
  { id: '甜心爪爪',           coins: '甜心爪爪',           price: 45, intelligence: false },
  { id: '摇香',               coins: '摇香',               price: 45, intelligence: false },
  { id: '天女散花',           coins: '天女散花',           price: 45, intelligence: false },
  { id: '挥刀',               coins: '挥刀',               price: 45, intelligence: false },
  { id: '猫狗奇遇·雪茸',       coins: '猫狗奇遇·雪茸',       price: 45, intelligence: false },
  { id: '扭扭乐',             coins: '扭扭乐',             price: 45, intelligence: false },
  { id: '猫狗奇遇·挠挠',       coins: '猫狗奇遇·挠挠',       price: 45, intelligence: false },
  { id: '猫狗奇遇·傲娇小哈',   coins: '猫狗奇遇·傲娇小哈',   price: 45, intelligence: false },
  { id: '刀术',               coins: '刀术',               price: 45, intelligence: false },
  { id: '爷胡了',             coins: '爷胡了',             price: 45, intelligence: false },
  { id: '猫狗奇遇·烫手飞盘',   coins: '猫狗奇遇·烫手飞盘',   price: 45, intelligence: false },
  { id: '猫狗奇遇·橘豆',       coins: '猫狗奇遇·橘豆',       price: 45, intelligence: false },
  { id: '拭心',               coins: '拭心',               price: 45, intelligence: false },
  { id: '神辉',               coins: '神辉',               price: 45, intelligence: false },
  { id: '甜夜安眠·绸光轻旋',   coins: '甜夜安眠·绸光轻旋',   price: 45, intelligence: false },
  { id: '乐动',               coins: '乐动',               price: 45, intelligence: false },
  { id: '轻舞',               coins: '轻舞',               price: 45, intelligence: false },
  { id: '西行劫·铃音',         coins: '西行劫·铃音',         price: 45, intelligence: false },
  { id: '竞渡摇',             coins: '竞渡摇',             price: 45, intelligence: false },
  { id: '第一刀',             coins: '第一刀',             price: 45, intelligence: false },
  { id: '天使曼舞',           coins: '天使曼舞',           price: 45, intelligence: false },
  { id: '冬日跃动',           coins: '冬日跃动',           price: 45, intelligence: false },
  { id: '焰灵吐息',           coins: '焰灵吐息',           price: 45, intelligence: false },
  { id: '动天雷引',           coins: '动天雷引',           price: 45, intelligence: false },
  { id: '请你尝尝',           coins: '请你尝尝',           price: 45, intelligence: false },
  { id: '塔罗序·奥秘之月',     coins: '塔罗序·奥秘之月',     price: 45, intelligence: false },
  { id: '浮浪鸟',             coins: '浮浪鸟',             price: 45, intelligence: false },
  { id: '绣球戏',             coins: '绣球戏',             price: 45, intelligence: false },
  { id: '灵翩',               coins: '灵翩',               price: 45, intelligence: false },
  { id: '洛天依·星光律动',     coins: '洛天依·星光律动',     price: 45, intelligence: false },
  { id: '快快生长',           coins: '快快生长',           price: 45, intelligence: false },
  { id: '美食家·独酌',         coins: '美食家·独酌',         price: 45, intelligence: false },
  { id: '边走边摇',           coins: '边走边摇',           price: 45, intelligence: false },
  { id: '爱意直递',           coins: '爱意直递',           price: 45, intelligence: false },
  { id: '接收爱意',           coins: '接收爱意',           price: 45, intelligence: false },
  { id: '观山海·飞鸣',         coins: '观山海·飞鸣',         price: 45, intelligence: false },
  { id: '滑溜溜',             coins: '滑溜溜',             price: 45, intelligence: false },
  { id: '扇引筠青',           coins: '扇引筠青',           price: 45, intelligence: false },
  { id: '不妥',               coins: '不妥',               price: 45, intelligence: false },
  { id: '准了',               coins: '准了',               price: 45, intelligence: false },
  { id: '甜夜安眠·银辉小熊',   coins: '甜夜安眠·银辉小熊',   price: 45, intelligence: false },
  { id: '心动',               coins: '心动',               price: 45, intelligence: false },
  { id: '心动奇袭',           coins: '心动奇袭',           price: 45, intelligence: false },
  { id: '怦然心动·跃动',       coins: '怦然心动·跃动',       price: 45, intelligence: false },
  { id: '离卷魂',             coins: '离卷魂',             price: 45, intelligence: false },
  { id: '观山海·悬日',         coins: '观山海·悬日',         price: 45, intelligence: false },
  { id: '夏日派对·防晒喷雾',   coins: '夏日派对·防晒喷雾',   price: 45, intelligence: false },
  { id: '龙之意·游身八卦掌',   coins: '龙之意·游身八卦掌',   price: 45, intelligence: false },
  { id: '甜夜安眠·小憩',       coins: '甜夜安眠·小憩',       price: 45, intelligence: false },
  { id: '古岛异闻·百幻翼',     coins: '古岛异闻·百幻翼',     price: 45, intelligence: false },
  { id: '广播体操',           coins: '广播体操',           price: 45, intelligence: false },
  { id: '一赞再赞',           coins: '一赞再赞',           price: 45, intelligence: false },
  { id: '天行九歌·焰灵迷舞',   coins: '天行九歌·焰灵迷舞',   price: 45, intelligence: false },
  { id: '跳舞不是罪过',       coins: '跳舞不是罪过',       price: 45, intelligence: false },
  { id: '爱',                 coins: '爱',                 price: 45, intelligence: false },

  // 50~300 元档
  { id: '争斗洪流语音包',     coins: '争斗洪流语音包',     price: 50,  intelligence: false },
  { id: '长歌诗韵·鱼龙舞',     coins: '长歌诗韵·鱼龙舞',     price: 50,  intelligence: false },
  { id: '恋念私语语音包',     coins: '恋念私语语音包',     price: 50,  intelligence: false },
  { id: '软暖甜梦语音包',     coins: '软暖甜梦语音包',     price: 50,  intelligence: false },
  { id: '季莹莹·音律织光语音包', coins: '季莹莹·音律织光语音包', price: 50, intelligence: false },
  { id: '炉石传说·卡包',       coins: '炉石传说·卡包',       price: 50,  intelligence: false },
  { id: '卫庄语音包',         coins: '卫庄语音包',         price: 50,  intelligence: false },
  { id: '焰灵姬语音包',       coins: '焰灵姬语音包',       price: 50,  intelligence: false },
  { id: '盖聂语音包',         coins: '盖聂语音包',         price: 50,  intelligence: false },
  { id: '赤练语音包',         coins: '赤练语音包',         price: 50,  intelligence: false },
  { id: '踏山河捆绑包',       coins: '踏山河捆绑包',       price: 52,  intelligence: false },
  { id: '藏宝礁',             coins: '藏宝礁',             price: 60,  intelligence: false },
  { id: '幻狸',               coins: '幻狸',               price: 60,  intelligence: false },
  { id: '丰饶莲座',           coins: '丰饶莲座',           price: 60,  intelligence: false },
  { id: '铸神·庚辰角',         coins: '铸神·庚辰角',         price: 60,  intelligence: false },
  { id: '铸神·冥狼冠',         coins: '铸神·冥狼冠',         price: 60,  intelligence: false },
  { id: '谪仙颂·鹤鸣',         coins: '谪仙颂·鹤鸣',         price: 60,  intelligence: false },
  { id: '春日序曲·绵糖兔',     coins: '春日序曲·绵糖兔',     price: 60,  intelligence: false },
  { id: '春日序曲·千金眼镜',   coins: '春日序曲·千金眼镜',   price: 60,  intelligence: false },
  { id: '蕾丝兔耳',           coins: '蕾丝兔耳',           price: 60,  intelligence: false },
  { id: '澹紫花座',           coins: '澹紫花座',           price: 60,  intelligence: false },
  { id: '草莓猫耳',           coins: '草莓猫耳',           price: 60,  intelligence: false },
  { id: '封神录·麒麟座',       coins: '封神录·麒麟座',       price: 60,  intelligence: false },
  { id: '铸吟台',             coins: '铸吟台',             price: 60,  intelligence: false },
  { id: '逆水寒·炽翎焰冠',     coins: '逆水寒·炽翎焰冠',     price: 60,  intelligence: false },
  { id: '封神录·怒莲',         coins: '封神录·怒莲',         price: 60,  intelligence: false },
  { id: '封神录·雪鳞龙',       coins: '封神录·雪鳞龙',       price: 60,  intelligence: false },
  { id: '安眠台',             coins: '安眠台',             price: 60,  intelligence: false },
  { id: '2674·悬浮喵',         coins: '2674·悬浮喵',         price: 60,  intelligence: false },
  { id: '2674·析音耳',         coins: '2674·析音耳',         price: 60,  intelligence: false },
  { id: '2674·信息镜',         coins: '2674·信息镜',         price: 60,  intelligence: false },
  { id: '观山海·听风',         coins: '观山海·听风',         price: 60,  intelligence: false },
  { id: '幻梦奇谭·雅奢',       coins: '幻梦奇谭·雅奢',       price: 60,  intelligence: false },
  { id: '幻梦奇谭·明焰',       coins: '幻梦奇谭·明焰',       price: 60,  intelligence: false },
  { id: '逆水寒·镜目如炬',     coins: '逆水寒·镜目如炬',     price: 60,  intelligence: false },
  { id: '逆水寒·俏语玲珑',     coins: '逆水寒·俏语玲珑',     price: 60,  intelligence: false },
  { id: '暗色镜框',           coins: '暗色镜框',           price: 60,  intelligence: false },
  { id: '龙之景·墨染九霄',     coins: '龙之景·墨染九霄',     price: 60,  intelligence: false },
  { id: '冬日绮韵·糖梦',       coins: '冬日绮韵·糖梦',       price: 60,  intelligence: false },
  { id: '绿野守护·滚滚',       coins: '绿野守护·滚滚',       price: 60,  intelligence: false },
  { id: '万千星',             coins: '万千星',             price: 60,  intelligence: false },
  { id: '卷落青台',           coins: '卷落青台',           price: 60,  intelligence: false },
  { id: '无间游戏·通讯器',     coins: '无间游戏·通讯器',     price: 60,  intelligence: false },
  { id: '雷爪惊霆',           coins: '雷爪惊霆',           price: 60,  intelligence: false },
  { id: '猫狗奇遇·金吉拉',     coins: '猫狗奇遇·金吉拉',     price: 60,  intelligence: false },
  { id: '万谷生',             coins: '万谷生',             price: 60,  intelligence: false },
  { id: '猫狗奇遇·波斯猫',     coins: '猫狗奇遇·波斯猫',     price: 60,  intelligence: false },
  { id: '猫狗奇遇·逗柴',       coins: '猫狗奇遇·逗柴',       price: 60,  intelligence: false },
  { id: '瑶枝烛梦',           coins: '瑶枝烛梦',           price: 60,  intelligence: false },
  { id: '百战·御冕',           coins: '百战·御冕',           price: 60,  intelligence: false },
  { id: '秘法台',             coins: '秘法台',             price: 60,  intelligence: false },
  { id: '缎光蜜语',           coins: '缎光蜜语',           price: 60,  intelligence: false },
  { id: '曦庭',               coins: '曦庭',               price: 60,  intelligence: false },
  { id: '暖居闲适捆绑包',     coins: '暖居闲适捆绑包',     price: 60,  intelligence: false },
  { id: '混沌洲',             coins: '混沌洲',             price: 60,  intelligence: false },
  { id: '鹅绒软帐',           coins: '鹅绒软帐',           price: 60,  intelligence: false },
  { id: '共赴无间·青芝盏',     coins: '共赴无间·青芝盏',     price: 60,  intelligence: false },
  { id: '魂灵台',             coins: '魂灵台',             price: 60,  intelligence: false },
  { id: '无间游戏·珍珠礼帽',   coins: '无间游戏·珍珠礼帽',   price: 60,  intelligence: false },
  { id: '电量不足',           coins: '电量不足',           price: 60,  intelligence: false },
  { id: '观山海·旭光',         coins: '观山海·旭光',         price: 60,  intelligence: false },
  { id: '瀛波玉台',           coins: '瀛波玉台',           price: 60,  intelligence: false },
  { id: '百战·终端面甲',       coins: '百战·终端面甲',       price: 60,  intelligence: false },
  { id: '砥砺筋骨·遮阳帽',     coins: '砥砺筋骨·遮阳帽',     price: 60,  intelligence: false },
  { id: '凌峰无界捆绑包',     coins: '凌峰无界捆绑包',     price: 60,  intelligence: false },
  { id: '喷绘飞艇',           coins: '喷绘飞艇',           price: 60,  intelligence: false },
  { id: '秉烛夜话·心蚀幻阵',   coins: '秉烛夜话·心蚀幻阵',   price: 60,  intelligence: false },
  { id: '秦时明月·天下棋局',   coins: '秦时明月·天下棋局',   price: 60,  intelligence: false },
  { id: '破劫·墨梅云台',       coins: '破劫·墨梅云台',       price: 60,  intelligence: false },
  { id: '红绒冬暖捆绑包',     coins: '红绒冬暖捆绑包',     price: 65,  intelligence: false },
  { id: '炽切',               coins: '炽切',               price: 65,  intelligence: false },
  { id: '秦时明月·归朴',       coins: '秦时明月·归朴',       price: 65,  intelligence: false },
  { id: '秉烛夜话·绛心秘契',   coins: '秉烛夜话·绛心秘契',   price: 65,  intelligence: false },

  // 75 元档
  { id: '击苍穹',             coins: '击苍穹',             price: 75,  intelligence: false },
  { id: '鲸歌',               coins: '鲸歌',               price: 75,  intelligence: false },
  { id: '阴阳师·月戟',         coins: '阴阳师·月戟',         price: 75,  intelligence: false },
  { id: '雪残梅',             coins: '雪残梅',             price: 75,  intelligence: false },
  { id: '寒冰胆',             coins: '寒冰胆',             price: 75,  intelligence: false },
  { id: '扶棠雪',             coins: '扶棠雪',             price: 75,  intelligence: false },
  { id: '抱歉啦',             coins: '抱歉啦',             price: 75,  intelligence: false },
  { id: '谪仙颂·太白',         coins: '谪仙颂·太白',         price: 75,  intelligence: false },
  { id: '冰辉',               coins: '冰辉',               price: 75,  intelligence: false },
  { id: '光威之矛',           coins: '光威之矛',           price: 75,  intelligence: false },
  { id: '拂雪绒',             coins: '拂雪绒',             price: 75,  intelligence: false },
  { id: '墨绒羽扇',           coins: '墨绒羽扇',           price: 75,  intelligence: false },
  { id: '鹫影',               coins: '鹫影',               price: 75,  intelligence: false },
  { id: '夜火泣',             coins: '夜火泣',             price: 75,  intelligence: false },
  { id: '逆水寒·骁野',         coins: '逆水寒·骁野',         price: 75,  intelligence: false },
  { id: '捉影',               coins: '捉影',               price: 75,  intelligence: false },
  { id: '2674·流音',           coins: '2674·流音',           price: 75,  intelligence: false },
  { id: '金曜',               coins: '金曜',               price: 75,  intelligence: false },
  { id: '逆水寒·狂夜瑰语',     coins: '逆水寒·狂夜瑰语',     price: 75,  intelligence: false },
  { id: '逆水寒·瑾鸣',         coins: '逆水寒·瑾鸣',         price: 75,  intelligence: false },
  { id: '烈狂',               coins: '烈狂',               price: 75,  intelligence: false },
  { id: '虎摆',               coins: '虎摆',               price: 75,  intelligence: false },
  { id: '盗墓笔记·黑金古刀',   coins: '盗墓笔记·黑金古刀',   price: 75,  intelligence: false },
  { id: '芝士披萨',           coins: '芝士披萨',           price: 75,  intelligence: false },
  { id: '双赫炎',             coins: '双赫炎',             price: 75,  intelligence: false },
  { id: '猫狗奇遇·铃铛猫',     coins: '猫狗奇遇·铃铛猫',     price: 75,  intelligence: false },
  { id: '星辉环月',           coins: '星辉环月',           price: 75,  intelligence: false },
  { id: '翠虬',               coins: '翠虬',               price: 75,  intelligence: false },
  { id: '手术刀',             coins: '手术刀',             price: 75,  intelligence: false },
  { id: '落乌',               coins: '落乌',               price: 75,  intelligence: false },
  { id: '镇殃',               coins: '镇殃',               price: 75,  intelligence: false },
  { id: '羽毛球拍',           coins: '羽毛球拍',           price: 75,  intelligence: false },
  { id: '镇恶',               coins: '镇恶',               price: 75,  intelligence: false },
  { id: '挽星',               coins: '挽星',               price: 75,  intelligence: false },
  { id: '偶像手杖',           coins: '偶像手杖',           price: 75,  intelligence: false },
  { id: '【挑染】甜夜安眠·夕霞', coins: '【挑染】甜夜安眠·夕霞', price: 75, intelligence: false },
  { id: '无间游戏·缚云锦',     coins: '无间游戏·缚云锦',     price: 75,  intelligence: false },
  { id: '朱嵌',               coins: '朱嵌',               price: 75,  intelligence: false },
  { id: '咯咯',               coins: '咯咯',               price: 75,  intelligence: false },
  { id: '咕咕',               coins: '咕咕',               price: 75,  intelligence: false },
  { id: '白狩',               coins: '白狩',               price: 75,  intelligence: false },
  { id: '木澜钓竿',           coins: '木澜钓竿',           price: 75,  intelligence: false },
  { id: '衔曜',               coins: '衔曜',               price: 75,  intelligence: false },
  { id: '亚运·扶摇金羽',       coins: '亚运·扶摇金羽',       price: 75,  intelligence: false },
  { id: '秦时明月·鲨齿',       coins: '秦时明月·鲨齿',       price: 75,  intelligence: false },
  { id: '我在永劫很想你',     coins: '我在永劫很想你',     price: 75,  intelligence: false },
  { id: '秉烛夜话·赤蕊凝寒',   coins: '秉烛夜话·赤蕊凝寒',   price: 75,  intelligence: false },
  { id: '破劫·断界',           coins: '破劫·断界',           price: 75,  intelligence: false },
  { id: '秦时明月·链蛇软剑',   coins: '秦时明月·链蛇软剑',   price: 75,  intelligence: false },
  { id: '巳辰新禧·真武捆绑包', coins: '巳辰新禧·真武捆绑包', price: 78,  intelligence: false },

  // 90 元及以上外观/武器
  { id: '霜天红叶',           coins: '霜天红叶',           price: 90,  intelligence: false },
  { id: '狂虎',               coins: '狂虎',               price: 90,  intelligence: false },
  { id: '狂虎捆绑包',         coins: '狂虎捆绑包',         price: 90,  intelligence: false },
  { id: '夜吻捆绑包',         coins: '夜吻捆绑包',         price: 90,  intelligence: false },
  { id: '承云兰寿',           coins: '承云兰寿',           price: 90,  intelligence: false },
  { id: '夜吻',               coins: '夜吻',               price: 90,  intelligence: false },
  { id: '浣烟纱捆绑包',       coins: '浣烟纱捆绑包',       price: 90,  intelligence: false },
  { id: '浣烟纱',             coins: '浣烟纱',             price: 90,  intelligence: false },
  { id: '铸神·冥天魂使',       coins: '铸神·冥天魂使',       price: 90,  intelligence: false },
  { id: '千秋匠心·素瓷',       coins: '千秋匠心·素瓷',       price: 90,  intelligence: false },
  { id: '兰庭月',             coins: '兰庭月',             price: 90,  intelligence: false },
  { id: '兰庭月捆绑包',       coins: '兰庭月捆绑包',       price: 90,  intelligence: false },
  { id: '巳辰新禧·西王母',     coins: '巳辰新禧·西王母',     price: 90,  intelligence: false },
  { id: '巳辰新禧·真武',       coins: '巳辰新禧·真武',       price: 90,  intelligence: false },
  { id: '春日序曲·朝颜',       coins: '春日序曲·朝颜',       price: 90,  intelligence: false },
  { id: '春日序曲·协光',       coins: '春日序曲·协光',       price: 90,  intelligence: false },
  { id: '协光捆绑包',         coins: '协光捆绑包',         price: 90,  intelligence: false },
  { id: '春日序曲·赤羽',       coins: '春日序曲·赤羽',       price: 90,  intelligence: false },
  { id: '春日序曲·寒芷',       coins: '春日序曲·寒芷',       price: 90,  intelligence: false },
  { id: '春日序曲·晨风',       coins: '春日序曲·晨风',       price: 90,  intelligence: false },
  { id: '封神录·黄飞虎',       coins: '封神录·黄飞虎',       price: 90,  intelligence: false },
  { id: '封神录·琼霄娘娘',     coins: '封神录·琼霄娘娘',     price: 90,  intelligence: false },
  { id: '封神录·闻仲',         coins: '封神录·闻仲',         price: 90,  intelligence: false },
  { id: '黄飞虎捆绑包',       coins: '黄飞虎捆绑包',       price: 90,  intelligence: false },
  { id: '封神录·碧霄娘娘',     coins: '封神录·碧霄娘娘',     price: 90,  intelligence: false },
  { id: '闻仲捆绑包',         coins: '闻仲捆绑包',         price: 90,  intelligence: false },
  { id: '决战平安京·梦枕',     coins: '决战平安京·梦枕',     price: 90,  intelligence: false },
  { id: '2674·溯时之流',       coins: '2674·溯时之流',       price: 90,  intelligence: false },
  { id: '2674·暗夜狂掠',       coins: '2674·暗夜狂掠',       price: 90,  intelligence: false },
  { id: '暗夜狂掠捆绑包',     coins: '暗夜狂掠捆绑包',     price: 90,  intelligence: false },
  { id: '幻梦奇谭·街角余火',   coins: '幻梦奇谭·街角余火',   price: 90,  intelligence: false },
  { id: '逆水寒·温语愈心',     coins: '逆水寒·温语愈心',     price: 90,  intelligence: false },
  { id: '逆水寒·雕骨琢心',     coins: '逆水寒·雕骨琢心',     price: 90,  intelligence: false },
  { id: '怦然心动·软暖甜梦',   coins: '怦然心动·软暖甜梦',   price: 90,  intelligence: false },
  { id: '天钿女命',           coins: '天钿女命',           price: 90,  intelligence: false },
  { id: '冬日绮韵·洋娃娃',     coins: '冬日绮韵·洋娃娃',     price: 90,  intelligence: false },
  { id: '决战平安京·不祥绯刃', coins: '决战平安京·不祥绯刃', price: 90,  intelligence: false },
  { id: '瑛舞',               coins: '瑛舞',               price: 90,  intelligence: false },
  { id: '流辉夜咏',           coins: '流辉夜咏',           price: 90,  intelligence: false },
  { id: '花沢',               coins: '花沢',               price: 90,  intelligence: false },
  { id: '无间游戏·佣兵17',     coins: '无间游戏·佣兵17',     price: 90,  intelligence: false },
  { id: '猫狗奇遇·软耳绒喵',   coins: '猫狗奇遇·软耳绒喵',   price: 90,  intelligence: false },
  { id: '猫狗奇遇·蓬蓬清雪',   coins: '猫狗奇遇·蓬蓬清雪',   price: 90,  intelligence: false },
  { id: '猫狗奇遇·电柴悦动',   coins: '猫狗奇遇·电柴悦动',   price: 90,  intelligence: false },
  { id: '断魂仙',             coins: '断魂仙',             price: 90,  intelligence: false },
  { id: '断魂仙捆绑包',       coins: '断魂仙捆绑包',       price: 90,  intelligence: false },
  { id: '霜鸿',               coins: '霜鸿',               price: 90,  intelligence: false },
  { id: '观山海·常羲',         coins: '观山海·常羲',         price: 90,  intelligence: false },
  { id: '璇枢素手',           coins: '璇枢素手',           price: 90,  intelligence: false },
  { id: '常羲捆绑包',         coins: '常羲捆绑包',         price: 90,  intelligence: false },
  { id: '璇枢素手捆绑包',     coins: '璇枢素手捆绑包',     price: 90,  intelligence: false },
  { id: '翩云捆绑包',         coins: '翩云捆绑包',         price: 90,  intelligence: false },
  { id: '秋日序曲·翩云',       coins: '秋日序曲·翩云',       price: 90,  intelligence: false },
  { id: '秋日裁',             coins: '秋日裁',             price: 90,  intelligence: false },
  { id: '百战·执金',           coins: '百战·执金',           price: 90,  intelligence: false },
  { id: '冬日绮韵·红绒冬暖',   coins: '冬日绮韵·红绒冬暖',   price: 90,  intelligence: false },
  { id: '莓果甜霜',           coins: '莓果甜霜',           price: 90,  intelligence: false },
  { id: '塔罗序·恶魔',         coins: '塔罗序·恶魔',         price: 90,  intelligence: false },
  { id: '塔罗序·恋人',         coins: '塔罗序·恋人',         price: 90,  intelligence: false },
  { id: '塔罗恋人捆绑包',     coins: '塔罗恋人捆绑包',     price: 90,  intelligence: false },
  { id: '塔罗序·女祭司',       coins: '塔罗序·女祭司',       price: 90,  intelligence: false },
  { id: '塔罗心火捆绑包',     coins: '塔罗心火捆绑包',     price: 90,  intelligence: false },
  { id: '元夕绒彩',           coins: '元夕绒彩',           price: 90,  intelligence: false },
  { id: '缚苍射斗',           coins: '缚苍射斗',           price: 90,  intelligence: false },
  { id: '元夕绒彩捆绑包',     coins: '元夕绒彩捆绑包',     price: 90,  intelligence: false },
  { id: '砥砺筋骨·金牌门将',   coins: '砥砺筋骨·金牌门将',   price: 90,  intelligence: false },
  { id: '扰清梦·亭亭清绝',     coins: '扰清梦·亭亭清绝',     price: 90,  intelligence: false },
  { id: '扰清梦·薄春衫',       coins: '扰清梦·薄春衫',       price: 90,  intelligence: false },
  { id: '薄荷黑巧捆绑包',     coins: '薄荷黑巧捆绑包',     price: 90,  intelligence: false },
  { id: '金牌门将捆绑包',     coins: '金牌门将捆绑包',     price: 90,  intelligence: false },
  { id: '美食家·薄荷黑巧',     coins: '美食家·薄荷黑巧',     price: 90,  intelligence: false },
  { id: '暖居闲适',           coins: '暖居闲适',           price: 90,  intelligence: false },
  { id: '漾金菊捆绑包',       coins: '漾金菊捆绑包',       price: 90,  intelligence: false },
  { id: '诗画四友·漾金菊',     coins: '诗画四友·漾金菊',     price: 90,  intelligence: false },
  { id: '春坞梅捆绑包',       coins: '春坞梅捆绑包',       price: 90,  intelligence: false },
  { id: '诗画四友·春坞梅',     coins: '诗画四友·春坞梅',     price: 90,  intelligence: false },
  { id: '诗画四友·明风竹',     coins: '诗画四友·明风竹',     price: 90,  intelligence: false },
  { id: '诗画四友·谢庭兰',     coins: '诗画四友·谢庭兰',     price: 90,  intelligence: false },
  { id: '明风竹捆绑包',       coins: '明风竹捆绑包',       price: 90,  intelligence: false },
  { id: '枫暮染',             coins: '枫暮染',             price: 90,  intelligence: false },
  { id: '枫暮染捆绑包',       coins: '枫暮染捆绑包',       price: 90,  intelligence: false },
  { id: '春日序曲·月野',       coins: '春日序曲·月野',       price: 90,  intelligence: false },
  { id: '月野捆绑包',         coins: '月野捆绑包',         price: 90,  intelligence: false },
  { id: '怦然心动·音律织光',   coins: '怦然心动·音律织光',   price: 90,  intelligence: false },
  { id: '甜夜安眠·碎月缎光',   coins: '甜夜安眠·碎月缎光',   price: 90,  intelligence: false },
  { id: '掌夜者捆绑包',       coins: '掌夜者捆绑包',       price: 90,  intelligence: false },
  { id: '甜夜安眠·琉璃香槟',   coins: '甜夜安眠·琉璃香槟',   price: 90,  intelligence: false },
  { id: '琉璃香槟捆绑包',     coins: '琉璃香槟捆绑包',     price: 90,  intelligence: false },
  { id: '无间游戏·掌夜者',     coins: '无间游戏·掌夜者',     price: 90,  intelligence: false },
  { id: '观山海·羲和',         coins: '观山海·羲和',         price: 90,  intelligence: false },
  { id: '古岛异闻·越海蝶',     coins: '古岛异闻·越海蝶',     price: 90,  intelligence: false },
  { id: '全职高手·散人',       coins: '全职高手·散人',       price: 90,  intelligence: false },
  { id: '散人捆绑包',         coins: '散人捆绑包',         price: 90,  intelligence: false },
  { id: '百战·雷曜之芯',       coins: '百战·雷曜之芯',       price: 90,  intelligence: false },
  { id: '破晓无畏捆绑包',     coins: '破晓无畏捆绑包',     price: 90,  intelligence: false },
  { id: '亚运·破晓无畏',       coins: '亚运·破晓无畏',       price: 90,  intelligence: false },
  { id: '亚运·锋芒无拘',       coins: '亚运·锋芒无拘',       price: 90,  intelligence: false },
  { id: '亚运·踏山河',         coins: '亚运·踏山河',         price: 90,  intelligence: false },
  { id: '锋芒无拘捆绑包',     coins: '锋芒无拘捆绑包',     price: 90,  intelligence: false },
  { id: '砥砺筋骨·最妙后援',   coins: '砥砺筋骨·最妙后援',   price: 90,  intelligence: false },
  { id: '秉烛夜话·墨刃裁魂',   coins: '秉烛夜话·墨刃裁魂',   price: 90,  intelligence: false },
  { id: '秦时明月·赤练',       coins: '秦时明月·赤练',       price: 90,  intelligence: false },
  { id: '木曜捆绑包',         coins: '木曜捆绑包',         price: 90,  intelligence: false },
  { id: '秉烛夜话·青衣悬丝',   coins: '秉烛夜话·青衣悬丝',   price: 90,  intelligence: false },
  { id: '秦时明月·卫庄',       coins: '秦时明月·卫庄',       price: 90,  intelligence: false },
  { id: '秦时明月·木曜',       coins: '秦时明月·木曜',       price: 90,  intelligence: false },
  { id: '青衣悬丝捆绑包',     coins: '青衣悬丝捆绑包',     price: 90,  intelligence: false },
  { id: '碧裳幽影捆绑包',     coins: '碧裳幽影捆绑包',     price: 90,  intelligence: false },
  { id: '秦时明月·盖聂',       coins: '秦时明月·盖聂',       price: 90,  intelligence: false },
  { id: '天行九歌·焰灵姬',     coins: '天行九歌·焰灵姬',     price: 90,  intelligence: false },
  { id: '秉烛夜话·瓷梦绮罗',   coins: '秉烛夜话·瓷梦绮罗',   price: 90,  intelligence: false },
  { id: '秉烛夜话·碧裳幽影',   coins: '秉烛夜话·碧裳幽影',   price: 90,  intelligence: false },
  { id: '瓷梦绮罗捆绑包',     coins: '瓷梦绮罗捆绑包',     price: 90,  intelligence: false },

  // 95 元以上
  { id: '灵心捆绑包',         coins: '灵心捆绑包',         price: 95,   intelligence: false },
  { id: '羲和捆绑包',         coins: '羲和捆绑包',         price: 95,   intelligence: false },
  { id: '求索捆绑包',         coins: '求索捆绑包',         price: 95,   intelligence: false },
  { id: '鸦鸣',               coins: '鸦鸣',               price: 100,  intelligence: false },
  { id: '百战·破荆者',         coins: '百战·破荆者',         price: 100,  intelligence: false },
  { id: '绿野守护·竹萌',       coins: '绿野守护·竹萌',       price: 100,  intelligence: false },
  { id: '咪的呼唤',           coins: '咪的呼唤',           price: 100,  intelligence: false },
  { id: '吊瓶战徽',           coins: '吊瓶战徽',           price: 100,  intelligence: false },
  { id: '汪气护体',           coins: '汪气护体',           price: 100,  intelligence: false },
  { id: '莓果甜霜捆绑包',     coins: '莓果甜霜捆绑包',     price: 100,  intelligence: false },
  { id: '塔罗远见捆绑包',     coins: '塔罗远见捆绑包',     price: 100,  intelligence: false },
  { id: '心动共振',           coins: '心动共振',           price: 100,  intelligence: false },
  { id: '谢庭兰捆绑包',       coins: '谢庭兰捆绑包',       price: 100,  intelligence: false },
  { id: '恋晶',               coins: '恋晶',               price: 100,  intelligence: false },
  { id: '眠云',               coins: '眠云',               price: 100,  intelligence: false },
  { id: '雷曜之芯捆绑包',     coins: '雷曜之芯捆绑包',     price: 100,  intelligence: false },
  { id: '西行志·猿魂',         coins: '西行志·猿魂',         price: 100,  intelligence: false },
  { id: '最妙后援捆绑包',     coins: '最妙后援捆绑包',     price: 100,  intelligence: false },
  { id: '软暖甜梦捆绑包',     coins: '软暖甜梦捆绑包',     price: 105,  intelligence: false },
  { id: '逐日捆绑包',         coins: '逐日捆绑包',         price: 105,  intelligence: false },
  { id: '佣兵17捆绑包',       coins: '佣兵17捆绑包',       price: 110,  intelligence: false },
  { id: '越海蝶捆绑包',       coins: '越海蝶捆绑包',       price: 110,  intelligence: false },
  { id: '盖聂捆绑包',         coins: '盖聂捆绑包',         price: 110,  intelligence: false },
  { id: '赤练捆绑包',         coins: '赤练捆绑包',         price: 110,  intelligence: false },
  { id: '卫庄捆绑包',         coins: '卫庄捆绑包',         price: 110,  intelligence: false },
  { id: '焰灵姬捆绑包',       coins: '焰灵姬捆绑包',       price: 110,  intelligence: false },
  { id: '软耳绒喵捆绑包',     coins: '软耳绒喵捆绑包',     price: 115,  intelligence: false },
  { id: '蓬蓬清雪捆绑包',     coins: '蓬蓬清雪捆绑包',     price: 115,  intelligence: false },
  { id: '电柴悦动捆绑包',     coins: '电柴悦动捆绑包',     price: 115,  intelligence: false },
  { id: '碎月缎光捆绑包',     coins: '碎月缎光捆绑包',     price: 115,  intelligence: false },
  { id: '承云兰寿捆绑包',     coins: '承云兰寿捆绑包',     price: 118,  intelligence: false },
  { id: '千秋匠心·青枝瓷',     coins: '千秋匠心·青枝瓷',     price: 120,  intelligence: false },
  { id: '寒芷捆绑包',         coins: '寒芷捆绑包',         price: 120,  intelligence: false },
  { id: '赤羽捆绑包',         coins: '赤羽捆绑包',         price: 120,  intelligence: false },
  { id: '朝颜捆绑包',         coins: '朝颜捆绑包',         price: 120,  intelligence: false },
  { id: '碧霄娘娘捆绑包',     coins: '碧霄娘娘捆绑包',     price: 120,  intelligence: false },
  { id: '琼霄娘娘捆绑包',     coins: '琼霄娘娘捆绑包',     price: 120,  intelligence: false },
  { id: '逆水寒·凤亭骁野',     coins: '逆水寒·凤亭骁野',     price: 120,  intelligence: false },
  { id: '决战平安京·恋念私语', coins: '决战平安京·恋念私语', price: 120,  intelligence: false },
  { id: '街角余火捆绑包',     coins: '街角余火捆绑包',     price: 120,  intelligence: false },
  { id: '龙之道·自知',         coins: '龙之道·自知',         price: 120,  intelligence: false },
  { id: '龙之道·求真',         coins: '龙之道·求真',         price: 120,  intelligence: false },
  { id: '冬日洋娃娃捆绑包',   coins: '冬日洋娃娃捆绑包',   price: 120,  intelligence: false },
  { id: '决战平安京·御神之刃', coins: '决战平安京·御神之刃', price: 120,  intelligence: false },
  { id: '龙之道·灵心',         coins: '龙之道·灵心',         price: 120,  intelligence: false },
  { id: '雪魅星尘',           coins: '雪魅星尘',           price: 120,  intelligence: false },
  { id: '流辉夜咏捆绑包',     coins: '流辉夜咏捆绑包',     price: 120,  intelligence: false },
  { id: '龙之道·无拘',         coins: '龙之道·无拘',         price: 120,  intelligence: false },
  { id: '樱奈春时',           coins: '樱奈春时',           price: 120,  intelligence: false },
  { id: '璃宫芙纱',           coins: '璃宫芙纱',           price: 120,  intelligence: false },
  { id: '璃宫芙纱捆绑包',     coins: '璃宫芙纱捆绑包',     price: 120,  intelligence: false },
  { id: '樱律捆绑包',         coins: '樱律捆绑包',         price: 120,  intelligence: false },
  { id: '秋日序曲·樱律',       coins: '秋日序曲·樱律',       price: 120,  intelligence: false },
  { id: '龙之道·求索',         coins: '龙之道·求索',         price: 120,  intelligence: false },
  { id: '秉烛夜话·紫翼流绯',   coins: '秉烛夜话·紫翼流绯',   price: 120,  intelligence: false },
  { id: '紫翼流绯捆绑包',     coins: '紫翼流绯捆绑包',     price: 120,  intelligence: false },
  { id: '执金捆绑包',         coins: '执金捆绑包',         price: 125,  intelligence: false },
  { id: '巳辰新禧·西王母捆绑包', coins: '巳辰新禧·西王母捆绑包', price: 128, intelligence: false },
  { id: '剑圣无双捆绑包',     coins: '剑圣无双捆绑包',     price: 140,  intelligence: false },
  { id: '青枝瓷捆绑包',       coins: '青枝瓷捆绑包',       price: 144,  intelligence: false },
  { id: '吕布捆绑包',         coins: '吕布捆绑包',         price: 144,  intelligence: false },
  { id: '温语愈心捆绑包',     coins: '温语愈心捆绑包',     price: 144,  intelligence: false },
  { id: '雕骨琢心捆绑包',     coins: '雕骨琢心捆绑包',     price: 144,  intelligence: false },
  { id: '雪魅星尘捆绑包',     coins: '雪魅星尘捆绑包',     price: 144,  intelligence: false },
  { id: '御神之刃捆绑包',     coins: '御神之刃捆绑包',     price: 144,  intelligence: false },
  { id: '樱奈春时捆绑包',     coins: '樱奈春时捆绑包',     price: 144,  intelligence: false },
  { id: '冥天魂使捆绑包',     coins: '冥天魂使捆绑包',     price: 150,  intelligence: false },
  { id: '恋念私语捆绑包',     coins: '恋念私语捆绑包',     price: 150,  intelligence: false },
  { id: '玄夜摄心捆绑包',     coins: '玄夜摄心捆绑包',     price: 150,  intelligence: false },
  { id: '音律织光捆绑包',     coins: '音律织光捆绑包',     price: 155,  intelligence: false },
  { id: '晨风捆绑包',         coins: '晨风捆绑包',         price: 160,  intelligence: false },
  { id: '溯时之流捆绑包',     coins: '溯时之流捆绑包',     price: 166,  intelligence: false },
  { id: '妖力全开捆绑包',     coins: '妖力全开捆绑包',     price: 170,  intelligence: false },
  { id: '秦时明月·百步飞剑',   coins: '秦时明月·百步飞剑',   price: 180,  intelligence: false },
  { id: '赤瑛',               coins: '赤瑛',               price: 185,  intelligence: false },
  { id: '秉烛夜话·玄蝠衔珠',   coins: '秉烛夜话·玄蝠衔珠',   price: 185,  intelligence: false },
  { id: '齐天撼世捆绑包',     coins: '齐天撼世捆绑包',     price: 210,  intelligence: false },
  { id: '灵麒佑',             coins: '灵麒佑',             price: 240,  intelligence: false },
  { id: '古岛异闻·赤冥佩',     coins: '古岛异闻·赤冥佩',     price: 240,  intelligence: false },
  { id: '甜夜安眠·幻梦鲸彩',   coins: '甜夜安眠·幻梦鲸彩',   price: 240,  intelligence: false },
  { id: '西行志·大闹天宫',     coins: '西行志·大闹天宫',     price: 290,  intelligence: false },
]


// =========================
// 大话手游
// =========================
const DHSY_RECHARGE_OPTIONS = [
  { id: '1', coins: '数量组合1元面值', price: 1, intelligence: true },

  { id: '一小包仙玉',     coins: '一小包仙玉',     price: 6,   intelligence: false },
  { id: '一大包仙玉',    coins: '一大包仙玉',    price: 30,  intelligence: false },
  { id: '一小袋仙玉',    coins: '一小袋仙玉',    price: 98,  intelligence: false },
  { id: '一大袋仙玉',   coins: '一大袋仙玉',   price: 198, intelligence: false },
  { id: '一大堆仙玉',   coins: '一大堆仙玉',   price: 328, intelligence: false },
  { id: '一大箱仙玉',   coins: '一大箱仙玉',   price: 648, intelligence: false },
  { id: '一整箱仙玉',   coins: '一整箱仙玉',   price: 1298, intelligence: false },
  { id: '一大车仙玉',   coins: '一大车仙玉',   price: 3298, intelligence: false },
  { id: '一整车仙玉',   coins: '一整车仙玉',   price: 6498, intelligence: false },
  { id: '特权月卡',   coins: '特权月卡',   price: 40, intelligence: false },
  { id: '龙马现世礼包',   coins: '龙马现世礼包',   price: 68, intelligence: false },
  { id: '特权季卡',   coins: '特权季卡',   price: 108, intelligence: false },
  { id: '成长基金',   coins: '成长基金',   price: 168, intelligence: false },
]

// 快手
const KUAI_RECHARGE_OPTIONS = [
  { id: '1', coins: '数量组合1元面值', price: 1, intelligence: true },
]

// 抖音钻石
const Douyin_RECHARGE_OPTIONS = [
  { id: '1', coins: '数量组合1元面值', price: 1, intelligence: true },
]


export default {
  name: 'ParameterList',
  components: {
    ArrowRight,
    ArrowLeft,
    Plus,
    Search,
    InfoFilled,
    DocumentCopy,
  },


  data() {
    return {
      platformInfo: {
        id: '',
        name: '平台',
        flag: '',
        description: '',
        icon: '◈',
        color: 'blue',
      },
      configs: [],
      keyword: '',
      dialogVisible: false,
      saving: false,
      editingConfig: null,
      configForm: {
        name: '',
        socCode: '',
        rechargeIds: [],   // 勾选的档位 id 数组（多选）
        faceValue: '',
        amount: '',
        payRatio: 1, // 最大支付比例，默认100%
        lossLimitMode: 0, // 0 跟全局 / 1 固定差额 / 2 百分比
        lossLimitFixed: 0,
        lossLimitPercent: 0,
        intelligence: false,
        enabled: true,
      },
      selectedConfigs: [],   // 表格选中的行

      configRules: {
        name: [
          {
            required: false,
            message: '请输入配置名称',
            trigger: 'blur',
          },
        ],

        payRatio: [
          {
            required: true,
            message: '请输入最大支付比例',
            trigger: 'change',
          },
          {
            validator: (rule, value, callback) => {
              const ratio = Number(value)

              if (
                  value === '' ||
                  value === null ||
                  value === undefined ||
                  !Number.isFinite(ratio) ||
                  ratio < 0.01 ||
                  ratio > 1
              ) {
                callback(new Error('最大支付比例必须在 0.01 ~ 1 之间'))
                return
              }

              callback()
            },
            trigger: 'change',
          },
        ],
      },

      soulRechargeOptions: SOUL_RECHARGE_OPTIONS,
      eggRechargeOptions: EGG_RECHARGE_OPTIONS,
      xhsRechargeOptions: XHS_RECHARGE_OPTIONS,
      taquRechargeOptions: TAQU_RECHARGE_OPTIONS,
      klmbRechargeOptions: KLMB_RECHARGE_OPTIONS,
      d5rgRechargeOptions: D5RG_RECHARGE_OPTIONS,
      mhxyRechargeOptions: MHXY_RECHARGE_OPTIONS,
      yjwjCRechargeOptions: YJWJ_C_RECHARGE_OPTIONS,
      yjwjMRechargeOptions: YJWJ_M_RECHARGE_OPTIONS,
      dhsyRechargeOptions: DHSY_RECHARGE_OPTIONS,
      kuaiRechargeOptions: KUAI_RECHARGE_OPTIONS,
      douyinRechargeOptions: Douyin_RECHARGE_OPTIONS,
    }

  },


  computed: {
    platformId() {
      return this.$route.params.platform || ''
    },


    isSoul() {
      return String(this.platformInfo.flag || '').toLowerCase() === 'soul'
    },

    isEgg() {
      return String(this.platformInfo.flag || '').toLowerCase() === 'eggie'
    },

    isXhs() {
      return String(this.platformInfo.flag || '').toLowerCase() === 'xhs'
    },
    isTaqu() {
      return String(this.platformInfo.flag || '').toLowerCase() === 'taqu'
    },
    isKlmb() {
      return String(this.platformInfo.flag || '').toLowerCase() === 'klmb'
    },
    isD5rg() {
      return String(this.platformInfo.flag || '').toLowerCase() === 'd5rg'
    },
    isMhxy() {
      return String(this.platformInfo.flag || '').toLowerCase() === 'mhxy'
    },
    isYjwjC() {
      return String(this.platformInfo.flag || '').toLowerCase() === 'yjwj_c'
    },
    isYjwjM() {
      return String(this.platformInfo.flag || '').toLowerCase() === 'yjwj_m'
    },
    isDhxyM() {
      return String(this.platformInfo.flag || '').toLowerCase() === 'dhxy_m'
    },
    isKuai() {
      return String(this.platformInfo.flag || '').toLowerCase() === 'kuai'
    },

    isDouYin() {
      return String(this.platformInfo.flag || '').toLowerCase() === 'douyin'
    },

    // 是否为固定档位平台（支持多选）
    isFixedOptionsPlatform() {
      return this.isSoul || this.isEgg || this.isXhs || this.isTaqu
          || this.isKlmb || this.isD5rg || this.isMhxy || this.isYjwjC || this.isYjwjM
          || this.isDhxyM || this.isKuai || this.isDouYin
    },

    // 多选上限
    maxSelectCount() {
      return 20
    },

    // 当前平台的档位列表
    currentRechargeOptions() {
      if (this.isSoul) return this.soulRechargeOptions
      if (this.isEgg) return this.eggRechargeOptions
      if (this.isXhs) return this.xhsRechargeOptions
      if (this.isTaqu) return this.taquRechargeOptions
      if (this.isKlmb) return this.klmbRechargeOptions
      if (this.isD5rg) return this.d5rgRechargeOptions
      if (this.isMhxy) return this.mhxyRechargeOptions
      if (this.isYjwjC) return this.yjwjCRechargeOptions
      if (this.isYjwjM) return this.yjwjMRechargeOptions
      if (this.isDhxyM) return this.dhsyRechargeOptions
      if (this.isKuai) return this.kuaiRechargeOptions
      if (this.isDouYin) return this.douyinRechargeOptions
      return []
    },

    // 当前平台可选（未存在）的档位
    selectableRechargeOptions() {
      return this.currentRechargeOptions
    },

    // 是否已全选（所有可选档位都已选中）
    isAllSelected() {
      const selectable = this.selectableRechargeOptions
      if (selectable.length === 0) return false
      const ids = new Set(this.configForm.rechargeIds)
      return selectable.every(item => ids.has(item.id))
    },

    filteredConfigs() {
      const keyword = this.keyword.trim().toLowerCase()
      if (!keyword) {
        return this.configs
      }

      return this.configs.filter(item => {
        const name = String(item.name || '').toLowerCase()
        const id = String(item.id || '').toLowerCase()
        return name.includes(keyword) || id.includes(keyword)
      })

    },

  },

  mounted() {
    this.loadData()
  },

  watch: {
    '$route.params.platform': {
      immediate: false,
      handler() {
        this.keyword = ''
        this.loadData()
      },
    },

  },


  methods: {
    // =========================
    // 加载数据
    // =========================
    async loadData() {
      await Promise.all([
        this.loadPlatformInfo(),
        this.fetchConfigs(),
      ])
    },


    async loadPlatformInfo() {

      try {

        const res = await platformList({ pageIndex: 1, pageSize: 100 ,id: Number(this.platformId)})
        const list = res?.list || []
        const platform = list.find(
            item => String(item.id) === String(this.platformId)
        )


        if (platform) {

          this.platformInfo = {
            id: platform.id,
            name: platform.sopName,
            flag: platform.sopFlag,
            description: platform.sopDescription,
            icon: platform.sopName?.slice(0, 1) || '◈',
            color: platform.sopColor || 'blue',
          }
        }
      } catch (error) {
        console.error('加载平台失败:', error)
      }

    },


    async fetchConfigs() {
      try {
        const res = await configList({
          id: Number(this.platformId),
          pageIndex: 1,
          pageSize: 100,
        })


        const list = res?.list || []
        this.configs = list.map(c => ({
          id: c.id,
          platformId: c.socPlatformId,
          name: c.socName,
          socCode: c.socCode,
          faceValue: c.socFaceValue,
          amount: c.socAmount,

          // 最大支付比例
          payRatio: c.socPayRatio == null
              ? 1
              : Number(c.socPayRatio),

          // 差额亏损限制：0 跟全局 / 1 固定 / 2 百分比
          lossLimitMode: Number(c.lossLimitMode ?? 0),
          lossLimitFixed: Number(c.lossLimitFixed ?? 0),
          lossLimitPercent: Number(c.lossLimitPercent ?? 0),

          intelligence: c.socIntelligence === true,
          description: c.socDescription,
          enabled: c.socEnabled !== false,
          createTime: c.createTime,
          updateTime: c.updateTime,
        }))

        this.selectedConfigs = []

      } catch (error) {
        console.error('加载配置失败:', error)
        ElMessage.error(error?.message || '加载配置失败')
      }

    },


    // =========================
    // 返回
    // =========================
    goBack() {
      this.$router.push('/admin/parameter')
    },


    // =========================
    // 添加配置
    // =========================
    openAdd() {
      this.editingConfig = null
      this.configForm = {
        name: '',
        socCode: generateSocCode(),
        rechargeIds: [],
        faceValue: '',
        amount: '',
        payRatio: 1,
        lossLimitMode: 0,
        lossLimitFixed: 0,
        lossLimitPercent: 0,
        intelligence: false,
        enabled: true,
      }

      this.dialogVisible = true
    },


    // =========================
    // 生成自动名称
    // 说明：普通档位直接用 item.id（各平台 id 本身已带可读前缀）
    // 智能档位统一用「平台前缀-智能1元」
    // =========================
    buildConfigName(item) {
      const prefix = this.isSoul ? 'soul'
          : this.isEgg ? '蛋币'
              : this.isXhs ? '小红书'
                  : this.isTaqu ? '他趣'
                      : this.isKlmb ? '克拉克拉'
                          : this.isD5rg ? '第五人格'
                              : this.isMhxy ? '梦幻西游'
                                  : this.isYjwjC ? '永劫无间'
                                      : this.isYjwjM ? '永劫无间手游'
                                          : this.isDhxyM ? '大话手游'
                                              : this.isKuai ? '快手'
                                                  : this.isDouYin ? '抖音钻石'
                                                      : '配置'

      if (item.intelligence) {
        return `${prefix}-智能1元`
      }

      return String(item.id)
    },


    // =========================
    // 判断档位是否已存在
    // =========================
    isOptionDisabled(item) {
      return false
    },


    // =========================
    // 刷新表单展示字段（faceValue / amount / intelligence）
    // =========================
    refreshFormDisplay() {
      const lastId = this.configForm.rechargeIds[this.configForm.rechargeIds.length - 1]
      const last = this.currentRechargeOptions.find(o => o.id === lastId)
      if (last) {
        this.configForm.faceValue = String(last.coins)
        this.configForm.amount = String(last.price)
        this.configForm.intelligence = last.intelligence === true
      } else {
        this.configForm.faceValue = ''
        this.configForm.amount = ''
        this.configForm.intelligence = false
      }
    },


    // =========================
    // 点击档位（编辑时锁定，不可更换）
    // =========================
    handleOptionClick(item) {
      if (this.editingConfig) {
        ElMessage.warning('编辑时不能更换档位，如需更换请删除后重新添加')
        return
      }
      this.toggleRechargeOption(item)
    },


    // =========================
    // 切换档位选中状态（多选，最多 20 个）
    // =========================
    toggleRechargeOption(item) {
      const idx = this.configForm.rechargeIds.indexOf(item.id)

      // 取消选中
      if (idx > -1) {
        this.configForm.rechargeIds.splice(idx, 1)
        this.refreshFormDisplay()
        return
      }

      // 最多选择20个
      if (this.configForm.rechargeIds.length >= this.maxSelectCount) {
        ElMessage.warning(`最多只能选择 ${this.maxSelectCount} 个档位`)
        return
      }

      this.configForm.rechargeIds.push(item.id)
      this.refreshFormDisplay()
    },


    // =========================
    // 全选 / 取消全选（受 20 个上限约束）
    // =========================
    toggleSelectAll() {
      const selectable = this.selectableRechargeOptions
      if (selectable.length === 0) {
        ElMessage.warning('没有可选的档位')
        return
      }

      // 取消全选
      if (this.isAllSelected) {
        const selectableIds = new Set(selectable.map(i => i.id))
        this.configForm.rechargeIds = this.configForm.rechargeIds.filter(
            id => !selectableIds.has(id)
        )
        this.refreshFormDisplay()
        return
      }

      // 全选：受上限约束
      const ids = new Set(this.configForm.rechargeIds)
      const remain = this.maxSelectCount - ids.size
      if (remain <= 0) {
        ElMessage.warning(`最多只能选择 ${this.maxSelectCount} 个档位`)
        return
      }

      let added = 0
      for (const item of selectable) {
        if (ids.has(item.id)) continue
        if (added >= remain) break
        ids.add(item.id)
        added++
      }

      this.configForm.rechargeIds = Array.from(ids)

      if (added < selectable.length) {
        ElMessage.info(`最多只能选择 ${this.maxSelectCount} 个档位，已选前 ${this.maxSelectCount} 个`)
      }

      this.refreshFormDisplay()
    },


    // =========================
    // 编辑配置
    // =========================
    editConfig(row) {

      this.editingConfig = row
      // 反查 rechargeId
      let rechargeId = ''
      if (this.isSoul) {
        const found = this.soulRechargeOptions.find(
            o => String(o.coins) === String(row.faceValue)
        )
        rechargeId = found ? found.id : ''
      } else if (this.isEgg) {
        const found = this.eggRechargeOptions.find(
            o => String(o.coins) === String(row.faceValue)
        )
        rechargeId = found ? found.id : ''
      }else if (this.isXhs) {
        const found = this.xhsRechargeOptions.find(
            o => String(o.coins) === String(row.faceValue)
        )
        rechargeId = found ? found.id : ''
      } else if (this.isTaqu) {
        const found = this.taquRechargeOptions.find(o => String(o.coins) === String(row.faceValue))
        rechargeId = found ? found.id : ''
      } else if (this.isKlmb) {
        const found = this.klmbRechargeOptions.find(
            o => String(o.coins) === String(row.faceValue)
        )
        rechargeId = found ? found.id : ''
      } else if (this.isD5rg) {
        const found = this.d5rgRechargeOptions.find(
            o => String(o.coins) === String(row.faceValue)
        )
        rechargeId = found ? found.id : ''
      } else if (this.isMhxy) {
        const found = this.mhxyRechargeOptions.find(
            o => String(o.coins) === String(row.faceValue)
        )
        rechargeId = found ? found.id : ''
      } else if (this.isYjwjC) {
        const found = this.yjwjCRechargeOptions.find(
            o => String(o.coins) === String(row.faceValue)
        )
        rechargeId = found ? found.id : ''
      } else if (this.isYjwjM) {
        const found = this.yjwjMRechargeOptions.find(
            o => String(o.coins) === String(row.faceValue)
        )
        rechargeId = found ? found.id : ''
      }else if (this.isDhxyM) {
        const found = this.dhsyRechargeOptions.find(
            o => String(o.coins) === String(row.faceValue)
        )
        rechargeId = found ? found.id : ''
      }else if (this.isKuai) {
        const found = this.kuaiRechargeOptions.find(
            o => String(o.coins) === String(row.faceValue)
        )
        rechargeId = found ? found.id : ''
      }else if (this.isDouYin) {
        const found = this.douyinRechargeOptions.find(
            o => String(o.coins) === String(row.faceValue)
        )
        rechargeId = found ? found.id : ''
      }

      this.configForm = {
        name: row.name,
        socCode: row.socCode || generateSocCode(),
        rechargeIds: rechargeId ? [rechargeId] : [],
        faceValue: row.faceValue || '',
        amount: row.amount || '',

        payRatio: row.payRatio ?? 1,

        lossLimitMode: row.lossLimitMode ?? 0,
        lossLimitFixed: row.lossLimitFixed ?? 0,
        lossLimitPercent: row.lossLimitPercent ?? 0,

        intelligence: row.intelligence === true,
        enabled: row.enabled !== false,
      }

      this.dialogVisible = true
    },


    // =========================
    // 保存
    // =========================
    async saveConfig() {
      if (!this.$refs.configFormRef) return

      try {
        await this.$refs.configFormRef.validate()
      } catch (e) {
        return
      }

      const lossLimitMode = Number(this.configForm.lossLimitMode ?? 0)

      if (![0, 1, 2].includes(lossLimitMode)) {
        ElMessage.warning('请选择差额亏损限制模式')
        return
      }

      const lossLimitFixed = Number(this.configForm.lossLimitFixed || 0)
      const lossLimitPercent = Number(this.configForm.lossLimitPercent || 0)

      if (lossLimitMode === 1 && lossLimitFixed < 0) {
        ElMessage.warning('固定差额不能小于 0 元')
        return
      }

      if (lossLimitMode === 2 && (lossLimitPercent < 0 || lossLimitPercent > 100)) {
        ElMessage.warning('百分比需在 0 - 100 之间')
        return
      }

      // ---------- 编辑：单条，名称来自输入 ----------
      if (this.editingConfig) {
        const name = this.configForm.name.trim()
        if (!name) {
          ElMessage.warning('请输入配置名称')
          return
        }

        this.saving = true
        try {
          await configSave({
            id: this.editingConfig.id,
            socName: name,
            socCode: this.configForm.socCode,
            socFaceValue: String(this.configForm.faceValue || ''),
            socAmount: String(this.configForm.amount || ''),
            socPayRatio: Number(this.configForm.payRatio),
            lossLimitMode,
            lossLimitFixed: lossLimitMode === 1 ? lossLimitFixed : 0,
            lossLimitPercent: lossLimitMode === 2 ? lossLimitPercent : 0,
            socIntelligence: this.configForm.intelligence === true,
            socEnabled: this.configForm.enabled !== false,
          })
          ElMessage.success('配置修改成功')
          this.dialogVisible = false
          this.editingConfig = null
          await this.fetchConfigs()
        } catch (error) {
          console.error('保存配置失败:', error)
          ElMessage.error(error?.message || '保存配置失败')
        } finally {
          this.saving = false
        }
        return
      }

      // ---------- 新增：构建待提交列表 ----------
      let tasks = []

      if (this.isFixedOptionsPlatform) {
        if (this.configForm.rechargeIds.length === 0) {
          ElMessage.warning('请至少选择一个充值档位')
          return
        }

        if (this.configForm.rechargeIds.length > this.maxSelectCount) {
          ElMessage.warning(`最多只能选择 ${this.maxSelectCount} 个档位`)
          return
        }

        this.configForm.rechargeIds.forEach(id => {
          const item = this.currentRechargeOptions.find(o => o.id === id)
          if (!item) return

          tasks.push({
            name: this.buildConfigName(item),
            faceValue: String(item.coins),
            amount: String(item.price),
            payRatio: Number(this.configForm.payRatio),
            lossLimitMode,
            lossLimitFixed: lossLimitMode === 1 ? lossLimitFixed : 0,
            lossLimitPercent: lossLimitMode === 2 ? lossLimitPercent : 0,
            intelligence: item.intelligence === true,
          })
        })

        if (tasks.length === 0) {
          ElMessage.warning('所选档位都已存在，没有需要新增的配置')
          return
        }

      } else {
        // 非固定档位平台仍需用户填名称
        const name = this.configForm.name.trim()
        if (!name) {
          ElMessage.warning('请输入配置名称')
          return
        }
        tasks.push({
          name,
          faceValue: String(this.configForm.faceValue || ''),
          amount: String(this.configForm.amount || ''),
          payRatio: Number(this.configForm.payRatio),
          lossLimitMode,
          lossLimitFixed: lossLimitMode === 1 ? lossLimitFixed : 0,
          lossLimitPercent: lossLimitMode === 2 ? lossLimitPercent : 0,
          intelligence: this.configForm.intelligence === true,
        })
      }

      this.saving = true
      let successCount = 0
      let failCount = 0
      const errors = []

      try {
        for (const t of tasks) {
          try {
            await configSave({
              socPlatformId: Number(this.platformId),
              socName: t.name,
              socCode: generateSocCode(),
              socFaceValue: t.faceValue,
              socAmount: t.amount,
              socPayRatio: t.payRatio,
              lossLimitMode: t.lossLimitMode,
              lossLimitFixed: t.lossLimitFixed,
              lossLimitPercent: t.lossLimitPercent,
              socIntelligence: t.intelligence,
              socEnabled: this.configForm.enabled !== false,
            })
            successCount++
          } catch (error) {
            failCount++
            errors.push(`${t.name}: ${error?.message || '失败'}`)
            console.error('单条保存失败:', t, error)
          }
        }

        if (failCount === 0) {
          ElMessage.success(`成功添加 ${successCount} 个配置`)
          this.dialogVisible = false
          this.editingConfig = null
        } else if (successCount === 0) {
          ElMessage.error(`添加失败：${errors[0]}`)
        } else {
          ElMessage.warning(`成功 ${successCount} 个，失败 ${failCount} 个`)
        }

        await this.fetchConfigs()
      } finally {
        this.saving = false
      }
    },


    // =========================
    // 启用 / 停用
    // =========================
    async toggleConfig(row) {
      const action = row.enabled !== false ? '停用' : '启用'
      try {
        await ElMessageBox.confirm(
            `确定要${action}配置「${row.name}」吗？`,
            `${action}配置`,
            {
              confirmButtonText: `确定${action}`,
              cancelButtonText: '取消',
              type: action === '停用' ? 'warning' : 'success',
            }

        )


        await configSave({
          id: row.id,
          socName: row.name,
          socCode: row.socCode,
          socFaceValue: row.faceValue,
          socAmount: row.amount,
          socPayRatio: row.payRatio ?? 1,
          socIntelligence: row.intelligence === true,
          socEnabled: row.enabled === false,
        })

        ElMessage.success(`已${action}`)
        await this.fetchConfigs()
      } catch (error) {

        // 取消

      }
    },


    // =========================
    // 删除
    // =========================
    async deleteConfig(row) {
      // 第一步：确认弹窗，用户取消直接返回
      try {
        await ElMessageBox.confirm(
            `删除后无法恢复，确定要删除「${row.name}」吗？`,
            '删除配置',
            {
              confirmButtonText: '删除',
              cancelButtonText: '取消',
              type: 'warning',
            }
        )
      } catch {
        return  // 用户取消，静默返回
      }

      // 第二步：执行删除，业务错误要提示
      try {
        await configDelete(row.id)
        ElMessage.success('配置已删除')
        await this.fetchConfigs()
      } catch (error) {
        console.error('删除配置失败:', error)
        ElMessage.warning(error?.message || '删除失败，请先解绑外部货源')
      }
    },

    // 表格选择变化
    handleSelectionChange(rows) {
      this.selectedConfigs = rows
    },

// 批量删除
    async batchDeleteConfigs() {
      const rows = this.selectedConfigs
      if (!rows.length) {
        ElMessage.warning('请先勾选要删除的配置')
        return
      }

      const names = rows.map(r => `「${r.name}」`).join('、')
      const preview = rows.length > 5
          ? names.slice(0, 60) + '…'
          : names

      try {
        await ElMessageBox.confirm(
            `确定要删除以下 ${rows.length} 个配置吗？删除后无法恢复。\n${preview}`,
            '批量删除配置',
            {
              confirmButtonText: '确定删除',
              cancelButtonText: '取消',
              type: 'warning',
            }
        )
      } catch {
        return
      }

      this.saving = true
      let successCount = 0
      let failCount = 0
      const errors = []

      // 逐条删除，单条失败跳过继续
      for (const row of rows) {
        try {
          await configDelete(row.id)
          successCount++
        } catch (error) {
          failCount++
          errors.push(`${row.name}: ${error?.message || '失败'}`)
          console.error('批量删除单条失败:', row, error)
        }
      }

      this.saving = false

      if (failCount === 0) {
        ElMessage.success(`成功删除 ${successCount} 个配置`)
      } else if (successCount === 0) {
        ElMessage.error(`删除失败：${errors[0]}`)
      } else {
        ElMessage.warning(`成功 ${successCount} 个，失败 ${failCount} 个`)
      }

      this.selectedConfigs = []
      await this.fetchConfigs()
    },

    // 已选数量
    selectedCount() {
      return this.selectedConfigs.length
    },

// 单行是否可勾选：已选满 20 且当前行未选中时禁用
    isRowSelectable(row) {
      if (this.selectedConfigs.length >= 20) {
        // 已选中的行仍可取消
        return this.selectedConfigs.some(r => r.id === row.id)
      }
      return true
    },

// =========================
// 复制 Code
// =========================
    async copyCode(code) {
      if (!code) {
        ElMessage.warning('该配置暂无 Code')
        return
      }

      try {
        await navigator.clipboard.writeText(String(code))
        ElMessage.success('配置 Code 已复制')
      } catch (error) {
        try {
          const textarea = document.createElement('textarea')
          textarea.value = String(code)
          textarea.style.position = 'fixed'
          textarea.style.left = '-9999px'
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
          ElMessage.success('配置 Code 已复制')
        } catch (copyError) {
          ElMessage.error('复制失败，请手动复制')
        }
      }
    },


    // =========================
    // 时间格式化
    // =========================
    formatTime(value) {
      if (!value) {
        return '-'
      }

      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return value
      }
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}`
    },
  },
}

</script>


<style scoped>

.parameter-list-page {
  width: 100%;
  /* max-width: 1440px; */
  margin: 0 auto;
  padding: 26px 30px 44px;
}


/* =========================
   页面头部
   ========================= */

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.header-left {
  min-width: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 12px;
  color: var(--app-text-muted);
}

.breadcrumb .el-icon {
  font-size: 11px;
}

.breadcrumb-link {
  cursor: pointer;
  transition: color .2s;
}

.breadcrumb-link:hover {
  color: var(--app-accent);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 13px;
}

.platform-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  font-size: 19px;
  font-weight: 700;
}

.platform-icon.blue {
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.platform-icon.orange {
  color: #e99a25;
  background: #fff5e7;
}

.platform-icon.green {
  color: #22a06b;
  background: #edf9f3;
}

.platform-icon.purple {
  color: var(--app-accent-strong);
  background: var(--app-accent-soft);
}

.title-row h1 {
  margin: 0;
  font-size: 25px;
  line-height: 1.2;
  font-weight: 650;
  color: var(--app-text-primary);
}

.title-row p {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}


/* =========================
   提示
   ========================= */

.notice {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 13px 15px;
  margin-bottom: 18px;
  border: 1px solid var(--app-accent-border);
  border-radius: 11px;
  background: var(--app-accent-soft);
}

.notice-icon {
  display: flex;
  color: var(--app-accent);
  font-size: 17px;
}

.notice-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.notice-content strong {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.notice-content span {
  font-size: 11px;
  color: var(--app-text-muted);
}

/* 深色模式说明横幅：避免浅色底配浅色文字导致看不清 */
html.dark .notice {
  border-color: var(--app-accent-border);
  background: var(--app-accent-soft);
}

html.dark .notice-content strong {
  color: var(--app-text-primary);
}

html.dark .notice-content span,
html.dark .notice-content div {
  color: var(--app-text-secondary);
}

html.dark .egg-notice {
  border-color: rgba(233, 154, 37, 0.28);
  background: rgba(233, 154, 37, 0.12);
}

html.dark .platform-icon.orange { background: rgba(233, 154, 37, 0.14); }
html.dark .platform-icon.green { background: rgba(34, 160, 107, 0.14); }
html.dark .platform-icon.purple { background: rgba(139, 92, 246, 0.14); }
html.dark .pay-preview { background: rgba(103, 194, 58, 0.12); }
html.dark .table-intelligence-badge {
  background: rgba(233, 154, 37, 0.12);
  border-color: rgba(233, 154, 37, 0.3);
}
html.dark .yjwj-notice {
  border-color: rgba(233, 154, 37, 0.28);
  background: rgba(233, 154, 37, 0.1);
}

.egg-notice {
  border-color: #fff0d5;
  background: #fffaf1;
}

.egg-notice .notice-icon {
  color: #e99a25;
}

.xhs-notice {
  border-color: #ffe0e0;
  background: #fff5f5;
}
.xhs-notice .notice-icon {
  color: #ef5d67;
}


/* =========================
   工具栏
   ========================= */

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 12px;
}

.result-count {
  font-size: 12px;
  color: var(--app-text-muted);
}

.result-count strong {
  margin: 0 2px;
  color: var(--app-text-primary);
  font-weight: 600;
}

.search-input {
  width: 260px;
}


/* =========================
   表格
   ========================= */

.config-table-wrapper {
  overflow: hidden;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 14px;
}

.config-table.el-table {
  width: 100%;
  border: 0;
  border-radius: 0;
}


/* =========================
   配置名称
   ========================= */

.config-name-cell {
  display: flex;
  align-items: center;
  gap: 11px;
}

.config-dot {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: var(--app-bg-subtle);
}

.config-dot span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--app-accent);
  box-shadow: 0 0 0 4px var(--app-accent-subtle);
}

.config-name {
  font-size: 15px;
  font-weight: 550;
  color: var(--app-text-primary);
}


/* =========================
   ID
   ========================= */

.id-cell {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 100%;
  padding: 5px 0;
  border-radius: 7px;
  cursor: pointer;
  transition: background .2s, color .2s;
}

.id-cell:hover {
  background: var(--app-bg-subtle);
}

.id-value {
  max-width: 135px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  font-family: SFMono-Regular, Consolas, Monaco, monospace;

  font-size: 11px;
  color: var(--app-text-muted);
}

.id-cell:hover .id-value {
  color: var(--app-accent);
}

.copy-icon {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--app-text-muted);
}

.id-cell:hover .copy-icon {
  color: var(--app-accent);
}


/* =========================
   面值 / 金额
   ========================= */

.face-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.amount-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-accent);
}


/* =========================
   时间
   ========================= */

.time-text {
  font-size: 13px;
  color: var(--app-text-secondary);
}


/* =========================
   操作
   ========================= */

.actions {
  display: flex;
  align-items: center;
}


/* =========================
   空状态
   ========================= */

.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 14px;
}


/* =========================
   充值选项
   ========================= */

.recharge-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
  width: 100%;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
}

.recharge-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border: 1px solid var(--app-border);
  border-radius: 9px;
  background: var(--app-bg-elevated);
  cursor: pointer;
  transition: all .2s;
  box-sizing: border-box;
}

.recharge-option:hover {
  border-color: var(--app-accent-border);
  background: var(--app-bg-subtle);
}

.recharge-option.active {
  border-color: var(--app-accent);
  background: var(--app-bg-subtle);
}

/* 已存在的档位置灰不可选 */
.recharge-option.is-disabled {
  opacity: .5;
  cursor: not-allowed;
  background: var(--app-bg-subtle);
}

.recharge-option.is-disabled:hover {
  border-color: var(--app-border);
  background: var(--app-bg-subtle);
}

/* 编辑时锁定档位 */
.recharge-option.is-locked {
  cursor: not-allowed;
}

.recharge-option.is-locked:not(.active) {
  opacity: .45;
}

.recharge-option.is-locked:hover {
  border-color: var(--app-border);
  background: var(--app-bg-elevated);
}

.recharge-option.is-locked.active:hover {
  border-color: var(--app-accent);
  background: var(--app-bg-subtle);
}

/* 智能项独占一行 */
.recharge-option.is-intelligence {
  grid-column: 1 / -1;
  justify-content: flex-start;
  gap: 12px;
}

.recharge-option.is-intelligence .recharge-info {
  justify-content: flex-start;
  gap: 16px;
}

.radio {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: 50%;
  box-sizing: border-box;
}

.recharge-option.active .radio {
  border-color: var(--app-accent);
}

.radio span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--app-accent);
}

.recharge-info {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  gap: 5px;
}

.recharge-coins {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.recharge-coins span {
  margin-left: 2px;
  font-size: 10px;
  font-weight: 400;
  color: var(--app-text-muted);
}

.recharge-price {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-accent);
}

/* =========================
   智能档位
   ========================= */

.recharge-option.intelligence {
  border-color: #ffe0b2;
  background: #fffaf1;
}

.recharge-option.intelligence:hover {
  border-color: #ffcc80;
  background: #fff5e6;
}

.recharge-option.intelligence.active {
  border-color: #e99a25;
  background: #fff5e7;
}

.recharge-option.intelligence .radio {
  border-color: #e99a25;
}

.recharge-option.intelligence.active .radio span {
  background: #e99a25;
}

.recharge-option.intelligence .recharge-price {
  color: #e99a25;
}

.intelligence-badge {
  flex-shrink: 0;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #ffb347, #e99a25);
}

/* 已添加标记 */
.exists-badge {
  flex-shrink: 0;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  color: var(--app-text-muted);
  background: var(--app-bg-subtle);
}

/* 已选提示 + 全选按钮容器 */
.options-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 8px;
}

.options-header .selected-tip {
  margin-bottom: 0;
}

.selected-tip {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--app-text-muted);
}

.selected-tip strong {
  color: var(--app-accent);
  font-weight: 600;
}

/* 表单提示 */
.form-tip {
  margin-top: 6px;
  font-size: 11px;
  color: #a2a8b0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 最大支付金额预览 */
.pay-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f0f9eb;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.pay-preview strong {
  color: #67c23a;
  font-size: 16px;
  font-weight: 600;
}

/* 支付上限 */
.pay-limit-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pay-limit-amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-accent);
}

.pay-limit-ratio {
  padding: 2px 6px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 500;
  color: var(--app-text-muted);
  background: var(--app-bg-subtle);
}
/* 表格里的智能标记 */

.face-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-intelligence-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  color: #e99a25;
  background: #fff5e7;
  border: 1px solid #ffe0b2;
}

.yjwj-notice {
  border-color: #ffe6cc;
  background: #fff8f0;
}
.yjwj-notice .notice-icon {
  color: #e99325;
}


/* =========================
   平板
   ========================= */

@media (max-width: 900px) {

  .page-header {
    align-items: flex-start;
  }

  .config-table-wrapper {
    overflow-x: auto;
  }

}


/* =========================
   手机
   ========================= */

@media (max-width: 700px) {

  .page-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 18px;
  }

  .breadcrumb {
    margin-bottom: 12px;
  }

  .title-row h1 {
    font-size: 22px;
  }

  .header-actions {
    justify-content: flex-end;
  }


  .notice {
    align-items: flex-start;
  }

  .notice-content span {
    line-height: 1.5;
  }


  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }


  .config-table-wrapper {
    overflow-x: auto;
    border-radius: 12px;
  }

  .config-table {
    min-width: 900px;
  }


  .recharge-options {
    grid-template-columns: 1fr;
  }

  /* 移动端智能项上下留白，和普通项区分开 */
  .recharge-option.is-intelligence {
    margin-bottom: 6px;
  }

}


/* =========================
   超小屏
   ========================= */

@media (max-width: 380px) {

  .parameter-list-page {
    width: 100%;
  }

}

</style>

<style>
/* 配置弹窗：标题和底部固定，仅表单内容区滚动 */
.config-dialog.el-dialog {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
  height: calc(100dvh - 48px);
  max-height: calc(100vh - 48px);
  max-height: calc(100dvh - 48px);
  margin: 24px auto;
  overflow: hidden;
}

.config-dialog .el-dialog__header,
.config-dialog .el-dialog__footer {
  flex-shrink: 0;
}

.config-dialog .el-dialog__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 700px) {
  .config-dialog.el-dialog {
    height: calc(100vh - 32px);
    height: calc(100dvh - 32px);
    margin: 16px auto;
  }
}
</style>