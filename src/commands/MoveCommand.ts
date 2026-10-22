import type { EditorSession } from '../application/EditorSession.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class MoveCommand implements Command {
  public static readonly syntax = 'move <id> <dx> <dy>';

  public constructor(private readonly session: EditorSession, private readonly args: CommandArguments) {}

  public execute(): string {
    const canvas = this.session.requireCanvas();
    this.args.expect(3);
    const shape = canvas.requireShape(this.args.text(0));
    const dx = this.args.number(1);
    const dy = this.args.number(2);
    shape.move(dx, dy);
    return `${shape.type}#${shape.id} moved by (${dx},${dy})`;
  }
}
