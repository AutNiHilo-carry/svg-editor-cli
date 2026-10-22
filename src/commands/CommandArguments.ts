import { FiniteNumber } from '../domain/FiniteNumber.js';
import type { CommandToken } from './CommandToken.js';

export class CommandArguments {
  readonly #tokens: readonly CommandToken[];
  readonly #syntax: string;

  public constructor(tokens: readonly CommandToken[], syntax: string) {
    this.#tokens = [...tokens];
    this.#syntax = syntax;
  }

  public get length(): number { return this.#tokens.length; }

  public expect(min: number, max = min): void {
    if (this.length < min || this.length > max) throw new Error(`usage: ${this.#syntax}`);
  }

  public text(index: number): string {
    const token = this.#tokens[index];
    if (!token) throw new Error(`usage: ${this.#syntax}`);
    return token.value;
  }

  public quoted(index: number): boolean { return this.#tokens[index]?.quoted ?? false; }
  public number(index: number): number { return FiniteNumber.parse(this.text(index)); }

  public slice(start: number, end = this.length, syntax = this.#syntax): CommandArguments {
    return new CommandArguments(this.#tokens.slice(start, end), syntax);
  }
}
