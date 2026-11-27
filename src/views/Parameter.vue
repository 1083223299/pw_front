<template>
  <div class="parameter-page">

    <!-- =========================
         页面头部
         ========================= -->
    <section class="page-header">
      <div class="header-left">
        <div class="page-title">
          <div class="title-icon">
            <el-icon>
              <Collection />
            </el-icon>
          </div>
          <div class="title-text">
            <div class="eyebrow">PARAMETER CONTROL</div>
            <h1>参数管控</h1>
            <p>管理充值平台及平台下的具体配置</p>
          </div>
        </div>
      </div>


      <div class="header-actions">
        <el-button @click="openLossSetting">
          <el-icon>
            <Setting />
          </el-icon>
          差额限制
        </el-button>

        <el-button type="primary" @click="openAddPlatform">
          <el-icon>
            <Plus />
          </el-icon>
          添加平台
        </el-button>
      </div>
    </section>


    <!-- =========================
         数据概览
         ========================= -->
    <section class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon blue">
          <el-icon>
            <Grid />
          </el-icon>
        </div>

        <div class="summary-info">
          <div class="summary-label">平台数量</div>
          <div class="summary-value">{{ platforms.length }}</div>
        </div>
      </div>


      <div class="summary-card">
        <div class="summary-icon green">
          <el-icon>
            <Setting />
          </el-icon>
        </div>

        <div class="summary-info">
          <div class="summary-label">配置数量</div>
          <div class="summary-value">{{ totalConfigCount }}</div>
        </div>

      </div>


      <div class="summary-card">
        <div class="summary-icon orange">
          <el-icon>
            <CircleCheck />
          </el-icon>
        </div>

        <div class="summary-info">
          <div class="summary-label">
            启用配置
          </div>
          <div class="summary-value">
            {{ enabledConfigCount }}
          </div>
        </div>
      </div>

      <div
          class="summary-card summary-card-link"
          @click="openRuleTool"
      >
        <div class="summary-icon orange">
          <el-icon>
            <Tools />
          </el-icon>
        </div>

        <div class="summary-info">
          <div class="summary-label">
            档位匹配工具
          </div>
          <div class="summary-desc">
            输入金额匹配最优档位
          </div>
        </div>

        <el-icon class="summary-arrow">
          <ArrowRight />
        </el-icon>
      </div>

      <!-- =========================
           网易实时商品中心
           ========================= -->
      <div
          class="summary-card summary-card-link netease-goods-card"
          @click="openNeteaseGoods"
      >
        <div class="summary-icon purple">
          <el-icon>
            <Goods />
          </el-icon>
        </div>

        <div class="summary-info">
          <div class="summary-label">
            网易实时商品中心
          </div>

          <div class="summary-desc">
            查看网易游戏全部实时商品
          </div>
        </div>

        <el-icon class="summary-arrow">
          <ArrowRight />
        </el-icon>
      </div>

      <!-- 抖音钻石母版：与网易实时商品中心同级 -->
      <div class="summary-card summary-card-link douyin-master-card" @click="openDouyinMaster">
        <div class="summary-icon douyin"><UserFilled/></div>
        <div class="summary-info">
          <div class="summary-label">抖音钻石母版</div>
          <div class="summary-desc">管理登录母版、有效期及使用次数</div>
        </div>
        <el-icon class="summary-arrow"><ArrowRight /></el-icon>
      </div>

    </section>


    <!-- =========================
         平台区域
         ========================= -->
    <section class="platform-section">
      <div class="section-title">
        <div>
          <h1>充值平台</h1>
          <p>选择平台进入具体配置管理</p>
        </div>
        <div class="section-tools">
          <el-input
              v-model="platformKeyword"
              class="platform-search"
              placeholder="搜索平台名称 / 编号"
              clearable
              @input="handleKeywordInput"
              @keyup.enter="handleKeywordSearch"
              @clear="handleKeywordSearch"
          >
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
          <span class="platform-count">{{ platformTotal }} 个平台</span>
        </div>
      </div>


      <!-- =========================
           空状态
           ========================= -->
      <div
          v-if="!platformLoading && platforms.length === 0 && !platformKeyword.trim()"
          class="empty-state"
      >
        <div class="empty-icon">
          <el-icon>
            <Grid />
          </el-icon>
        </div>

        <h3>暂无充值平台</h3>
        <p>点击右上角「添加平台」创建第一个平台</p>
        <el-button type="primary" @click="openAddPlatform">
          <el-icon>
            <Plus />
          </el-icon>
          添加平台
        </el-button>
      </div>

      <div
          v-else-if="!platformLoading && platforms.length === 0"
          class="empty-state"
      >
        <div class="empty-icon">
          <el-icon>
            <Search />
          </el-icon>
        </div>

        <h3>未找到匹配平台</h3>
        <p>请更换平台名称、编号或平台 ID 重试</p>
      </div>


      <!-- =========================
           平台卡片
           ========================= -->
      <div v-else class="platform-grid">
        <div
            v-for="platform in platforms"
            :key="platform.id"
            class="platform-card"
        >

          <!-- =========================
               平台头部
               ========================= -->
          <div
              class="platform-top"
              @click.stop="editPlatform(platform)"
              title="点击编辑平台"
          >

            <div class="platform-icon-wrap">
              <div
                  class="platform-icon"
                  :class="[
                    `platform-icon-${platform.color || 'blue'}`,
                    { 'platform-icon-compact': (platform.icon || platform.name?.slice(0, 1) || 'P').length > 2 }
                  ]"
              >
                {{ platform.icon || platform.name?.slice(0, 1) || 'P' }}
              </div>

              <div class="edit-icon">
                <el-icon>
                  <Edit />
                </el-icon>
              </div>
            </div>


            <div class="platform-basic">
              <div class="platform-name-row">
                <h2>
                  {{ platform.name }}
                </h2>
                <span
                    class="platform-status"
                    :class="{
                    enabled:
                      platform.enabled !== false
                  }"
                >
                  <span class="status-dot"></span>
                  {{platform.enabled !== false ? '启用' : '停用' }}
                </span>
              </div>


              <div class="platform-code">ID: {{ platform.id }}</div>
            </div>
          </div>


          <!-- =========================
               平台描述
               ========================= -->
          <div class="platform-description">
            {{ platform.description || '暂无平台描述' }}
          </div>


          <!-- =========================
               平台统计
               ========================= -->
          <div class="platform-stats">
            <div class="stat-item">
              <span class="stat-label">配置数量</span>
              <span class="stat-value">
                {{ getPlatformConfigCount(platform) }}
              </span>
            </div>

            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-label">启用配置</span>
              <span class="stat-value">
                {{ getPlatformEnabledConfigCount(platform) }}
              </span>
            </div>
          </div>


          <!-- =========================
               底部操作
               ========================= -->
          <div class="platform-footer">
            <div class="footer-actions">
              <!-- 配置管理 -->
              <div
                  class="config-entry"
                  @click="openPlatform(platform)"
              >

                <div class="config-entry-left">
                  <div class="config-entry-icon">
                    <el-icon>
                      <Setting />
                    </el-icon>
                  </div>

                  <div>
                    <div class="config-entry-title">配置管理</div>
                    <div class="config-entry-desc">管理该平台的具体充值配置</div>
                  </div>
                </div>


                <el-icon class="config-arrow">
                  <ArrowRight />
                </el-icon>

              </div>


              <!-- 删除平台 -->
              <el-button
                  class="delete-platform-button"
                  link
                  type="danger"
                  @click.stop="deletePlatform(platform)"
              >

                <el-icon>
                  <Delete />
                </el-icon>
                删除平台
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================
         添加 / 编辑平台弹窗
         ========================= -->
    <el-dialog
        v-model="platformDialogVisible"
        :title="platformDialogTitle"
        width="460px"
        destroy-on-close
        class="platform-dialog fixed-body-dialog"
        align-center
    >

      <div class="dialog-description">

        {{
          platformForm.id
              ? '修改当前平台的信息'
              : '选择需要添加的充值平台'
        }}

      </div>


      <el-form
          ref="platformFormRef"
          :model="platformForm"
          label-position="top"
      >

        <!-- =========================
             添加时选择平台
             ========================= -->
        <el-form-item
            v-if="!platformForm.id"
            label="平台类型"
        >

          <el-select
              v-model="platformForm.platformType"
              popper-class="platform-select-dropdown"
              placeholder="请选择平台"
              style="width: 100%"
              @change="handlePlatformTypeChange"
          >

            <el-option
                v-for="item in platformOptions"
                :key="item.code"
                :label="item.name"
                :value="item.code"
            >

              <div class="platform-option">

                <div
                    class="platform-option-icon"
                  :class="[
                    `platform-icon-${item.color}`,
                    { 'platform-icon-compact': item.icon.length > 2 }
                  ]"
                >
                {{ item.icon }}
                </div>

                <div>
                  <div class="platform-option-name">{{ item.name }}</div>
                  <div class="platform-option-code">{{ item.code }}</div>
                </div>
              </div>

            </el-option>
          </el-select>
          <div class="form-tip">目前支持</div>
        </el-form-item>


        <!-- =========================
             编辑时显示平台类型
             ========================= -->
        <el-form-item v-else label="平台类型">
          <div class="selected-platform">
            <div
                class="selected-platform-icon"
                :class="[
                  `platform-icon-${platformForm.color || 'blue'}`,
                  { 'platform-icon-compact': (platformForm.icon || 'P').length > 2 }
                ]"
            >
              {{ platformForm.icon || 'P' }}
            </div>

            <div>
              <div class="selected-platform-name">
                {{ getPlatformOptionName(platformForm.flag) }}
              </div>
            </div>
          </div>
          <div class="form-tip">平台类型创建后不可修改</div>
        </el-form-item>


        <!-- =========================
             平台名称
             ========================= -->
        <el-form-item label="平台名称">
          <el-input
              v-model="platformForm.name"
              placeholder="例如：Soul"
              maxlength="30"
              show-word-limit
          />
        </el-form-item>

        <!-- =========================
             平台图标
             ========================= -->
        <el-form-item label="平台图标">
          <div class="icon-input-row">
            <div
                class="preview-platform-icon"
                :class="[
                  `platform-icon-${platformForm.color || 'blue'}`,
                  { 'platform-icon-compact': (platformForm.icon || 'P').length > 2 }
                ]"
            >
              {{ platformForm.icon || 'P' }}
            </div>

            <el-input
                v-model="platformForm.icon"
                placeholder="例如：S"
                maxlength="4"
            />
          </div>
        </el-form-item>


        <!-- =========================
             平台描述
             ========================= -->
        <el-form-item
            label="平台描述"
        >

          <el-input
              v-model="platformForm.description"
              type="textarea"
              :rows="3"
              placeholder="例如：Soul 充值参数配置"
              maxlength="100"
              show-word-limit
          />

        </el-form-item>


        <!-- =========================
             平台状态
             ========================= -->
        <el-form-item
            v-if="platformForm.id"
            label="平台状态"
        >
          <div class="switch-row">
            <el-switch
                v-model="platformForm.enabled"
                active-text="启用"
                inactive-text="停用"
            />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="platformDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingPlatform" @click="savePlatform">保存平台</el-button>
      </template>
    </el-dialog>

    <!-- =========================
         全局差额亏损限制
         ========================= -->
    <el-dialog
        v-model="lossDialogVisible"
        title="差额亏损限制"
        width="480px"
        destroy-on-close
        class="fixed-body-dialog"
        align-center
    >
      <el-form label-position="top">
        <el-form-item label="推送 URL">
          <el-input
              v-model="lossForm.pushUrl"
              placeholder="请输入上游回调推送地址"
              clearable
          />
        </el-form-item>

        <el-form-item label="限制模式">
          <el-radio-group v-model="lossForm.lossLimitMode">
            <el-radio :value="1">固定差额（元）</el-radio>
            <el-radio :value="2">百分比</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="lossForm.lossLimitMode === 1" label="允许亏损固定金额（元）">
          <el-input-number
              v-model="lossForm.lossLimitFixed"
              :min="0"
              :step="0.01"
              :precision="2"
              controls-position="right"
              style="width: 100%"
          />
        </el-form-item>

        <el-form-item v-if="lossForm.lossLimitMode === 2" label="允许亏损百分比（%）">
          <el-input-number
              v-model="lossForm.lossLimitPercent"
              :min="0"
              :max="100"
              :step="1"
              :precision="2"
              controls-position="right"
              style="width: 100%"
          />
        </el-form-item>

        <div class="form-tip">
          只拦截亏损：实付高于成交价时才校验；规格可单独覆盖全局限制。
        </div>
      </el-form>

      <template #footer>
        <el-button @click="lossDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="lossSaving" @click="saveLossSetting">保存限制</el-button>
      </template>
    </el-dialog>

  </div>
