import type { CommandDescriptor } from './CommandDescriptor.js';
import type { ShapeProvider } from './ShapeProvider.js';
import type { TreeDecorator } from './TreeDecorator.js';
import type { AttributeHandler } from './AttributeHandler.js';

export type ExtensionCategory = 'shapes' | 'commands' | 'decorators' | 'attributes';
export const CATEGORIES: readonly ExtensionCategory[] = ['shapes', 'commands', 'decorators', 'attributes'];

export class PluginRegistry {
  readonly #shapes = new Map<string, ShapeProvider>();
  readonly #commands = new Map<string, CommandDescriptor>();
  readonly #decorators = new Map<string, TreeDecorator>();
  readonly #attributes = new Map<string, AttributeHandler>();

  registerShape(provider: ShapeProvider): void { this.add('shapes', provider.type, provider, this.#shapes); }
  registerCommand(descriptor: CommandDescriptor): void { this.add('commands', descriptor.name, descriptor, this.#commands); }
  registerDecorator(decorator: TreeDecorator): void { this.add('decorators', decorator.name, decorator, this.#decorators); }
  registerAttribute(handler: AttributeHandler): void { this.add('attributes', handler.name, handler, this.#attributes); }

  get shapes(): readonly ShapeProvider[] { return [...this.#shapes.values()]; }
  get commands(): readonly CommandDescriptor[] { return [...this.#commands.values()]; }
  get decorators(): readonly TreeDecorator[] { return [...this.#decorators.values()]; }
  get attributes(): readonly AttributeHandler[] { return [...this.#attributes.values()]; }

  names(category: ExtensionCategory): string[] {
    switch (category) {
      case 'shapes': return [...this.#shapes.keys()];
      case 'commands': return [...this.#commands.keys()];
      case 'decorators': return [...this.#decorators.keys()];
      case 'attributes': return [...this.#attributes.keys()];
    }
  }

  private add<T>(category: ExtensionCategory, name: string, value: T, map: Map<string, T>): void {
    if (!name) throw new Error(`invalid ${category} name`);
    if (map.has(name)) throw new Error(`duplicate registration: ${category}/${name}`);
    map.set(name, value);
  }
}
