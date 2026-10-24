import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { EditorSession } from '../src/application/EditorSession.js';
import { CommandTokenizer } from '../src/cli/CommandTokenizer.js';
import { CommandDispatcher } from '../src/commands/CommandDispatcher.js';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';

test('分词保留颜色、带空格文本、空文本、引号转义和路径反斜杠', () => {
  const tokenizer = new CommandTokenizer();
  assert.deepEqual(tokenizer.parse('  # 注释'), []);
  assert.deepEqual(tokenizer.parse(' \t '), []);
  assert.deepEqual(tokenizer.parse('create rect r 0 0 10 20 #4a90d9').map(token => token.value),
    ['create', 'rect', 'r', '0', '0', '10', '20', '#4a90d9']);
  const tokens = tokenizer.parse(String.raw`set t text "A \"quote\" C:\tmp \\ end"`);
  assert.equal(tokens[3]?.value, 'A "quote" C:\\tmp \\ end');
  assert.equal(tokens[3]?.quoted, true);
  assert.equal(tokenizer.parse('set t text ""')[3]?.value, '');
  assert.throws(() => tokenizer.parse('set t text "unfinished'), /unterminated double quote/);
  assert.throws(() => tokenizer.parse('set t text "a"b'), /expected whitespace/);
  assert.throws(() => tokenizer.parse('set t text a"b"'), /must start an argument/);
});

test('六种图形从命令创建，所有类型可指定父容器，省略样式不生成属性', () => {
  const session = new EditorSession();
  const dispatcher = new CommandDispatcher(session, new ShapeFactory());
  const tokenizer = new CommandTokenizer();
  const run = (line: string) => dispatcher.dispatch(tokenizer.parse(line));
  assert.equal(run('init'), 'canvas 800x600 created');
  assert.equal(run('create g scene'), 'g#scene created');
  assert.equal(run('create g nested in scene'), 'g#nested created in g#scene');
  run('create rect r 1.5 2 30 40 #4a90d9 in nested');
  run('create circle c 3 4 5 in nested');
  run('create ellipse e 6 7 8 9 red in nested');
  run('create line l 0 0 10 20 black in nested');
  assert.equal(run('create text t 10 20 "开始 in 节点" in nested'), 'text#t created in g#nested');
  run('create text empty 0 0 ""');
  run('create text word 0 0 "in"');
  const canvas = session.requireCanvas();
  assert.equal(canvas.walk().length, 9);
  assert.equal(canvas.requireGroup('nested').children.length, 5);
  assert.equal(canvas.requireShape('r').attributes['fill'], '#4a90d9');
  assert.equal(canvas.requireShape('c').attributes['fill'], undefined);
  assert.equal(canvas.requireShape('l').attributes['stroke'], 'black');
  assert.equal(canvas.requireShape('t').attributes['text'], '开始 in 节点');
  assert.equal(canvas.requireShape('word').attributes['text'], 'in');
  assert.equal(canvas.requireShape('empty').attributes['text'], '');
});

test('命令驱动容器移动缩放、属性修改和子树删除', () => {
  const session = new EditorSession();
  const dispatcher = new CommandDispatcher(session, new ShapeFactory());
  const tokenizer = new CommandTokenizer();
  const run = (line: string) => dispatcher.dispatch(tokenizer.parse(line));
  run('init 400 300');
  run('create g node');
  run('create rect r 10 20 30 40 in node');
  run('create text t 15 25 "旧文字" in node');
  assert.equal(run('move node 5 -10'), 'g#node moved by (5,-10)');
  assert.equal(run('scale node 2'), 'g#node scaled by 2');
  assert.equal(run('set t text "新文字 with spaces"'), 'text#t updated: text="新文字 with spaces"');
  assert.equal(run('set node fill #ff0000'), 'g#node updated: fill="#ff0000"');
  assert.deepEqual(session.requireCanvas().requireShape('r').attributes, { x: 30, y: 20, width: 60, height: 80 });
  assert.equal(run('canvas'), 'canvas 400x300');
  assert.equal(run('canvas 640 480'), 'canvas resized to 640x480');
  assert.equal(run('delete node'), 'g#node deleted');
  assert.equal(session.requireCanvas().walk().length, 0);
  run('create circle r 0 0 1');
  assert.equal(session.requireCanvas().requireShape('r').type, 'circle');
});

test('错误参数、ID 冲突、容器错误和未知类型均不改变文档', () => {
  const session = new EditorSession();
  const dispatcher = new CommandDispatcher(session, new ShapeFactory());
  const tokenizer = new CommandTokenizer();
  const run = (line: string) => dispatcher.dispatch(tokenizer.parse(line));
  assert.match(run('help')!, /create <type>/);
  assert.throws(() => run('move r 1 2'), /no document\. use 'init' or 'read' first/);
  assert.throws(() => run('INIT'), /unknown command: INIT/);
  run('init');
  run('create rect r 1 2 3 4');
  const canvas = session.requireCanvas();
  const before = canvas.requireShape('r').attributes;
  const cases: readonly [string, RegExp][] = [
    ['create rect r 0 0 1 1', /id already exists: r/],
    ['create g g in missing', /no such container: missing/],
    ['create g g in r', /not a container: r/],
    ['create box b 0 0 10 10 "title"', /unknown shape type: box/],
    ['create text t 0 0 unquoted', /must be double quoted/],
    ['create circle c 0 0 -1', /nonnegative/],
    ['create rect short 0 0', /usage:/],
    ['create g excess extra', /usage:/],
    ['set r width -1', /nonnegative/],
    ['set r x 0x10', /finite number/],
    ['set r unknown 1', /unknown attribute: unknown/],
    ['move r 1 bad', /finite number/],
    ['move r 1 2 extra', /usage:/],
    ['scale r 0', /scale factor must be positive/],
    ['scale r -1', /scale factor must be positive/],
    ['delete absent', /no such shape: absent/],
    ['delete r extra', /usage:/],
    ['canvas 10', /usage:/],
    ['canvas 10 -1', /canvas dimensions/],
    ['init 0 100', /canvas dimensions/],
    ['init 10 20 extra', /usage:/],
    ['help extra', /usage:/],
  ];
  for (const [line, message] of cases) {
    assert.throws(() => run(line), message, line);
    assert.equal(session.requireCanvas(), canvas, line);
    assert.deepEqual(canvas.requireShape('r').attributes, before, line);
    assert.equal(canvas.walk().length, 1, line);
    assert.equal(canvas.width, 800, line);
    assert.equal(canvas.height, 600, line);
  }
  run('create rect R 0 0 1 1');
  assert.equal(canvas.walk().length, 2, 'ID 大小写敏感');
});

test('REPL 脚本回放：出错后继续处理，颜色与文本不丢失，EOF 正常退出', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 10_000,
    input: [
      '# 回放脚本',
      '',
      'move missing 1 2',
      'init 400 300',
      'create rect r 0 0 10 20 #abcdef',
      'create text t 1 2 "Hello World"',
      'set t text "not closed',
      'set t text "Hello again"',
      'scale r -1',
      'move r 3 4',
      'canvas',
    ].join('\r\n'),
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout, [
    "svg-editor 0.1 — type 'help' for commands",
    "error: no document. use 'init' or 'read' first",
    'canvas 400x300 created',
    'rect#r created',
    'text#t created',
    'error: unterminated double quote',
    'text#t updated: text="Hello again"',
    'error: scale factor must be positive',
    'rect#r moved by (3,4)',
    'canvas 400x300',
    '',
  ].join('\n'));
});
