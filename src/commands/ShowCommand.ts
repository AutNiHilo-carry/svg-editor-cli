import type { EditorSession } from '../application/EditorSession.js';
import { DocumentInspector } from '../application/DocumentInspector.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class ShowCommand implements Command {
  public static readonly syntax = 'show <id>';
  public constructor(private readonly session: EditorSession, private readonly args: CommandArguments) {}
  public execute(): string {
    const canvas = this.session.requireCanvas();
    this.args.expect(1);
    return new DocumentInspector(canvas).show(this.args.text(0));
  }
}
