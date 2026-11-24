const fs = require('fs');
const path = require('path');

// 打包前检查历史 app.asar 是否被编辑器等进程占用，避免 electron-builder 清空目录时失败。
const probe = path.join(__dirname, '..', 'release', 'win-unpacked', 'resources', 'app.asar');
if (!fs.existsSync(probe)) process.exit(0);

try {
  const temporary = `${probe}.lockprobe`;
  fs.renameSync(probe, temporary);
  fs.renameSync(temporary, probe);
  process.exit(0);
} catch {
  console.error('打包阻断：release\\win-unpacked 正被其他程序占用，请关闭相关文件或进程后重试。');
  process.exit(1);
}
