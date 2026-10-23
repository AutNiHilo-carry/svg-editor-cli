import type { EditorSession } from '../application/EditorSession.js';
import { TreeEditor } from '../domain/TreeEditor.js';
import { EditCommand } from './EditCommand.js';
import type { CommandArguments } from './CommandArguments.js';

export class GroupCommand extends EditCommand {
  public static readonly syntax = 'group <newGid> <id1> <id2>…';
  public constructor(session: EditorSession, private readonly args: CommandArguments) { super(session); }

  protected override apply(): string {
    this.args.expect(2, Number.MAX_SAFE_INTEGER);
    const ids = Array.from({ length: this.args.length - 1 }, (_, index) => this.args.text(index + 1));
    const group = new TreeEditor(this.session.requireCanvas()).group(this.args.text(0), ids);
    return `g#${group.id} created with ${group.children.length} children`;
  }
}
