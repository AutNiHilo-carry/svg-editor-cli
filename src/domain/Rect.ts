import { Shape } from './Shape.js';

export class Rect extends Shape {
  public readonly type = 'rect';

  public constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id, { x, y, width, height }, ['width', 'height']);
  }

  protected override translated(dx: number, dy: number): Map<string, number> {
    return this.translateAxes(dx, dy, ['x'], ['y']);
  }
}
