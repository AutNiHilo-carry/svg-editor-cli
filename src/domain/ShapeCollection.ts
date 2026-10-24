import type { Shape } from './Shape.js';
import type { ShapeContainer } from './ShapeContainer.js';

// 容器共享的树结构管理器；父关系不开放 setter，统一在插入/移除时维护。
export class ShapeCollection {
  static readonly #parents = new WeakMap<Shape, ShapeContainer>();
  readonly #items: Shape[] = [];
  readonly #owner: ShapeContainer;

  public constructor(owner: ShapeContainer) { this.#owner = owner; }

  public static parentOf(shape: Shape): ShapeContainer | null {
    return this.#parents.get(shape) ?? null;
  }

  public get children(): readonly Shape[] { return Object.freeze([...this.#items]); }

  public insert(shape: Shape, index = this.#items.length): void {
    if (!Number.isInteger(index) || index < 0 || index > this.#items.length) {
      throw new Error('invalid child index');
    }
    const subtree = shape.walk();
    const moving = new Set(subtree);
    let root = this.#owner;
    // 包括 owner 本身，禁止把容器移入自己或子孙。
    while (true) {
      if (subtree.some(node => Object.is(node, root))) {
        throw new Error(`cannot move a container into its own descendant: ${shape.id}`);
      }
      if (root.parent === null) break;
      root = root.parent;
    }
    const ids = new Set([...(root.reservedIds ?? []), ...root.walk().filter(node => !moving.has(node)).map(node => node.id)]);
    for (const node of subtree) {
      if (ids.has(node.id)) throw new Error(`id already exists: ${node.id}`);
      ids.add(node.id);
    }
    // 前面所有校验成功后才从原父容器移除；失败时整棵树保持原状。
    const oldParent = ShapeCollection.parentOf(shape);
    const oldIndex = this.#items.indexOf(shape);
    oldParent?.remove(shape);
    const insertion = oldParent === this.#owner && oldIndex < index ? index - 1 : index;
    this.#items.splice(insertion, 0, shape);
    ShapeCollection.#parents.set(shape, this.#owner);
  }

  public remove(shape: Shape): void {
    const index = this.#items.indexOf(shape);
    if (index < 0) throw new Error(`no such child: ${shape.id}`);
    this.#items.splice(index, 1);
    ShapeCollection.#parents.delete(shape);
  }
}
