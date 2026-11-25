# 行数统计（由 `scripts/metrics.mjs` 生成）

对比 `final`（Phase 1）与 `HEAD`（Phase 2），排除测试、声明、依赖和构建产物。

| 区域 | final 文件 | final 代码行 | HEAD 文件 | HEAD 代码行 | 增量 |
|---|---:|---:|---:|---:|---:|
| kernel | 57 | 1967 | 70 | 2634 | 667 |
| assembly | 3 | 71 | 7 | 391 | 320 |
| plugins | 0 | 0 | 7 | 268 | 268 |
| vscode | 0 | 0 | 4 | 201 | 201 |
| **CLI 合计** | 60 | 2038 | 84 | 3293 | 1255 |

VSCode 扩展单列，不计入 CLI 重构增量。
