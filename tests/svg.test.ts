import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { DocumentInspector } from '../src/application/DocumentInspector.js';
import { FileDocumentStore } from '../src/infrastructure/FileDocumentStore.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { EditorHarness } from './EditorHarness.js';

test('六种图形 SVG 往返保留层级、顺序、属性和需要 XML 转义的文本与 ID', () => {
  const editor = new EditorHarness();
  for (const command of [
    'init 400 300', 'create g scene', 'create rect r 1 2 3 4 #abc in scene',
    'create circle c 1 2 3 in scene', 'create ellipse e 1 2 3 4 in scene',
    'create line l 1 2 3 4 black', 'create text "t&<>" 5 6 "A & <B>" in scene',
    'set scene stroke-width 2', 'create g empty in scene',
  ]) editor.run(command);
  const codec = new SvgCodec();
  const xml = codec.encode(editor.canvas);
  assert.match(xml, /&amp;/);
  assert.match(xml, /&lt;B&gt;/);
  assert.doesNotMatch(xml, /\btext="/);
  const loaded = codec.decode(xml);
  assert.deepEqual(loaded.warnings, []);
  assert.equal(new DocumentInspector(loaded.canvas).tree(), new DocumentInspector(editor.canvas).tree());
  assert.equal(loaded.canvas.walk().length, 7);
});

test('缺 ID 自动分配预先避开全文已有 ID，重复 ID 拒绝', () => {
  const codec = new SvgCodec();
  const loaded = codec.decode('<svg width="400" height="300"><rect/><rect id="rect1"/><g><rect/><text>Hi</text></g></svg>');
  assert.deepEqual(loaded.canvas.walk().map(shape => shape.id), ['rect2', 'rect1', 'g1', 'rect3', 'text1']);
  assert.deepEqual(loaded.warnings, [
    'warning: assigned id rect2 to unnamed <rect>',
    'warning: assigned id g1 to unnamed <g>',
    'warning: assigned id rect3 to unnamed <rect>',
    'warning: assigned id text1 to unnamed <text>',
  ]);
  assert.throws(() => codec.decode('<svg><rect id="a"/><g id="a"/></svg>'), /id already exists: a/);
  assert.throws(() => codec.decode('<svg id="root"><rect id="root"/></svg>'), /id already exists: root/);
});

test('坏 XML、不支持的标签和非法数值明确报错，不静默丢弃', () => {
  const codec = new SvgCodec();
  const sources = [
    '<svg><rect></svg>', '<html/>', '<svg><path d="M0 0"/></svg>',
    '<svg><text><tspan>unsupported</tspan></text></svg>', '<svg width="100%"/>',
    '<svg><circle r="-1"/></svg>', '<svg><rect x="0x10"/></svg>',
    '<svg><g>unexpected text</g></svg>', '<svg viewBox="0 0 1"/>',
    '<!DOCTYPE svg><svg/>', '<svg xmlns="https://example.invalid"/>',
  ];
  for (const xml of sources) assert.throws(() => codec.decode(xml), /invalid SVG:/, xml);
});

test('保留 viewBox、transform 和字体等导入属性，编辑和撤销不丢失根属性', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-editor-'));
  t.after(() => {
    for (const name of readdirSync(directory)) unlinkSync(join(directory, name));
    rmdirSync(directory);
  });
  const path = join(directory, 'import.svg');
  writeFileSync(path, '<svg id="root" width="400px" height="200" viewBox="10 20 800 400"><g id="g" transform="translate(60,40)"><rect id="r" width="10px" height="20"/><text id="t" x="60" y="38" text-anchor="middle" font-size="16">End</text></g></svg>');
  const editor = new EditorHarness(new FileDocumentStore());
  editor.run(`read "${path}"`);
  editor.run('move g 1 2');
  editor.run('undo');
  assert.equal(editor.canvas.svgAttributes['viewBox'], '10 20 800 400');
  assert.equal(editor.canvas.requireShape('g').attributes['transform'], 'translate(60,40)');
  assert.equal(editor.canvas.requireShape('t').attributes['text-anchor'], 'middle');
  const before = editor.view();
  assert.throws(() => editor.run('set t font-size 20'), /unknown attribute: font-size/);
  assert.throws(() => editor.run('create g root in g'), /id already exists: root/);
  assert.deepEqual(editor.view(), before);
  assert.equal(editor.canvas.svgAttributes['viewBox'], '10 20 800 400');
  editor.run('save');
  const reread = new SvgCodec().decode(readFileSync(path, 'utf8'));
  assert.equal(reread.canvas.svgAttributes['viewBox'], '10 20 800 400');
  assert.equal(reread.canvas.requireShape('t').attributes['font-size'], '16');
  editor.run('canvas 100 100');
  editor.run('save');
  assert.match(readFileSync(path, 'utf8'), /viewBox="0 0 100 100"/);
});