</template>


<script>
import {
  Plus,
  Grid,
  Setting,
  CircleCheck,
  ArrowRight,
  Edit,
  Delete,
  Search,
  Tools,
  Goods,
  UserFilled,
  Collection
} from '@element-plus/icons-vue'


import {
  ElMessage,
  ElMessageBox,
} from 'element-plus'


import {
  platformList,
  platformSave,
  platformDelete,
  outerSettingGet,
  outerSettingSave,
} from '@/api/api.js'


// ======================================================
// 默认平台
// ======================================================
const PLATFORM_OPTIONS = [
  {
    name: 'Soul',
    code: 'soul',
    description: 'Soul 充值参数配置',
    icon: 'S',
    color: 'blue',
  },
  {
    name: '蛋仔派对',
    code: 'eggie',
    description: '蛋仔派对充值参数配置',
    icon: '蛋',
    color: 'orange',
  },
  {
    name: '小红书',
    code: 'xhs',
    description: '小红书充值参数配置',
    icon: '红',
    color: 'red',
  },
  {
    name: '他趣',
    code: 'taqu',
    description: '他趣充值参数配置',
    icon: '趣',
    color: 'purple',
  },
  {
    name: '克拉漫播',
    code: 'klmb',
    description: '克拉漫播充值参数配置',
    icon: '克',
    color: 'green',
  },
  {
    name: '第五人格',
    code: 'd5rg',
    description: '第五人格充值参数配置',
    icon: '五',
    color: 'purple',
  },
  {
    name: '梦幻西游',
    code: 'mhxy',
    description: '梦幻西游充值参数配置',
    icon: '梦',
    color: 'blue',
  },
  {
    name: '永劫无间-直充',
    code: 'yjwj_c',
    description: '永劫无间直充参数配置',
    icon: '劫-直充',
    color: 'orange',
  },
  {
    name: '永劫无间-手游',
    code: 'yjwj_m',
    description: '永劫无间手游参数配置',
    icon: '劫-手游',
    color: 'blue',
  },
  {
    name: '大话手游',
    code: 'dhxy_m',
    description: '大话手游参数配置',
    icon: '大话手游',
    color: 'blue',
  },
  {
    name: '快手',
    code: 'kuai',
    description: '快手参数配置',
    icon: '快',
    color: 'orange',
  },
  {
    name: '抖音钻石',
    code: 'douyin',
    description: '抖音钻石参数配置',
    icon: '钻',
    color: 'black',
  },
]


