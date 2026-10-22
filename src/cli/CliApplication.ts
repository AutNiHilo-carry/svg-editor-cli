import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import type { CommandDispatcher } from '../commands/CommandDispatcher.js';
import { CommandTokenizer } from './CommandTokenizer.js';

export class CliApplication {
  readonly #tokenizer = new CommandTokenizer();

  public constructor(private readonly dispatcher: CommandDispatcher) {}

  public run(): void {
    stdout.write("svg-editor 0.1 — type 'help' for commands\n");
    const terminal = Boolean(stdin.isTTY && stdout.isTTY);
    const reader = createInterface({ input: stdin, output: stdout, terminal });
    reader.setPrompt('svg> ');
    reader.on('line', line => {
      try {
        const result = this.dispatcher.dispatch(this.#tokenizer.parse(line));
        if (result !== undefined) stdout.write(`${result}\n`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stdout.write(`error: ${message.replace(/[\r\n]+/g, ' ')}\n`);
      }
      if (terminal) reader.prompt();
    });
    if (terminal) reader.prompt();
  }
}
