import type { Shape } from '../domain/Shape.js';
import type { ShapeProvider } from '../extensions/ShapeProvider.js';
import { Circle } from '../domain/Circle.js';
import { Ellipse } from '../domain/Ellipse.js';
import { Group } from '../domain/Group.js';
import { Line } from '../domain/Line.js';
import { Rect } from '../domain/Rect.js';
import { Text } from '../domain/Text.js';

class RectProvider implements ShapeProvider {
  readonly type = 'rect';
  readonly createUsage = 'create rect <id> <x> <y> <w> <h> [fill]';
  readonly svgTag = 'rect';
  create({ id, input }: { id: string; input: import('../domain/ShapeInput.js').ShapeInput }): Shape {
    input.expect(4, 5);
    const shape = new Rect(id, input.number('x', 0), input.number('y', 1), input.number('width', 2), input.number('height', 3));
    const fill = input.optional('fill', 4);
    if (fill !== undefined) shape.setAttribute('fill', fill);
    return shape;
  }
}
class CircleProvider implements ShapeProvider {
  readonly type = 'circle';
  readonly createUsage = 'create circle <id> <cx> <cy> <r> [fill]';
  readonly svgTag = 'circle';
  create({ id, input }: { id: string; input: import('../domain/ShapeInput.js').ShapeInput }): Shape {
    input.expect(3, 4);
    const shape = new Circle(id, input.number('cx', 0), input.number('cy', 1), input.number('r', 2));
    const fill = input.optional('fill', 3);
    if (fill !== undefined) shape.setAttribute('fill', fill);
    return shape;
  }
}
class EllipseProvider implements ShapeProvider {
  readonly type = 'ellipse';
  readonly createUsage = 'create ellipse <id> <cx> <cy> <rx> <ry> [fill]';
  readonly svgTag = 'ellipse';
  create({ id, input }: { id: string; input: import('../domain/ShapeInput.js').ShapeInput }): Shape {
    input.expect(4, 5);
    const shape = new Ellipse(id, input.number('cx', 0), input.number('cy', 1), input.number('rx', 2), input.number('ry', 3));
    const fill = input.optional('fill', 4);
    if (fill !== undefined) shape.setAttribute('fill', fill);
    return shape;
  }
}
class LineProvider implements ShapeProvider {
  readonly type = 'line';
  readonly createUsage = 'create line <id> <x1> <y1> <x2> <y2> [stroke]';
  readonly svgTag = 'line';
  create({ id, input }: { id: string; input: import('../domain/ShapeInput.js').ShapeInput }): Shape {
    input.expect(4, 5);
    const shape = new Line(id, input.number('x1', 0), input.number('y1', 1), input.number('x2', 2), input.number('y2', 3));
    const stroke = input.optional('stroke', 4);
    if (stroke !== undefined) shape.setAttribute('stroke', stroke);
    return shape;
  }
}
class TextProvider implements ShapeProvider {
  readonly type = 'text';
  readonly createUsage = 'create text <id> <x> <y> "content"';
  readonly svgTag = 'text';
  create({ id, input }: { id: string; input: import('../domain/ShapeInput.js').ShapeInput }): Shape {
    input.expect(3);
    return new Text(id, input.number('x', 0), input.number('y', 1), input.text('text', 2));
  }
}
class GroupProvider implements ShapeProvider {
  readonly type = 'g';
  readonly createUsage = 'create g <id>';
  readonly svgTag = 'g';
  create({ id, input }: { id: string; input: import('../domain/ShapeInput.js').ShapeInput }): Shape {
    input.expect(0);
    return new Group(id);
  }
}

export const builtinShapeProviders: readonly ShapeProvider[] = [
  new RectProvider(),
  new CircleProvider(),
  new EllipseProvider(),
  new LineProvider(),
  new TextProvider(),
  new GroupProvider(),
];
