export interface ShapeInput {
  expect(min: number, max?: number): void;
  number(name: string, index: number): number;
  text(name: string, index: number): string;
  optional(name: string, index: number): string | undefined;
}
