import { EditorSession } from '../src/application/EditorSession.js';
import { CommandDispatcher } from '../src/commands/CommandDispatcher.js';
import { builtinCommandDescriptors } from '../src/builtin/BuiltinPlugin.js';
import { builtinShapeProviders } from '../src/builtin/BuiltinShapes.js';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';
import type { CommandServices } from '../src/extensions/CommandDescriptor.js';

/** Synchronous test composition root; production uses activatePlugin(). */
export function createTestSystem(session: EditorSession): { dispatcher: CommandDispatcher; services: CommandServices } {
  const shapes = new ShapeFactory(builtinShapeProviders);
  const dispatcher = new CommandDispatcher();
  for (const descriptor of builtinCommandDescriptors) dispatcher.register(descriptor);
  const services: CommandServices = {
    session,
    shapes,
    decorators: [],
    attributes: [],
    dispatcher,
  };
  return { dispatcher, services };
}
