import type { Element } from '@xmldom/xmldom';
import { FiniteNumber } from '../domain/FiniteNumber.js';
import type { ShapeInput } from '../domain/ShapeInput.js';

export class XmlShapeInput implements ShapeInput {
  public constructor(private readonly element: Element) {}
  public expect(_min: number, _max?: number): void {}
  public number(name: string, _index: number): number {
    return FiniteNumber.parse((this.element.getAttribute(name) ?? '0').replace(/px$/, ''));
  }
  public text(_name: string, _index: number): string { return this.element.textContent ?? ''; }
  public optional(name: string, _index: number): string | undefined {
    return this.element.hasAttribute(name) ? this.element.getAttribute(name)! : undefined;
  }
}
