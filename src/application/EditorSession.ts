import { Canvas } from '../domain/Canvas.js';
import { CommandHistory } from './CommandHistory.js';
import type { UndoableAction } from './UndoableAction.js';

export class EditorSession {
  #canvas: Canvas | undefined;
  readonly #history = new CommandHistory();

  public initialize(width = 800, height = 600): Canvas {
    const canvas = new Canvas(width, height);
    this.#canvas = canvas;
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
}
