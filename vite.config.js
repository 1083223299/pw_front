const { defineConfig } = require('vite');
const vue = require('@vitejs/plugin-vue');
const path = require('path');
const pkg = require('./package.json');
const apiTarget = require('./api-target.cjs');

module.exports = defineConfig({
  // Web 发布目录保持原值；Electron 使用相对路径，保证 file:// 下资源可加载。
  base: process.env.VITE_DESKTOP === 'true' ? './' : '/h5_pw/',
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      // 测试环境后端主机：http://47.95.21.64
      // 本地开发时由 vite 代理转发，避免浏览器跨域；接口前缀保持不变
      '/pws': {
        target: apiTarget,  // 充值管理端 pwServiceCmd（原本地 localhost:8097）
        changeOrigin: true,
        ws: true,           // 代理管理端通知 WebSocket：/pws/admin/ws
      },
      '/doudian_shop': {
        target: apiTarget,  // 订单处理工具 ddShopCmd（原本地 localhost:8092）
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true,
  },
});
