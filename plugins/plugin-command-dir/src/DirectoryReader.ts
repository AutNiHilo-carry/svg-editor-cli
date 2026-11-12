export type DirectoryEntryKind = 'dir' | 'file' | 'link' | 'other';

export interface DirectoryEntry {
  readonly name: string;
  readonly kind: DirectoryEntryKind;
}

/** Adapter target port; DirCommand depends only on this interface. */
export interface DirectoryReader {
  list(path: string): readonly DirectoryEntry[];
}
