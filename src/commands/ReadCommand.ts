import type { EditorSession } from '../application/EditorSession.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class ReadCommand implements Command {
  public static readonly syntax = 'read <file.svg>';
  public constructor(private readonly session: EditorSession, private readonly args: CommandArguments) {}
  public execute(): string {
    this.args.expect(1);
    const path = this.args.text(0);
    const loaded = this.session.read(path);
    return [...loaded.warnings, `read ${path} (${loaded.canvas.walk().length} elements)`].join('\n');
  }
}
