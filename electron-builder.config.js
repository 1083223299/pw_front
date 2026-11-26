const packageJson = require('./package.json');

// 按环境区分安装包：生产无前缀，测试环境使用 test_ 前缀。
const env = process.env.VITE_APP_ENV || 'prod';
const envPrefix = env === 'prod' ? '' : `${env}_`;
// macOS 的应用名（程序坞/菜单栏/访达里显示的）取的是 .app 目录名，
// 只有让它变成中文，Dock 才会稳定显示「充值中心」，不依赖 Info.plist 的显示名字段。
// 因此 mac 构建时用环境变量 VITE_PRODUCT_NAME 覆盖 productName；
// Windows 本地打包不设这个变量，仍是 pwEsportsRecharge，安装包和用户目录都不受影响。
const defaultProductName = 'pwEsportsRecharge';
const productName = process.env.VITE_PRODUCT_NAME || defaultProductName;
const appId = env === 'prod' ? packageJson.build.appId : `${packageJson.build.appId}.${env}`;
const shortcutSuffix = env === 'prod' ? '' : '（测试）';

module.exports = {
  ...packageJson.build,
  appId,
  productName,
  // 产物文件名固定用英文：自动更新的 latest-mac.yml 里记的是这个文件名，
  // 若跟着 productName 变成中文，历史安装包会因为文件名对不上而更新失败。
  artifactName: `${envPrefix}${defaultProductName}SetupV\${version}.\${ext}`,
  extraMetadata: {
    ...packageJson.build.extraMetadata,
    appEnvironment: env,
  },
  afterPack: require('./scripts/after-pack.cjs'),
  nsis: {
    ...packageJson.build.nsis,
    shortcutName: `充值中心${shortcutSuffix}`,
  },
};
