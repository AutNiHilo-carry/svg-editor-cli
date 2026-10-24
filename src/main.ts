import { CliApplication } from './cli/CliApplication.js';
import { EditorSession } from './application/EditorSession.js';
import { CommandDispatcher } from './commands/CommandDispatcher.js';
import { ShapeFactory } from './domain/ShapeFactory.js';
import { FileDocumentStore } from './infrastructure/FileDocumentStore.js';

const session = new EditorSession(new FileDocumentStore());
const dispatcher = new CommandDispatcher(session, new ShapeFactory());
new CliApplication(dispatcher).run();
