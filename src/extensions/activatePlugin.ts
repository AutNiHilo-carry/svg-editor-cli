import type { CommandDescriptor } from './CommandDescriptor.js';
import type { PluginContribution, PluginContext, SvgPlugin } from './Plugin.js';
import type { ShapeProvider } from './ShapeProvider.js';
import type { TreeDecorator } from './TreeDecorator.js';
import type { AttributeHandler } from './AttributeHandler.js';
import { CATEGORIES, PluginRegistry, type ExtensionCategory } from './PluginRegistry.js';
import type { DocumentListener, EditorSession } from '../application/EditorSession.js';

export interface ActivationOptions {
  readonly options?: Readonly<Record<string, unknown>>;
  readonly manifest?: PluginContribution | undefined;
}

/**
 * One registration path for code and config assembly. Contributions are staged;
 * manifest and duplicate checks happen before the plugin is committed, so a
 * failed activation leaves no partial registrations behind.
 */
export async function activatePlugin(
  registry: PluginRegistry,
  plugin: SvgPlugin,
  session: EditorSession,
  options: ActivationOptions = {},
): Promise<void> {
  const name = plugin.name || 'anonymous plugin';
  const declared = normalize(options.manifest ?? plugin.contributes ?? {});
  const staged = new StagedContext(session, options.options ?? {});
  try {
    await plugin.activate(staged);
    const actual = staged.contribution();
    if (!same(declared, actual)) {
      throw new Error(
        `plugin manifest mismatch: ${name} (declared: ${describe(declared)}; registered: ${describe(actual)})`,
      );
    }
    for (const category of CATEGORIES) {
      for (const value of actual[category] ?? []) {
        if (registry.names(category).includes(value)) {
          throw new Error(`duplicate registration: ${category}/${value}`);
        }
      }
    }
    staged.commit(registry);
  } catch (error) {
    staged.dispose();
    if (error instanceof Error && /^(plugin manifest mismatch|duplicate registration):/.test(error.message)) throw error;
    throw new Error(`plugin failed to activate: ${name} (${reason(error)})`);
  }
}

class StagedContext implements PluginContext {
  readonly #shapes = new Map<string, ShapeProvider>();
  readonly #commands = new Map<string, CommandDescriptor>();
  readonly #decorators = new Map<string, TreeDecorator>();
  readonly #attributes = new Map<string, AttributeHandler>();
  readonly #unsubscribers: Array<() => void> = [];

  public constructor(
    readonly session: EditorSession,
    readonly options: Readonly<Record<string, unknown>>,
  ) {}

  public registerShape(provider: ShapeProvider): void { this.add('shapes', provider.type, provider, this.#shapes); }
  public registerCommand(descriptor: CommandDescriptor): void { this.add('commands', descriptor.name, descriptor, this.#commands); }
  public registerDecorator(decorator: TreeDecorator): void { this.add('decorators', decorator.name, decorator, this.#decorators); }
  public registerAttribute(handler: AttributeHandler): void { this.add('attributes', handler.name, handler, this.#attributes); }

  public onDocumentChange(listener: DocumentListener): () => void {
    const unsubscribe = this.session.onDocumentChange(listener);
    this.#unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  public contribution(): PluginContribution {
    return {
      shapes: [...this.#shapes.keys()],
      commands: [...this.#commands.keys()],
      decorators: [...this.#decorators.keys()],
      attributes: [...this.#attributes.keys()],
    };
  }

  public commit(registry: PluginRegistry): void {
    for (const provider of this.#shapes.values()) registry.registerShape(provider);
    for (const command of this.#commands.values()) registry.registerCommand(command);
    for (const decorator of this.#decorators.values()) registry.registerDecorator(decorator);
    for (const handler of this.#attributes.values()) registry.registerAttribute(handler);
  }

  public dispose(): void {
    for (const unsubscribe of this.#unsubscribers) unsubscribe();
    this.#unsubscribers.length = 0;
  }

  private add<T>(category: ExtensionCategory, name: string, value: T, map: Map<string, T>): void {
    if (!name) throw new Error(`invalid ${category} name`);
    if (map.has(name)) throw new Error(`duplicate registration: ${category}/${name}`);
    map.set(name, value);
  }
}

function normalize(contribution: PluginContribution): Required<PluginContribution> {
  return {
    shapes: [...(contribution.shapes ?? [])].sort(),
    commands: [...(contribution.commands ?? [])].sort(),
    decorators: [...(contribution.decorators ?? [])].sort(),
    attributes: [...(contribution.attributes ?? [])].sort(),
  };
}

function same(declared: Required<PluginContribution>, actual: PluginContribution): boolean {
  const normalizedActual = normalize(actual);
  return CATEGORIES.every((category) => {
    const left = declared[category];
    const right = normalizedActual[category];
    return left.length === right.length && left.every((value, index) => value === right[index]);
  });
}

function describe(contribution: PluginContribution): string {
  return CATEGORIES.map((category) => `${category}=[${[...(contribution[category] ?? [])].sort().join(',')}]`).join(' ');
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
