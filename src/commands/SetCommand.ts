import type { EditorSession } from '../application/EditorSession.js';
import { EditCommand } from './EditCommand.js';
import type { CommandArguments } from './CommandArguments.js';

export class SetCommand extends EditCommand {
  public static readonly syntax = 'set <id> <attr> <value>';

  public constructor(session: EditorSession, private readonly args: CommandArguments) { super(session); }

  protected override apply(): string {
    const canvas = this.session.requireCanvas();
    this.args.expect(3);
    const shape = canvas.requireShape(this.args.text(0));
    const attribute = this.args.text(1);
    shape.setAttribute(attribute, this.args.text(2));
    return `${shape.type}#${shape.id} updated: ${attribute}=${JSON.stringify(shape.attributes[attribute])}`;
  }
}
