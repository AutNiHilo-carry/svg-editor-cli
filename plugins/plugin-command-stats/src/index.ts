import type { Command, CommandArguments, CommandDescriptor, EditorSession, PluginContext, Shape, SvgPlugin } from 'svg-editor-cli';
import { isShapeContainer } from 'svg-editor-cli';

class StatsCommand implements Command {
  public constructor(private readonly session: EditorSession) {}

  public execute(): string {
    const canvas = this.session.requireCanvas();
    const counts = new Map<string, number>();
    let total = 0;
    let containers = 0;
    const visit = (shape: Shape): void => {
      if (isShapeContainer(shape)) {
        containers += 1;
        for (const child of shape.children) visit(child);
      } else {
        total += 1;
        counts.set(shape.type, (counts.get(shape.type) ?? 0) + 1);
      }
    };
    for (const child of canvas.children) visit(child);
    const prefix = [...counts.entries()].map(([type, count]) => `${type}: ${count}`).join('  ');
    const summary = `(total ${total}, containers ${containers})`;
    return prefix ? `${prefix}  ${summary}` : summary;
  }
}

const descriptor: CommandDescriptor = {
  name: 'stats',
  syntax: 'stats',
  build: (args: CommandArguments, services) => {
    args.expect(0);
    return new StatsCommand(services.session);
  },
};

export const contributes = {
  shapes: [],
  commands: ['stats'],
  decorators: [],
  attributes: [],
} as const;

const plugin: SvgPlugin = {
  name: '@svgframe/plugin-command-stats',
  contributes,
  activate(context: PluginContext): void { context.registerCommand(descriptor); },
};

export default plugin;
