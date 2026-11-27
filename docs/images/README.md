# VSCode 运行截图

本目录包含两张真实运行截图：

1. `vscode-svg-badge.png`：Explorer 中 `example.svg` 右侧显示 `[]`，`notes.txt` 和 `docs/` 没有标记。
2. `vscode-svg-outline.png`：`example.svg` 以 Text Editor 打开，原生 Outline 显示 `svg / g#flow / rect#start / line#edge / rect#end / text`，选中 `rect#start` 时编辑器定位到第 4 行附近。

运行方式：

```powershell
cd vscode-extension
npm.cmd install
npm.cmd run build
code --extensionDevelopmentPath="$PWD" "$PWD/demo-workspace"
```

截图来自扩展开发宿主窗口，未使用课程附件中的参考图。