export default {

  name: 'Parameter',

  components: {
    UserFilled,
    Tools,
    Goods,
    Plus,
    Grid,
    Setting,
    CircleCheck,
    ArrowRight,
    Edit,
    Delete,
    Search,
    Collection,
  },


  data() {

    return {
      // ==================================================
      // 平台
      // ==================================================
      platforms: [],

      // 平台搜索关键词，直接透传给平台列表接口
      platformKeyword: '',
      platformTotal: 0,
      platformLoading: false,
      searchTimer: null,
      requestSeq: 0,

      // ==================================================
      // 配置
      // ==================================================
      configs: [],
      // ==================================================
      // 平台类型
      // ==================================================
      platformOptions: PLATFORM_OPTIONS,
      // ==================================================
      // 平台弹窗
      // ==================================================
      platformDialogVisible: false,
      platformDialogTitle: '添加平台',
      savingPlatform: false,

      // 全局差额亏损限制弹窗
      lossDialogVisible: false,
      lossSaving: false,
      lossForm: {
        pushUrl: '',
        lossLimitMode: 1,
        lossLimitFixed: 0,
        lossLimitPercent: 0,
      },

      // ==================================================
      // 平台表单
      // ==================================================
      platformForm: {
        id: '',
        platformType: '',
        name: '',
        code: '',
        flag: '',
        description: '',
        icon: '',
        color: 'blue',
        enabled: true,
      },
    }
  },


  computed: {
    // ==================================================
    // 总配置数量
    // ==================================================
    totalConfigCount() {
      return this.platforms.reduce((sum, p) => sum + (p.configs?.length || 0), 0)
    },

    // ==================================================
    // 启用配置数量
    // ==================================================
    enabledConfigCount() {
      return this.platforms.reduce((sum, p) => sum + (p.configs || []).filter(c => c.enabled !== false).length, 0)
    },

  },


  created() {
    this.fetchPlatforms()
  },

  beforeUnmount() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
      this.searchTimer = null
    }
  },


  methods: {

    // =========================
    // 全局差额亏损限制
    // =========================
    async openLossSetting() {
      this.lossDialogVisible = true

      try {
        const res = await outerSettingGet()
        this.lossForm = {
          pushUrl: res?.pushUrl || '',
          lossLimitMode: Number(res?.lossLimitMode || 1),
          lossLimitFixed: Number(res?.lossLimitFixed ?? 0),
          lossLimitPercent: Number(res?.lossLimitPercent ?? 0),
        }
      } catch (error) {
        console.error('读取差额限制失败:', error)
        ElMessage.error(error?.message || '读取差额限制失败')
      }
    },

    async saveLossSetting() {
      const mode = Number(this.lossForm.lossLimitMode)

      if (![1, 2].includes(mode)) {
        ElMessage.warning('请选择差额限制模式')
        return
      }

      const fixed = Number(this.lossForm.lossLimitFixed || 0)
      const percent = Number(this.lossForm.lossLimitPercent || 0)

      if (mode === 1 && fixed < 0) {
        ElMessage.warning('固定差额不能小于 0 元')
        return
      }

      if (mode === 2 && (percent < 0 || percent > 100)) {
        ElMessage.warning('百分比需在 0 - 100 之间')
        return
      }

      this.lossSaving = true
      try {
        await outerSettingSave({
          pushUrl: this.lossForm.pushUrl.trim(),
          lossLimitMode: mode,
          lossLimitFixed: mode === 1 ? fixed : 0,
          lossLimitPercent: mode === 2 ? percent : 0,
        })
        ElMessage.success('差额限制已保存')
        this.lossDialogVisible = false
      } catch (error) {
        console.error('保存差额限制失败:', error)
        ElMessage.error(error?.message || '保存差额限制失败')
      } finally {
        this.lossSaving = false
      }
    },

    openRuleTool() {
      this.$router.push({ name: 'RechargeRuleTool' })
    },

    // 打开网易实时商品中心
    openNeteaseGoods() {
      this.$router.push({
        name: 'NeteaseGoods'
      })
    },

    // 打开抖音钻石母版管理
    openDouyinMaster() {
      this.$router.push({ name: 'DouyinMaster' })
    },

    handleKeywordInput() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      this.searchTimer = setTimeout(() => {
        this.fetchPlatforms()
      }, 300)
    },

    handleKeywordSearch() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
        this.searchTimer = null
      }
      this.fetchPlatforms()
    },

    async fetchPlatforms() {
      const keyword = this.platformKeyword.trim()
      const seq = ++this.requestSeq
      this.platformLoading = true

      try {
        const res = await platformList({
          pageIndex: 1,
          pageSize: 100,
          keyword,
        })

        if (seq !== this.requestSeq) return

        const list = res?.list || []

        this.platforms = list.map(p => {
          const flag = p.sopFlag || ''
          const option = PLATFORM_OPTIONS.find(item => item.code === flag)

          return {
            id: p.id,
            name: p.sopName,
            code: p.sopCode || '',
            flag,
            description: p.sopDescription,
            // 优先前端定义，其次后端，最后兜底
            icon: option?.icon || p.sopIcon || p.sopName?.slice(0, 1) || 'P',
            color: option?.color || p.sopColor || 'blue',
            rawIcon: p.sopIcon || '',
            rawColor: p.sopColor || 'blue',
            enabled: p.sopEnabled !== false,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            configs: (p.configs || []).map(c => ({
              id: c.id,
              platformId: c.socPlatformId,
              name: c.socName,
              key: c.socKey,
              faceValue: c.socFaceValue,
              amount: c.socAmount,
              description: c.socDescription,
              enabled: c.socEnabled !== false,
            })),
          }
        })
        this.platformTotal = Number.isFinite(Number(res?.total)) ? Number(res.total) : list.length
      } catch (error) {
        if (seq !== this.requestSeq) return
        console.error('获取平台失败:', error)
        ElMessage.error(error?.message || '获取平台失败')
      } finally {
        if (seq === this.requestSeq) {
          this.platformLoading = false
        }
      }
    },

    // ==================================================
    // 打开添加平台
    // ==================================================
    openAddPlatform() {
      this.platformDialogTitle = '添加平台'
      this.platformForm = {
        id: '',
        platformType: '',
        name: '',
        flag: '',
        description: '',
        icon: '',
        color: 'blue',
        enabled: true,
      }
      this.platformDialogVisible = true
    },

    // ==================================================
    // 选择平台类型
    // ==================================================

    handlePlatformTypeChange(code) {
      const platform = this.platformOptions.find(item => item.code === code)
      if (!platform) {
        return
      }


      // ----------------------------------------------
      // 自动填充
      // ----------------------------------------------
      this.platformForm.name = platform.name
      this.platformForm.flag = platform.code
      this.platformForm.code = ''
      this.platformForm.description = platform.description
      this.platformForm.icon = platform.icon
      this.platformForm.color = platform.color

    },


    // ==================================================
    // 获取平台类型名称
    // ==================================================

    getPlatformOptionName(code) {
      const platform = this.platformOptions.find(item => item.code === code)
      return platform
          ? platform.name
          : code
    },


    // ==================================================
    // 编辑平台
    // ==================================================
    editPlatform(platform) {
      const option = this.platformOptions.find(item => item.code === platform.flag)
      this.platformDialogTitle = '编辑平台'
      this.platformForm = {
        id: platform.id,
        platformType: platform.code,
        name: platform.name || '',
        flag: platform.flag || '',
        code: platform.code || '',
        description: platform.description || '',
        icon: option?.icon || platform.icon || '',
        color: option?.color || platform.color || 'blue',
        enabled: platform.enabled !== false,
      }
      this.platformDialogVisible = true

    },

    async savePlatform() {
      const name = this.platformForm.name.trim()
      const description = this.platformForm.description.trim()
      const icon = this.platformForm.icon.trim()

      if (!name) {
        ElMessage.warning('请输入平台名称')
        return
      }

      this.savingPlatform = true

      try {
        // ==================== 编辑 ====================
        if (this.platformForm.id) {
          await platformSave({
            id: this.platformForm.id,
            sopName: name,
            sopDescription: description,
            sopEnabled: this.platformForm.enabled !== false,
            sopFlag: this.platformForm.flag,
          })

          ElMessage.success('平台更新成功')

        } else {
          // ==================== 新增 ====================
          await platformSave({
            sopName: name,
            sopDescription: description,
            sopEnabled: true,
            sopFlag: this.platformForm.flag,
          })

          ElMessage.success(`「${name}」平台添加成功`)
        }

        this.platformDialogVisible = false
        await this.fetchPlatforms()

      } catch (error) {
        console.error('保存平台失败:', error)
        ElMessage.error(error?.message || '保存平台失败')
      } finally {
        this.savingPlatform = false
      }
    },


    // ==================================================
    // 删除平台
    // ==================================================
    async deletePlatform(platform) {
      const configCount = platform.configs?.length || 0

      let message = `确定要删除平台「${platform.name}」吗？`
      if (configCount > 0) {
        message += `\n\n当前平台下面还有 ${configCount} 个配置，将一并删除。`
      }

      // 第一步：确认弹窗，用户取消直接返回
      try {
        await ElMessageBox.confirm(message, '删除平台', {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: false,
        })
      } catch {
        return  // 用户取消，静默返回
      }

      // 第二步：调接口，业务错误要提示
      try {
        await platformDelete(platform.id)
        ElMessage.success('平台已删除')
        await this.fetchPlatforms()
      } catch (error) {
        console.error('删除平台失败:', error)
        ElMessage.warning(error?.message || '删除失败，请先解绑外部货源')
      }
    },


    // ==================================================
    // 进入平台配置
    // ==================================================
    openPlatform(platform) {
      if (platform.enabled === false) {
        ElMessage.warning('该平台已停用')
        return
      }

      this.$router.push({
        name: 'ParameterList',
        params: {
          platform: platform.id,
        },
      })
    },


    // ==================================================
    // 获取平台配置数量
    // ==================================================
    getPlatformConfigCount(platform) {
      return platform.configs?.length || 0
    },


    // ==================================================
    // 获取平台启用配置数量
    // ==================================================
    getPlatformEnabledConfigCount(platform) {
      return (platform.configs || []).filter(
          c => c.enabled !== false
      ).length
    },

  },

  // ==================================================
