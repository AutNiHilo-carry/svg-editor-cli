import { CliApplication } from './cli/CliApplication.js';
import { EditorSession } from './application/EditorSession.js';
import { CommandDispatcher } from './commands/CommandDispatcher.js';
import { ShapeFactory } from './commands/ShapeFactory.js';

const session = new EditorSession();
const dispatcher = new CommandDispatcher(session, new ShapeFactory());
new CliApplication(dispatcher).run();
