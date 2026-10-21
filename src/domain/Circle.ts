import { Shape } from './Shape.js';

export class Circle extends Shape {
  public readonly type = 'circle';

  public constructor(id: string, cx: number, cy: number, r: number) {
    super(id, { cx, cy, r }, ['r']);
  }

  protected override translated(dx: number, dy: number): Map<string, number> {
    return this.translateAxes(dx, dy, ['cx'], ['cy']);
  }
}
