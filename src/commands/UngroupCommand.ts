import type { EditorSession } from '../application/EditorSession.js';
import { TreeEditor } from '../domain/TreeEditor.js';
import { EditCommand } from './EditCommand.js';
import type { CommandArguments } from './CommandArguments.js';

export class UngroupCommand extends EditCommand {
  public static readonly syntax = 'ungroup <gid>';
  public constructor(session: EditorSession, private readonly args: CommandArguments) { super(session); }

  protected override apply(): string {
    this.args.expect(1);
    const id = this.args.text(0);
    const count = new TreeEditor(this.session.requireCanvas()).ungroup(id);
    return `g#${id} ungrouped (${count} children promoted)`;
  }
}
