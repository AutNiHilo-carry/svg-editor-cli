import type { Shape } from './Shape.js';
import type { ShapeContainer } from './ShapeContainer.js';

/**
 * Structural container test used at plugin boundaries. Plugin composites may
 * be loaded from a separate module instance, so `instanceof Group` is unsafe.
 */
export function isShapeContainer(shape: Shape): shape is Shape & ShapeContainer {
  return typeof (shape as Partial<ShapeContainer>).insert === 'function'
    && typeof (shape as Partial<ShapeContainer>).remove === 'function';
}
