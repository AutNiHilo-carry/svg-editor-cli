import type { EditorSession } from '../application/EditorSession.js';
import { SnapshotEdit } from '../application/SnapshotEdit.js';
import type { Command } from './Command.js';

export abstract class EditCommand implements Command {
  protected constructor(protected readonly session: EditorSession) {}

  public execute(): string {
    const canvas = this.session.requireCanvas();
    return this.session.executeEdit(new SnapshotEdit(canvas, () => this.apply()));
  }

  protected abstract apply(): string;
}