// 根据平台类型获取展示配置（图标 / 颜色）
// ==================================================
  getPlatformDisplay(platform) {
    const option = this.platformOptions.find(
        item => item.code === platform.flag
    )

    return {
      // 优先用前端定义，其次用后端返回，最后兜底
      icon: option?.icon || platform.icon || platform.name?.slice(0, 1) || 'P',
      color: option?.color || platform.color || 'blue',
    }
  },

}

</script>


<style scoped>

.parameter-page {
  width: 100%;
  padding: 26px 30px 44px;
  /* //max-width: 1440px; */
  margin: 0 auto;
}

/* 下拉项之间的间距 */
.platform-select-dropdown .el-select-dropdown__item {
  height: auto;
  min-height: 52px;          /* 原来约 34px，加到 52px */
  line-height: normal;
  padding: 8px 12px;         /* 上下各留 8px */
  display: flex;
  align-items: center;
  box-sizing: border-box;
}


/* =========================================================
   页面头部
   ========================================================= */

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 28px;
}

.header-left {
  min-width: 0;
}

.eyebrow {
  margin-bottom: 8px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--app-accent);
}

.page-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.title-icon {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 23px;
}

.title-text {
  min-width: 0;
}

.page-header h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.25;
  font-weight: 700;
  color: var(--app-text-primary);
}

