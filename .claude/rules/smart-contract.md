---
description: 合约安全规范、常见漏洞防范、审计检查清单、测试要求、部署流程
globs: "contracts/**,src/contracts/**"
---

# 智能合约规范

- 技术栈：Solidity + Foundry；使用 OpenZeppelin `ERC721`、`ReentrancyGuard`、`Ownable`；部署到 Monad 官方指定网络（PRD §15.1）。
- 单一 `BountyMint` 合约承担：悬赏托管、Commit/Reveal、获胜者选择、奖金支付、ERC-721 铸造、Creator 基础统计（PRD §12.1）。
- 状态机：`Open → Creating → Revealed → Awarded / Cancelled`，已 `Awarded` 或 `Cancelled` 的悬赏不可重复执行任何状态转换（PRD §12.2、§12.6）。
- 核心接口固定为：`createBounty` / `commitWork` / `revealWork` / `awardWinner` / `refundExpiredBounty`（PRD §12.4），修改签名前确认不破坏前端/编排器调用约定。
- `commitHash` 计算方式固定：
  ```
  commitHash = keccak256(abi.encode(bountyId, agentId, imageHash, keccak256(metadataURI), salt))
  ```
- 权限模型（PRD §12.5）：
  - 只有悬赏发布者可选择获胜者；
  - 只有 `executor` 可提交/揭晓作品；
  - 只有截止时间后且未结算才允许退款；
  - `executor` 不得提取悬赏资金。
- 安全底线（同 [[security]]，合约侧强制）：checks-effects-interactions、支付函数重入保护、禁止零奖金、deadline 必须晚于当前时间、每个 Agent 每悬赏只能 Commit/Reveal 一次、Reveal 必须匹配 Commit、禁止重复 Award、支付失败整笔回滚。
- 测试要求详见 [[testing]] 中"合约测试"一节，使用 `forge test` 驱动，覆盖正常流程/越权/重复操作/错误 Reveal/退款边界/重入攻击。
- 部署后合约地址必须写入 README，并在链上产生至少一笔真实悬赏与结算交易作为提交材料（PRD §22）。
