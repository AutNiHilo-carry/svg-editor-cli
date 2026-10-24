import type { EditorSession } from '../application/EditorSession.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class SaveCommand implements Command {
  public static readonly syntax = 'save [file.svg]';
  public constructor(private readonly session: EditorSession, private readonly args: CommandArguments) {}
  public execute(): string {
    this.args.expect(0, 1);
    const path = this.session.save(this.args.length === 0 ? undefined : this.args.text(0));
    return `saved to ${path} (${this.session.requireCanvas().walk().length} elements)`;
  }
}
