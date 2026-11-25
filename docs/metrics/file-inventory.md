# 文件清单（由 `scripts/metrics.mjs` 从 `HEAD` 生成）

| 文件 | 区域 | 代码行 | 复杂度 | 职责 |
|---|---|---:|---:|---|
| `plugins/plugin-command-dir/src/DirCommand.ts` | plugins | 51 | 12 | dir 命令插件与目录适配器 |
| `plugins/plugin-command-dir/src/DirectoryReader.ts` | plugins | 8 | 1 | dir 命令插件与目录适配器 |
| `plugins/plugin-command-dir/src/NodeDirectoryAdapter.ts` | plugins | 16 | 5 | dir 命令插件与目录适配器 |
| `plugins/plugin-command-dir/src/index.ts` | plugins | 4 | 1 | dir 命令插件与目录适配器 |
| `plugins/plugin-command-stats/src/index.ts` | plugins | 44 | 11 | stats 命令插件 |
| `plugins/plugin-shape-box/src/index.ts` | plugins | 97 | 36 | box 形状、属性处理器与 (box) 标签 |
| `plugins/plugin-tree-modified-star/src/index.ts` | plugins | 48 | 18 | modified-star 树标签 |
| `src/application/CommandHistory.ts` | kernel | 39 | 8 | 文档会话、历史与结构查询 |
| `src/application/DocumentInspector.ts` | kernel | 48 | 20 | 文档会话、历史与结构查询 |
| `src/application/DocumentStore.ts` | kernel | 6 | 2 | 文档会话、历史与结构查询 |
| `src/application/EditorSession.ts` | kernel | 80 | 21 | 文档会话、历史与结构查询 |
| `src/application/LoadedDocument.ts` | kernel | 9 | 3 | 文档会话、历史与结构查询 |
| `src/application/SnapshotEdit.ts` | kernel | 33 | 8 | 文档会话、历史与结构查询 |
| `src/application/UndoableAction.ts` | kernel | 5 | 3 | 文档会话、历史与结构查询 |
| `src/builtin/BuiltinPlugin.ts` | assembly | 58 | 23 | 内置插件：六种形状与 Phase 1 命令 |
| `src/builtin/BuiltinShapes.ts` | assembly | 76 | 10 | 内置插件：六种形状与 Phase 1 命令 |
| `src/cli/CliApplication.ts` | assembly | 29 | 9 | REPL 与分词 |
| `src/cli/CommandTokenizer.ts` | assembly | 38 | 16 | REPL 与分词 |
| `src/commands/AddToCommand.ts` | kernel | 15 | 2 | 命令对象与参数校验 |
| `src/commands/BackCommand.ts` | kernel | 15 | 2 | 命令对象与参数校验 |
| `src/commands/CanvasCommand.ts` | kernel | 14 | 3 | 命令对象与参数校验 |
| `src/commands/Command.ts` | kernel | 3 | 1 | 命令对象与参数校验 |
| `src/commands/CommandArguments.ts` | kernel | 24 | 11 | 命令对象与参数校验 |
| `src/commands/CommandDispatcher.ts` | kernel | 18 | 7 | 命令对象与参数校验 |
| `src/commands/CommandShapeInput.ts` | kernel | 14 | 7 | 命令对象与参数校验 |
| `src/commands/CommandToken.ts` | kernel | 10 | 3 | 命令对象与参数校验 |
| `src/commands/CreateCommand.ts` | kernel | 25 | 7 | 命令对象与参数校验 |
| `src/commands/DeleteCommand.ts` | kernel | 14 | 2 | 命令对象与参数校验 |
| `src/commands/EditCommand.ts` | kernel | 11 | 4 | 命令对象与参数校验 |
| `src/commands/FrontCommand.ts` | kernel | 15 | 2 | 命令对象与参数校验 |
| `src/commands/GroupCommand.ts` | kernel | 14 | 3 | 命令对象与参数校验 |
| `src/commands/HelpCommand.ts` | kernel | 22 | 2 | 命令对象与参数校验 |
| `src/commands/InitCommand.ts` | kernel | 15 | 4 | 命令对象与参数校验 |
| `src/commands/MoveCommand.ts` | kernel | 16 | 2 | 命令对象与参数校验 |
| `src/commands/ReadCommand.ts` | kernel | 13 | 2 | 命令对象与参数校验 |
| `src/commands/RedoCommand.ts` | kernel | 11 | 2 | 命令对象与参数校验 |
| `src/commands/SaveCommand.ts` | kernel | 12 | 3 | 命令对象与参数校验 |
| `src/commands/ScaleCommand.ts` | kernel | 15 | 2 | 命令对象与参数校验 |
| `src/commands/SetCommand.ts` | kernel | 30 | 7 | 命令对象与参数校验 |
| `src/commands/ShowCommand.ts` | kernel | 13 | 2 | 命令对象与参数校验 |
| `src/commands/TreeCommand.ts` | kernel | 18 | 3 | 命令对象与参数校验 |
| `src/commands/UndoCommand.ts` | kernel | 11 | 2 | 命令对象与参数校验 |
| `src/commands/UngroupCommand.ts` | kernel | 14 | 2 | 命令对象与参数校验 |
| `src/domain/Canvas.ts` | kernel | 74 | 32 | 领域模型：Canvas |
| `src/domain/CanvasSnapshot.ts` | kernel | 39 | 14 | 领域模型：CanvasSnapshot |
| `src/domain/Circle.ts` | kernel | 10 | 2 | 领域模型：Circle |
| `src/domain/Ellipse.ts` | kernel | 10 | 2 | 领域模型：Ellipse |
| `src/domain/FiniteNumber.ts` | kernel | 10 | 4 | 领域模型：FiniteNumber |
| `src/domain/Group.ts` | kernel | 23 | 10 | 领域模型：Group |
| `src/domain/Line.ts` | kernel | 10 | 2 | 领域模型：Line |
| `src/domain/Rect.ts` | kernel | 10 | 2 | 领域模型：Rect |
| `src/domain/Shape.ts` | kernel | 114 | 60 | 领域模型：Shape |
| `src/domain/ShapeCollection.ts` | kernel | 54 | 26 | 领域模型：ShapeCollection |
| `src/domain/ShapeContainer.ts` | kernel | 9 | 3 | 领域模型：ShapeContainer |
| `src/domain/ShapeFactory.ts` | kernel | 21 | 9 | 领域模型：ShapeFactory |
| `src/domain/ShapeInput.ts` | kernel | 6 | 4 | 领域模型：ShapeInput |
| `src/domain/ShapeState.ts` | kernel | 4 | 3 | 领域模型：ShapeState |
| `src/domain/Text.ts` | kernel | 34 | 10 | 领域模型：Text |
| `src/domain/TreeEditor.ts` | kernel | 66 | 26 | 领域模型：TreeEditor |
| `src/domain/isShapeContainer.ts` | kernel | 6 | 2 | 领域模型：isShapeContainer |
| `src/extensions/AttributeHandler.ts` | kernel | 10 | 2 | 扩展点契约、注册表、事务式激活 |
| `src/extensions/CommandDescriptor.ts` | kernel | 19 | 1 | 扩展点契约、注册表、事务式激活 |
| `src/extensions/Plugin.ts` | kernel | 25 | 7 | 扩展点契约、注册表、事务式激活 |
| `src/extensions/PluginRegistry.ts` | kernel | 33 | 16 | 扩展点契约、注册表、事务式激活 |
| `src/extensions/ShapeProvider.ts` | kernel | 13 | 2 | 扩展点契约、注册表、事务式激活 |
| `src/extensions/TreeDecorator.ts` | kernel | 11 | 1 | 扩展点契约、注册表、事务式激活 |
| `src/extensions/activatePlugin.ts` | kernel | 107 | 46 | 扩展点契约、注册表、事务式激活 |
| `src/host/PluginLoader.ts` | assembly | 112 | 39 | 代码/配置装配与插件加载 |
| `src/host/codeAssembly.ts` | assembly | 28 | 5 | 代码/配置装配与插件加载 |
| `src/index.ts` | kernel | 32 | 1 | 源码 |
| `src/infrastructure/FileDocumentStore.ts` | kernel | 32 | 7 | SVG 编解码与文件存储 |
| `src/infrastructure/SvgCodec.ts` | kernel | 113 | 61 | SVG 编解码与文件存储 |
| `src/infrastructure/SvgLength.ts` | kernel | 8 | 3 | SVG 编解码与文件存储 |
| `src/infrastructure/XmlShapeInput.ts` | kernel | 14 | 8 | SVG 编解码与文件存储 |
| `src/main.ts` | assembly | 50 | 12 | 组合根 |
| `tests/EditorHarness.ts` | kernel | 36 | 6 | 源码 |
| `tests/TestSystem.ts` | kernel | 19 | 2 | 源码 |
| `tests/cli.test.ts` | kernel | 150 | 16 | 源码 |
| `tests/domain.test.ts` | kernel | 139 | 34 | 源码 |
| `tests/history.test.ts` | kernel | 187 | 46 | 源码 |
| `tests/plugin-features.test.ts` | kernel | 153 | 22 | 源码 |
| `tests/plugin-loader.test.ts` | kernel | 113 | 17 | 源码 |
| `tests/plugin-system.test.ts` | kernel | 86 | 13 | 源码 |
| `tests/svg.test.ts` | kernel | 232 | 52 | 源码 |
| `vscode-extension/src/decoration.ts` | vscode | 3 | 1 | VSCode 扩展 |
| `vscode-extension/src/extension.ts` | vscode | 10 | 2 | VSCode 扩展 |
| `vscode-extension/src/providers.ts` | vscode | 41 | 14 | VSCode 扩展 |
| `vscode-extension/src/xmlOutline.ts` | vscode | 147 | 37 | VSCode 扩展 |
