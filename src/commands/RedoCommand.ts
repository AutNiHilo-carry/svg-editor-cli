import type { EditorSession } from '../application/EditorSession.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class RedoCommand implements Command {
  public static readonly syntax = 'redo';
  public constructor(private readonly session: EditorSession, private readonly args: CommandArguments) {}

  public execute(): string {
    this.args.expect(0);
    return this.session.redo();
  }
}
