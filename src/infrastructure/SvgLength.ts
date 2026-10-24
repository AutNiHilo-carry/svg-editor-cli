import { FiniteNumber } from '../domain/FiniteNumber.js';

export class SvgLength {
  public static parse(value: string): number {
    const token = value.trim();
    if (/\s/.test(token)) throw new Error('value must be a finite number');
    return FiniteNumber.parse(token.endsWith('px') ? token.slice(0, -2) : token);
  }
}
