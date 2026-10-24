import { Canvas } from '../domain/Canvas.js';
import { CommandHistory } from './CommandHistory.js';
import type { UndoableAction } from './UndoableAction.js';
import type { DocumentStore } from './DocumentStore.js';
import type { LoadedDocument } from './LoadedDocument.js';

export class EditorSession {
  #canvas: Canvas | undefined;
  readonly #history = new CommandHistory();
  #path: string | undefined;

  public constructor(private readonly store?: DocumentStore) {}

  public initialize(width = 800, height = 600): Canvas {
    const canvas = new Canvas(width, height);
    this.#canvas = canvas;
    this.#path = undefined;
    this.#history.barrier();
    return canvas;
  }

  public requireCanvas(): Canvas {
    if (!this.#canvas) throw new Error("no document. use 'init' or 'read' first");
    return this.#canvas;
  }

  public resizeCanvas(width: number, height: number): Canvas {
    const canvas = this.requireCanvas();
    canvas.resize(width, height);
    this.#history.barrier();
    return canvas;
  }

  public executeEdit(action: UndoableAction): string {
    this.requireCanvas();
    return this.#history.execute(action);
  }

  public undo(): string { this.requireCanvas(); return this.#history.undo(); }
  public redo(): string { this.requireCanvas(); return this.#history.redo(); }

  public read(path: string): LoadedDocument {
    if (!this.store) throw new Error('document store is not configured');
    const loaded = this.store.read(path);
    this.#canvas = loaded.canvas;
    this.#path = path;
    this.#history.barrier();
    return loaded;
  }

  public save(path = this.#path): string {
    const canvas = this.requireCanvas();
    if (!path) throw new Error("no file path. use 'save <file.svg>'");
    if (!this.store) throw new Error('document store is not configured');
    this.store.write(path, canvas);
    this.#path = path;
    this.#history.barrier();
    return path;
  }
}
