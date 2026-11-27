import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { EditorSession } from 'svg-editor-cli';
import { CommandDispatcher } from 'svg-editor-cli';
import { CommandTokenizer } from 'svg-editor-cli';
import { ShapeFactory } from 'svg-editor-cli';
import { PluginRegistry } from 'svg-editor-cli';
import { activatePlugin } from 'svg-editor-cli';
import { builtinPlugin } from 'svg-editor-cli';
import { FileDocumentStore } from 'svg-editor-cli';
import { SvgCodec } from 'svg-editor-cli';
import { PluginLoader } from 'svg-editor-cli';
import { loadCodePlugins } from 'svg-editor-cli';
import type { CommandServices } from 'svg-editor-cli';

async function build(session: EditorSession, registry: PluginRegistry) {
  const shapes = new ShapeFactory(registry.shapes);
  session.setStore(new FileDocumentStore(new SvgCodec(shapes)));
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
    registry,
    services,
    run: (line: string) => dispatcher.dispatch(tokenizer.parse(line), services),
  };
}

async function system(...plugins: any[]) {
  const session = new EditorSession();
  const registry = new PluginRegistry();
  await activatePlugin(registry, builtinPlugin, session);
  for (const plugin of plugins) await activatePlugin(registry, plugin as any, session);
  return build(session, registry);
}

async function pluginDefault(specifier: string): Promise<any> {
  const resolved = realpathSync.native(createRequire(import.meta.url).resolve(specifier));
  return (await import(pathToFileURL(resolved).href)).default;
}

