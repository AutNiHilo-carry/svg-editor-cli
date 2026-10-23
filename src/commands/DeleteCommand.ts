import type { EditorSession } from '../application/EditorSession.js';
import { EditCommand } from './EditCommand.js';
import type { CommandArguments } from './CommandArguments.js';

export class DeleteCommand extends EditCommand {
  public static readonly syntax = 'delete <id>';

  public constructor(session: EditorSession, private readonly args: CommandArguments) { super(session); }

  protected override apply(): string {
    const canvas = this.session.requireCanvas();
    this.args.expect(1);
    const shape = canvas.requireShape(this.args.text(0));
    shape.parent?.remove(shape);
    return `${shape.type}#${shape.id} deleted`;
  }
}
