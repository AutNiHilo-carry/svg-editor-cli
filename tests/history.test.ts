import assert from 'node:assert/strict';
import test from 'node:test';
import { SnapshotEdit } from '../src/application/SnapshotEdit.js';
import { EditorHarness } from './EditorHarness.js';

test('基础编辑撤销重做精确恢复浮点数、文本和原本缺省的样式', () => {
  const editor = new EditorHarness();
  editor.run('init');
  const commands = [
    'create g node',
    'create rect r 0.1 0.2 0.3 0.4 in node',
    'create text t 0.1 0.2 "旧文字" in node',
    'set r fill red',
    'set node stroke blue',
    'set r stroke-width 2',
    'set t text "新文字 with spaces"',
    'move node 0.2 -0.1',
    'scale node 3',
    'delete node',
  ];
  const states = [editor.view()];
  for (const command of commands) { editor.run(command); states.push(editor.view()); }
  for (let index = commands.length - 1; index >= 0; index--) {
    assert.match(editor.run('undo')!, /^undone:/);
    assert.deepEqual(editor.view(), states[index], commands[index]);
  }
  assert.throws(() => editor.run('undo'), /nothing to undo/);
  for (let index = 0; index < commands.length; index++) {
    assert.match(editor.run('redo')!, /^redone:/);
    assert.deepEqual(editor.view(), states[index + 1], commands[index]);
  }
  assert.throws(() => editor.run('redo'), /nothing to redo/);
});

test('跨父分组保持文档顺序，一次撤销还原所有父级和兄弟位置', () => {
  const editor = new EditorHarness();
  for (const command of [
    'init', 'create g left', 'create g right',
    'create rect a 0 0 1 1 in left', 'create circle spare 0 0 1 in left',
    'create text b 0 0 "B" in right', 'create circle tail 0 0 1',
  ]) editor.run(command);
  const before = editor.view();
  const a = editor.canvas.requireShape('a');
  assert.equal(editor.run('group joined b a'), 'g#joined created with 2 children');
  assert.deepEqual(editor.canvas.children.map(shape => shape.id), ['joined', 'left', 'right', 'tail']);
  assert.deepEqual(editor.canvas.requireGroup('joined').children.map(shape => shape.id), ['a', 'b']);
  const after = editor.view();
  editor.run('undo');
  assert.deepEqual(editor.view(), before);
  assert.equal(editor.canvas.requireShape('a'), a, '恢复后保留原对象身份');
  editor.run('redo');
  assert.deepEqual(editor.view(), after);
});

test('同父分组占据首个所选节点位置，嵌套解组提升子节点并保持顺序', () => {
  const editor = new EditorHarness();
  for (const command of [
    'init', 'create g outer', 'create g before in outer',
    'create rect a 0 0 1 1 in outer', 'create circle middle 0 0 1 in outer',
    'create rect b 0 0 2 2 in outer', 'create g after in outer', 'group inner b a',
  ]) editor.run(command);
  assert.deepEqual(editor.canvas.requireGroup('outer').children.map(shape => shape.id), ['before', 'inner', 'middle', 'after']);
  assert.deepEqual(editor.canvas.requireGroup('inner').children.map(shape => shape.id), ['a', 'b']);
  const before = editor.view();
  assert.equal(editor.run('ungroup inner'), 'g#inner ungrouped (2 children promoted)');
  assert.deepEqual(editor.canvas.requireGroup('outer').children.map(shape => shape.id), ['before', 'a', 'b', 'middle', 'after']);
  const after = editor.view();
  editor.run('undo');
  assert.deepEqual(editor.view(), before);
  editor.run('redo');
  assert.deepEqual(editor.view(), after);
  const stable = editor.view();
  assert.throws(() => editor.run('ungroup outer'), /cannot ungroup top-level container: outer/);
  assert.deepEqual(editor.view(), stable);
});

test('空容器解组、单节点分组均可撤销', () => {
  const editor = new EditorHarness();
  for (const command of ['init', 'create g root', 'create g empty in root']) editor.run(command);
  const before = editor.view();
  editor.run('ungroup empty');
  assert.equal(editor.canvas.find('empty'), undefined);
  editor.run('undo');
  assert.deepEqual(editor.view(), before);
  editor.run('group wrapper empty');
  assert.deepEqual(editor.canvas.requireGroup('wrapper').children.map(shape => shape.id), ['empty']);
  editor.run('undo');
  assert.deepEqual(editor.view(), before);
});

