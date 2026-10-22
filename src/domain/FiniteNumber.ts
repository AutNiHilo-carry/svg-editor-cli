export class FiniteNumber {
  public static parse(value: string | number): number {
    if (typeof value === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())) {
      throw new Error('value must be a finite number');
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) throw new Error('value must be a finite number');
    return numeric;
  }
}
