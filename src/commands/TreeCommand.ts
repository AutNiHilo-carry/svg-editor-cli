import type { EditorSession } from '../application/EditorSession.js';
import { DocumentInspector } from '../application/DocumentInspector.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class TreeCommand implements Command {
  public static readonly syntax = 'tree [id]';
  public constructor(private readonly session: EditorSession, private readonly args: CommandArguments) {}
  public execute(): string {
    const canvas = this.session.requireCanvas();
    this.args.expect(0, 1);
    return new DocumentInspector(canvas).tree(this.args.length ? this.args.text(0) : undefined);
  }
}
