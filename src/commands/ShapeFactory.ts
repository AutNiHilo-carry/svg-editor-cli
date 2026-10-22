import { Circle } from '../domain/Circle.js';
import { Ellipse } from '../domain/Ellipse.js';
import { Group } from '../domain/Group.js';
import { Line } from '../domain/Line.js';
import { Rect } from '../domain/Rect.js';
import { Text } from '../domain/Text.js';
import type { Shape } from '../domain/Shape.js';
import type { CommandArguments } from './CommandArguments.js';

export class ShapeFactory {
  readonly #builders = new Map<string, (args: CommandArguments) => Shape>([
    ['rect', args => {
      args.expect(5, 6);
      return this.withStyle(new Rect(args.text(0), args.number(1), args.number(2), args.number(3), args.number(4)), args, 5, 'fill');
    }],
    ['circle', args => {
      args.expect(4, 5);
      return this.withStyle(new Circle(args.text(0), args.number(1), args.number(2), args.number(3)), args, 4, 'fill');
    }],
    ['ellipse', args => {
      args.expect(5, 6);
      return this.withStyle(new Ellipse(args.text(0), args.number(1), args.number(2), args.number(3), args.number(4)), args, 5, 'fill');
    }],
    ['line', args => {
      args.expect(5, 6);
      return this.withStyle(new Line(args.text(0), args.number(1), args.number(2), args.number(3), args.number(4)), args, 5, 'stroke');
    }],
    ['text', args => {
      args.expect(4);
      if (!args.quoted(3)) throw new Error('text content must be double quoted');
      return new Text(args.text(0), args.number(1), args.number(2), args.text(3));
    }],
    ['g', args => {
      args.expect(1);
      return new Group(args.text(0));
    }],
  ]);

  public create(type: string, args: CommandArguments): Shape {
    const build = this.#builders.get(type);
    if (!build) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return build(args);
  }

  private withStyle(shape: Shape, args: CommandArguments, index: number, attribute: string): Shape {
    if (args.length > index) shape.setAttribute(attribute, args.text(index));
    return shape;
  }
}
