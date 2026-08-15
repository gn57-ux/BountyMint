---
title: 悬赏类合约的 deadline 必须在提交类接口（非仅退款接口）中校验
feature: 1.smart-contract-core
type: pitfall
tags: [solidity, security, deadline, state-machine, commit-reveal]
date: 2026-08-14
---

**问题/场景**：`BountyMint` 合约有 `deadline` 字段，最初只在 `refundExpiredBounty` 里校验 `block.timestamp > deadline`（截止前不可退款）。`commitWork`/`revealWork` 完全没有引用 `deadline`，导致悬赏过期后 executor 仍可继续 Commit/Reveal，直到发布者显式发起退款交易为止——这就把"截止时间"变成了一个只在退款路径生效的摆设，且与退款交易之间存在可被抢跑的时间窗口。Codex review（P2, confidence 0.88）指出了这一点。

**解法/结论**：任何有截止时间语义的状态机，只要某个操作应该在截止后被禁止，就必须在**该操作自己的入口**加校验，不能只指望"另一个操作"（这里是退款）间接兜底。本例修复为在 `commitWork`、`revealWork` 入口各加一行 `require(block.timestamp <= bounty.deadline, "BountyMint: bounty expired")`，并配套两个回归测试（`vm.warp(deadline + 1)` 后断言 revert）。

**复用方式**：后续 feature（尤其 executor 编排器调用 Commit/Reveal 的后端逻辑）如果依赖"deadline 之后合约会自动拒绝提交"这一假设，现在是成立的；review 合约新接口时优先检查"这个函数是否该受 deadline/status 约束，而它是否真的加了对应 require"，而不是假设已有的 deadline 字段会被处处生效。
