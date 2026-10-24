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

已支持需求中的全部命令：`init / read / save / canvas / create / delete / move / scale / set / group / ungroup / addto / front / back / tree / show / help / undo / redo`。输入 `help` 查看参数和六种图形的创建语法。

```text
init 400 300
create g node
create rect r 10 20 120 60 #4a90d9 in node
create text label 25 55 "开始" in node
move node 20 10
scale node 1.5
set label text "处理数据"
undo
redo
canvas
```

以 `#` 开头的整行是注释，颜色参数中的 `#` 会保留。文本内容用双引号包裹，双引号内可转义引号和反斜杠。交互终端显示 `svg>` 提示符；管道输入不显示提示符，便于回放脚本，例如 PowerShell：

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Get-Content -Encoding utf8 examples/flowchart.commands.txt | npm.cmd run cli
```

每条成功编辑命令对应一个撤销单元，包括整次分组或子树删除。undo 后成功执行新编辑会清空 redo；失败操作、tree/show/help 和画布查询保留历史。成功 init/read/save 或修改画布尺寸会清空历史并阻止 undo/redo，直到下一条成功编辑。

`group` 按原文档遍历顺序收编节点，不按参数顺序；跨父节点时放入最近公共父容器。根级容器禁止 ungroup，嵌套容器解组后子节点占据原容器位置。`front` 移到同级末尾（SVG 后绘制），`back` 移到同级开头。

## SVG 读写与示例

`read examples/other.svg` 可读取作业提供的外部示例，并为缺失 ID 的矩形补上 rect1。`save demo.svg` 保存；后续无参数 `save` 使用最近一次成功 read/save 的路径，init 会清除该路径。读写失败保留当前文档与历史。

完整流程图回放脚本为 [examples/flowchart.commands.txt](examples/flowchart.commands.txt)，输出 [examples/flowchart.svg](examples/flowchart.svg)，可直接用浏览器打开。该图实际有 8 个元素，不含 svg 根。

导入支持六种内置图形、嵌套 g、XML 转义和缺 ID 补全。保留 viewBox、transform、字体和其他属性；move/scale 修改元素本地坐标，不把导入的 transform 展平成全局坐标。修改画布尺寸会重置 viewBox 为新画布范围。几何属性支持无单位数值或 px，百分比与其他单位、path/defs/tspan 等标签、DOCTYPE 明确拒绝。注释、原始缩进和 XML 属性顺序不保证保留；set 仍只允许需求白名单。

架构方案和开发记录见 [doc/README.md](doc/README.md)。
