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
  // macOS：没有 Developer ID 证书时做 ad-hoc 自签。
  // 苹果芯片（arm64）要求可执行文件必须带有效签名，否则安装后提示
  // “已损坏，无法打开”。ad-hoc 签名（codesign -s -）即可满足这一要求，
  // 用户侧不再需要手动跑 xattr / codesign 命令。
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