test('addto 跨父和同父移至末尾，front/back 只调整同级顺序', () => {
  const editor = new EditorHarness();
  for (const command of [
    'init', 'create g target', 'create rect a 0 0 1 1 in target',
    'create circle b 0 0 1 in target', 'create text c 0 0 "C"',
  ]) editor.run(command);
  const commands = ['addto target c', 'front a', 'back c', 'addto target c'];
  const expected = [['a', 'b', 'c'], ['b', 'c', 'a'], ['c', 'b', 'a'], ['b', 'a', 'c']];
  const states = [editor.view()];
  for (const [index, command] of commands.entries()) {
    editor.run(command);
    assert.deepEqual(editor.canvas.requireGroup('target').children.map(shape => shape.id), expected[index]);
    states.push(editor.view());
  }
  for (let index = commands.length - 1; index >= 0; index--) {
    editor.run('undo');
    assert.deepEqual(editor.view(), states[index]);
  }
  for (let index = 0; index < commands.length; index++) {
    editor.run('redo');
    assert.deepEqual(editor.view(), states[index + 1]);
  }
});

test('非法分组、循环与不存在目标不改变状态，也不清空 redo', () => {
  const editor = new EditorHarness();
  for (const command of ['init', 'create g outer', 'create g inner in outer', 'create rect r 0 0 1 1 in inner', 'move r 2 3']) {
    editor.run(command);
  }
  editor.run('undo');
  const before = editor.view();
  const errors: readonly [string, RegExp][] = [
    ['group bad r outer', /cannot group a container into its own descendant: outer/],
    ['group bad outer inner', /cannot group a container into its own descendant: outer/],
    ['group bad r r', /duplicate shape id: r/],
    ['group outer r', /id already exists: outer/],
    ['group bad r missing', /no such shape: missing/],
    ['group bad', /usage:/],
    ['addto inner outer', /own descendant/],
    ['addto inner inner', /own descendant/],
    ['addto missing r', /no such container: missing/],
    ['addto r inner', /not a container: r/],
    ['front missing', /no such shape: missing/],
    ['back r extra', /usage:/],
    ['ungroup r', /not a container: r/],
    ['undo extra', /usage:/],
    ['redo extra', /usage:/],
  ];
  for (const [command, message] of errors) {
    assert.throws(() => editor.run(command), message, command);
    assert.deepEqual(editor.view(), before, command);
  }
  editor.run('redo');
  assert.equal(editor.canvas.requireShape('r').attributes['x'], 2);
  editor.run('undo');
  editor.run('set r fill red');
  assert.throws(() => editor.run('redo'), /nothing to redo/);
});

test('历史屏障只在成功文档操作后生效，查询和 help 不消耗历史', () => {
  const editor = new EditorHarness();
  assert.throws(() => editor.run('undo'), /no document/);
  editor.run('init');
  assert.throws(() => editor.run('undo'), /undo not allowed after io command/);
  assert.throws(() => editor.run('redo'), /undo not allowed after io command/);
  assert.throws(() => editor.run('create circle bad 0 0 -1'), /nonnegative/);
  assert.throws(() => editor.run('undo'), /undo not allowed after io command/);
  editor.run('create rect r 0 0 1 1');
  editor.run('move r 4 5');
  editor.run('canvas');
  editor.run('help');
  editor.run('# 注释');
  assert.throws(() => editor.run('init 0 1'), /canvas dimensions/);
  assert.throws(() => editor.run('canvas 0 1'), /canvas dimensions/);
  editor.run('undo');
  assert.equal(editor.canvas.requireShape('r').attributes['x'], 0);
  editor.run('canvas 400 300');
  assert.throws(() => editor.run('undo'), /undo not allowed after io command/);
  assert.throws(() => editor.run('redo'), /undo not allowed after io command/);
  editor.run('move r 1 2');
  editor.run('undo');
  assert.equal(editor.canvas.width, 400);
  assert.throws(() => editor.run('undo'), /nothing to undo/);
  editor.run('redo');
  editor.run('init 200 100');
  assert.equal(editor.canvas.walk().length, 0);
  assert.throws(() => editor.run('redo'), /undo not allowed after io command/);
});

test('编辑中途抛错也回滚内容和树结构，保留已有 redo', () => {
  const editor = new EditorHarness();
  for (const command of ['init', 'create g node', 'create rect r 0 0 1 1 in node', 'move r 5 6']) editor.run(command);
  editor.run('undo');
  const before = editor.view();
  assert.throws(() => editor.session.executeEdit(new SnapshotEdit(editor.canvas, () => {
    const rect = editor.canvas.requireShape('r');
    rect.setAttribute('fill', 'red');
    editor.canvas.insert(rect);
    editor.canvas.remove(editor.canvas.requireGroup('node'));
    throw new Error('模拟中途故障');
  })), /模拟中途故障/);
  assert.deepEqual(editor.view(), before);
  editor.run('redo');
  assert.equal(editor.canvas.requireShape('r').attributes['x'], 5);
});
