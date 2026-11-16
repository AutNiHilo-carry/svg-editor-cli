import { Group } from '../domain/Group.js';
import { isShapeContainer } from '../domain/isShapeContainer.js';
import type { Canvas } from '../domain/Canvas.js';
import type { Shape } from '../domain/Shape.js';
import type { TreeDecorator } from '../extensions/TreeDecorator.js';

export class DocumentInspector {
  public constructor(
    private readonly canvas: Canvas,
    private readonly decorators: readonly TreeDecorator[] = [],
  ) {}

  public tree(id?: string): string {
    if (id !== undefined) {
      const shape = this.canvas.requireShape(id);
      return [this.row('', '', shape, false), ...this.branches(shape.children, '')].join('\n');
    }
    return [`svg (${this.canvas.width}x${this.canvas.height})${this.tags(null, true)}`, ...this.branches(this.canvas.children, '')].join('\n');
  }

  public show(id: string): string {
    const shape = this.canvas.requireShape(id);
    const parentShape = shape.parent as unknown as Shape | null;
    const parent = parentShape && parentShape !== (this.canvas as unknown as Shape) ? `g#${parentShape.id}` : 'svg';
    return [
      `${shape.type}#${shape.id}  parent=${parent}`,
      ...Object.entries(shape.attributes).map(([key, value]) => `  ${key}=${typeof value === 'string' ? JSON.stringify(value) : value}`),
    ].join('\n');
  }

  private row(prefix: string, connector: string, shape: Shape, isRoot: boolean): string {
    const summary = shape.summary ? `  ${shape.summary}` : '';
    return `${prefix}${connector}${shape.svgTag}#${shape.id}${summary}${this.tags(shape, isRoot)}`;
  }

  private branches(children: readonly Shape[], prefix: string): string[] {
    return children.flatMap((shape, index) => {
      const last = index === children.length - 1;
      return [
        this.row(prefix, last ? '└── ' : '├── ', shape, false),
        ...this.branches(shape.children, `${prefix}${last ? '    ' : '│   '}`),
      ];
    });
  }

  private tags(shape: Shape | null, isRoot: boolean): string {
    const tags = this.decorators.flatMap((decorator) => {
      const value = decorator.decorate({ canvas: this.canvas, shape, isRoot });
      if (value === null) return [];
      return typeof value === 'string' ? [value] : [...value];
    }).filter((value) => value !== '');
    return tags.length === 0 ? '' : ` ${tags.join(' ')}`;
  }
}
