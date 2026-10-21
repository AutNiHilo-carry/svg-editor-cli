import { Group } from './Group.js';
import { ShapeCollection } from './ShapeCollection.js';
import type { Shape } from './Shape.js';
import type { ShapeContainer } from './ShapeContainer.js';

export class Canvas implements ShapeContainer {
  #width: number;
  #height: number;
  readonly #collection = new ShapeCollection(this);

  public constructor(width = 800, height = 600) {
    this.validateSize(width, height);
    this.#width = width;
    this.#height = height;
  }

  public get width(): number { return this.#width; }
  public get height(): number { return this.#height; }
  public get parent(): null { return null; }
  public get children(): readonly Shape[] { return this.#collection.children; }
  public insert(shape: Shape, index?: number): void { this.#collection.insert(shape, index); }
  public remove(shape: Shape): void { this.#collection.remove(shape); }
  public walk(): readonly Shape[] { return this.children.flatMap(child => child.walk()); }

  public resize(width: number, height: number): void {
    this.validateSize(width, height);
    this.#width = width;
    this.#height = height;
  }

  public find(id: string): Shape | undefined { return this.walk().find(shape => shape.id === id); }

  public requireShape(id: string): Shape {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }

  public requireGroup(id: string): Group {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }

  private validateSize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error('canvas dimensions must be positive finite numbers');
    }
  }
}
