import { Canvas } from '../domain/Canvas.js';

export class EditorSession {
  #canvas: Canvas | undefined;

  public initialize(width = 800, height = 600): Canvas {
    const canvas = new Canvas(width, height);
    this.#canvas = canvas;
    return canvas;
  }

  public requireCanvas(): Canvas {
    if (!this.#canvas) throw new Error("no document. use 'init' or 'read' first");
    return this.#canvas;
  }
}
