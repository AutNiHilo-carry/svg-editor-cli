import { EditorSession } from '../src/application/EditorSession.js';
import { CommandTokenizer } from '../src/cli/CommandTokenizer.js';
import { CommandDispatcher } from '../src/commands/CommandDispatcher.js';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';
import { Group } from '../src/domain/Group.js';
import type { DocumentStore } from '../src/application/DocumentStore.js';

export class EditorHarness {
  public readonly session: EditorSession;
  readonly #dispatcher: CommandDispatcher;
  readonly #tokenizer = new CommandTokenizer();

  public constructor(store?: DocumentStore) {
    this.session = new EditorSession(store);
    this.#dispatcher = new CommandDispatcher(this.session, new ShapeFactory());
  }

  public run(line: string): string | undefined { return this.#dispatcher.dispatch(this.#tokenizer.parse(line)); }
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
