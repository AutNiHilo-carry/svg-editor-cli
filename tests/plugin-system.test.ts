import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { EditorSession } from '../src/application/EditorSession.js';
import { CommandDispatcher } from '../src/commands/CommandDispatcher.js';
import { CommandTokenizer } from '../src/cli/CommandTokenizer.js';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';
import { PluginRegistry } from '../src/extensions/PluginRegistry.js';
import { activatePlugin } from '../src/extensions/activatePlugin.js';
import { builtinPlugin } from '../src/builtin/BuiltinPlugin.js';
import type { CommandServices } from '../src/extensions/CommandDescriptor.js';
import statsPlugin from '@svgframe/plugin-command-stats';
import dirPlugin, { createDirPlugin, NodeDirectoryAdapter } from '@svgframe/plugin-command-dir';
import type { DirectoryReader } from '@svgframe/plugin-command-dir';

async function system(...plugins: any[]) {
  const session = new EditorSession();
  const registry = new PluginRegistry();
  await activatePlugin(registry, builtinPlugin, session);
  for (const plugin of plugins) await activatePlugin(registry, plugin as any, session);
  const shapes = new ShapeFactory(registry.shapes);
  const dispatcher = new CommandDispatcher();
  for (const descriptor of registry.commands) dispatcher.register(descriptor);
  const services: CommandServices = {
    session,
    shapes,
    decorators: registry.decorators,
    attributes: registry.attributes,
    dispatcher,
  };
  const tokenizer = new CommandTokenizer();
  return {
    session,
    run: (line: string) => dispatcher.dispatch(tokenizer.parse(line), services),
  };
}

test('stats is an independent command plugin with ordered counts', async () => {
  const app = await system(statsPlugin);
  assert.equal(app.run('init 100 100'), 'canvas 100x100 created');
  app.run('create rect a 0 0 10 10');
  app.run('create circle c 10 10 5');
  app.run('create rect b 0 0 5 5');
  app.run('create g box');
  app.run('create text t 0 0 "x" in box');
  assert.equal(app.run('stats'), 'rect: 2  circle: 1  text: 1  (total 4, containers 1)');
  app.run('init 10 10');
  assert.equal(app.run('stats'), '(total 0, containers 0)');
});

test('dir uses the directory port and sorts directories before files', async () => {
  const reader: DirectoryReader = {
    list: () => [
      { name: 'z.txt', kind: 'file' },
      { name: 'b', kind: 'dir' },
      { name: '.hidden', kind: 'file' },
      { name: 'a', kind: 'dir' },
    ],
  };
  const app = await system(createDirPlugin(reader));
  assert.equal(app.run('dir'), '[DIR]  a\n[DIR]  b\n[FILE]  .hidden\n[FILE]  z.txt');
});

test('dir works before init and reports reader failures without changing the document', async () => {
  const failing: DirectoryReader = { list: () => { throw new Error('denied'); } };
  const app = await system(createDirPlugin(failing));
  assert.throws(() => app.run('dir'), /cannot read directory:/);
  assert.throws(() => app.session.requireCanvas(), /no document/);
});

test('real NodeDirectoryAdapter lists a fixed temporary directory', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'svg-plugin-dir-'));
  const previous = process.cwd();
  try {
    mkdirSync(join(dir, 'docs'));
    writeFileSync(join(dir, 'demo.svg'), '<svg/>');
    const app = await system(createDirPlugin(new NodeDirectoryAdapter()));
    process.chdir(dir);
    assert.equal(app.run('dir'), '[DIR]  docs\n[FILE]  demo.svg');
  } finally {
    process.chdir(previous);
    rmSync(dir, { recursive: true, force: true });
  }
});
