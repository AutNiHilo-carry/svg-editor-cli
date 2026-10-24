import type { Canvas } from '../domain/Canvas.js';

export class LoadedDocument {
  readonly #warnings: readonly string[];
  public constructor(private readonly document: Canvas, warnings: readonly string[] = []) {
    this.#warnings = Object.freeze([...warnings]);
  }
  public get canvas(): Canvas { return this.document; }
  public get warnings(): readonly string[] { return this.#warnings; }
}
