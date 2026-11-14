import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { PluginContribution, SvgPlugin } from '../extensions/Plugin.js';
import type { PluginRegistry } from '../extensions/PluginRegistry.js';
import { activatePlugin } from '../extensions/activatePlugin.js';
import type { EditorSession } from '../application/EditorSession.js';

interface Entry { module: string; options?: Record<string, unknown> | undefined; enabled?: boolean | undefined }

export type ErrorSink = (line: string) => void;

export class PluginLoader {
  public constructor(
    private readonly registry: PluginRegistry,
    private readonly session: EditorSession,
    private readonly configPath: string,
    private readonly report: ErrorSink,
  ) {}

  public async load(): Promise<void> {
    let config: { plugins: Entry[] };
    try {
      const parsed = JSON.parse(readFileSync(this.configPath, 'utf8')) as unknown;
      if (typeof parsed !== 'object' || parsed === null || !Array.isArray((parsed as { plugins?: unknown }).plugins)) {
        throw new Error('invalid config');
      }
      const plugins = (parsed as { plugins: unknown[] }).plugins.map((raw) => {
        if (typeof raw !== 'object' || raw === null) throw new Error('invalid plugin entry');
        const value = raw as Record<string, unknown>;
        if (typeof value.module !== 'string' || value.module.trim() === '') throw new Error('invalid module');
        if (value.enabled !== undefined && typeof value.enabled !== 'boolean') throw new Error('invalid enabled');
        if (value.options !== undefined && (typeof value.options !== 'object' || value.options === null || Array.isArray(value.options))) {
          throw new Error('invalid options');
        }
        return {
          module: value.module,
          enabled: value.enabled as boolean | undefined,
          options: value.options as Record<string, unknown> | undefined,
        };
      });
      config = { plugins };
    } catch {
      this.report('error: invalid plugin config');
      return;
    }

    for (const entry of config.plugins) {
      if (entry.enabled === false) continue;
      await this.loadOne(entry);
    }
  }

  private async loadOne(entry: Entry): Promise<void> {
    const requireFromConfig = createRequire(this.configPath);
    let resolved: string;
    try {
      resolved = realpathSync.native(requireFromConfig.resolve(entry.module));
    } catch {
      this.report(`error: plugin not found: ${entry.module}`);
      return;
    }
    const manifest = readManifest(resolved);
    const name = manifest?.name ?? entry.module;
    let loaded: { default?: SvgPlugin };
    try {
      loaded = await import(pathToFileURL(resolved).href) as { default?: SvgPlugin };
    } catch (error) {
      this.report(`error: plugin failed to activate: ${name} (${reason(error)})`);
      return;
    }
    if (typeof loaded.default !== 'object' || loaded.default === null) {
      this.report(`error: plugin has no default export: ${entry.module}`);
      return;
    }
    try {
      await activatePlugin(this.registry, loaded.default, this.session, {
        manifest: manifest?.contributes,
        options: entry.options ?? {},
      });
    } catch (error) {
      this.report(`error: ${reason(error)}`);
    }
  }
}

interface Manifest { name?: string | undefined; contributes?: PluginContribution | undefined }

function readManifest(resolved: string): Manifest | null {
  let directory = dirname(resolved);
  for (let depth = 0; depth < 8; depth += 1) {
    const file = join(directory, 'package.json');
    if (existsSync(file)) {
      try {
        const parsed = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
        if (typeof parsed.name === 'string') {
          return {
            name: parsed.name,
            contributes: typeof parsed.contributes === 'object' && parsed.contributes !== null
              ? parsed.contributes as PluginContribution
              : undefined,
          };
        }
      } catch {
        return null;
      }
    }
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return null;
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function configPath(cwd = process.cwd()): string {
  return resolve(cwd, 'plugins.config.json');
}
