import type { Shape } from '../domain/Shape.js';
import type { ShapeInput } from '../domain/ShapeInput.js';

export interface ShapeCreateRequest {
  readonly id: string;
  readonly input: ShapeInput;
  readonly mode?: 'create' | 'restore' | undefined;
}

/** Extension point 1: one SVG shape type. */
export interface ShapeProvider {
  readonly type: string;
  readonly svgTag: string;
  /** Help text for create, supplied by the plugin. */
  readonly createUsage?: string;
  create(request: ShapeCreateRequest): Shape;
  /** Called after children and attributes were imported during `read`. */
  validateRestored?(shape: Shape): void;
}
