import type { EditorSession } from '../application/EditorSession.js';
import { EditCommand } from './EditCommand.js';
import type { CommandArguments } from './CommandArguments.js';
import type { AttributeHandler } from '../extensions/AttributeHandler.js';

export class SetCommand extends EditCommand {
  public static readonly syntax = 'set <id> <attr> <value>';

  public constructor(
    session: EditorSession,
    private readonly args: CommandArguments,
    private readonly handlers: readonly AttributeHandler[] = [],
  ) { super(session); }

  protected override apply(): string {
    const canvas = this.session.requireCanvas();
    this.args.expect(3);
    const shape = canvas.requireShape(this.args.text(0));
    const attribute = this.args.text(1);
    const value = this.args.text(2);
    const matching = this.handlers.filter(handler => handler.handles(shape, attribute));
    if (matching.length > 1) {
      throw new Error(`ambiguous attribute handler: ${attribute} (matched: ${matching.map(handler => handler.name).join(', ')})`);
    }
    const handler = matching[0];
    if (handler) {
      const message = handler.apply(shape, attribute, value, { canvas });
      return message ?? `${shape.type}#${shape.id} updated: ${attribute}=${JSON.stringify(value)}`;
    }
    shape.setAttribute(attribute, value);
    return `${shape.type}#${shape.id} updated: ${attribute}=${JSON.stringify(shape.attributes[attribute])}`;
  }
}
