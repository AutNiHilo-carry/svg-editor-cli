import type { EditorSession } from '../application/EditorSession.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class InitCommand implements Command {
  public static readonly syntax = 'init [w] [h]';

  public constructor(private readonly session: EditorSession, private readonly args: CommandArguments) {}

  public execute(): string {
    this.args.expect(0, 2);
    const canvas = this.session.initialize(
      this.args.length > 0 ? this.args.number(0) : 800,
      this.args.length > 1 ? this.args.number(1) : 600,
    );
    return `canvas ${canvas.width}x${canvas.height} created`;
  }
}
