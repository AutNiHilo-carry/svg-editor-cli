import { DOMParser, XMLSerializer, DOMImplementation } from '@xmldom/xmldom';
import type { Element, Document } from '@xmldom/xmldom';
import { LoadedDocument } from '../application/LoadedDocument.js';
import { Canvas } from '../domain/Canvas.js';
import { FiniteNumber } from '../domain/FiniteNumber.js';
import { Group } from '../domain/Group.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import type { Shape } from '../domain/Shape.js';
import { XmlShapeInput } from './XmlShapeInput.js';

export class SvgCodec {
  static readonly #namespace = 'http://www.w3.org/2000/svg';
  public constructor(private readonly factory = new ShapeFactory()) {}

  public decode(xml: string): LoadedDocument {
    try {
      const document = new DOMParser({ onError: (_level, message) => { throw new Error(message); } })
        .parseFromString(xml, 'image/svg+xml');
      if (document.doctype) throw new Error('DOCTYPE is not supported');
      const root = document.documentElement;
      if (!root || root.localName !== 'svg') throw new Error('root element must be svg');
      this.checkNamespace(root);
      const viewBox = root.getAttribute('viewBox');
      const view = viewBox?.trim().split(/[\s,]+/).map(value => FiniteNumber.parse(value));
      if (view && (view.length !== 4 || view[2]! <= 0 || view[3]! <= 0)) throw new Error('invalid viewBox');
      const width = root.hasAttribute('width') ? FiniteNumber.parse(root.getAttribute('width')!.replace(/px$/, '')) : (view?.[2] ?? 800);
      const height = root.hasAttribute('height') ? FiniteNumber.parse(root.getAttribute('height')!.replace(/px$/, '')) : (view?.[3] ?? 600);
      const canvas = new Canvas(width, height);
      for (let index = 0; index < root.attributes.length; index++) {
        const attribute = root.attributes.item(index)!;
        if (attribute.name !== 'width' && attribute.name !== 'height') canvas.importAttribute(attribute.name, attribute.value);
      }
      const reserved = new Set<string>();
      const elements = Array.from(root.getElementsByTagName('*'));
      if (root.hasAttribute('id')) reserved.add(root.getAttribute('id')!);
      for (const element of elements) {
        const id = element.getAttribute('id');
        if (id === null || id === '') continue;
        if (reserved.has(id)) throw new Error(`id already exists: ${id}`);
        reserved.add(id);
      }
      const warnings: string[] = [];
      for (const element of this.childElements(root)) canvas.insert(this.decodeShape(element, reserved, warnings));
      return new LoadedDocument(canvas, warnings);
    } catch (error) {
      throw new Error(`invalid SVG: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public encode(canvas: Canvas): string {
    const document = new DOMImplementation().createDocument(SvgCodec.#namespace, 'svg', null);
    const root = document.documentElement!;
    for (const [key, value] of Object.entries(canvas.svgAttributes)) root.setAttribute(key, String(value));
    if (!root.hasAttribute('viewBox')) root.setAttribute('viewBox', `0 0 ${canvas.width} ${canvas.height}`);
    for (const shape of canvas.children) root.appendChild(this.encodeShape(document, shape));
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(document)}\n`;
  }

  private decodeShape(element: Element, reserved: Set<string>, warnings: string[]): Shape {
    this.checkNamespace(element);
    const type = element.localName ?? element.tagName;
    let id = element.getAttribute('id');
    if (!id) {
      let sequence = 1;
      while (reserved.has(`${type}${sequence}`)) sequence++;
      id = `${type}${sequence}`;
      reserved.add(id);
      warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
    }
    const shape = this.factory.create(type, id, new XmlShapeInput(element));
    const children = this.childElements(element, shape.content !== undefined);
    if (children.length > 0 && !(shape instanceof Group)) throw new Error(`nested elements are not supported in <${type}>`);
    for (let index = 0; index < element.attributes.length; index++) {
      const attribute = element.attributes.item(index)!;
      if (attribute.name === 'id') continue;
      // 几何数值已由工厂解析；其余属性原样保留，set 白名单不扩大。
      if (typeof shape.svgAttributes[attribute.name] === 'number' && attribute.name !== 'stroke-width') continue;
      shape.importAttribute(attribute.name, attribute.value);
    }
    if (shape instanceof Group) {
      for (const child of children) shape.insert(this.decodeShape(child, reserved, warnings));
    }
    return shape;
  }

  private childElements(element: Element, allowText = false): Element[] {
    const result: Element[] = [];
    for (let index = 0; index < element.childNodes.length; index++) {
      const node = element.childNodes.item(index)!;
      if (node.nodeType === 1) result.push(node as Element);
      else if ((node.nodeType === 3 || node.nodeType === 4) && node.nodeValue?.trim() && !allowText) {
        throw new Error(`unexpected text in <${element.localName}>`);
      }
    }
    return result;
  }

  private checkNamespace(element: Element): void {
    if (element.namespaceURI && element.namespaceURI !== SvgCodec.#namespace) throw new Error('unsupported XML namespace');
  }

  private encodeShape(document: Document, shape: Shape): Element {
    const element = document.createElementNS(SvgCodec.#namespace, shape.type);
    element.setAttribute('id', shape.id);
    for (const [key, value] of Object.entries(shape.svgAttributes)) element.setAttribute(key, String(value));
    if (shape.content !== undefined) element.appendChild(document.createTextNode(shape.content));
    for (const child of shape.children) element.appendChild(this.encodeShape(document, child));
    return element;
  }
}
