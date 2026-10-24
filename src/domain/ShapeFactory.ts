import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Group } from './Group.js';
import { Line } from './Line.js';
import { Rect } from './Rect.js';
import { Text } from './Text.js';
import type { Shape } from './Shape.js';
import type { ShapeInput } from './ShapeInput.js';

export class ShapeFactory {
  readonly #builders = new Map<string, (id: string, input: ShapeInput) => Shape>([
    ['rect', (id, input) => {
      input.expect(4, 5);
      return this.styled(new Rect(id, input.number('x', 0), input.number('y', 1), input.number('width', 2), input.number('height', 3)), input.optional('fill', 4), 'fill');
    }],
    ['circle', (id, input) => {
      input.expect(3, 4);
      return this.styled(new Circle(id, input.number('cx', 0), input.number('cy', 1), input.number('r', 2)), input.optional('fill', 3), 'fill');
    }],
    ['ellipse', (id, input) => {
      input.expect(4, 5);
      return this.styled(new Ellipse(id, input.number('cx', 0), input.number('cy', 1), input.number('rx', 2), input.number('ry', 3)), input.optional('fill', 4), 'fill');
    }],
    ['line', (id, input) => {
      input.expect(4, 5);
      return this.styled(new Line(id, input.number('x1', 0), input.number('y1', 1), input.number('x2', 2), input.number('y2', 3)), input.optional('stroke', 4), 'stroke');
    }],
    ['text', (id, input) => {
      input.expect(3);
      return new Text(id, input.number('x', 0), input.number('y', 1), input.text('text', 2));
    }],
    ['g', (id, input) => { input.expect(0); return new Group(id); }],
  ]);

  public create(type: string, id: string, input: ShapeInput): Shape {
    const build = this.#builders.get(type);
    if (!build) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return build(id, input);
  }

  private styled(shape: Shape, value: string | undefined, attribute: string): Shape {
    if (value !== undefined) shape.setAttribute(attribute, value);
    return shape;
  }
}
