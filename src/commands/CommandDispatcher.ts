import { CommandArguments } from './CommandArguments.js';
import type { CommandToken } from './CommandToken.js';
import type { CommandDescriptor, CommandServices } from '../extensions/CommandDescriptor.js';

export class CommandDispatcher {
  readonly #commands = new Map<string, CommandDescriptor>();

  public register(descriptor: CommandDescriptor): void {
    if (this.#commands.has(descriptor.name)) throw new Error(`duplicate registration: commands/${descriptor.name}`);
    this.#commands.set(descriptor.name, descriptor);
  }

  public syntaxes(): string[] { return [...this.#commands.values()].map((command) => command.syntax); }

  public dispatch(tokens: readonly CommandToken[], services: CommandServices): string | undefined {
    const name = tokens[0]?.value;
    if (name === undefined) return undefined;
    const descriptor = this.#commands.get(name);
    if (!descriptor) throw new Error(`unknown command: ${name}`);
    return descriptor.build(new CommandArguments(tokens.slice(1), descriptor.syntax), services).execute();
  }
}
