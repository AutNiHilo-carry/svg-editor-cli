import type { Command, CommandArguments, PluginContext, SvgPlugin } from '../../../dist/index.js';
import type { DirectoryEntry, DirectoryEntryKind, DirectoryReader } from './DirectoryReader.js';

const ORDER: Record<DirectoryEntryKind, number> = { dir: 0, file: 1, link: 2, other: 3 };
const LABEL: Record<DirectoryEntryKind, string> = {
  dir: '[DIR]',
  file: '[FILE]',
  link: '[LINK]',
  other: '[OTHER]',
};

export class DirCommand implements Command {
  public constructor(private readonly reader: DirectoryReader) {}

  public execute(): string {
    const cwd = process.cwd();
    let entries: readonly DirectoryEntry[];
    try {
      entries = this.reader.list(cwd);
    } catch {
      throw new Error(`cannot read directory: ${cwd}`);
    }
    if (entries.length === 0) return '(empty directory)';
    const sorted = [...entries].sort((a, b) => {
      const group = ORDER[a.kind] - ORDER[b.kind];
      return group !== 0 ? group : a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
    return sorted.map(entry => `${LABEL[entry.kind]}  ${entry.name}`).join('\n');
  }
}

export const contributes = {
  shapes: [],
  commands: ['dir'],
  decorators: [],
  attributes: [],
} as const;

export function createDirPlugin(reader: DirectoryReader): SvgPlugin {
  return {
    name: '@svgframe/plugin-command-dir',
    contributes,
    activate(context: PluginContext): void {
      context.registerCommand({
        name: 'dir',
        syntax: 'dir',
        build: (args: CommandArguments) => {
          args.expect(0);
          return new DirCommand(reader);
        },
      });
    },
  };
}

export { NodeDirectoryAdapter } from './NodeDirectoryAdapter.js';
export type { DirectoryEntry, DirectoryEntryKind, DirectoryReader } from './DirectoryReader.js';
