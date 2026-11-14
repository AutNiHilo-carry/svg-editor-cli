import { createRequire } from 'node:module';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { EditorSession } from '../application/EditorSession.js';
import type { PluginRegistry } from '../extensions/PluginRegistry.js';
import type { SvgPlugin } from '../extensions/Plugin.js';
import { activatePlugin } from '../extensions/activatePlugin.js';

export const codePluginSpecifiers = [
  '@svgframe/plugin-command-stats',
  '@svgframe/plugin-command-dir',
  '@svgframe/plugin-shape-box',
] as const;

export async function loadCodePlugins(registry: PluginRegistry, session: EditorSession, report: (line: string) => void): Promise<void> {
  for (const specifier of codePluginSpecifiers) {
    try {
      const resolved = realpathSync.native(createRequire(import.meta.url).resolve(specifier));
      const loaded = await import(pathToFileURL(resolved).href) as { default: SvgPlugin };
      await activatePlugin(registry, loaded.default, session);
    } catch (error) {
      report(`error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
