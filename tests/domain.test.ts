import assert from 'node:assert/strict';
import test from 'node:test';
import { Canvas } from '../src/domain/Canvas.js';
import { Circle } from '../src/domain/Circle.js';
import { Ellipse } from '../src/domain/Ellipse.js';
import { Group } from '../src/domain/Group.js';
import { Line } from '../src/domain/Line.js';
import { Rect } from '../src/domain/Rect.js';
import { Text } from '../src/domain/Text.js';

test('嵌套容器移动和缩放六种图形，位置尺寸同时变化，样式保持', () => {
  const canvas = new Canvas();
  const group = new Group('scene');
  const nested = new Group('node');
  const rect = new Rect('r', 10, 20, 30, 40);
  const circle = new Circle('c', 10, 20, 5);
  const ellipse = new Ellipse('e', 10, 20, 3, 4);
  const line = new Line('l', 10, 20, 30, 40);
  const text = new Text('t', 10, 20, '开始');
  canvas.insert(group);
  group.insert(nested);
  for (const shape of [rect, circle, ellipse, line, text]) nested.insert(shape);
  group.setAttribute('fill', 'red');
  rect.setAttribute('stroke-width', 2);
  group.move(5, -10);
  group.scale(2);
  assert.deepEqual(rect.attributes, { x: 30, y: 20, width: 60, height: 80, 'stroke-width': 2 });
  assert.deepEqual(circle.attributes, { cx: 30, cy: 20, r: 10 });
  assert.deepEqual(ellipse.attributes, { cx: 30, cy: 20, rx: 6, ry: 8 });
  assert.deepEqual(line.attributes, { x1: 30, y1: 20, x2: 70, y2: 60 });
  assert.deepEqual(text.attributes, { x: 30, y: 20, text: '开始' });
  assert.deepEqual(group.attributes, { fill: 'red' });
  assert.equal(canvas.walk().length, 7);
});

test('全局 ID 冲突（包括子树）拒绝且不改变原父级', () => {
  const canvas = new Canvas();
  const a = new Group('a');
  const b = new Group('b');
  canvas.insert(a);
  canvas.insert(b);
  a.insert(new Rect('r', 0, 0, 1, 1));
  const incoming = new Group('incoming');
  const duplicate = new Circle('r', 0, 0, 1);
  incoming.insert(duplicate);
  assert.throws(() => b.insert(incoming), /id already exists: r/);
  assert.equal(incoming.parent, null);
  assert.equal(duplicate.parent, incoming);
  assert.deepEqual(b.children, []);
  assert.throws(() => canvas.insert(new Group('a')), /id already exists: a/);
});

test('重设父级、同级顺序、移除及 ID 复用', () => {
  const canvas = new Canvas();
  const group = new Group('g');
  const first = new Rect('a', 0, 0, 1, 1);
  const second = new Rect('b', 0, 0, 1, 1);
  canvas.insert(first);
  canvas.insert(second);
  canvas.insert(group);
  canvas.insert(first);
  assert.deepEqual(canvas.children.map(shape => shape.id), ['b', 'g', 'a']);
  group.insert(first);
  assert.equal(first.parent, group);
  assert.deepEqual(canvas.children.map(shape => shape.id), ['b', 'g']);
  canvas.insert(first, 0);
  assert.deepEqual(group.children, []);
  assert.deepEqual(canvas.children.map(shape => shape.id), ['a', 'b', 'g']);
  canvas.remove(first);
  assert.equal(first.parent, null);
  canvas.insert(new Circle('a', 1, 2, 3));
  assert.equal(canvas.requireShape('a').type, 'circle');
});

test('循环与非法位置拒绝，保持原树结构', () => {
  const canvas = new Canvas();
  const outer = new Group('outer');
  const inner = new Group('inner');
  canvas.insert(outer);
  outer.insert(inner);
  assert.throws(() => inner.insert(outer), /own descendant/);
  assert.throws(() => outer.insert(outer), /own descendant/);
  assert.throws(() => canvas.insert(inner, -1), /invalid child index/);
  assert.equal(outer.parent, canvas);
  assert.equal(inner.parent, outer);
});

test('非法数值、白名单、文本设置及封装', () => {
  const rect = new Rect('r', 1, 2, 3, 4);
  assert.throws(() => rect.setAttribute('width', -1), /nonnegative/);
  assert.throws(() => rect.setAttribute('x', ''), /finite/);
  assert.throws(() => rect.setAttribute('x', Infinity), /finite/);
  assert.throws(() => rect.setAttribute('label', 'x'), /unknown attribute: label/);
  assert.throws(() => rect.scale(0), /scale factor must be positive/);
  assert.throws(() => new Circle('c', 0, 0, -1), /nonnegative/);
  assert.throws(() => new Rect('bad id', 0, 0, 1, 1), /id must/);
  assert.deepEqual(rect.attributes, { x: 1, y: 2, width: 3, height: 4 });
  assert.throws(() => { (rect.attributes as Record<string, number>)['x'] = 99; }, TypeError);
  const text = new Text('t', 0, 0, '旧文字');
  text.setAttribute('text', '带空格的新文字');
  assert.equal(text.content, '带空格的新文字');
});

test('容器操作中后续子节点溢出时，前面的子节点不被部分修改', () => {
  const group = new Group('g');
  const safe = new Rect('safe', 1, 2, 3, 4);
  const large = new Circle('large', Number.MAX_VALUE, 0, 1);
  group.insert(safe);
  group.insert(large);
  assert.throws(() => group.scale(2), /finite/);
  assert.deepEqual(safe.attributes, { x: 1, y: 2, width: 3, height: 4 });
  assert.throws(() => group.move(Number.MAX_VALUE, 0), /finite/);
  assert.deepEqual(safe.attributes, { x: 1, y: 2, width: 3, height: 4 });
  assert.equal(large.attributes['cx'], Number.MAX_VALUE);
});

test('画布尺寸验证与容器查询', () => {
  const canvas = new Canvas();
  assert.equal(canvas.width, 800);
  assert.equal(canvas.height, 600);
  assert.throws(() => canvas.resize(100, NaN), /canvas dimensions/);
  assert.equal(canvas.width, 800);
  canvas.resize(400, 300);
  assert.equal(canvas.height, 300);
  canvas.insert(new Rect('r', 0, 0, 1, 1));
  assert.throws(() => canvas.requireShape('missing'), /no such shape: missing/);
  assert.throws(() => canvas.requireGroup('missing'), /no such container: missing/);
  assert.throws(() => canvas.requireGroup('r'), /not a container: r/);
});
