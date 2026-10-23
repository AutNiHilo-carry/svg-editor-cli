import type { UndoableAction } from './UndoableAction.js';

export class CommandHistory {
  readonly #undo: UndoableAction[] = [];
  readonly #redo: UndoableAction[] = [];
  #blocked = true;

  public execute(action: UndoableAction): string {
    const result = action.execute();
    this.#undo.push(action);
    this.#redo.length = 0;
    this.#blocked = false;
    return result;
  }

  public barrier(): void {
    this.#undo.length = 0;
    this.#redo.length = 0;
    this.#blocked = true;
  }

  public undo(): string {
    this.checkAllowed();
    const action = this.#undo.at(-1);
    if (!action) throw new Error('nothing to undo');
    const result = action.undo();
    this.#undo.pop();
    this.#redo.push(action);
    return result;
  }

  public redo(): string {
    this.checkAllowed();
    const action = this.#redo.at(-1);
    if (!action) throw new Error('nothing to redo');
    const result = action.redo();
    this.#redo.pop();
    this.#undo.push(action);
    return result;
  }

  private checkAllowed(): void {
    if (this.#blocked) throw new Error('undo not allowed after io command');
  }
}
