import type { PluginContext, SvgPlugin } from '../extensions/Plugin.js';
import type { CommandDescriptor } from '../extensions/CommandDescriptor.js';
import { builtinShapeProviders } from './BuiltinShapes.js';
import { AddToCommand } from '../commands/AddToCommand.js';
import { BackCommand } from '../commands/BackCommand.js';
import { CanvasCommand } from '../commands/CanvasCommand.js';
import { CreateCommand } from '../commands/CreateCommand.js';
import { DeleteCommand } from '../commands/DeleteCommand.js';
import { FrontCommand } from '../commands/FrontCommand.js';
import { GroupCommand } from '../commands/GroupCommand.js';
import { HelpCommand } from '../commands/HelpCommand.js';
import { InitCommand } from '../commands/InitCommand.js';
import { MoveCommand } from '../commands/MoveCommand.js';
import { ReadCommand } from '../commands/ReadCommand.js';
import { RedoCommand } from '../commands/RedoCommand.js';
import { SaveCommand } from '../commands/SaveCommand.js';
import { ScaleCommand } from '../commands/ScaleCommand.js';
import { SetCommand } from '../commands/SetCommand.js';
import { ShowCommand } from '../commands/ShowCommand.js';
import { TreeCommand } from '../commands/TreeCommand.js';
import { UndoCommand } from '../commands/UndoCommand.js';
import { UngroupCommand } from '../commands/UngroupCommand.js';

const descriptors: readonly CommandDescriptor[] = [
  { name: 'init', syntax: InitCommand.syntax, build: (args, services) => new InitCommand(services.session, args) },
  { name: 'canvas', syntax: CanvasCommand.syntax, build: (args, services) => new CanvasCommand(services.session, args) },
  { name: 'create', syntax: CreateCommand.syntax, build: (args, services) => new CreateCommand(services.session, services.shapes, args) },
  { name: 'move', syntax: MoveCommand.syntax, build: (args, services) => new MoveCommand(services.session, args) },
  { name: 'scale', syntax: ScaleCommand.syntax, build: (args, services) => new ScaleCommand(services.session, args) },
  { name: 'set', syntax: SetCommand.syntax, build: (args, services) => new SetCommand(services.session, args, services.attributes) },
  { name: 'delete', syntax: DeleteCommand.syntax, build: (args, services) => new DeleteCommand(services.session, args) },
  { name: 'group', syntax: GroupCommand.syntax, build: (args, services) => new GroupCommand(services.session, args) },
  { name: 'ungroup', syntax: UngroupCommand.syntax, build: (args, services) => new UngroupCommand(services.session, args) },
  { name: 'addto', syntax: AddToCommand.syntax, build: (args, services) => new AddToCommand(services.session, args) },
  { name: 'front', syntax: FrontCommand.syntax, build: (args, services) => new FrontCommand(services.session, args) },
  { name: 'back', syntax: BackCommand.syntax, build: (args, services) => new BackCommand(services.session, args) },
  { name: 'undo', syntax: UndoCommand.syntax, build: (args, services) => new UndoCommand(services.session, args) },
  { name: 'redo', syntax: RedoCommand.syntax, build: (args, services) => new RedoCommand(services.session, args) },
  { name: 'read', syntax: ReadCommand.syntax, build: (args, services) => new ReadCommand(services.session, args) },
  { name: 'save', syntax: SaveCommand.syntax, build: (args, services) => new SaveCommand(services.session, args) },
  { name: 'tree', syntax: TreeCommand.syntax, build: (args, services) => new TreeCommand(services.session, args, services.decorators) },
  { name: 'show', syntax: ShowCommand.syntax, build: (args, services) => new ShowCommand(services.session, args) },
  { name: 'help', syntax: HelpCommand.syntax, build: (args, services) => new HelpCommand(args, services.dispatcher.syntaxes(), services.shapes.creationUsages()) },
];

export const builtinCommandDescriptors: readonly CommandDescriptor[] = descriptors;

export const contributes = {
  shapes: ['rect', 'circle', 'ellipse', 'line', 'text', 'g'],
  commands: descriptors.map((descriptor) => descriptor.name),
  decorators: [],
  attributes: [],
} as const;

/** Built-ins are assembled through the same PluginContext as external plugins. */
export const builtinPlugin: SvgPlugin = {
  name: '@svgframe/builtin',
  contributes,
  activate(context: PluginContext): void {
    for (const provider of builtinShapeProviders) context.registerShape(provider);
    for (const descriptor of descriptors) context.registerCommand(descriptor);
  },
};
