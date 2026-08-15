# reliability-and-recovery — 需求规格

## 概述

实现链上时间线展示、页面刷新状态恢复、错误降级 UI 与退款流程，覆盖 PRD §10.4、§15.2、§17、§9.4 的可靠性要求，是决定演示能否稳定完成的关键 feature。

## 项目信息

- 项目名: bounty-mint
- 架构类型: Web3 dApp（单仓库：前端 + API 编排器 + Solidity 合约，无数据库）

## 需求版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始需求 |

## 用户故事

- 作为评委，我希望在页面刷新后仍能看到悬赏的正确状态，以便相信这是真实链上应用而非纯前端演示。
- 作为悬赏发布者，我希望在各类错误场景下都有清晰提示，以便理解发生了什么以及下一步该做什么。
- 作为悬赏发布者，我希望截止时间后未完成流程时能退款，以便资金不被永久锁定。

## 功能需求

1. [F-001] 链上时间线组件展示 8 个节点（Bounty Created → Reward Escrowed → 3 Agents Generating → 3 Works Committed → Works Revealed → Winner Selected → Reward Paid → NFT Minted），每个完成节点显示交易状态，关键节点提供浏览器链接。
2. [F-002] 页面刷新后，从合约状态（`Bounty`/`Submission`）与后端 job 状态重新读取并恢复 UI，无需用户重新操作。
3. [F-003] 实现 PRD §17 错误与降级处理表中的全部前端场景：未连接钱包、网络错误、余额不足、用户拒绝交易、RPC 暂时失败、图片生成失败、图片存储失败、Commit 部分失败、Reveal 不匹配、支付失败、页面刷新。
4. [F-004] 提供退款入口：截止时间后且未 Awarded 的悬赏，发布者可调用 `refundExpiredBounty`。
5. [F-005] UI 明确区分链下 AI job 状态与链上协议状态；所有链上完成节点只能由 Monad RPC、receipt 或合约读取驱动，不得由 localStorage/Mock 数据宣告成功。

## 非功能需求

- 性能: RPC 暂时失败时使用指数退避重试，不无限重试导致页面卡死。
- 安全: 退款按钮仅在满足合约条件（截止后、未 Awarded）时可点击，最终以合约 `require` 为准。
- 兼容性: 时间线组件在悬赏处于任意阶段时都应正确渲染已完成/进行中/未开始三种节点视觉状态。

## 验收标准

- [ ] [AC-001] 时间线 8 个节点的完成状态与实际链上/后端状态一致，关键节点浏览器链接可点击。
- [ ] [AC-002] 在悬赏的任意阶段刷新页面，UI 能恢复到与刷新前一致的状态。
- [ ] [AC-003] PRD §17 表中列出的每种错误场景都有对应 UI 提示且不导致页面白屏或卡死。
- [ ] [AC-004] 截止时间前退款按钮不可用或调用后合约 revert；截止后且未 Awarded 时退款成功，发布者收到退款。
- [ ] [AC-005] 已 Awarded 的悬赏不显示退款入口。
- [ ] [AC-006] 清空 localStorage 并刷新后，创建/Commit/Reveal/Award/NFT 等关键状态仍能由 bountyId 和 Monad 合约恢复，证明应用不是纯前端演示。

## 依赖

- `2.wallet-and-bounty-creation`（交易状态机模式）
- `4.commit-reveal-execution`（job 状态与 Commit/Reveal 数据）
- `5.winner-award-and-mint`（Award 后状态）
- `1.smart-contract-core`（`refundExpiredBounty` 接口）

## 开放问题

- 无
