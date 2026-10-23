import { CanvasSnapshot } from '../domain/CanvasSnapshot.js';
import type { Canvas } from '../domain/Canvas.js';
import type { UndoableAction } from './UndoableAction.js';

export class SnapshotEdit implements UndoableAction {
  #before: CanvasSnapshot | undefined;
  #after: CanvasSnapshot | undefined;
  #summary = '';

  public constructor(private readonly canvas: Canvas, private readonly operation: () => string) {}

  public execute(): string {
    const before = new CanvasSnapshot(this.canvas);
    try {
      const summary = this.operation();
      const after = new CanvasSnapshot(this.canvas);
      this.#before = before;
      this.#after = after;
      this.#summary = summary;
      return summary;
    } catch (error) {
      before.restore();
      throw error;
    }
  }

  public undo(): string {
    if (!this.#before) throw new Error('command has not been executed');
    this.#before.restore();
    return `undone: ${this.#summary}`;
  }

  public redo(): string {
    if (!this.#after) throw new Error('command has not been executed');
    this.#after.restore();
    return `redone: ${this.#summary}`;
  }
}
