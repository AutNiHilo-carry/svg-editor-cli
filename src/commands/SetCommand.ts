import type { EditorSession } from '../application/EditorSession.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class SetCommand implements Command {
  public static readonly syntax = 'set <id> <attr> <value>';

  public constructor(private readonly session: EditorSession, private readonly args: CommandArguments) {}

  public execute(): string {
    const canvas = this.session.requireCanvas();
    this.args.expect(3);
    const shape = canvas.requireShape(this.args.text(0));
    const attribute = this.args.text(1);
    shape.setAttribute(attribute, this.args.text(2));
    return `${shape.type}#${shape.id} updated: ${attribute}=${JSON.stringify(shape.attributes[attribute])}`;
  }
}
