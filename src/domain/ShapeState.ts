export class ShapeState {
  public constructor(private readonly restoreState: () => void) {}

  public restore(): void { this.restoreState(); }
}
