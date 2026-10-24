import { ShapeCollection } from './ShapeCollection.js';
import { FiniteNumber } from './FiniteNumber.js';
import { ShapeState } from './ShapeState.js';
import type { ShapeContainer } from './ShapeContainer.js';

export abstract class Shape {
  public abstract readonly type: string;
  readonly #id: string;
  readonly #geometry: Map<string, number>;
  readonly #sizes: ReadonlySet<string>;
  readonly #styles = new Map<string, string | number>();
  readonly #imported = new Map<string, string>();

  protected constructor(id: string, geometry: Record<string, number>, sizes: readonly string[] = []) {
    if (!id || /\s/.test(id)) throw new Error('id must be nonempty and contain no whitespace');
    this.#id = id;
    this.#sizes = new Set(sizes);
    this.#geometry = new Map(Object.entries(geometry));
    for (const [key, value] of this.#geometry) this.validateNumber(key, value);
  }

  public get id(): string { return this.#id; }
  public get parent(): ShapeContainer | null { return ShapeCollection.parentOf(this); }
  public get children(): readonly Shape[] { return []; }
  public get content(): string | undefined { return undefined; }

  public get attributes(): Readonly<Record<string, string | number>> {
    return Object.freeze(Object.fromEntries([...this.#imported, ...this.#geometry, ...this.#styles]));
  }

  public get svgAttributes(): Readonly<Record<string, string | number>> { return this.attributes; }

  public get summary(): string {
    return Object.entries(this.svgAttributes).map(([key, value]) => `${key}=${value}`).join(' ');
  }

  public importAttribute(name: string, value: string): void {
    if (name === 'id' || name === 'text') throw new Error(`reserved attribute: ${name}`);
    if (this.#geometry.has(name) || ['fill', 'stroke', 'stroke-width'].includes(name)) {
      this.setAttribute(name, value);
    } else {
      this.#imported.set(name, value);
    }
  }

  public setAttribute(name: string, value: string | number): void {
    if (this.#geometry.has(name)) {
      const numeric = FiniteNumber.parse(value);
      this.validateNumber(name, numeric);
      this.#geometry.set(name, numeric);
      return;
    }
    if (name === 'fill' || name === 'stroke') {
      this.#styles.set(name, String(value));
      return;
    }
    if (name === 'stroke-width') {
      const numeric = FiniteNumber.parse(value);
      if (numeric < 0) throw new Error('stroke-width must be nonnegative');
      this.#styles.set(name, numeric);
      return;
    }
    throw new Error(`unknown attribute: ${name}`);
  }

  public move(dx: number, dy: number): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) throw new Error('coordinates must be finite');
    // 先计算整棵子树的结果，全部合法后才写回，防止溢出导致部分移动。
    const changes = this.walk().map(shape => ({ shape, values: shape.translated(dx, dy) }));
    for (const change of changes) change.shape.validateGeometry(change.values);
    for (const change of changes) change.shape.applyGeometry(change.values);
  }

  public scale(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error('scale factor must be positive');
    const changes = this.walk().map(shape => ({
      shape,
      values: new Map([...shape.#geometry].map(([key, value]) => [key, value * factor])),
    }));
    for (const change of changes) change.shape.validateGeometry(change.values);
    for (const change of changes) change.shape.applyGeometry(change.values);
  }

  public walk(): readonly Shape[] { return [this]; }

  public captureState(): ShapeState {
    const geometry = new Map(this.#geometry);
    const styles = new Map(this.#styles);
    const imported = new Map(this.#imported);
    return new ShapeState(() => {
      this.#geometry.clear();
      this.#styles.clear();
      this.#imported.clear();
      for (const [key, value] of geometry) this.#geometry.set(key, value);
      for (const [key, value] of styles) this.#styles.set(key, value);
      for (const [key, value] of imported) this.#imported.set(key, value);
    });
  }

  protected translateAxes(dx: number, dy: number, xKeys: readonly string[], yKeys: readonly string[]): Map<string, number> {
    const values = new Map(this.#geometry);
    for (const key of xKeys) values.set(key, this.coordinate(key) + dx);
    for (const key of yKeys) values.set(key, this.coordinate(key) + dy);
    return values;
  }

  protected abstract translated(dx: number, dy: number): Map<string, number>;

  private coordinate(name: string): number {
    const value = this.#geometry.get(name);
    if (value === undefined) throw new Error(`unknown coordinate: ${name}`);
    return value;
  }

  private validateNumber(name: string, value: number): void {
    if (!Number.isFinite(value)) throw new Error(`${name} must be finite`);
    if (this.#sizes.has(name) && value < 0) throw new Error(`${name} must be nonnegative`);
  }

  private validateGeometry(values: ReadonlyMap<string, number>): void {
    for (const [name, value] of values) this.validateNumber(name, value);
  }

  private applyGeometry(values: ReadonlyMap<string, number>): void {
    for (const [name, value] of values) this.#geometry.set(name, value);
  }
}
