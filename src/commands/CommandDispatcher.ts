import type { EditorSession } from '../application/EditorSession.js';
import type { Command } from './Command.js';
import type { CommandToken } from './CommandToken.js';
import { CommandArguments } from './CommandArguments.js';
import { CanvasCommand } from './CanvasCommand.js';
import { CreateCommand } from './CreateCommand.js';
import { DeleteCommand } from './DeleteCommand.js';
import { HelpCommand } from './HelpCommand.js';
import { InitCommand } from './InitCommand.js';
import { MoveCommand } from './MoveCommand.js';
import { ScaleCommand } from './ScaleCommand.js';
import { SetCommand } from './SetCommand.js';
import type { ShapeFactory } from './ShapeFactory.js';

export class CommandDispatcher {
  readonly #commands = new Map<string, { syntax: string; build: (args: CommandArguments) => Command }>();

  public constructor(session: EditorSession, factory: ShapeFactory) {
    this.register('init', InitCommand.syntax, args => new InitCommand(session, args));
    this.register('canvas', CanvasCommand.syntax, args => new CanvasCommand(session, args));
    this.register('create', CreateCommand.syntax, args => new CreateCommand(session, factory, args));
    this.register('move', MoveCommand.syntax, args => new MoveCommand(session, args));
    this.register('scale', ScaleCommand.syntax, args => new ScaleCommand(session, args));
    this.register('set', SetCommand.syntax, args => new SetCommand(session, args));
    this.register('delete', DeleteCommand.syntax, args => new DeleteCommand(session, args));
    this.register('help', HelpCommand.syntax, args => new HelpCommand(args, [...this.#commands.values()].map(item => item.syntax)));
  }

  public dispatch(tokens: readonly CommandToken[]): string | undefined {
    const name = tokens[0]?.value;
    if (name === undefined) return undefined;
    const registration = this.#commands.get(name);
    if (!registration) throw new Error(`unknown command: ${name}`);
    return registration.build(new CommandArguments(tokens.slice(1), registration.syntax)).execute();
  }

  private register(name: string, syntax: string, build: (args: CommandArguments) => Command): void {
    this.#commands.set(name, { syntax, build });
  }
}
