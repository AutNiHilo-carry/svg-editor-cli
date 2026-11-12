import type { Canvas } from '../domain/Canvas.js';
import type { Shape } from '../domain/Shape.js';

export interface AttributeApplyContext {
  readonly canvas: Canvas;
}

/** Extension point 4: domain semantics for `set <shape> <attr> <value>`. */
export interface AttributeHandler {
  readonly name: string;
  handles(shape: Shape, attribute: string): boolean;
  apply(shape: Shape, attribute: string, value: string, context: AttributeApplyContext): string | void;
}
