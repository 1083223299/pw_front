const fs = require('fs');
const path = require('path');

// 打包结束后清理 release 下的解包目录（win-unpacked、*-unpacked 等）。
// 目的：release 目录只保留安装包、blockmap、latest.yml 这些真正要发布的东西。
// 90MB+ 的 app.asar 长期留在磁盘上，容易被编辑器 / 搜索索引读走并持有句柄，
// 下一次打包时就会被判定为“占用”。清掉它，占用问题从源头消失。
const releaseDir = path.join(__dirname, '..', 'release');
if (!fs.existsSync(releaseDir)) process.exit(0);

const unpackedDirs = fs
  .readdirSync(releaseDir, { withFileTypes: true })
  // 只处理 Windows 的解包目录（win-unpacked / win-arm64-unpacked），
  // macOS 的 release/mac* 目录、dmg、zip 一律不碰
  .filter((item) => item.isDirectory() && /^win.*unpacked$/i.test(item.name))
  .map((item) => path.join(releaseDir, item.name));

if (!unpackedDirs.length) {
  console.log('release 目录无解包残留，跳过清理');
  process.exit(0);
}

for (const dir of unpackedDirs) {
  try {
    // maxRetries 用于规避杀软 / 索引器的短暂句柄
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    console.log(`已清理解包目录：release\\${path.basename(dir)}`);
  } catch (error) {
    // 清理失败不阻断：安装包、blockmap、latest.yml 此时已经生成完成
    console.warn(
      `清理失败（不影响已生成的安装包）：release\\${path.basename(dir)} - ${error.code || error.message}`
    );
    console.warn('如需定位占用进程，可执行：powershell -File scripts\\find-lock-owner.ps1 "release\\win-unpacked"');
  }
}

process.exit(0);
