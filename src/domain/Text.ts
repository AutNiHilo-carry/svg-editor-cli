import { Shape } from './Shape.js';

export class Text extends Shape {
  public readonly type = 'text';
  #content: string;

  public constructor(id: string, x: number, y: number, content: string) {
    super(id, { x, y });
    this.#content = content;
  }

  public get content(): string { return this.#content; }

  public override get attributes(): Readonly<Record<string, string | number>> {
    return Object.freeze({ ...super.attributes, text: this.#content });
  }

  public override setAttribute(name: string, value: string | number): void {
    if (name === 'text') {
      this.#content = String(value);
      return;
    }
    super.setAttribute(name, value);
  }

  protected override translated(dx: number, dy: number): Map<string, number> {
    return this.translateAxes(dx, dy, ['x'], ['y']);
  }
}
