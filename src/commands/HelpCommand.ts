import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class HelpCommand implements Command {
  public static readonly syntax = 'help';

  public constructor(private readonly args: CommandArguments, private readonly syntaxes: readonly string[]) {}

  public execute(): string {
    this.args.expect(0);
    return [
      '当前支持的命令：',
      ...this.syntaxes,
      'create 类型：rect <id> <x> <y> <w> <h> [fill]',
      '             circle <id> <cx> <cy> <r> [fill]',
      '             ellipse <id> <cx> <cy> <rx> <ry> [fill]',
      '             line <id> <x1> <y1> <x2> <y2> [stroke]',
      '             text <id> <x> <y> "content"',
      '             g <id>',
      '以上 create 类型均支持尾缀 in <containerId>。',
      '# 开头的整行为注释；双引号内支持 \\" 和 \\\\ 转义。',
      'Ctrl+C 或输入结束（EOF）退出。',
      '一条编辑命令对应一次 undo；新编辑清空 redo；init/read/save 和 canvas 修改尺寸后建立历史屏障。',
      '内置六种图形；box 与插件系统不属于本阶段。',
    ].join('\n');
  }
}
