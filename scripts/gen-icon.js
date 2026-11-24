const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const buildDir = path.join(root, 'build');

/**
 * 品牌图：src/assets/images/logo-brand.png
 * 16/32/48/256 尺寸 PNG 已从品牌源图导出；本脚本负责把这些 PNG 封装成 Windows ICO。
 */
const entries = [
  { size: 16, file: path.join(root, 'src', 'assets', 'images', 'logo16.png') },
  { size: 32, file: path.join(root, 'src', 'assets', 'images', 'logo32.png') },
  { size: 48, file: path.join(buildDir, 'icon48.png') },
  { size: 256, file: path.join(buildDir, 'icon.png') },
];

function makeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const directories = [];
  const buffers = [];

  for (const image of images) {
    const directory = Buffer.alloc(16);
    directory[0] = image.size >= 256 ? 0 : image.size;
    directory[1] = image.size >= 256 ? 0 : image.size;
    directory.writeUInt16LE(1, 4);
    directory.writeUInt16LE(32, 6);
    directory.writeUInt32LE(image.png.length, 8);
    directory.writeUInt32LE(offset, 12);
    offset += image.png.length;
    directories.push(directory);
    buffers.push(image.png);
  }

  return Buffer.concat([header, ...directories, ...buffers]);
}

const ico = makeIco(
  entries.map((entry) => ({
    size: entry.size,
    png: fs.readFileSync(entry.file),
  }))
);

fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico);
console.log('已封装品牌图 Windows ICO。');
