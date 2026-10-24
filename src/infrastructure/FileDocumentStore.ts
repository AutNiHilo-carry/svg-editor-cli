import { readFileSync, writeFileSync, renameSync, unlinkSync, openSync, closeSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Canvas } from '../domain/Canvas.js';
import type { LoadedDocument } from '../application/LoadedDocument.js';
import type { DocumentStore } from '../application/DocumentStore.js';
import { SvgCodec } from './SvgCodec.js';

export class FileDocumentStore implements DocumentStore {
  public constructor(private readonly codec = new SvgCodec()) {}

  public read(path: string): LoadedDocument {
    let source: string;
    try { source = readFileSync(path, 'utf8'); }
    catch { throw new Error(`cannot read file: ${path}`); }
    return this.codec.decode(source);
  }

  public write(path: string, canvas: Canvas): void {
    const target = resolve(path);
    const temporary = join(dirname(target), `.svg-editor-${randomUUID()}.tmp`);
    let created = false;
    try {
      const xml = this.codec.encode(canvas);
      const descriptor = openSync(temporary, 'wx');
      created = true;
      try { writeFileSync(descriptor, xml, 'utf8'); }
      finally { closeSync(descriptor); }
      renameSync(temporary, target);
    } catch {
      if (created) { try { unlinkSync(temporary); } catch { /* 保留原始写入错误。 */ } }
      throw new Error(`cannot write file: ${path}`);
    }
  }
}
