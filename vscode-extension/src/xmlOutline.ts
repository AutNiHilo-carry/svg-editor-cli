export interface OutlineNode {
  readonly tag: string;
  readonly id: string | null;
  readonly start: number;
  readonly end: number;
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly children: OutlineNode[];
}

interface Pending {
  tag: string;
  id: string | null;
  start: number;
  selectionStart: number;
  selectionEnd: number;
  children: OutlineNode[];
}

/**
 * Offset-aware XML reader used by the VSCode outline. It intentionally does not
 * reuse the CLI codec: the CLI parser needs a Canvas, while VSCode needs source
 * offsets for click-to-locate. Malformed input throws; the provider returns an
 * empty outline instead of crashing the extension host.
 */
export function buildOutlineModel(source: string): OutlineNode[] {
  const roots: OutlineNode[] = [];
  const stack: Pending[] = [];
  let index = 0;
  const fail = (message: string): never => {
    throw new Error(`invalid XML: ${message}`);
  };

  while (index < source.length) {
    const lt = source.indexOf('<', index);
    if (lt < 0) break;
    if (source.startsWith('<!--', lt)) {
      const end = source.indexOf('-->', lt + 4);
      if (end < 0) fail('unterminated comment');
      index = end + 3;
      continue;
    }
    if (source.startsWith('<![CDATA[', lt)) {
      const end = source.indexOf(']]>', lt + 9);
      if (end < 0) fail('unterminated CDATA');
      index = end + 3;
      continue;
    }
    if (source.startsWith('<?', lt)) {
      const end = source.indexOf('?>', lt + 2);
      if (end < 0) fail('unterminated processing instruction');
      index = end + 2;
      continue;
    }
    if (source.startsWith('<!', lt)) {
      const end = source.indexOf('>', lt + 2);
      if (end < 0) fail('unterminated declaration');
      index = end + 1;
      continue;
    }
    if (source.startsWith('</', lt)) {
      const end = source.indexOf('>', lt + 2);
      if (end < 0) fail('unterminated closing tag');
      const tag = source.slice(lt + 2, end).trim();
      const current = stack.pop();
      if (!current) fail(`unexpected closing tag </${tag}>`);
      if (current!.tag !== tag) fail(`expected </${current!.tag}> but found </${tag}>`);
      if (stack.length === 0) {
        roots.push({
          tag: current!.tag,
          id: current!.id,
          start: current!.start,
          end: end + 1,
          selectionStart: current!.selectionStart,
          selectionEnd: current!.selectionEnd,
          children: current!.children,
        });
      } else {
        stack[stack.length - 1].children.push({
          tag: current!.tag,
          id: current!.id,
          start: current!.start,
          end: end + 1,
          selectionStart: current!.selectionStart,
          selectionEnd: current!.selectionEnd,
          children: current!.children,
        });
      }
      index = end + 1;
      continue;
    }

    const tagEnd = findTagEnd(source, lt + 1);
    if (tagEnd < 0) fail('unterminated opening tag');
    let body = source.slice(lt + 1, tagEnd).trim();
    if (body === '') fail('empty tag');
    const selfClosing = body.endsWith('/');
    if (selfClosing) body = body.slice(0, -1).trim();
    const nameMatch = /^([A-Za-z_][\w:.-]*)/.exec(body);
    if (!nameMatch) fail('invalid tag name');
    const tag = nameMatch![1];
    const raw = source.slice(lt + 1, tagEnd);
    const nameStart = lt + 1 + (raw.length - raw.trimStart().length);
    const idMatch = /(?:^|\s)id\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(body.slice(nameMatch![0].length));
    const idValue = idMatch ? decodeEntities(idMatch[1] ?? idMatch[2] ?? '').trim() : '';
    const id = idValue === '' ? null : idValue;
    const node: Pending = {
      tag,
      id,
      start: lt,
      selectionStart: nameStart,
      selectionEnd: nameStart + tag.length,
      children: [],
    };
    if (selfClosing) {
      const finished: OutlineNode = {
        tag,
        id,
        start: lt,
        end: tagEnd + 1,
        selectionStart: node.selectionStart,
        selectionEnd: node.selectionEnd,
        children: [],
      };
      if (stack.length === 0) roots.push(finished);
      else stack[stack.length - 1].children.push(finished);
    } else {
      stack.push(node);
    }
    index = tagEnd + 1;
  }

  if (stack.length > 0) fail(`unexpected end of input: unclosed <${stack[stack.length - 1].tag}>`);
  if (roots.length === 0) fail('missing root element');
  return roots;
}

function findTagEnd(source: string, start: number): number {
  let quote: string | null = null;
  for (let index = start; index < source.length; index += 1) {
    const ch = source[index];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '>') {
      return index;
    }
  }
  return -1;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
