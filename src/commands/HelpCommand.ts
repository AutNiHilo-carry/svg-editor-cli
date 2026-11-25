import type { Command } from './Command.js';
import type { CommandArguments } from './CommandArguments.js';

export class HelpCommand implements Command {
  public static readonly syntax = 'help';

  public constructor(
    private readonly args: CommandArguments,
    private readonly syntaxes: readonly string[],
    private readonly shapeUsages: readonly string[] = [],
  ) {}

  public execute(): string {
    this.args.expect(0);
    return [
      '当前支持的命令：',
      ...this.syntaxes,
      'create 类型：',
      ...this.shapeUsages.map(usage => `  ${usage}`),
      '以上 create 类型均支持尾缀 in <containerId>。',
      '# 开头的整行为注释；双引号内支持 \\" 和 \\\\ 转义。',
      'Ctrl+C 或输入结束（EOF）退出。',
      '一条编辑命令对应一次 undo；新编辑清空 redo；init/read/save 和 canvas 修改尺寸后建立历史屏障。',
    ].join('\n');
  }
}
