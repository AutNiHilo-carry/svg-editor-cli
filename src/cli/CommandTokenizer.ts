import { CommandToken } from '../commands/CommandToken.js';

export class CommandTokenizer {
  public parse(line: string): readonly CommandToken[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: CommandToken[] = [];
    let index = 0;
    while (index < line.length) {
      if (/\s/.test(line[index]!)) { index++; continue; }
      let value = '';
      const quoted = line[index] === '"';
      if (quoted) {
        index++;
        let closed = false;
        while (index < line.length) {
          const character = line[index++]!;
          if (character === '"') { closed = true; break; }
          if (character === '\\' && (line[index] === '"' || line[index] === '\\')) {
            value += line[index++];
          } else {
            value += character;
          }
        }
        if (!closed) throw new Error('unterminated double quote');
        if (index < line.length && !/\s/.test(line[index]!)) {
          throw new Error('expected whitespace after closing quote');
        }
      } else {
        while (index < line.length && !/\s/.test(line[index]!)) {
          const character = line[index++]!;
          if (character === '"') throw new Error('double quote must start an argument');
          value += character;
        }
      }
      tokens.push(new CommandToken(value, quoted));
    }
    return tokens;
  }
}