.page-header p {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--app-text-muted);
}

.header-actions {
  flex-shrink: 0;
}


/* =========================================================
   Summary
   ========================================================= */

.summary-grid {
  display: grid;
  grid-template-columns:
      repeat(6, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 34px;
}

.summary-card {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  min-height: 92px;
  padding: 18px 20px;
  box-sizing: border-box;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 14px;
  box-shadow:
      0 4px 18px rgba(20, 30, 50, .035);
}

.summary-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  border-radius: 11px;
  font-size: 19px;
}

.summary-icon.blue {
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.summary-icon.green {
  color: #22a06b;
  background: #edf9f3;
}

.summary-icon.orange {
  color: #e99b35;
  background: #fff7e9;
}

/* =========================================================
   网易实时商品中心
   ========================================================= */

.summary-icon.purple {
  color: var(--app-accent-strong);
  background: var(--app-accent-soft);
}

/* 网易商品入口独占一行 */
.netease-goods-card {
  /* //grid-column: 1 / -1; */
  min-height: 88px;
  border: 1px solid var(--app-accent-border);
  background: linear-gradient(
      110deg,
      var(--app-bg-elevated) 0%,
      var(--app-accent-soft) 100%
  );
}

.netease-goods-card:hover {
  border-color: var(--app-accent);
  box-shadow: 0 12px 32px rgba(154, 107, 10, .12);
}

.netease-goods-card:hover .summary-arrow {
  color: var(--app-accent-strong);
}

.summary-icon.douyin { color: #0f766e; background: #e7f8f4; }
.douyin-master-card { border-color: #d8f2ec; background: linear-gradient(110deg,var(--app-bg-elevated),#f3fcfa); }
.douyin-master-card:hover { border-color: #83d8c7; box-shadow: 0 12px 32px rgba(15,118,110,.10); }
.douyin-master-card:hover .summary-arrow { color: #0f766e; }

.summary-label {
  margin-bottom: 5px;
  font-size: 12px;
  color: #9299a3;
}

.summary-value {
  font-size: 24px;
  line-height: 1;
  font-weight: 650;
  color: var(--app-text-primary);
}

/* =========================================================
   可点击的功能入口卡
   ========================================================= */

.summary-card-link {
  cursor: pointer;
  transition:
      transform .2s ease,
      box-shadow .2s ease,
      border-color .2s ease;
}

.summary-card-link:hover {
  transform: translateY(-2px);
  border-color: #ffd9a8;
  box-shadow: 0 12px 32px rgba(233, 155, 53, .14);
}

.summary-desc {
  margin-top: 4px;
  font-size: 11px;
  color: var(--app-text-muted);
}

.summary-arrow {
  margin-left: auto;
  color: var(--app-text-muted);
  font-size: 14px;
  transition: transform .2s ease, color .2s ease;
}

.summary-card-link:hover .summary-arrow {
  color: #e99b35;
  transform: translateX(3px);
}


/* =========================================================
   Section
   ========================================================= */

.platform-section {
  margin-bottom: 30px;
}

.section-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-title h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 650;
  color: var(--app-text-primary);
}

.section-title p {
  margin: 5px 0 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

.section-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.platform-search {
  width: 220px;
}

.platform-search :deep(.el-input__wrapper) {
  border-radius: 10px;
}

.platform-count {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--app-text-muted);
}


/* =========================================================
   Platform Grid
   ========================================================= */

.platform-grid {
  display: grid;
  grid-template-columns:
      repeat(5, minmax(0, 1fr));
  gap: 18px;
}


/* =========================================================
   Platform Card
   ========================================================= */

.platform-card {
  overflow: hidden;
  background: var(--app-bg-elevated);
  border: 1px solid var(--app-border);
  border-radius: 16px;
  box-shadow:
      0 6px 24px rgba(20, 30, 50, .20);
  transition:
      transform .2s ease,
      box-shadow .2s ease;
}

.platform-card:hover {
  transform: translateY(-2px);
  box-shadow:
      0 10px 30px rgba(20, 30, 50, .50);
}

.platform-top {
  display: flex;
  align-items: center;
  padding: 22px 22px 14px;
}


/* =========================================================
   Platform Icon
   ========================================================= */

.platform-icon-wrap {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
}

.platform-icon {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 15px;
  font-size: 22px;
  font-weight: 700;
  white-space: nowrap;
  transition:
      transform .2s ease,
      filter .2s ease;
}

.platform-icon-compact {
  font-size: 12px;
  letter-spacing: -.3px;
}

.platform-icon-wrap:hover .platform-icon {
  transform: scale(1.04);
  filter: brightness(.97);
}

.platform-icon-blue {
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.platform-icon-orange {
  color: #e99325;
  background: #fff3df;
}

.platform-icon-purple {
  color: var(--app-accent-strong);
  background: var(--app-accent-soft);
}

.platform-icon-green {
  color: #16a36a;
  background: #eaf9f2;
}

.platform-icon-red {
  color: #ef5d67;
  background: #fff0f1;
}

.edit-icon {
  position: absolute;
  right: -5px;
  bottom: -5px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  background: var(--app-accent);
  border: 2px solid #fff;
  font-size: 10px;
  opacity: 0;
  transform: scale(.8);
  transition:
      opacity .2s ease,
      transform .2s ease;
}

.platform-icon-wrap:hover .edit-icon {
  opacity: 1;
  transform: scale(1);
}


/* =========================================================
   Platform Basic
   ========================================================= */

.platform-basic {
  min-width: 0;
  margin-left: 15px;
}

.platform-name-row {
  display: flex;
  align-items: center;
  gap: 9px;
}

.platform-name-row h3 {
  overflow: hidden;
  margin: 0;
  font-size: 17px;
  font-weight: 650;
  color: var(--app-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.platform-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 3px 7px;
  border-radius: 20px;
  font-size: 10px;
  color: var(--app-text-muted);
  background: var(--app-bg-subtle);
}

.platform-status.enabled {
  color: #22a06b;
  background: #edf9f3;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.platform-code {
  margin-top: 6px;
  font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      monospace;
  font-size: 11px;
  color: var(--app-text-muted);
}


/* =========================================================
   Description
   ========================================================= */

.platform-description {
  min-height: 20px;
  padding:
      0 22px 17px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--app-text-muted);
}


/* =========================================================
   Stats
   ========================================================= */

.platform-stats {
  display: flex;
  align-items: center;
  margin: 0 22px;
  padding: 13px 0;
  border-top: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
}

.stat-label {
  font-size: 11px;
  color: var(--app-text-muted);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.stat-divider {
  width: 1px;
  height: 16px;
  margin: 0 18px;
  background: #eceef1;
}


/* =========================================================
   Footer
   ========================================================= */

.platform-footer {
  padding: 7px 10px 10px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.config-entry {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition:
      background .2s ease;
}

.config-entry:hover {
  background: var(--app-bg-subtle);
}

.config-entry-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.config-entry-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  border-radius: 8px;
  color: var(--app-accent);
  background: var(--app-accent-soft);
  font-size: 14px;
}

.config-entry-title {
  font-size: 14px;
  font-weight: 550;
  color: var(--app-text-primary);
}

.config-entry-desc {
  margin-top: 3px;
  font-size: 12px;
  color: var(--app-text-muted);
}

.config-arrow {
  flex-shrink: 0;
  color: var(--app-text-muted);
  font-size: 14px;
  transition:
      transform .2s ease,
      color .2s ease;
}

.config-entry:hover .config-arrow {
  color: var(--app-accent);
  transform: translateX(3px);
}

.delete-platform-button {
  flex-shrink: 0;
  margin-right: 4px;
  padding: 8px 7px;
  font-size: 11px;
}


/* =========================================================
   Empty
   ========================================================= */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 30px;
  box-sizing: border-box;
  background: var(--app-bg-elevated);
  border:
      1px dashed var(--app-border);
  border-radius: 16px;
}

.empty-icon {
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  border-radius: 16px;
  color: var(--app-text-muted);
  background: var(--app-bg-subtle);
  font-size: 24px;
}

.empty-state h3 {
  margin: 0;
  font-size: 15px;
  color: var(--app-text-primary);
}

.empty-state p {
  margin: 7px 0 18px;
  font-size: 12px;
  color: var(--app-text-muted);
}


/* =========================================================
   Dialog
   ========================================================= */

.dialog-description {
  margin-bottom: 20px;
  font-size: 12px;
  color: var(--app-text-muted);
}


/* =========================================================
   平台选择
   ========================================================= */

.platform-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 40px;
  padding: 4px 0;
  box-sizing: border-box;
}

/* 文字块：名称 + 编码纵向排列并垂直居中 */
.platform-option > div:last-child {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  flex: 1;
}

.platform-option-icon {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  align-self: center;   /* 加这行 */
}

.platform-option-icon.platform-icon-compact {
  overflow: hidden;
  font-size: 7px;
  letter-spacing: -.2px;
  white-space: nowrap;
}

.platform-option-name {
  font-size: 13px;
  line-height: 18px;   /* 加这行 */
  color: var(--app-text-primary);
}

.platform-option-code {
  margin-top: 2px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  line-height: 14px;   /* 加这行 */
  color: var(--app-text-muted);
}

:deep(.el-select-dropdown__item) {
  height: auto;
  min-height: 46px;
  line-height: normal;
  padding-top: 6px;
  padding-bottom: 6px;
  display: flex;
  align-items: center;
}


/* =========================================================
   已选择的平台
   ========================================================= */

.selected-platform {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 11px 12px;
  box-sizing: border-box;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-bg-subtle);
}

.selected-platform-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 11px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
}

.selected-platform-icon.platform-icon-compact,
.preview-platform-icon.platform-icon-compact {
  overflow: hidden;
  font-size: 9px;
  letter-spacing: -.3px;
  white-space: nowrap;
}

.selected-platform-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.selected-platform-code {
  margin-top: 3px;
  font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      monospace;
  font-size: 10px;
  color: var(--app-text-muted);
}


/* =========================================================
   Icon
   ========================================================= */

.icon-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-platform-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
}

.switch-row {
  display: flex;
  align-items: center;
}

.form-tip {
  margin-top: 6px;
  font-size: 11px;
  line-height: 1.5;
  color: #a2a8b0;
}

.platform-icon-pink {
  color: #ec4899;
  background: #fdf2f8;
}


/* =========================================================
   Responsive
   ========================================================= */

@media (max-width: 900px) {

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .platform-grid {
    grid-template-columns:
        1fr;
  }

}


@media (max-width: 700px) {

  .page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
  }

  .page-header h1 {
    font-size: 25px;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .el-button {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns:
        1fr;
    gap: 10px;
    margin-bottom: 25px;
  }

  .summary-card {
    min-height: 76px;
  }

  .platform-top {
    padding: 18px 18px 12px;
  }

  .platform-description {
    padding:
        0 18px 15px;
  }

  .platform-stats {
    margin:
        0 18px;
  }

  .platform-footer {
    padding:
        7px 8px 8px;
  }

  .section-title {
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12px;
  }

  .section-tools {
    width: 100%;
    flex-wrap: wrap;
  }

  .platform-search {
    flex: 1 1 180px;
    width: auto;
  }

  .platform-count {
    margin-top: 3px;
  }

  .footer-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .delete-platform-button {
    justify-content: center;
    width: 100%;
    margin: 0;
  }

}


@media (max-width: 420px) {

  .platform-name-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }

  .stat-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .stat-divider {
    margin: 0 12px;
  }

}

