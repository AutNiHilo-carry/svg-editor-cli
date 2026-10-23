export interface UndoableAction {
  execute(): string;
  undo(): string;
  redo(): string;
}
