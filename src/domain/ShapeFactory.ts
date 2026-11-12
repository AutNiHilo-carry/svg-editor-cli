import type { Shape } from './Shape.js';
import type { ShapeInput } from './ShapeInput.js';
import type { ShapeProvider } from '../extensions/ShapeProvider.js';

/** Shape registry. The kernel has no built-in type switch. */
export class ShapeFactory {
  readonly #providers = new Map<string, ShapeProvider>();

  public constructor(providers: readonly ShapeProvider[] = []) {
    for (const provider of providers) this.register(provider);
  }

  public register(provider: ShapeProvider): void {
    if (this.#providers.has(provider.type)) throw new Error(`duplicate registration: shapes/${provider.type}`);
    this.#providers.set(provider.type, provider);
  }

  public has(type: string): boolean { return this.#providers.has(type); }
  public provider(type: string): ShapeProvider | undefined { return this.#providers.get(type); }
  public get types(): readonly string[] { return [...this.#providers.keys()]; }

  public create(type: string, id: string, input: ShapeInput, mode: 'create' | 'restore' = 'create'): Shape {
    const provider = this.#providers.get(type);
    if (!provider) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return provider.create({ id, input, mode });
  }
}
