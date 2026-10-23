import type { EditorSession } from '../application/EditorSession.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class UndoCommand implements Command {
  public static readonly syntax = 'undo';
  public constructor(private readonly session: EditorSession, private readonly args: CommandArguments) {}

  public execute(): string {
    this.args.expect(0);
    return this.session.undo();
  }
}
