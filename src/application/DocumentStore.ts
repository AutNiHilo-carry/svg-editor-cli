import type { Canvas } from '../domain/Canvas.js';
import type { LoadedDocument } from './LoadedDocument.js';

export interface DocumentStore {
  read(path: string): LoadedDocument;
  write(path: string, canvas: Canvas): void;
}
