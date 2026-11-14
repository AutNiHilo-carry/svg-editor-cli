import { Group, Rect, Text, type Shape, type ShapeInput } from '../../../dist/index.js';
import type { ShapeProvider } from '../../../dist/index.js';

export class Box extends Group {
  public override readonly type = 'box';
  public override get svgTag(): string { return 'g'; }
  public override importAttribute(name: string, value: string): void {
    if (name === 'data-kind') return;
    super.importAttribute(name, value);
  }

  public override get summary(): string {
    return Object.entries(super.attributes).map(([key, value]) => `${key}=${value}`).join(' ');
  }
  public override get svgAttributes(): Readonly<Record<string, string | number>> {
    return Object.freeze({ ...super.svgAttributes, 'data-kind': 'box' });
  }
  public get rect(): Rect {
    const shape = this.children.find(child => child.id === `${this.id}-rect`);
    if (!(shape instanceof Rect)) throw new Error(`box ${this.id} lost its rect`);
    return shape;
  }
  public get label(): Text {
    const shape = this.children.find(child => child.id === `${this.id}-label`);
    if (!(shape instanceof Text)) throw new Error(`box ${this.id} lost its label`);
    return shape;
  }
  public setFill(value: string): void { this.rect.setAttribute('fill', value); }
  public setLabel(value: string): void { this.label.setAttribute('text', value); }

  public override assertCanDetach(shape: Shape): string | null {
    return shape === this.rect || shape === this.label
      ? `cannot remove required child of composite shape: ${shape.id}`
      : null;
  }
  public override canUngroup(): string | null { return `cannot ungroup composite shape: ${this.id}`; }
}

function createBox(id: string, input: ShapeInput): Box {
  input.expect(5, 5);
  const x = input.number('x', 0);
  const y = input.number('y', 1);
  const width = input.number('width', 2);
  const height = input.number('height', 3);
  const title = input.text('text', 4);
  const box = new Box(id);
  const rect = new Rect(`${id}-rect`, x, y, width, height);
  rect.setAttribute('fill', '#4a90d9');
  const text = new Text(`${id}-label`, x + 20, y + height / 2 + 5, title);
  text.importAttribute('font-size', '16');
  box.insert(rect);
  box.insert(text);
  return box;
}

const provider: ShapeProvider = {
  type: 'box',
  svgTag: 'g',
  create: ({ id, input, mode }) => mode === 'restore' ? new Box(id) : createBox(id, input),
  validateRestored: (shape) => {
    if (!(shape instanceof Box)) throw new Error(`invalid box: ${shape.id}`);
    shape.rect;
    shape.label;
  },
};

export const contributes = {
  shapes: ['box'],
  commands: [],
  decorators: ['box-type-label'],
  attributes: ['box-attributes'],
} as const;

export default {
  name: '@svgframe/plugin-shape-box',
  contributes,
  activate(context: import('../../../dist/index.js').PluginContext): void {
    context.registerShape(provider);
    context.registerAttribute({
      name: 'box-attributes',
      handles: (shape, attribute) => shape instanceof Box && (attribute === 'fill' || attribute === 'label'),
      apply: (shape, attribute, value) => {
        const box = shape as Box;
        if (attribute === 'fill') { box.setFill(value); return `${box.type}#${box.id} fill propagated to ${box.rect.id}`; }
        box.setLabel(value);
        return `${box.type}#${box.id} label updated: ${JSON.stringify(value)}`;
      },
    });
    context.registerDecorator({
      name: 'box-type-label',
      decorate: ({ shape }) => shape?.type === 'box' ? '(box)' : null,
    });
  },
} satisfies import('../../../dist/index.js').SvgPlugin;
