---
description: 命名/缩进/import/注释规范
---

# 代码风格

- 语言：TypeScript（前端 + 编排器 API），Solidity（合约）。
- TS：2 空格缩进，使用 `camelCase` 变量/函数、`PascalCase` 组件与类型、`SCREAMING_SNAKE_CASE` 常量。
- Solidity：4 空格缩进，函数/变量 `camelCase`，事件/结构体 `PascalCase`，私有状态变量加 `_` 前缀，遵循 solidity-style-guide。
- import 顺序：第三方库 → 内部模块（`@/...`）→ 相对路径；同组内按字母排序。
- 所有用户可见文案必须来自集中式语言词典（默认 `zh-CN`），禁止在组件中硬编码中文/英文字符串（PRD §15.1）。
- 链上状态（奖金、Commit、Reveal、获胜者、tokenId）以合约读取为准，不在前端自建本地持久状态源（PRD §15.2）。
- 默认不写注释；仅在解释非显而易见的原因（如 commitHash 计算方式、重入防护取舍）时补充单行注释。
