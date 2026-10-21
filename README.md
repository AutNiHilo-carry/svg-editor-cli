# SVG 编辑器 CLI

Lab1 Phase 1，使用 TypeScript 面向对象实现。

## 开发

需要 Node.js 22 或更新版本。

```sh
npm install
npm run check
npm run build
npm test
npm run cli
```

Windows PowerShell 若限制执行 npm.ps1，可使用 `npm.cmd` 代替 `npm`。

## 断点调试

用 VS Code 打开项目目录，先安装依赖，在 `src/main.ts` 或 `src/cli/CliApplication.ts` 设置断点，然后按 F5，选择“调试 SVG CLI”。配置使用 Node.js 的 `--import tsx` 直接运行 TypeScript，并使用集成终端以便后续 REPL 读取输入。

当前入口输出骨架状态后退出。图形方法可通过领域测试验证：`npm test`。

目前完成项目初始化和领域模型：六种图形、嵌套容器、画布与 ID 约束，以及移动、缩放、属性设置。启动入口仍仅输出骨架状态，尚未实现命令交互。
架构方案和开发记录见 [doc/README.md](doc/README.md)。
