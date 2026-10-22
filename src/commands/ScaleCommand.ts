import type { EditorSession } from '../application/EditorSession.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class ScaleCommand implements Command {
  public static readonly syntax = 'scale <id> <factor>';

  public constructor(private readonly session: EditorSession, private readonly args: CommandArguments) {}

  public execute(): string {
    const canvas = this.session.requireCanvas();
    this.args.expect(2);
    const shape = canvas.requireShape(this.args.text(0));
    const factor = this.args.number(1);
    shape.scale(factor);
    return `${shape.type}#${shape.id} scaled by ${factor}`;
  }
}
