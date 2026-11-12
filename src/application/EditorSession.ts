import { Canvas } from '../domain/Canvas.js';
import { CommandHistory } from './CommandHistory.js';
import type { UndoableAction } from './UndoableAction.js';
import type { DocumentStore } from './DocumentStore.js';
import type { LoadedDocument } from './LoadedDocument.js';

export type DocumentEventKind = 'init' | 'read' | 'save' | 'edit' | 'undo' | 'redo' | 'canvas';
export interface DocumentEvent { readonly kind: DocumentEventKind; readonly canvas: Canvas; }
export type DocumentListener = (event: DocumentEvent) => void;

export class EditorSession {
  #canvas: Canvas | undefined;
  readonly #history = new CommandHistory();
  #path: string | undefined;
  readonly #listeners = new Set<DocumentListener>();

  public constructor(private store?: DocumentStore) {}

  /** Used by the composition root after plugins have contributed codecs. */
  public setStore(store: DocumentStore): void { this.store = store; }

  public initialize(width = 800, height = 600): Canvas {
    const canvas = new Canvas(width, height);
    this.#canvas = canvas;
    this.#path = undefined;
    this.#history.barrier();
    this.emit('init', canvas);
    return canvas;
  }

  public onDocumentChange(listener: DocumentListener): () => void {
    this.#listeners.add(listener);
    return () => { this.#listeners.delete(listener); };
  }

  public requireCanvas(): Canvas {
    if (!this.#canvas) throw new Error("no document. use 'init' or 'read' first");
    return this.#canvas;
  }

  public resizeCanvas(width: number, height: number): Canvas {
    const canvas = this.requireCanvas();
    canvas.resize(width, height);
    this.#history.barrier();
    this.emit('canvas', canvas);
    return canvas;
  }

  public executeEdit(action: UndoableAction): string {
    const canvas = this.requireCanvas();
    const result = this.#history.execute(action);
    this.emit('edit', canvas);
    return result;
  }

  public undo(): string {
    const canvas = this.requireCanvas();
    const result = this.#history.undo();
    this.emit('undo', canvas);
    return result;
  }

  public redo(): string {
    const canvas = this.requireCanvas();
    const result = this.#history.redo();
    this.emit('redo', canvas);
    return result;
  }

  public read(path: string): LoadedDocument {
    if (!this.store) throw new Error('document store is not configured');
    const loaded = this.store.read(path);
    this.#canvas = loaded.canvas;
    this.#path = path;
    this.#history.barrier();
    this.emit('read', loaded.canvas);
    return loaded;
  }

  public get currentPath(): string | undefined { return this.#path; }

  public save(path = this.#path): string {
    const canvas = this.requireCanvas();
    if (!path) throw new Error("no file path. use 'save <file.svg>'");
    if (!this.store) throw new Error('document store is not configured');
    this.store.write(path, canvas);
    this.#path = path;
    this.#history.barrier();
    this.emit('save', canvas);
    return path;
  }

  private emit(kind: DocumentEventKind, canvas: Canvas): void {
    for (const listener of [...this.#listeners]) listener({ kind, canvas });
  }
}
