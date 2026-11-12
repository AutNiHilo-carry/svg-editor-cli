import { EditorSession } from '../src/application/EditorSession.js';
import { CommandTokenizer } from '../src/cli/CommandTokenizer.js';
import type { CommandDispatcher } from '../src/commands/CommandDispatcher.js';
import type { CommandServices } from '../src/extensions/CommandDescriptor.js';
import { Group } from '../src/domain/Group.js';
import type { DocumentStore } from '../src/application/DocumentStore.js';
import { createTestSystem } from './TestSystem.js';

export class EditorHarness {
  public readonly session: EditorSession;
  readonly #dispatcher: CommandDispatcher;
  readonly #services: CommandServices;
  readonly #tokenizer = new CommandTokenizer();

  public constructor(store?: DocumentStore) {
    this.session = new EditorSession(store);
    const system = createTestSystem(this.session);
    this.#dispatcher = system.dispatcher;
    this.#services = system.services;
  }

  public run(line: string): string | undefined {
    return this.#dispatcher.dispatch(this.#tokenizer.parse(line), this.#services);
  }
  public get canvas() { return this.session.requireCanvas(); }

  public view() {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
      nodes: this.canvas.walk().map(shape => ({
        id: shape.id,
        type: shape.type,
        attributes: shape.attributes,
        parent: shape.parent instanceof Group ? shape.parent.id : 'svg',
        index: shape.parent?.children.indexOf(shape),
      })),
    };
  }
}
