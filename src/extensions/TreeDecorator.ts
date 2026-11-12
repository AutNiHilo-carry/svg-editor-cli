import type { Canvas } from '../domain/Canvas.js';
import type { Shape } from '../domain/Shape.js';

export interface TreeRow {
  readonly canvas: Canvas;
  readonly shape: Shape | null;
  readonly isRoot: boolean;
}

/** Extension point 3: a label appended to the end of one tree row. */
export interface TreeDecorator {
  readonly name: string;
  decorate(row: TreeRow): string | readonly string[] | null;
}
