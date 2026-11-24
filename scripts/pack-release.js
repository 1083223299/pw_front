const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

// 生产/测试打包统一入口。
// 思路：electron-builder 的完整流程（解包 → 写图标版本 → 生成 nsis）放到系统临时目录执行，
// 只把真正要发布的安装包、blockmap、latest.yml 拷回 release。
// 这样 release 里永远是干净的三件套，不会留 90MB+ 的 win-unpacked/app.asar，
// 编辑器、搜索索引、杀软也就没有机会长期持有它，打包不会再被“目录占用”卡住。
const projectDir = path.join(__dirname, '..');
const releaseDir = path.join(projectDir, 'release');
const envName = process.argv[2] === 'test' ? 'test' : 'prod';

let buildDir = path.join(os.tmpdir(), 'pw-esports-build');
try {
  fs.rmSync(buildDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
} catch {
  // 上次的临时目录还有残留进程占用时，换一个带时间戳的新目录，绝不复用
  buildDir = `${buildDir}-${Date.now()}`;
}
fs.mkdirSync(buildDir, { recursive: true });

// 用 node 直接执行 electron-builder 的 CLI 入口：
// Windows 上 spawnSync 不能直接拉起 .cmd（会报 EINVAL），走 js 入口最稳，也不依赖 shell 引号
const builderCli = path.join(projectDir, 'node_modules', 'electron-builder', 'out', 'cli', 'cli.js');
if (!fs.existsSync(builderCli)) {
  console.error('未找到 electron-builder，请先执行 npm install');
  process.exit(1);
}

console.log(`打包输出目录（临时）：${buildDir}`);
const result = spawnSync(
  process.execPath,
  [builderCli, '--config', 'electron-builder.config.js', '--win', 'nsis', '--config.directories.output', buildDir],
  {
    cwd: projectDir,
    stdio: 'inherit',
    env: { ...process.env, VITE_APP_ENV: envName, VITE_DESKTOP: 'true' },
  }
);

if (result.error) {
  console.error(`electron-builder 启动失败：${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`electron-builder 退出码 ${result.status}，打包中断；临时目录保留在 ${buildDir} 便于排查`);
  process.exit(result.status || 1);
}

// 只回收发布需要的产物，win-unpacked 这类中间目录一律丢弃
const artifactPattern = /(\.exe|\.exe\.blockmap|latest\.yml|latest-.*\.yml)$/i;
const artifacts = fs
  .readdirSync(buildDir)
  .filter((name) => artifactPattern.test(name) && !name.startsWith('builder-debug'))
  .map((name) => path.join(buildDir, name));

if (!artifacts.length) {
  console.error('未在临时目录找到可发布的产物，请检查 electron-builder 配置');
  process.exit(1);
}

fs.mkdirSync(releaseDir, { recursive: true });
for (const file of artifacts) {
  const target = path.join(releaseDir, path.basename(file));
  fs.copyFileSync(file, target);
  console.log(`已更新：release\\${path.basename(file)}  ${(fs.statSync(target).size / 1024 / 1024).toFixed(2)} MB`);
}

// 临时目录用完即删；删不掉只提示，不影响已生成的安装包
try {
  fs.rmSync(buildDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
} catch {
  console.warn(`临时目录未能删除，可手动清理：${buildDir}`);
}

console.log('打包完成，release 目录只保留安装包、blockmap 与 latest.yml');
