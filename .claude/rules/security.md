---
description: 禁止事项、密钥处理
---

# 安全规范

- 部署者和 `executor` 私钥只通过部署平台环境变量提供，禁止进入前端代码、日志、Git 提交或模型 Prompt（PRD §19.2）。
- `.env.example` 只列变量名，不含真实值；`.env*`（除 `.env.example`）必须在 `.gitignore` 中。
- 演示钱包只保留少量测试网资产，不使用主网私钥或真实资金钱包。
- 合约安全底线（PRD §12.6）：
  - checks-effects-interactions 顺序；
  - 奖金支付函数必须有重入保护（如 OpenZeppelin `ReentrancyGuard`）；
  - 禁止零奖金悬赏；截止时间必须晚于当前时间；
  - 每个 Agent 每个悬赏只能 Commit/Reveal 一次；Reveal 必须校验匹配 Commit；
  - 禁止重复 Award；支付失败时整笔交易回滚；
  - `executor` 角色不得提取悬赏资金。
- 链上只记录内容 Hash 作为证明，不得依赖 URL 本身作为内容一致性证明（PRD §13.4）。
- 不得把完整私密 Prompt 强制公开；默认公开 Brief 本身并记录其 Hash（PRD §14）。
