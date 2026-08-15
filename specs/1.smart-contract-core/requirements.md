# smart-contract-core — 需求规格

## 概述

实现 `BountyMint.sol` 单一合约，承担悬赏托管、Commit/Reveal、获胜者选择、奖金支付、ERC-721 铸造与部署，是所有其他 feature 的链上基础。

## 项目信息

- 项目名: bounty-mint
- 架构类型: Web3 dApp（单仓库：前端 + API 编排器 + Solidity 合约，无数据库）

## 需求版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始需求 |

## 用户故事

- 作为悬赏发布者，我希望锁定的 MON 奖金由合约托管，以便不依赖平台承诺付款。
- 作为 Creator Agent，我希望我的作品提交时间、内容哈希和获奖记录写入链上，以便形成可验证的创作履历。
- 作为悬赏发布者，我希望截止时间后未完成流程可以退款，以便资金不被永久锁定。

## 功能需求

1. [F-001] 合约定义 `BountyStatus` 枚举（Open/Creating/Revealed/Awarded/Cancelled）与 `Bounty`/`Submission` 数据结构。
2. [F-002] `createBounty(promptHash, deadline) payable` 创建悬赏并锁定奖金，deadline 必须晚于当前时间，奖金不得为零。
3. [F-003] `commitWork(bountyId, agentId, commitHash, payoutAddress)` 仅 `executor` 可调用，每个 Agent 每悬赏只能 Commit 一次。
4. [F-004] `revealWork(bountyId, agentId, imageHash, metadataURI, salt)` 校验 `commitHash = keccak256(abi.encode(bountyId, agentId, imageHash, keccak256(metadataURI), salt))`，不匹配则 revert。
5. [F-005] `awardWinner(bountyId, agentId)` 仅悬赏发布者可调用，且目标作品必须已 Reveal；执行奖金支付给对应 `payoutAddress` 并为发布者铸造 ERC-721 NFT。
6. [F-006] `refundExpiredBounty(bountyId)` 仅在截止时间后、未 Awarded 时允许发布者退款。
7. [F-007] 已 `Awarded` 或 `Cancelled` 的悬赏不可重复执行任何状态转换。

## 非功能需求

- 性能: 单笔交易 gas 消耗需可在 Monad 测试网正常执行，不做特殊优化。
- 安全: `awardWinner` 必须使用 checks-effects-interactions 且加重入保护；`executor` 角色不得提取悬赏资金。
- 兼容性: 使用 OpenZeppelin `ERC721`、`ReentrancyGuard`、`Ownable`；Solidity 版本与 Foundry 工具链保持一致。

## 验收标准

- [ ] [AC-001] 创建悬赏后合约余额增加对应奖金金额，`Bounty.status` 为 `Open`。
- [ ] [AC-002] 非 `executor` 调用 `commitWork`/`revealWork` 必须 revert。
- [ ] [AC-003] `salt`/`metadataURI` 与原始 Commit 不匹配时 `revealWork` 必须 revert。
- [ ] [AC-004] 未 Reveal 的作品不能被 `awardWinner` 选中。
- [ ] [AC-005] `awardWinner` 成功后获胜地址余额增加奖金，发布者 `ownerOf(tokenId)` 为自己，且不可重复调用。
- [ ] [AC-006] 截止时间前调用 `refundExpiredBounty` 必须 revert；已 `Awarded` 的悬赏调用退款必须 revert。
- [ ] [AC-007] 模拟重入攻击场景，`awardWinner` 不能被重复触发领取奖金。

## 依赖

- Foundry
- OpenZeppelin Contracts（ERC721、ReentrancyGuard、Ownable）
- Monad 测试网络（RPC/Chain ID，占位待比赛当天替换，见 `PLAN.md`）

## 开放问题

- 无（第三方选型与网络参数已在 PLAN.md 中记录确认状态）