test('真实文件读写、默认路径、失败原子性及 read/save 历史屏障', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-editor-'));
  t.after(() => {
    for (const name of readdirSync(directory)) unlinkSync(join(directory, name));
    rmdirSync(directory);
  });
  const path = join(directory, 'diagram with spaces.svg');
  const invalid = join(directory, 'bad.svg');
  writeFileSync(invalid, '<svg><path/></svg>');
  const editor = new EditorHarness(new FileDocumentStore());
  assert.throws(() => editor.run('save'), /no document/);
  editor.run('init');
  editor.run('create rect r 0 0 10 20');
  assert.throws(() => editor.run('save'), /no file path/);
  assert.match(editor.run(`save "${path}"`)!, /saved to .*\(1 elements\)/);
  assert.throws(() => editor.run('undo'), /undo not allowed after io command/);
  editor.run('move r 1 2');
  editor.run('undo');
  const canvas = editor.canvas;
  const before = editor.view();
  assert.throws(() => editor.run(`read "${join(directory, 'missing.svg')}"`), /cannot read file:/);
  assert.throws(() => editor.run(`read "${invalid}"`), /invalid SVG:/);
  assert.throws(() => editor.run(`save "${directory}"`), /cannot write file:/);
  assert.deepEqual(editor.view(), before);
  assert.equal(editor.canvas, canvas);
  assert.equal(readdirSync(directory).some(name => name.endsWith('.tmp')), false);
  editor.run('redo');
  assert.equal(editor.canvas.requireShape('r').attributes['x'], 1);
  editor.run('save');
  assert.throws(() => editor.run('redo'), /undo not allowed after io command/);
  editor.run('delete r');
  assert.equal(editor.canvas.walk().length, 0);
  assert.match(editor.run(`read "${path}"`)!, /read .*\(1 elements\)/);
  assert.equal(editor.canvas.requireShape('r').attributes['x'], 1);
  assert.throws(() => editor.run('undo'), /undo not allowed after io command/);
  editor.run('init');
  assert.throws(() => editor.run('save'), /no file path/);
});

test('tree 内联属性、子树连接线、show 父级与文本内容，查询不消耗历史', () => {
  const editor = new EditorHarness();
  assert.throws(() => editor.run('tree'), /no document/);
  for (const command of ['init 400 300', 'create g g', 'create rect r 1 2 3 4 red in g', 'create text t 5 6 "Hello World" in g', 'create g end']) editor.run(command);
  assert.equal(editor.run('tree'), [
    'svg (400x300)', '├── g#g', '│   ├── rect#r  x=1 y=2 width=3 height=4 fill=red',
    '│   └── text#t  x=5 y=6 "Hello World"', '└── g#end',
  ].join('\n'));
  assert.equal(editor.run('tree g'), ['g#g', '├── rect#r  x=1 y=2 width=3 height=4 fill=red', '└── text#t  x=5 y=6 "Hello World"'].join('\n'));
  assert.equal(editor.run('show t'), 'text#t  parent=g#g\n  x=5\n  y=6\n  text="Hello World"');
  assert.throws(() => editor.run('tree missing'), /no such shape: missing/);
  assert.throws(() => editor.run('show r extra'), /usage:/);
  editor.run('undo');
  assert.equal(editor.canvas.find('end'), undefined);
  editor.run('tree');
  editor.run('show r');
  editor.run('redo');
  assert.equal(editor.canvas.requireShape('end').type, 'g');
});

test('作业外部 SVG 样例读入 7 个元素且只为缺失 ID 的矩形给出警告', () => {
  const editor = new EditorHarness(new FileDocumentStore());
  assert.equal(editor.run('read examples/other.svg'), 'warning: assigned id rect1 to unnamed <rect>\nread examples/other.svg (7 elements)');
  assert.equal(editor.canvas.width, 400);
  assert.equal(editor.canvas.height, 300);
  assert.deepEqual(editor.canvas.requireGroup('g1').children.map(shape => shape.id), ['r2', 'c2']);
  assert.match(editor.run('tree')!, /ellipse#e1.*cx=1 cy=2 rx=3 ry=4/);
});

test('完整流程图脚本回放，中文文本保真且实际为 8 个元素', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-editor-'));
  t.after(() => {
    for (const name of readdirSync(directory)) unlinkSync(join(directory, name));
    rmdirSync(directory);
  });
  const path = join(directory, 'flowchart.svg');
  const input = readFileSync('examples/flowchart.commands.txt', 'utf8').replaceAll('examples/flowchart.svg', `"${path}"`);
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
    input, encoding: 'utf8', timeout: 10_000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.doesNotMatch(result.stdout, /^error:/m);
  assert.match(result.stdout, /saved to .*\(8 elements\)/);
  const canvas = new SvgCodec().decode(readFileSync(path, 'utf8')).canvas;
  assert.equal(canvas.walk().length, 8);
  assert.equal(canvas.requireShape('start-label').content, '开始');
  assert.equal(canvas.requireShape('process-label').content, '处理数据 v2');
  assert.equal(canvas.requireShape('process').attributes['y'], 100);
});

test('注释和 CDATA 中的 DOCTYPE 字样是普通内容，真正的文档类型仍拒绝', () => {
  const codec = new SvgCodec();
  const comment = codec.decode('<svg><!-- 示例文字 <!DOCTYPE svg> --><rect id="r" width="10" height="20"/></svg>');
  assert.equal(comment.canvas.requireShape('r').type, 'rect');
  const loaded = codec.decode('<svg><text id="t"><![CDATA[示例 <!DOCTYPE html>]]></text></svg>');
  assert.equal(loaded.canvas.requireShape('t').content, '示例 <!DOCTYPE html>');
  assert.equal(codec.decode(codec.encode(loaded.canvas)).canvas.requireShape('t').content, '示例 <!DOCTYPE html>');
  assert.throws(() => codec.decode('<!DOCTYPE svg><svg/>'), /DOCTYPE is not supported/);
  assert.throws(() => codec.decode('<!DOCTYPE svg SYSTEM "example.dtd"><svg/>'), /DOCTYPE is not supported/);
});
