import { readdirSync } from 'node:fs';
import type { DirectoryEntry, DirectoryReader } from './DirectoryReader.js';

/** Adapter from Node fs Dirent to the DirectoryReader port. Symlinks are not followed. */
export class NodeDirectoryAdapter implements DirectoryReader {
  public list(path: string): readonly DirectoryEntry[] {
    return readdirSync(path, { withFileTypes: true }).map(entry => ({
      name: entry.name,
      kind: entry.isDirectory()
        ? 'dir'
        : entry.isFile()
          ? 'file'
          : entry.isSymbolicLink()
            ? 'link'
            : 'other',
    }));
  }
}
