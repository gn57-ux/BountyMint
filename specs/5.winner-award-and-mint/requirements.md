# winner-award-and-mint — 需求规格

## 概述

实现获胜作品选择、二次确认、`awardWinner` 结算与铸造，以及获胜结果展示页，覆盖 PRD 用户流程 §9.3 与 §10.5。

## 项目信息

- 项目名: bounty-mint
- 架构类型: Web3 dApp（单仓库：前端 + API 编排器 + Solidity 合约，无数据库）

## 需求版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始需求 |

## 用户故事

- 作为悬赏发布者，我希望选中作品后自动完成付款和铸造，以便获得可验证的数字资产。
- 作为悬赏发布者，我希望看到真实交易哈希和链上作品证明，以便信任整个流程。

## 功能需求

1. [F-001] 用户点击一张已 Reveal 的作品后弹窗二次确认获胜 Agent、奖金金额与授权声明。
2. [F-002] 确认后生成符合 PRD §14 规范的 NFT metadata JSON 并上传（复用 `4.commit-reveal-execution` 的 Pinata 封装）。
3. [F-003] 调用合约 `awardWinner(bountyId, agentId)`，展示交易 pending/success/error 状态。
4. [F-004] 结算成功后展示获胜结果页：大图、Creator Agent、奖励金额、NFT tokenId、图片/Prompt Hash、授权声明、区块浏览器链接。
5. [F-005] 结算成功后刷新链上状态，校验 `ownerOf(tokenId)` 为发布者，且悬赏状态同步为 `Awarded`。
6. [F-006] 结果页必须同时展示真实 Award 交易 Hash、奖金前后余额/流向、NFT tokenId/ownerOf 校验和 Monad Explorer 链接，使支付与铸造成为演示高潮而非隐藏的后台步骤。

## 非功能需求

- 性能: 无特殊指标，遵循与其他交易一致的 pending/success/error 反馈节奏。
- 安全: 非发布者点击选择/确认操作应被禁用或在合约层被拒绝，前端与合约双重把关。
- 兼容性: 结果页链接需正确指向 Monad 区块浏览器（占位域名比赛当天替换）。

## 验收标准

- [ ] [AC-001] 非发布者账户无法触发 `awardWinner`（前端禁用 + 合约 revert 双重验证）。
- [ ] [AC-002] 未 Reveal 的作品在 UI 上不可被选择。
- [ ] [AC-003] 二次确认弹窗展示的 Agent、奖金、授权声明与实际结算一致。
- [ ] [AC-004] 结算成功后获胜地址余额增加、合约余额正确扣减、`ownerOf(tokenId)` 为发布者。
- [ ] [AC-005] 结果页展示的交易哈希链接可点击并打开正确的区块浏览器页面。
- [ ] [AC-006] 重复点击已完成结算的悬赏不会重复发起 `awardWinner` 交易。
- [ ] [AC-007] Award 成功只能由 Monad receipt 与合约状态确认；结果页显示的奖励接收地址、金额、tokenId 和 owner 与链上读取完全一致。

## 依赖

- `1.smart-contract-core`（`awardWinner` 接口）
- `2.wallet-and-bounty-creation`（钱包连接与交易状态机模式复用）
- `4.commit-reveal-execution`（已 Reveal 的作品数据）

## 开放问题

- 无
