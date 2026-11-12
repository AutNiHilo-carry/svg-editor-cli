import type { CommandDescriptor } from './CommandDescriptor.js';
import type { ShapeProvider } from './ShapeProvider.js';
import type { TreeDecorator } from './TreeDecorator.js';
import type { AttributeHandler } from './AttributeHandler.js';
import type { EditorSession, DocumentListener } from '../application/EditorSession.js';

export interface PluginContribution {
  readonly shapes?: readonly string[];
  readonly commands?: readonly string[];
  readonly decorators?: readonly string[];
  readonly attributes?: readonly string[];
}

export interface PluginContext {
  readonly options: Readonly<Record<string, unknown>>;
  readonly session: EditorSession;
  registerShape(provider: ShapeProvider): void;
  registerCommand(descriptor: CommandDescriptor): void;
  registerDecorator(decorator: TreeDecorator): void;
  registerAttribute(handler: AttributeHandler): void;
  onDocumentChange(listener: DocumentListener): () => void;
}

export interface SvgPlugin {
  readonly name: string;
  readonly contributes: PluginContribution;
  activate(context: PluginContext): void | Promise<void>;
}
