import type { EditorSession } from '../application/EditorSession.js';
import { TreeEditor } from '../domain/TreeEditor.js';
import { EditCommand } from './EditCommand.js';
import type { CommandArguments } from './CommandArguments.js';

export class BackCommand extends EditCommand {
  public static readonly syntax = 'back <id>';
  public constructor(session: EditorSession, private readonly args: CommandArguments) { super(session); }

  protected override apply(): string {
    this.args.expect(1);
    const canvas = this.session.requireCanvas();
    new TreeEditor(canvas).back(this.args.text(0));
    const shape = canvas.requireShape(this.args.text(0));
    return `${shape.type}#${shape.id} moved to back`;
  }
}
