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

当前入口启动交互循环，在集成终端中输入命令，Ctrl+C 或 EOF 退出。运行 `npm test` 可验证领域模型、命令及脚本回放。

## 当前命令

已支持 `init`、`canvas`、`create`、`move`、`scale`、`set`、`delete` 和 `help`。输入 `help` 查看参数和六种图形的创建语法。

```text
init 400 300
create g node
create rect r 10 20 120 60 #4a90d9 in node
create text label 25 55 "开始" in node
move node 20 10
scale node 1.5
set label text "处理数据"
canvas
```

以 `#` 开头的整行是注释，颜色参数中的 `#` 会保留。文本内容用双引号包裹，双引号内可转义引号和反斜杠。交互终端显示 `svg>` 提示符；管道输入不显示提示符，便于回放脚本，例如 PowerShell：

```powershell
Get-Content -Encoding utf8 commands.txt | npm.cmd run cli
```

六种图形、嵌套容器、ID 约束以及基础编辑已实现。分组操作、撤销重做、SVG 读写和 tree/show 尚未实现。
架构方案和开发记录见 [doc/README.md](doc/README.md)。
