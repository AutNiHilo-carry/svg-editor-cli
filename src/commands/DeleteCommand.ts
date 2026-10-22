import type { EditorSession } from '../application/EditorSession.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class DeleteCommand implements Command {
  public static readonly syntax = 'delete <id>';

  public constructor(private readonly session: EditorSession, private readonly args: CommandArguments) {}

  public execute(): string {
    const canvas = this.session.requireCanvas();
    this.args.expect(1);
    const shape = canvas.requireShape(this.args.text(0));
    shape.parent?.remove(shape);
    return `${shape.type}#${shape.id} deleted`;
  }
}
