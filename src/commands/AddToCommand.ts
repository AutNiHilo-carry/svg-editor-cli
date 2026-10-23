import type { EditorSession } from '../application/EditorSession.js';
import { TreeEditor } from '../domain/TreeEditor.js';
import { EditCommand } from './EditCommand.js';
import type { CommandArguments } from './CommandArguments.js';

export class AddToCommand extends EditCommand {
  public static readonly syntax = 'addto <gid> <id>';
  public constructor(session: EditorSession, private readonly args: CommandArguments) { super(session); }

  protected override apply(): string {
    this.args.expect(2);
    const canvas = this.session.requireCanvas();
    new TreeEditor(canvas).addTo(this.args.text(0), this.args.text(1));
    const shape = canvas.requireShape(this.args.text(1));
    return `${shape.type}#${shape.id} moved into g#${this.args.text(0)}`;
  }
}