test('box is a container with fill/label semantics, invariants, and round-trip', async () => {
  const app = await system(await pluginDefault('@svgframe/plugin-shape-box'));
  const dir = mkdtempSync(join(tmpdir(), 'svg-box-'));
  app.run('init 800 600');
  assert.equal(app.run('create box n1 120 100 160 60 "开始"'), 'box#n1 created');
  const help = app.run('help')!;
  assert.match(help, /create box <id> <x> <y> <w> <h>/);
  assert.match(help, /create rect <id>/);
  const tree = app.run('tree')!;
  assert.match(tree, /g#n1 \(box\)/);
  assert.match(tree, /rect#n1-rect/);
  assert.match(tree, /text#n1-label/);

  const shown = app.run('show n1')!;
  assert.match(shown, /box#n1  parent=svg/);
  assert.match(shown, /fill="#4a90d9"/);
  assert.match(shown, /label="开始"/);
  assert.equal(app.run('set n1 fill #f5a623'), 'box#n1 fill propagated to n1-rect');
  assert.equal(app.run('set n1 label "处理数据"'), 'box#n1 label updated: "处理数据"');
  assert.match(app.run('tree')!, /fill=#f5a623/);
  assert.match(app.run('undo')!, /^undone:/);

  assert.throws(() => app.run('ungroup n1'), /cannot ungroup composite shape: n1/);
  assert.throws(() => app.run('delete n1-rect'), /cannot remove required child/);
  assert.throws(() => app.run('group broken n1-rect n1-label'), /cannot remove required child/);

  const path = join(dir, 'box.svg');
  assert.equal(app.run(`save ${path}`), `saved to ${path} (3 elements)`);
  assert.equal(app.run(`read ${path}`), `read ${path} (3 elements)`);
  assert.match(app.run('tree')!, /g#n1 \(box\)/);
});

test('malformed box input is rejected instead of creating a partial box', async () => {
  const app = await system(await pluginDefault('@svgframe/plugin-shape-box'));
  const dir = mkdtempSync(join(tmpdir(), 'svg-box-'));
  writeFileSync(
    join(dir, 'bad.svg'),
    '<svg width="100" height="100"><g id="n1" data-kind="box"><rect id="n1-rect" x="0" y="0" width="10" height="10"/></g></svg>',
    'utf8',
  );
  assert.throws(() => app.run(`read ${join(dir, 'bad.svg')}`), /invalid SVG:/);
});

test('modified-star uses content fingerprints, ancestors, save points, and undo', async () => {
  const app = await system(await pluginDefault('@svgframe/plugin-tree-modified-star'));
  const dir = mkdtempSync(join(tmpdir(), 'svg-star-'));
  app.run('init 100 100');
  app.run('create g group');
  app.run('create rect child 0 0 10 10 in group');
  assert.equal(app.run('tree')!.split('\n').every(line => line.endsWith('*')), true);
  app.run(`save ${join(dir, 's.svg')}`);
  assert.equal(app.run('tree')!.includes('*'), false);
  app.run('move child 1 1');
  const dirty = app.run('tree')!;
  assert.match(dirty, /g#group .*\*$/m);
  assert.match(dirty, /child .*\*$/m);
  app.run('undo');
  assert.equal(app.run('tree')!.includes('*'), false);
  app.run('create rect fresh 20 20 5 5');
  assert.match(app.run('tree')!, /rect#fresh .*\*$/m);
  app.run('undo');
  assert.equal(app.run('tree')!.includes('*'), false);
});

test('without decorators the tree matches the saved-star baseline', async () => {
  const plain = await system();
  const starred = await system(await pluginDefault('@svgframe/plugin-tree-modified-star'));
  const dir = mkdtempSync(join(tmpdir(), 'svg-baseline-'));
  for (const app of [plain, starred]) {
    app.run('init 100 100');
    app.run('create g group');
    app.run('create rect child 0 0 10 10 in group');
  }
  starred.run(`save ${join(dir, 's.svg')}`);
  assert.equal(starred.run('tree'), plain.run('tree'));
});

test('code assembly and config assembly produce byte-identical transcripts', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'svg-dual-'));
  mkdirSync(join(cwd, 'docs'));
  writeFileSync(join(cwd, 'a.txt'), 'x');
  const commands = [
    'init 800 600',
    'create box n1 120 100 160 60 "开始"',
    'create box n2 520 100 160 60 "处理"',
    'create line arrow 280 130 520 130 black',
    'group flow n1 n2 arrow',
    'set n2 fill #f5a623',
    'set n2 label "处理数据"',
    'tree',
    'stats',
    'dir',
    'save out.svg',
    'read out.svg',
    'tree',
    'help',
  ];

  async function runMode(mode: 'code' | 'config', target: string): Promise<string[]> {
    const session = new EditorSession();
    const registry = new PluginRegistry();
    await activatePlugin(registry, builtinPlugin, session);
    if (mode === 'code') {
      await loadCodePlugins(registry, session, (line: string) => { throw new Error(line); });
    } else {
      await new PluginLoader(registry, session, join(process.cwd(), 'plugins.config.json'), line => { throw new Error(line); }).load();
    }
    const app = await build(session, registry);
    const previous = process.cwd();
    try {
      process.chdir(target);
      const output: string[] = [];
      for (const command of commands) {
        const result = app.run(command);
        output.push(`svg> ${command}`, result ?? '');
      }
      return output;
    } finally {
      process.chdir(previous);
    }
  }

  const codeDir = mkdtempSync(join(tmpdir(), 'svg-dual-code-'));
  const configDir = mkdtempSync(join(tmpdir(), 'svg-dual-config-'));
  for (const dir of [codeDir, configDir]) {
    mkdirSync(join(dir, 'docs'));
    writeFileSync(join(dir, 'a.txt'), 'x');
  }
  assert.deepEqual(await runMode('code', codeDir), await runMode('config', configDir));
});


test('two matching attribute handlers are rejected without changing history', async () => {
  const handler = {
    name: 'h1',
    handles: (shape: any, attr: string) => shape.type === 'rect' && attr === 'fill',
    apply: () => 'wrong',
  };
  const plugin = {
    name: 'attribute-conflict',
    contributes: { attributes: ['h1', 'h2'] },
    activate(ctx: any) {
      ctx.registerAttribute(handler);
      ctx.registerAttribute({ ...handler, name: 'h2' });
    },
  };
  const app = await system(plugin);
  app.run('init 100 100');
  app.run('create rect r 0 0 10 10');
  assert.throws(() => app.run('set r fill red'), /ambiguous attribute handler: fill/);
  assert.equal(app.session.requireCanvas().requireShape('r').attributes.fill, undefined);
  assert.match(app.run('undo')!, /^undone: rect#r created/);
});

test('a handler that changes a child and then throws rolls back the whole set', async () => {
  const plugin = {
    name: 'attribute-partial',
    contributes: { attributes: ['partial'] },
    activate(ctx: any) {
      ctx.registerAttribute({
        name: 'partial',
        handles: (shape: any, attr: string) => shape.type === 'rect' && attr === 'fill',
        apply: (shape: any) => {
          shape.setAttribute('fill', 'red');
          throw new Error('partial failure');
        },
      });
    },
  };
  const app = await system(plugin);
  app.run('init 100 100');
  app.run('create rect r 0 0 10 10');
  assert.throws(() => app.run('set r fill red'), /partial failure/);
  assert.equal(app.session.requireCanvas().requireShape('r').attributes.fill, undefined);
  assert.match(app.run('undo')!, /^undone: rect#r created/);
});
