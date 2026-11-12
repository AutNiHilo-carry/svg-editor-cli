import { CliApplication } from './cli/CliApplication.js';
import { EditorSession } from './application/EditorSession.js';
import { CommandDispatcher } from './commands/CommandDispatcher.js';
import { ShapeFactory } from './domain/ShapeFactory.js';
import { FileDocumentStore } from './infrastructure/FileDocumentStore.js';
import { SvgCodec } from './infrastructure/SvgCodec.js';
import { PluginRegistry } from './extensions/PluginRegistry.js';
import { activatePlugin } from './extensions/activatePlugin.js';
import { builtinPlugin } from './builtin/BuiltinPlugin.js';
import { PluginLoader } from './host/PluginLoader.js';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { CommandServices } from './extensions/CommandDescriptor.js';
import type { SvgPlugin } from './extensions/Plugin.js';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const config = argsValue(argv, '--config');
  const noPlugins = argv.includes('--no-plugins');

  const session = new EditorSession();
  const registry = new PluginRegistry();
  await activatePlugin(registry, builtinPlugin, session);

  if (config) {
    const loader = new PluginLoader(registry, session, resolve(config), line => process.stderr.write(`${line}\n`));
    await loader.load();
  } else if (!noPlugins) {
    // Assembly mode A: the composition root decides which plugins to instantiate.
    for (const specifier of ['@svgframe/plugin-command-stats', '@svgframe/plugin-command-dir', '@svgframe/plugin-shape-box', '@svgframe/plugin-tree-modified-star']) {
      try {
        const resolved = realpathSync(createRequire(import.meta.url).resolve(specifier));
        const loaded = await import(pathToFileURL(resolved).href) as { default: SvgPlugin };
        await activatePlugin(registry, loaded.default, session);
      } catch (error) {
        process.stderr.write(`error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
  }

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
  new CliApplication(dispatcher, services).run();
}

function argsValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`missing value for ${name}`);
  return value;
}

main().catch(error => {
  process.stderr.write(`error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
