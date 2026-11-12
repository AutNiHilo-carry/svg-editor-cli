import { createDirPlugin, NodeDirectoryAdapter } from './DirCommand.js';

export default createDirPlugin(new NodeDirectoryAdapter());
export { createDirPlugin, DirCommand, NodeDirectoryAdapter } from './DirCommand.js';
export type { DirectoryEntry, DirectoryEntryKind, DirectoryReader } from './DirectoryReader.js';
