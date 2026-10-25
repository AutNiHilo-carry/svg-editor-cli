# SVG 编辑器 CLI

Lab1 Phase 1：使用 TypeScript 和 Node.js 实现的 SVG 命令行编辑器，支持六种图形、分组与层级调整、SVG 读写和撤销重做。

## 快速运行

需要 Node.js 22 或更新版本，在项目根目录执行：

```sh
npm ci
npm run cli
```

Windows PowerShell 若限制执行 `npm.ps1`，可将 `npm` 换为 `npm.cmd`。启动后输入 `help` 查看命令，Ctrl+C 或 EOF 退出。

```text
init 400 300
create rect r1 20 30 120 60 #4a90d9
move r1 10 20
undo
tree
save demo.svg
```

## 文档与示例

- [作业文档与完整使用说明](doc/README.md)：架构方案、AI 协作过程、一致性自查和质量保证。
- [最终检查记录](doc/final-review.md)：需求核对和验证结果。
- [视觉验收记录](doc/visual-acceptance.md)：浏览器截图和复现方法。
- [流程图命令脚本](examples/flowchart.commands.txt)与[生成的 SVG](examples/flowchart.svg)。

`src/` 为 TypeScript 源码，`dist/` 为编译输出。运行 `npm run check`、`npm test` 和 `npm run build` 可进行类型检查、测试和构建。

交付版本由 [final 标签](https://github.com/AutNiHilo-carry/svg-editor-cli/tree/final)标记。
