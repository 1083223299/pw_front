/**
 * 多环境配置：结构参考桌面端项目，具体接口值仍由当前项目的 .env 文件提供。
 * 不引入参考项目的接口地址、WebSocket 地址或其他业务配置。
 */
export const ENV_NAMES = {
  TEST: 'test',
  PROD: 'prod',
};

export const CLIENT_VERSION = __APP_VERSION__;

const apiBaseURL = import.meta.env.VITE_API_URL || '/pws';
const toolsApiBaseURL = import.meta.env.VITE_TOOLS_API_URL || '/doudian_shop/v1';

export const environments = {
  [ENV_NAMES.TEST]: {
    name: '测试',
    apibaseURL: apiBaseURL,
    toolsApibaseURL: toolsApiBaseURL,
    timeout: 60000,
    toolsTimeout: 30000,
    debug: true,
  },
  [ENV_NAMES.PROD]: {
    name: '生产',
    apibaseURL: apiBaseURL,
    toolsApibaseURL: toolsApiBaseURL,
    timeout: 60000,
    toolsTimeout: 30000,
    debug: false,
  },
};

function resolveEnv() {
  const fromScript = import.meta.env.VITE_APP_ENV;
  if (fromScript && environments[fromScript]) return fromScript;
  return import.meta.env.PROD ? ENV_NAMES.PROD : ENV_NAMES.TEST;
}

export const CURRENT_ENV = resolveEnv();
export const config = environments[CURRENT_ENV];

export default config;
