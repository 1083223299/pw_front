# 充值中心（pw_front）

基于 Vue 3 + Vite 5 + Element Plus + Pinia，现已接入 Electron 桌面端，同时保留原 Web 构建方式。

## 桌面端命令

```bash
# 安装依赖
npm install

# 桌面端开发：测试环境，Vite 热更新
npm run dev
# 等价于
npm run dev:test

# 桌面端开发：使用生产环境配置
npm run dev:prod-api

# 构建并运行桌面端
npm run start:test
npm run start:prod

# 仅生成桌面端前端资源
npm run build:test
npm run build:prod

# 生成免安装目录
npm run pack:test
npm run pack:prod

# 生成 Windows 安装包，输出到 release/
npm run dist:test
npm run dist:prod
```

桌面端使用无边框窗口、系统托盘和窗口状态记忆。点击窗口关闭按钮会隐藏到托盘，右键托盘图标选择“退出”才会完全退出。

## Web 兼容命令

```bash
# 原 Web 开发模式
npm run dev:web

# 原 Web 构建
npm run build:web:test
npm run build:web:prod

# 预览 Web 构建产物
npm run preview
```

Web 端仍使用 `/h5_pw/` 作为 `base` 和路由根路径；桌面端自动使用相对资源路径与 hash 路由，避免 `file://` 加载时出现白屏。

## 接口环境配置

环境变量文件和值保持原项目配置：

| 文件 | 环境 | 加载时机 |
| --- | --- | --- |
| `.env` | 公共配置 | 所有环境 |
| `.env.development` | 测试环境 | `dev:test`、`build:test`、`pack:test`、`dist:test` |
| `.env.production` | 生产环境 | `dev:prod-api`、`build:prod`、`pack:prod`、`dist:prod` |

`src/config/env.js` 按参考项目的结构统一导出当前环境、接口地址和超时时间，`src/api/request.js` 与 `src/api/tools.js` 从该模块读取配置。

| 配置 | 当前值 | 使用位置 |
| --- | --- | --- |
| `VITE_API_URL` | `/pws` | 主后端请求 |
| `VITE_TOOLS_API_URL` | `/doudian_shop/v1` | 订单处理工具请求 |
| `VITE_APP_TITLE` | `外部订单系统` | 公共配置 |
| `VITE_APP_DEBUG` | 测试 `true` / 生产 `false` | 环境标识 |

本地开发时，`vite.config.js` 继续将 `/pws`、`/doudian_shop` 代理到原项目已配置的 `http://47.95.21.64`，代理目标未修改。打包版通过仅监听 `127.0.0.1` 的本机服务加载页面，并转发同样的相对接口路径，避免它们被当成 `file://` 地址；不会修改前端环境变量，也不会关闭浏览器安全策略。

## 桌面端结构

```text
main.js                     Electron 主进程：窗口、托盘、IPC、日志
preload.js                  渲染进程安全桥接
localServer.js              打包版本机页面服务与相对接口代理
api-target.cjs              原项目后端代理目标（开发/桌面共用）
electron-builder.config.js  分环境安装包配置
scripts/dev.js              Vite 热更新与 Electron 联合启动
scripts/check-release-lock.js 打包前文件占用检查
scripts/after-pack.cjs       Windows exe 图标与版本信息写入
scripts/gen-icon.js         当前项目桌面图标生成
src/config/env.js           多环境接口配置入口
src/components/DesktopTitlebar.vue 桌面窗口标题栏
```

日志位于应用用户数据目录的 `logs/main.log`。测试环境使用独立用户数据目录，不与生产环境共享缓存和窗口状态。
