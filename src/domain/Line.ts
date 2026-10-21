import { Shape } from './Shape.js';

export class Line extends Shape {
  public readonly type = 'line';

  public constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super(id, { x1, y1, x2, y2 });
  }

  protected override translated(dx: number, dy: number): Map<string, number> {
    return this.translateAxes(dx, dy, ['x1', 'x2'], ['y1', 'y2']);
  }
}