</style>

<!-- 深色主题覆盖（非 scoped）：工具入口卡去掉浅色渐变、统一深灰底，图标改半透明彩色；浅色模式保持原样 -->
<style>
html.dark .netease-goods-card,
html.dark .douyin-master-card {
  background: var(--app-bg-elevated) !important;
  border-color: var(--app-border) !important;
}

html.dark .summary-icon.blue { background: var(--app-accent-soft) !important; color: var(--app-accent-strong); }
html.dark .summary-icon.green { background: rgba(34, 160, 107, 0.16) !important; color: #34d399; }
html.dark .summary-icon.orange { background: rgba(233, 155, 53, 0.16) !important; color: #fbbf24; }
html.dark .summary-icon.purple { background: rgba(139, 92, 246, 0.16) !important; color: #a78bfa; }
html.dark .summary-icon.douyin { background: rgba(15, 118, 110, 0.16) !important; color: #2dd4bf; }

html.dark .platform-icon-orange { background: rgba(233, 154, 37, 0.14); }
html.dark .platform-icon-purple { background: rgba(139, 92, 246, 0.14); }
html.dark .platform-icon-green { background: rgba(34, 160, 107, 0.14); }
html.dark .platform-icon-red { background: rgba(239, 93, 103, 0.14); }
</style>