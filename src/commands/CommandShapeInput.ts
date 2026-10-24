import type { ShapeInput } from '../domain/ShapeInput.js';
import type { CommandArguments } from './CommandArguments.js';

export class CommandShapeInput implements ShapeInput {
  public constructor(private readonly args: CommandArguments) {}
  public expect(min: number, max = min): void { this.args.expect(min, max); }
  public number(_name: string, index: number): number { return this.args.number(index); }
  public optional(_name: string, index: number): string | undefined {
    return index < this.args.length ? this.args.text(index) : undefined;
  }
  public text(_name: string, index: number): string {
    if (!this.args.quoted(index)) throw new Error('text content must be double quoted');
    return this.args.text(index);
  }
}
