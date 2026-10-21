import { Shape } from './Shape.js';

export class Ellipse extends Shape {
  public readonly type = 'ellipse';

  public constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id, { cx, cy, rx, ry }, ['rx', 'ry']);
  }

  protected override translated(dx: number, dy: number): Map<string, number> {
    return this.translateAxes(dx, dy, ['cx'], ['cy']);
  }
}
