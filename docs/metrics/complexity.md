# 圈复杂度近似值（由 `scripts/metrics.mjs` 生成）

每个函数计 1，每个 `if`/循环/`case`/`catch`/条件表达式/短路运算再计 1，用于趋势比较。

| 区域 | final | HEAD | 增量 |
|---|---:|---:|---:|
| kernel | 580 | 725 | 145 |
| assembly | 26 | 114 | 88 |
| plugins | 0 | 79 | 79 |
| vscode | 0 | 51 | 51 |
| **CLI 合计** | 606 | 918 | 312 |
