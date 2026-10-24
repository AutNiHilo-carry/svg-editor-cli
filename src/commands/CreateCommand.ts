import type { EditorSession } from '../application/EditorSession.js';
import { EditCommand } from './EditCommand.js';
import type { CommandArguments } from './CommandArguments.js';
import type { ShapeFactory } from '../domain/ShapeFactory.js';
import { CommandShapeInput } from './CommandShapeInput.js';

export class CreateCommand extends EditCommand {
  public static readonly syntax = 'create <type> <id> [params…] [in <containerId>]';

  public constructor(
    session: EditorSession,
    private readonly factory: ShapeFactory,
    private readonly args: CommandArguments,
  ) { super(session); }

  protected override apply(): string {
    const canvas = this.session.requireCanvas();
    this.args.expect(2, Number.MAX_SAFE_INTEGER);
    const hasContainer = this.args.length >= 4
      && !this.args.quoted(this.args.length - 2)
      && this.args.text(this.args.length - 2) === 'in';
    const parent = hasContainer ? canvas.requireGroup(this.args.text(this.args.length - 1)) : canvas;
    const end = hasContainer ? this.args.length - 2 : this.args.length;
    const shape = this.factory.create(this.args.text(0), this.args.text(1), new CommandShapeInput(this.args.slice(2, end)));
    parent.insert(shape);
    return `${shape.type}#${shape.id} created${hasContainer ? ` in g#${this.args.text(this.args.length - 1)}` : ''}`;
  }
}
