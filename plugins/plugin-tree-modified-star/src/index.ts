import type { Canvas, DocumentEvent, PluginContext, Shape, SvgPlugin, TreeDecorator, TreeRow } from 'svg-editor-cli';

class ModifiedStar implements TreeDecorator {
  readonly name = 'modified-star';
  readonly #saved = new Map<string, string>();
  #savedRoot = '';
  #baseline = false;

  attach(context: PluginContext): void {
    try { this.capture(context.session.requireCanvas()); } catch { /* no document yet */ }
    context.onDocumentChange((event: DocumentEvent) => {
      if (event.kind === 'init' || event.kind === 'read' || event.kind === 'save') this.capture(event.canvas);
    });
  }

  decorate(row: TreeRow): string | null {
    if (!this.#baseline) return null;
    const current = row.isRoot ? rootPrint(row.canvas) : shapePrint(row.shape!);
    const previous = row.isRoot ? this.#savedRoot : this.#saved.get(row.shape!.id);
    return previous === current ? null : '*';
  }

  private capture(canvas: Canvas): void {
    this.#saved.clear();
    for (const shape of canvas.walk()) this.#saved.set(shape.id, shapePrint(shape));
    this.#savedRoot = rootPrint(canvas);
    this.#baseline = true;
  }
}

function shapePrint(shape: Shape): string {
  return JSON.stringify({
    type: shape.type,
    attributes: shape.attributes,
    content: shape.content,
    subtree: shape.walk().map(node => ({ type: node.type, id: node.id, attributes: node.attributes, content: node.content })),
  });
}

function rootPrint(canvas: Canvas): string {
  return JSON.stringify({ width: canvas.width, height: canvas.height, nodes: canvas.walk().map(node => ({ type: node.type, id: node.id, attributes: node.attributes, content: node.content })) });
}

export const contributes = {
  shapes: [], commands: [], decorators: ['modified-star'], attributes: [],
} as const;

export default {
  name: '@svgframe/plugin-tree-modified-star',
  contributes,
  activate(context: PluginContext): void {
    const decorator = new ModifiedStar();
    decorator.attach(context);
    context.registerDecorator(decorator);
  },
} satisfies SvgPlugin;
