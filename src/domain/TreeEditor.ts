import { Group } from './Group.js';
import type { Canvas } from './Canvas.js';
import type { Shape } from './Shape.js';
import type { ShapeContainer } from './ShapeContainer.js';

export class TreeEditor {
  public constructor(private readonly canvas: Canvas) {}

  public group(id: string, ids: readonly string[]): Group {
    if (ids.length === 0) throw new Error('group requires at least one shape');
    if (this.canvas.find(id)) throw new Error(`id already exists: ${id}`);
    const selected = new Set<Shape>();
    for (const shapeId of ids) {
      const shape = this.canvas.requireShape(shapeId);
      if (selected.has(shape)) throw new Error(`duplicate shape id: ${shapeId}`);
      selected.add(shape);
    }
    const ordered = this.canvas.walk().filter(shape => selected.has(shape));
    for (const shape of ordered) {
      for (const ancestor of this.ancestors(shape)) {
        if (ancestor instanceof Group && selected.has(ancestor)) {
          throw new Error(`cannot group a container into its own descendant: ${ancestor.id}`);
        }
      }
    }
    const parent = this.ancestors(ordered[0]!).find(candidate =>
      ordered.every(shape => this.ancestors(shape).includes(candidate)),
    );
    if (!parent) throw new Error('shapes must belong to the same document');
    const index = parent.children.findIndex(branch => branch.walk().some(shape => selected.has(shape)));
    const group = new Group(id);
    parent.insert(group, index);
    for (const shape of ordered) group.insert(shape);
    return group;
  }

  public ungroup(id: string): number {
    const group = this.canvas.requireGroup(id);
    const parent = group.parent;
    if (parent === this.canvas) throw new Error(`cannot ungroup top-level container: ${id}`);
    if (!parent) throw new Error(`no such container: ${id}`);
    const index = parent.children.indexOf(group);
    const children = group.children;
    for (const [offset, child] of children.entries()) parent.insert(child, index + offset);
    parent.remove(group);
    return children.length;
  }

  public addTo(groupId: string, id: string): void {
    const group = this.canvas.requireGroup(groupId);
    group.insert(this.canvas.requireShape(id));
  }

  public front(id: string): void {
    const shape = this.canvas.requireShape(id);
    shape.parent?.insert(shape);
  }

  public back(id: string): void {
    const shape = this.canvas.requireShape(id);
    shape.parent?.insert(shape, 0);
  }

  private ancestors(shape: Shape): readonly ShapeContainer[] {
    const result: ShapeContainer[] = [];
    let parent = shape.parent;
    while (parent) { result.push(parent); parent = parent.parent; }
    return result;
  }
}
