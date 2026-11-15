# VSCode 运行截图

这里需要两张真实运行截图：

1. `vscode-svg-badge.png`：Explorer 中 `example.svg` 右侧显示 `[]`，`notes.txt` 和 `docs/` 没有标记。
2. `vscode-svg-outline.png`：打开 `example.svg` 后，原生 Outline 显示 `svg / g#flow / rect#start / line#edge / rect#end / text`，选中 `rect#start` 时编辑器定位到对应源码行。

运行方式：

```powershell
cd vscode-extension
npm.cmd install
npm.cmd run build
code --extensionDevelopmentPath="$PWD" "$PWD/demo-workspace"
```

当前开发沙箱禁止 Electron 创建 named pipe，VSCode 启动时报
`mojo platform_channel.cc: Check failed: 拒绝访问 (0x5)`，因此仓库没有伪造截图；
请在普通桌面环境按上述步骤运行后，把两张 PNG 放到本目录。
