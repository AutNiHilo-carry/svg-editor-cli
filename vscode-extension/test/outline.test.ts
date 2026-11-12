import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOutlineModel } from '../src/xmlOutline';
import { isSvgPath } from '../src/decoration';

const sample = `<svg width="400" height="200">
  <rect id="bg" width="400" height="200"/>
  <g id="flow">
    <rect id="start" x="30" y="70" width="120" height="60"/>
    <text x="60" y="100">Start</text>
  </g>
</svg>`;

test('nested elements keep hierarchy, ids, and unnamed labels', () => {
  const roots = buildOutlineModel(sample);
  assert.equal(roots.length, 1);
  assert.equal(roots[0].tag, 'svg');
  assert.equal(roots[0].children.length, 2);
  const group = roots[0].children[1];
  assert.equal(group.id, 'flow');
  assert.equal(group.children[0].id, 'start');
  assert.equal(group.children[1].id, null);
  assert.equal(group.children[1].tag, 'text');
});

test('selection range points at the opening tag and full range covers the element', () => {
  const start = buildOutlineModel(sample)[0].children[1].children[0];
  assert.equal(sample.slice(start.selectionStart, start.selectionEnd), 'rect');
  assert.match(sample.slice(start.start, start.end), /^<rect id="start"[\s\S]*\/>$/);
});

test('incomplete or mismatched XML throws', () => {
  assert.throws(() => buildOutlineModel('<svg><g id="flow"><rect id="a"'));
  assert.throws(() => buildOutlineModel('<svg></g>'));
});

test('comments and declarations are not outline nodes', () => {
  const roots = buildOutlineModel('<?xml version="1.0"?><!-- c --><svg><!--x--><g id="g1"/></svg>');
  assert.equal(roots[0].tag, 'svg');
  assert.equal(roots[0].children.length, 1);
  assert.equal(roots[0].children[0].tag, 'g');
});

test('editing the source produces an updated outline model', () => {
  const before = buildOutlineModel('<svg><rect id="a" width="1" height="1"/></svg>');
  const after = buildOutlineModel('<svg><circle id="b" cx="1" cy="1" r="1"/></svg>');
  assert.equal(before[0].children[0].tag, 'rect');
  assert.equal(after[0].children[0].tag, 'circle');
  assert.equal(after[0].children[0].id, 'b');
});

test('an empty id is treated as no id', () => {
  const roots = buildOutlineModel('<svg><rect id="" width="1" height="1"/></svg>');
  assert.equal(roots[0].children[0].id, null);
});

test('only .svg files are badge candidates, case-insensitively', () => {
  assert.equal(isSvgPath('/tmp/a.svg'), true);
  assert.equal(isSvgPath('/tmp/A.SVG'), true);
  assert.equal(isSvgPath('/tmp/a.txt'), false);
  assert.equal(isSvgPath('/tmp/svg'), false);
});
