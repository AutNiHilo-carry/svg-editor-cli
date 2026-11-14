import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { EditorSession } from '../src/application/EditorSession.js';
import { PluginRegistry } from '../src/extensions/PluginRegistry.js';
import { activatePlugin } from '../src/extensions/activatePlugin.js';
import { builtinPlugin } from '../src/builtin/BuiltinPlugin.js';
import { PluginLoader } from '../src/host/PluginLoader.js';

interface Fixture {
  dir: string;
  session: EditorSession;
  registry: PluginRegistry;
  errors: string[];
}

async function fixture(): Promise<Fixture> {
  const dir = mkdtempSync(join(tmpdir(), 'svg-loader-'));
  const session = new EditorSession();
  const registry = new PluginRegistry();
  await activatePlugin(registry, builtinPlugin, session);
  return { dir, session, registry, errors: [] };
}

async function load(f: Fixture, config: unknown): Promise<void> {
  const path = join(f.dir, 'plugins.config.json');
  writeFileSync(path, JSON.stringify(config), 'utf8');
  await new PluginLoader(f.registry, f.session, path, line => f.errors.push(line)).load();
}

function plugin(f: Fixture, name: string, source: string): string {
  writeFileSync(join(f.dir, name), source, 'utf8');
  return `./${name}`;
}

test('loader reports missing module and missing default export, then keeps running', async () => {
  const f = await fixture();
  plugin(f, 'nodefault.mjs', 'export const nope = true;');
  await load(f, { plugins: [{ module: './missing.mjs' }, { module: './nodefault.mjs' }] });
  assert.deepEqual(f.errors, [
    'error: plugin not found: ./missing.mjs',
    'error: plugin has no default export: ./nodefault.mjs',
  ]);
  assert.ok(f.registry.commands.some(command => command.name === 'init'));
});

test('loader rejects manifest mismatch and rolls back the staged command', async () => {
  const f = await fixture();
  const spec = plugin(f, 'mismatch.mjs', `
    export default {
      name: 'mismatch-fixture',
      contributes: { commands: ['declared'] },
      activate(ctx) {
        ctx.registerCommand({ name: 'actual', syntax: 'actual', build: () => ({ execute: () => 'ok' }) });
      },
    };`);
  await load(f, { plugins: [{ module: spec }] });
  assert.equal(f.errors.length, 1);
  assert.match(f.errors[0]!, /plugin manifest mismatch: mismatch-fixture/);
  assert.equal(f.registry.commands.some(command => command.name === 'actual'), false);
});

test('loader reports activate failures and continues with later plugins', async () => {
  const f = await fixture();
  const boom = plugin(f, 'boom.mjs', `
    export default { name: 'boom', contributes: { commands: [] }, activate() { throw new Error('kaboom'); } };`);
  const good = plugin(f, 'good.mjs', `
    export default {
      name: 'good', contributes: { commands: ['good'] },
      activate(ctx) { ctx.registerCommand({ name: 'good', syntax: 'good', build: () => ({ execute: () => 'good' }) }); },
    };`);
  await load(f, { plugins: [{ module: boom }, { module: good }] });
  assert.deepEqual(f.errors, ['error: plugin failed to activate: boom (kaboom)']);
  assert.ok(f.registry.commands.some(command => command.name === 'good'));
});

test('duplicate registration rejects the second plugin but keeps the first', async () => {
  const f = await fixture();
  const first = plugin(f, 'first.mjs', `
    export default {
      name: 'first', contributes: { commands: ['hello'] },
      activate(ctx) { ctx.registerCommand({ name: 'hello', syntax: 'hello', build: () => ({ execute: () => 'first' }) }); },
    };`);
  const second = plugin(f, 'second.mjs', `
    export default {
      name: 'second', contributes: { commands: ['hello'] },
      activate(ctx) { ctx.registerCommand({ name: 'hello', syntax: 'hello', build: () => ({ execute: () => 'second' }) }); },
    };`);
  await load(f, { plugins: [{ module: first }, { module: second }] });
  assert.deepEqual(f.errors, ['error: duplicate registration: commands/hello']);
  assert.equal(f.registry.commands.filter(command => command.name === 'hello').length, 1);
});

test('failed activation leaves no staged registrations and disabled entries are skipped', async () => {
  const f = await fixture();
  const staged = plugin(f, 'staged.mjs', `
    export default {
      name: 'staged', contributes: { commands: ['temp'] },
      activate(ctx) {
        ctx.registerCommand({ name: 'temp', syntax: 'temp', build: () => ({ execute: () => 'temp' }) });
        throw new Error('after registration');
      },
    };`);
  const disabled = plugin(f, 'disabled.mjs', `
    export default {
      name: 'disabled', contributes: { commands: ['disabled'] },
      activate(ctx) { ctx.registerCommand({ name: 'disabled', syntax: 'disabled', build: () => ({ execute: () => 'd' }) }); },
    };`);
  await load(f, { plugins: [{ module: staged }, { module: disabled, enabled: false }] });
  assert.deepEqual(f.errors, ['error: plugin failed to activate: staged (after registration)']);
  assert.equal(f.registry.commands.some(command => command.name === 'temp'), false);
  assert.equal(f.registry.commands.some(command => command.name === 'disabled'), false);
});

test('invalid config reports one error and loads nothing', async () => {
  const f = await fixture();
  const path = join(f.dir, 'plugins.config.json');
  writeFileSync(path, '{ broken', 'utf8');
  await new PluginLoader(f.registry, f.session, path, line => f.errors.push(line)).load();
  assert.deepEqual(f.errors, ['error: invalid plugin config']);
});
