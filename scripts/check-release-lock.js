const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// 打包前置处理：不再用“改名探测”判断占用，而是直接把上一次的解包目录删掉。
// electron-builder 每次都会重新解包，旧目录留着只有两种结局：
//   1) 没人占用：白占几百 MB 磁盘，还容易被编辑器 / 搜索索引读走；
//   2) 有人占用：electron-builder 清空目录那一步失败，打包中断。
// 所以这里改成主动清理：删得掉就放行，删不掉才打印出占用进程并阻断。
const releaseDir = path.join(__dirname, '..', 'release');
const unpackedDirs = fs.existsSync(releaseDir)
  ? fs
      .readdirSync(releaseDir, { withFileTypes: true })
      // 只处理 Windows 解包目录，避免误删 macOS 的 mac / mac-arm64 输出
      .filter((item) => item.isDirectory() && /^win.*unpacked$/i.test(item.name))
      .map((item) => path.join(releaseDir, item.name))
  : [];

if (!unpackedDirs.length) process.exit(0);

for (const dir of unpackedDirs) {
  try {
    // maxRetries 用于等待杀软 / 索引器短暂释放句柄
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    console.log(`已清理上次的解包目录：release\\${path.basename(dir)}`);
  } catch (error) {
    console.error(`打包阻断：release\\${path.basename(dir)} 删不掉（${error.code || error.message}）`);

    // 直接告诉用户是谁占着，省得自己猜、自己翻任务管理器
    const ps1 = path.join(__dirname, 'find-lock-owner.ps1');
    const result = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, dir],
      { encoding: 'utf8' }
    );
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);

    console.error('关闭占用该目录的窗口 / 进程后重新执行打包命令即可。');
    process.exit(1);
  }
}

process.exit(0);
