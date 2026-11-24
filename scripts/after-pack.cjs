const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const packageJson = require('../package.json');

/** 写入自动更新读取的本地元数据；更新地址仍沿用 package.json.build.publish，不改动业务配置。 */
function writeAppUpdateYml(context) {
  const publish = packageJson.build && packageJson.build.publish;
  if (!publish || !publish.provider || !publish.url) return;

  const resourcesDir = path.join(context.appOutDir, 'resources');
  fs.mkdirSync(resourcesDir, { recursive: true });

  const updaterCacheDirName = context.packager.appInfo.updaterCacheDirName;
  const appUpdateYml = [
    `provider: ${publish.provider}`,
    `url: ${publish.url}`,
    `updaterCacheDirName: ${updaterCacheDirName}`,
  ].join('\n') + '\n';

  fs.writeFileSync(path.join(resourcesDir, 'app-update.yml'), appUpdateYml, 'utf8');
}

/**
 * Windows 下图标和版本信息分两次写入。
 * 当前 rcedit 在部分环境中一次提交两类资源会报 Unable to commit changes。
 */
module.exports = async function afterPack(context) {
  // macOS：没有 Developer ID 证书，做 ad-hoc 自签。
  // 苹果芯片要求可执行文件带有效签名，完全未签名的包会提示“已损坏，无法打开”。
  // 注意：ad-hoc 只解决“打不开”，首次启动仍会有“无法验证开发者”提示，
  // 彻底消除需要 Developer ID 证书 + 公证。
  if (context.electronPlatformName === 'darwin') {
    const appInfo = context.packager.appInfo;
    const appBundle = path.join(context.appOutDir, `${appInfo.productFilename}.app`);
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', appBundle], {
      stdio: 'inherit',
    });
    console.log(`已完成 macOS ad-hoc 签名：${appBundle}`);
    return;
  }

  if (context.electronPlatformName !== 'win32') return;

  const rcedit = require('rcedit');
  const appInfo = context.packager.appInfo;
  const executable = path.join(context.appOutDir, `${appInfo.productFilename}.exe`);
  const icon = path.join(context.packager.projectDir, 'build', 'icon.ico');

  const productVersion = [...appInfo.version.split('.'), '0', '0', '0'].slice(0, 4).join('.');
  const temporaryExecutable = `${executable}.edit.exe`;
  fs.copyFileSync(executable, temporaryExecutable);

  const editWithRetry = async (options) => {
    let lastError;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        await rcedit(temporaryExecutable, options);
        return;
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
    }
    throw lastError;
  };

  try {
    await editWithRetry({
      'version-string': {
        FileDescription: appInfo.productName,
        ProductName: appInfo.productName,
      },
      'file-version': appInfo.version,
      'product-version': productVersion,
    });
    await editWithRetry({ icon });
    fs.copyFileSync(temporaryExecutable, executable);
    writeAppUpdateYml(context);
  } finally {
    fs.rmSync(temporaryExecutable, { force: true });
  }
};
