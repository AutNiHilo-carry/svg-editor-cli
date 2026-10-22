export class CommandToken {
  readonly #value: string;
  readonly #quoted: boolean;

  public constructor(value: string, quoted = false) {
    this.#value = value;
    this.#quoted = quoted;
  }

  public get value(): string { return this.#value; }
  public get quoted(): boolean { return this.#quoted; }
}
