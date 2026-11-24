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
};
