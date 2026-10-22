import type { EditorSession } from '../application/EditorSession.js';
import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class CanvasCommand implements Command {
  public static readonly syntax = 'canvas [w] [h]';

  public constructor(private readonly session: EditorSession, private readonly args: CommandArguments) {}

  public execute(): string {
    const canvas = this.session.requireCanvas();
    if (this.args.length === 0) return `canvas ${canvas.width}x${canvas.height}`;
    this.args.expect(2);
    canvas.resize(this.args.number(0), this.args.number(1));
    return `canvas resized to ${canvas.width}x${canvas.height}`;
  }
}
