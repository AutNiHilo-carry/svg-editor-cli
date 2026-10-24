import { Group } from '../domain/Group.js';
import type { Canvas } from '../domain/Canvas.js';
import type { Shape } from '../domain/Shape.js';

export class DocumentInspector {
  public constructor(private readonly canvas: Canvas) {}

  public tree(id?: string): string {
    if (id !== undefined) {
      const shape = this.canvas.requireShape(id);
      return [this.label(shape), ...this.branches(shape.children, '')].join('\n');
    }
    return [`svg (${this.canvas.width}x${this.canvas.height})`, ...this.branches(this.canvas.children, '')].join('\n');
  }

  public show(id: string): string {
    const shape = this.canvas.requireShape(id);
    const parent = shape.parent instanceof Group ? `g#${shape.parent.id}` : 'svg';
    return [
      `${shape.type}#${shape.id}  parent=${parent}`,
      ...Object.entries(shape.attributes).map(([key, value]) => `  ${key}=${typeof value === 'string' ? JSON.stringify(value) : value}`),
    ].join('\n');
  }

  private label(shape: Shape): string { return `${shape.type}#${shape.id}${shape.summary ? `  ${shape.summary}` : ''}`; }

  private branches(children: readonly Shape[], prefix: string): string[] {
    return children.flatMap((shape, index) => {
      const last = index === children.length - 1;
      return [
        `${prefix}${last ? '└── ' : '├── '}${this.label(shape)}`,
        ...this.branches(shape.children, `${prefix}${last ? '    ' : '│   '}`),
      ];
    });
  }
}
