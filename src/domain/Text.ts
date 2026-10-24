import { Shape } from './Shape.js';
import { ShapeState } from './ShapeState.js';

export class Text extends Shape {
  public readonly type = 'text';
  #content: string;

  public constructor(id: string, x: number, y: number, content: string) {
    super(id, { x, y });
    this.#content = content;
  }

  public override get content(): string { return this.#content; }
  public override get svgAttributes(): Readonly<Record<string, string | number>> { return super.attributes; }
  public override get summary(): string { return `${super.summary} ${JSON.stringify(this.#content)}`; }

  public override captureState(): ShapeState {
    const base = super.captureState();
    const content = this.#content;
    return new ShapeState(() => {
      base.restore();
      this.#content = content;
    });
  }

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
