import { Group } from './Group.js';
import type { Canvas } from './Canvas.js';
import type { Shape } from './Shape.js';
import type { ShapeContainer } from './ShapeContainer.js';
import type { ShapeState } from './ShapeState.js';

export class CanvasSnapshot {
  readonly #canvas: Canvas;
  readonly #canvasState: ShapeState;
  readonly #states: readonly ShapeState[];
  readonly #layout: readonly { container: ShapeContainer; children: readonly Shape[] }[];

  public constructor(canvas: Canvas) {
    this.#canvas = canvas;
    this.#canvasState = canvas.captureState();
    const shapes = canvas.walk();
    this.#states = shapes.map(shape => shape.captureState());
    this.#layout = [canvas, ...shapes.filter(shape => shape instanceof Group)]
      .map(container => ({ container, children: container.children }));
  }

  public restore(): void {
    // 先清空当前和快照中的容器，再按原树顺序重建，避免临时 ID 冲突。
    const containers = new Set<ShapeContainer>([
      this.#canvas,
      ...this.#canvas.walk().filter(shape => shape instanceof Group),
      ...this.#layout.map(item => item.container),
    ]);
    for (const container of containers) {
      for (const child of container.children) container.remove(child);
    }
    for (const state of this.#states) state.restore();
    for (const { container, children } of this.#layout) {
      for (const child of children) container.insert(child);
    }
    this.#canvasState.restore();
  }
}
