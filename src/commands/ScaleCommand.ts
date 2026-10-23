import type { EditorSession } from '../application/EditorSession.js';
import { EditCommand } from './EditCommand.js';
import type { CommandArguments } from './CommandArguments.js';

export class ScaleCommand extends EditCommand {
  public static readonly syntax = 'scale <id> <factor>';

  public constructor(session: EditorSession, private readonly args: CommandArguments) { super(session); }

  protected override apply(): string {
    const canvas = this.session.requireCanvas();
    this.args.expect(2);
    const shape = canvas.requireShape(this.args.text(0));
    const factor = this.args.number(1);
    shape.scale(factor);
    return `${shape.type}#${shape.id} scaled by ${factor}`;
  }
}
