import type { EditorSession } from '../application/EditorSession.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';
import type { ShapeFactory } from './ShapeFactory.js';

export class CreateCommand implements Command {
  public static readonly syntax = 'create <type> <id> [params…] [in <containerId>]';

  public constructor(
    private readonly session: EditorSession,
    private readonly factory: ShapeFactory,
    private readonly args: CommandArguments,
  ) {}

  public execute(): string {
    const canvas = this.session.requireCanvas();
    this.args.expect(2, Number.MAX_SAFE_INTEGER);
    const hasContainer = this.args.length >= 4
      && !this.args.quoted(this.args.length - 2)
      && this.args.text(this.args.length - 2) === 'in';
    const parent = hasContainer ? canvas.requireGroup(this.args.text(this.args.length - 1)) : canvas;
    const end = hasContainer ? this.args.length - 2 : this.args.length;
    const shape = this.factory.create(this.args.text(0), this.args.slice(1, end));
    parent.insert(shape);
    return `${shape.type}#${shape.id} created${hasContainer ? ` in g#${this.args.text(this.args.length - 1)}` : ''}`;
  }
}
