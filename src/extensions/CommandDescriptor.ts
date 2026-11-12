import type { Command } from '../commands/Command.js';
import type { CommandArguments } from '../commands/CommandArguments.js';
import type { CommandDispatcher } from '../commands/CommandDispatcher.js';
import type { EditorSession } from '../application/EditorSession.js';
import type { ShapeFactory } from '../domain/ShapeFactory.js';
import type { TreeDecorator } from './TreeDecorator.js';
import type { AttributeHandler } from './AttributeHandler.js';

export interface CommandServices {
  readonly session: EditorSession;
  readonly shapes: ShapeFactory;
  readonly decorators: readonly TreeDecorator[];
  readonly attributes: readonly AttributeHandler[];
  readonly dispatcher: CommandDispatcher;
}

/** Extension point 2: a command factory registered under a CLI name. */
export interface CommandDescriptor {
  readonly name: string;
  readonly syntax: string;
  readonly build: (args: CommandArguments, services: CommandServices) => Command;
}
