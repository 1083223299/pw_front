/**
 * 主题颜色迁移脚本（一次性辅助工具）
 *
 * 作用：把业务页面里硬编码的「中性色」批量替换为全局主题变量，
 * 语义彩色（品牌蓝 / 状态绿 / 橙 / 红 / 紫等标签与按钮）保持不动。
 *
 * 用法：
 *   node scripts/migrate-theme-colors.cjs --dry-run   仅统计命中，不写文件
 *   node scripts/migrate-theme-colors.cjs             实际写回
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const INCLUDE = ['.vue', '.css'];

// 白色 / 卡片底色 -> 提升层背景
const BG_WHITE = ['#fff', '#ffffff'];
// 浅灰底色 -> 次级背景
const BG_SUBTLE = [
  '#f7f8fa', '#f8f9fb', '#fafbfc', '#f8fbff', '#fafcff', '#f7faff',
  '#f3f4f6', '#f1f5f9', '#f1f3f5', '#f5f6f8', '#f8fafc', '#fafdff',
  '#f4faff', '#f9fbff', '#fbfcff', '#f5f7fa', '#f4f6f8', '#fafafa',
  '#f5f5f5', '#f0f2f5', '#f1f2f4', '#f0f4f9', '#f3f6fc', '#f4f4f5',
  '#f5f6f7', '#f5f7fc', '#f7f9fd', '#f3f7fb', '#f0f3f9', '#f2f7fd',
  '#f0f6ff', '#f5f8ff', '#f3f7ff', '#f4f9ff', '#f0f9f4',
];
// 浅灰边框 -> 主题边框
const BORDER_GRAY = [
  '#eef0f3', '#edf1f8', '#e8ebef', '#e5e7eb', '#e8eef8', '#e8edf3',
  '#f0f1f3', '#f2f3f5', '#dcdfe6', '#e5e9ef', '#e7eaf0', '#e4e7ed',
  '#ebeef5', '#edf0f3', '#e8edf5', '#e1e8f3', '#eef1f6', '#e9eef7',
  '#c9ced6', '#e0e0e0', '#edf1f7', '#edf0f4', '#e5edfa', '#f0f3f9',
  '#e7eef9', '#e7eef8',
];
// 深色标题文字 -> 主文字
const TEXT_PRIMARY = [
  '#17191c', '#30343a', '#30343b', '#111827', '#1f2937', '#303133',
  '#334155', '#2d3442', '#363b43', '#454a52', '#494e59',
  '#1e293b', '#20252d', '#172b4d', '#203152', '#263a5c', '#253858',
  '#324461', '#334561',
];
// 中灰正文 -> 次级文字
const TEXT_SECONDARY = [
  '#4b5563', '#606266', '#66707a', '#64748b', '#666', '#475569',
  '#6b7280', '#888', '#8190a8', '#72819d', '#53617b', '#52617d',
  '#31588e', '#8a98ae',
];
// 浅灰弱化文字 -> 弱化文字
const TEXT_MUTED = [
  '#8b929c', '#9097a1', '#9aa1aa', '#9aa1ab', '#a1a7af', '#a0a5ad',
  '#a3a8b0', '#a5aab2', '#9ca3af', '#8a929c', '#7b8490', '#909399',
  '#a8abb2', '#c0c4cc', '#9ba1a9', '#9ba2aa', '#929aa4', '#8c949e',
  '#969da6', '#aeb5be', '#b0b5bd', '#b2b8c0', '#68717d', '#999',
  '#aaa', '#8b96a3', '#a0a6ae', '#9ca3ad', '#8290a8', '#66758e',
  '#6f809d', '#7c8ba7', '#58718e', '#9098a2', '#94a3b8', '#9aa7bc',
];

function toMap(list, variable) {
  const map = new Map();
  for (const c of list) map.set(c.toLowerCase(), variable);
  return map;
}

const MAPS = {
  background: new Map([
    ...toMap(BG_WHITE, 'var(--app-bg-elevated)'),
    ...toMap(BG_SUBTLE, 'var(--app-bg-subtle)'),
  ]),
  border: toMap(BORDER_GRAY, 'var(--app-border)'),
  color: new Map([
    ...toMap(TEXT_PRIMARY, 'var(--app-text-primary)'),
    ...toMap(TEXT_SECONDARY, 'var(--app-text-secondary)'),
    ...toMap(TEXT_MUTED, 'var(--app-text-muted)'),
  ]),
};

function classify(prop) {
  const p = prop.toLowerCase();
  if (p === 'background' || p === 'background-color') return 'background';
  if (p.startsWith('border')) return 'border';
  if (p === 'color' || p === 'scrollbar-color') return 'color';
  return null;
}

// 把 value 中的命中 hex 替换为变量；返回 [新value, 替换次数]
function replaceInValue(value, map) {
  let count = 0;
  const next = value.replace(/#[0-9a-fA-F]{3,6}\b/g, (hex) => {
    const variable = map.get(hex.toLowerCase());
    if (variable) {
      count += 1;
      return variable;
    }
    return hex;
  });
  return [next, count];
}

// 匹配一条 CSS 声明：property: value;（兼容压缩行末尾无分号、直接接 } 的情况）
const DECL_RE = /([a-zA-Z-]+)\s*:\s*([^;{}]+)(;|})/g;

function processFile(filePath, dryRun) {
  const source = fs.readFileSync(filePath, 'utf8');
  let total = 0;

  const next = source.replace(DECL_RE, (whole, prop, value, sep) => {
    const kind = classify(prop);
    if (!kind) return whole;
    const [newValue, count] = replaceInValue(value, MAPS[kind]);
    total += count;
    return count ? `${prop}: ${newValue}${sep}` : whole;
  });

  if (!dryRun && total > 0) {
    fs.writeFileSync(filePath, next, 'utf8');
  }
  return total;
}

// 仿手机账单的预览弹窗，内部模拟手机界面，保留自身配色，不参与主题迁移
const EXCLUDE = ['BillDetail.vue'];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (INCLUDE.includes(path.extname(entry.name)) && !EXCLUDE.includes(entry.name)) out.push(full);
  }
  return out;
}

const dryRun = process.argv.includes('--dry-run');
const files = walk(SRC_DIR);
let grand = 0;

for (const file of files) {
  const hits = processFile(file, dryRun);
  if (hits > 0) {
    grand += hits;
    console.log(`${String(hits).padStart(4)}  ${path.relative(SRC_DIR, file)}`);
  }
}
console.log(`\n${dryRun ? '[dry-run] ' : ''}共替换 ${grand} 处中性色`);
