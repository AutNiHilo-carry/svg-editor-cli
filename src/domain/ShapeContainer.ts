import type { Shape } from './Shape.js';

export interface ShapeContainer {
  readonly parent: ShapeContainer | null;
  readonly children: readonly Shape[];
  readonly reservedIds?: readonly string[];
  insert(shape: Shape, index?: number): void;
  remove(shape: Shape): void;
  walk(): readonly Shape[];
}
