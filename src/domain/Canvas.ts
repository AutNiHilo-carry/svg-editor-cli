import { Group } from './Group.js';
import { ShapeCollection } from './ShapeCollection.js';
import type { Shape } from './Shape.js';
import type { ShapeContainer } from './ShapeContainer.js';
import { ShapeState } from './ShapeState.js';

export class Canvas implements ShapeContainer {
  #width: number;
  #height: number;
  readonly #collection = new ShapeCollection(this);
  readonly #imported = new Map<string, string>();

  public constructor(width = 800, height = 600) {
    this.validateSize(width, height);
    this.#width = width;
    this.#height = height;
  }

  public get width(): number { return this.#width; }
  public get height(): number { return this.#height; }
  public get parent(): null { return null; }
  public get reservedIds(): readonly string[] {
    const id = this.#imported.get('id');
    return id ? [id] : [];
  }
  public captureState(): ShapeState {
    const width = this.#width;
    const height = this.#height;
    const attributes = new Map(this.#imported);
    return new ShapeState(() => {
      this.#width = width;
      this.#height = height;
      this.#imported.clear();
      for (const [key, value] of attributes) this.#imported.set(key, value);
    });
  }
  public get svgAttributes(): Readonly<Record<string, string | number>> {
    return Object.freeze({
      xmlns: 'http://www.w3.org/2000/svg',
      ...Object.fromEntries(this.#imported),
      width: this.#width, height: this.#height,
    });
  }
  public importAttribute(name: string, value: string): void {
    if (name === 'width' || name === 'height') throw new Error(`reserved attribute: ${name}`);
    this.#imported.set(name, value);
  }
  public get children(): readonly Shape[] { return this.#collection.children; }
  public insert(shape: Shape, index?: number): void { this.#collection.insert(shape, index); }
  public remove(shape: Shape): void { this.#collection.remove(shape); }
  public walk(): readonly Shape[] { return this.children.flatMap(child => child.walk()); }

  public resize(width: number, height: number): void {
    this.validateSize(width, height);
    this.#width = width;
    this.#height = height;
    this.#imported.delete('viewBox');
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
