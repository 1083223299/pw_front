const packageJson = require('./package.json');

// 按环境区分安装包：生产无前缀，测试环境使用 test_ 前缀。
const env = process.env.VITE_APP_ENV || 'prod';
const envPrefix = env === 'prod' ? '' : `${env}_`;
const productName = 'pwEsportsRecharge';
const appId = env === 'prod' ? packageJson.build.appId : `${packageJson.build.appId}.${env}`;
const shortcutSuffix = env === 'prod' ? '' : '（测试）';

module.exports = {
  ...packageJson.build,
  appId,
  productName,
  artifactName: `${envPrefix}${productName}SetupV\${version}.\${ext}`,
  extraMetadata: {
    ...packageJson.build.extraMetadata,
    appEnvironment: env,
  },
  afterPack: require('./scripts/after-pack.cjs'),
  nsis: {
    ...packageJson.build.nsis,
    shortcutName: `充值中心${shortcutSuffix}`,
  },
  mac: {
    ...packageJson.build.mac,
    // macOS 图标最小 512x512，这里单独用 build/icon-mac.png（1024），
    // 不改动 Windows 使用的 build/icon.png（256）和 build/icon.ico
    icon: 'build/icon-mac.png',
    // ad-hoc 自签（无证书）时不启用 hardened runtime：
    // 开了会要求 JIT 等 entitlements，未公证的包更容易被系统拦下
    hardenedRuntime: false,
  },
};
