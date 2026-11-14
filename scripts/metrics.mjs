import { spawnSync } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const left = process.argv[2] ?? 'final';
const right = process.argv[3] ?? 'HEAD';
const outDir = join(repo, 'docs/metrics');

function git(args) {
  const dir = mkdtempSync(join(tmpdir(), 'svg-metrics-'));
  const out = join(dir, 'out');
  const err = join(dir, 'err');
  const outFd = openSync(out, 'w');
  const errFd = openSync(err, 'w');
  try {
    const result = spawnSync('git', args, { cwd: repo, stdio: ['ignore', outFd, errFd] });
    if (result.status !== 0) throw new Error(readFileSync(err, 'utf8'));
    return readFileSync(out, 'utf8');
  } finally {
    closeSync(outFd);
    closeSync(errFd);
    rmSync(dir, { recursive: true, force: true });
  }
}

function files(ref) {
  return git(['ls-tree', '-r', '--name-only', ref])
    .split(/\r?\n/)
    .filter(path => path.endsWith('.ts') && !path.endsWith('.d.ts') && !path.includes('/test') && !path.includes('/dist'));
}

function category(ref, path) {
  if (path.startsWith('vscode-extension/src/')) return 'vscode';
  if (path.startsWith('plugins/') && path.includes('/src/')) return 'plugins';
  if (ref === 'final') return path === 'src/main.ts' || path.startsWith('src/cli/') ? 'assembly' : 'kernel';
  return path === 'src/main.ts' || path.startsWith('src/cli/') || path.startsWith('src/host/') || path.startsWith('src/builtin/')
    ? 'assembly'
    : 'kernel';
}

function codeLines(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== '' && !line.startsWith('//')).length;
}

function complexity(text) {
  const source = ts.createSourceFile('m.ts', text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  let score = 0;
  const visit = node => {
    if (ts.isFunctionLike(node)) score++;
    if (ts.isIfStatement(node) || ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)
      || ts.isWhileStatement(node) || ts.isDoStatement(node) || ts.isCaseClause(node) || ts.isCatchClause(node)
      || ts.isConditionalExpression(node)
      || (ts.isBinaryExpression(node) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind))) score++;
    node.forEachChild(visit);
  };
  visit(source);
  return Math.max(1, score);
}

function collect(ref) {
  return files(ref).map(path => {
    const text = git(['show', `${ref}:${path}`]);
    return { path, area: category(ref, path), code: codeLines(text), complexity: complexity(text) };
  });
}

const leftFiles = collect(left);
const rightFiles = collect(right);
const areas = ['kernel', 'assembly', 'plugins', 'vscode'];
const rows = areas.map(area => {
  const l = leftFiles.filter(f => f.area === area);
  const r = rightFiles.filter(f => f.area === area);
  return {
    area,
    lf: l.length, lc: l.reduce((s, f) => s + f.code, 0), lx: l.reduce((s, f) => s + f.complexity, 0),
    rf: r.length, rc: r.reduce((s, f) => s + f.code, 0), rx: r.reduce((s, f) => s + f.complexity, 0),
  };
});

writeFileSync(join(outDir, 'line-counts.md'), `# 行数统计（由 \`scripts/metrics.mjs\` 生成）\n\n对比 \`${left}\`（Phase 1）与 \`${right}\`（Phase 2），排除测试、声明、依赖和构建产物。\n\n| 区域 | ${left} 文件 | ${left} 代码行 | ${right} 文件 | ${right} 代码行 | 增量 |\n|---|---:|---:|---:|---:|---:|\n${rows.map(r => `| ${r.area} | ${r.lf} | ${r.lc} | ${r.rf} | ${r.rc} | ${r.rc - r.lc} |`).join('\n')}\n| **CLI 合计** | ${rows.filter(r => r.area !== 'vscode').reduce((s, r) => s + r.lf, 0)} | ${rows.filter(r => r.area !== 'vscode').reduce((s, r) => s + r.lc, 0)} | ${rows.filter(r => r.area !== 'vscode').reduce((s, r) => s + r.rf, 0)} | ${rows.filter(r => r.area !== 'vscode').reduce((s, r) => s + r.rc, 0)} | ${rows.filter(r => r.area !== 'vscode').reduce((s, r) => s + r.rc - r.lc, 0)} |\n\nVSCode 扩展单列，不计入 CLI 重构增量。\n`);

writeFileSync(join(outDir, 'complexity.md'), `# 圈复杂度近似值（由 \`scripts/metrics.mjs\` 生成）\n\n每个函数计 1，每个 \`if\`/循环/\`case\`/\`catch\`/条件表达式/短路运算再计 1，用于趋势比较。\n\n| 区域 | ${left} | ${right} | 增量 |\n|---|---:|---:|---:|\n${rows.map(r => `| ${r.area} | ${r.lx} | ${r.rx} | ${r.rx - r.lx} |`).join('\n')}\n| **CLI 合计** | ${rows.filter(r => r.area !== 'vscode').reduce((s, r) => s + r.lx, 0)} | ${rows.filter(r => r.area !== 'vscode').reduce((s, r) => s + r.rx, 0)} | ${rows.filter(r => r.area !== 'vscode').reduce((s, r) => s + r.rx - r.lx, 0)} |\n`);

writeFileSync(join(outDir, 'file-inventory.md'), `# 文件清单（由 \`scripts/metrics.mjs\` 从 \`${right}\` 生成）\n\n| 文件 | 区域 | 代码行 | 复杂度 | 职责 |\n|---|---|---:|---:|---|\n${rightFiles.map(f => `| \`${f.path}\` | ${f.area} | ${f.code} | ${f.complexity} | ${responsibility(f.path)} |`).join('\n')}\n`);

function responsibility(path) {
  if (path.startsWith('src/extensions/')) return '扩展点契约、注册表、事务式激活';
  if (path.startsWith('src/host/')) return '代码/配置装配与插件加载';
  if (path.startsWith('src/builtin/')) return '内置插件：六种形状与 Phase 1 命令';
  if (path.startsWith('src/domain/')) return `领域模型：${path.split('/').pop()?.replace('.ts', '')}`;
  if (path.startsWith('src/application/')) return '文档会话、历史与结构查询';
  if (path.startsWith('src/infrastructure/')) return 'SVG 编解码与文件存储';
  if (path.startsWith('src/commands/')) return '命令对象与参数校验';
  if (path.startsWith('src/cli/')) return 'REPL 与分词';
  if (path === 'src/main.ts') return '组合根';
  if (path.startsWith('plugins/plugin-command-stats/')) return 'stats 命令插件';
  if (path.startsWith('plugins/plugin-command-dir/')) return 'dir 命令插件与目录适配器';
  if (path.startsWith('plugins/plugin-shape-box/')) return 'box 形状、属性处理器与 (box) 标签';
  if (path.startsWith('plugins/plugin-tree-modified-star/')) return 'modified-star 树标签';
  if (path.startsWith('vscode-extension/src/')) return 'VSCode 扩展';
  return '源码';
}

process.stdout.write(`wrote metrics ${left}..${right}: ${leftFiles.length} -> ${rightFiles.length} files\n`);
