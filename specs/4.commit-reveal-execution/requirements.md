# commit-reveal-execution — 需求规格

## 概述

实现 Pinata 存储上传、executor 对三个 Agent 的 Commit/Reveal 链上提交，以及前端创作竞技场的状态展示，覆盖 PRD 用户流程 §9.2 后半段与 §10.3。

## 项目信息

- 项目名: bounty-mint
- 架构类型: Web3 dApp（单仓库：前端 + API 编排器 + Solidity 合约，无数据库）

## 需求版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始需求 |

## 用户故事

- 作为悬赏发布者，我希望作品先提交 Hash 再统一揭晓，以便公平比较，不被抢先复制。
- 作为悬赏发布者，我希望在创作过程中看到每个 Agent 的实时状态，以便了解进度。

## 功能需求

1. [F-001] 图片与 metadata JSON 上传至 Pinata，返回 `ipfs://` URI，用于回填并重算 `commitHash`（衔接 `3.agent-orchestration-generation` 的占位 URI）。
2. [F-002] executor 并行为三个 Agent 调用合约 `commitWork`，全部完成前不暴露任何作品内容。
3. [F-003] 全部 Commit 完成后，executor 依次调用 `revealWork`，校验 salt/metadata 与原 Commit 一致。
4. [F-004] 前端创作竞技场展示三张 Agent 卡片，状态包含 `Ideating / Generating / Committed / Revealed`；Commit 完成后作品保持模糊并显示锁定图标，Reveal 时三张作品同时翻转。
5. [F-005] 前端通过轮询 `GET /api/jobs/:jobId` 驱动状态更新，无需手动刷新页面。

## 非功能需求

- 性能: Commit 部分失败时只重试失败的 Agent，不重新提交已成功的 Commit（PRD §17）。
- 安全: executor 私钥仅在服务端环境变量中使用，不出现在前端或日志。
- 兼容性: Reveal 前端展示必须保证三张作品同时翻转，不因链上确认时间差异而分别揭晓。

## 验收标准

- [ ] [AC-001] 图片和 metadata 均成功上传至 Pinata 并返回可访问的 `ipfs://` URI。
- [ ] [AC-002] 合约存在三个 Agent 的 Commit 事件，且揭晓前前端不展示任何作品内容或风格提示。
- [ ] [AC-003] 三个作品均能成功 Reveal；错误 salt 的模拟场景下 Reveal 失败且该作品被标记不可选。
- [ ] [AC-004] 前端 Agent 卡片状态与链上/后端实际状态一致，不出现状态倒退或卡死。
- [ ] [AC-005] Reveal 完成时三张作品在前端同时翻转展示，不逐个出现。
- [ ] [AC-006] 单个 Agent Commit 失败时，仅重试该 Agent，不影响已成功的其他两个。

## 依赖

- `1.smart-contract-core`（`commitWork`/`revealWork` 接口）
- `3.agent-orchestration-generation`（图片、Hash、salt 来源）
- Pinata（IPFS pinning，已确认）

## 开放问题

- 无（存储方案已确认为 Pinata）
