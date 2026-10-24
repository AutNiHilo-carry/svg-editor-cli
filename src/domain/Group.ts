import { Shape } from './Shape.js';
import { ShapeCollection } from './ShapeCollection.js';
import type { ShapeContainer } from './ShapeContainer.js';

export class Group extends Shape implements ShapeContainer {
  public readonly type = 'g';
  readonly #collection: ShapeCollection;

  public constructor(id: string) {
    super(id, {});
    this.#collection = new ShapeCollection(this);
  }

  public override get children(): readonly Shape[] { return this.#collection.children; }
  public insert(shape: Shape, index?: number): void { this.#collection.insert(shape, index); }
  public remove(shape: Shape): void { this.#collection.remove(shape); }

  public override walk(): readonly Shape[] {
    return [this, ...this.children.flatMap(child => child.walk())];
  }

  protected override translated(_dx: number, _dy: number): Map<string, number> {
    return new Map();
  }
}
