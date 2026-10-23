import { EditorSession } from '../src/application/EditorSession.js';
import { CommandTokenizer } from '../src/cli/CommandTokenizer.js';
import { CommandDispatcher } from '../src/commands/CommandDispatcher.js';
import { ShapeFactory } from '../src/commands/ShapeFactory.js';
import { Group } from '../src/domain/Group.js';

export class EditorHarness {
  public readonly session = new EditorSession();
  readonly #dispatcher = new CommandDispatcher(this.session, new ShapeFactory());
  readonly #tokenizer = new CommandTokenizer();

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
