# winner-award-and-mint — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始设计 |

> 跨项目经验检索：`YD_EXPERIENCE_REPO` 未配置，经验增强本次不可用，已跳过，不影响当前工作流。

## 项目架构

- 架构类型: Web3 dApp（单仓库）
- 涉及层: 前端（选择/确认/结果页）、后端（metadata 生成，复用 Pinata 封装）、智能合约（`awardWinner` 调用方）

## 功能模块设计

### 模块 1: 获胜作品选择与二次确认

**涉及层及关键设计:**

- 仅 `Revealed` 状态的作品卡片可点击（复用 `4.commit-reveal-execution` 的状态数据）。
- 点击后弹窗展示：Agent 名称/头像、奖金金额、授权声明原文，要求用户显式确认（对应 [[frontend]] 规则的关键交互二次确认要求）。
- 仅悬赏发布者地址（`useAccount().address === bounty.creator`）可见/可点击选择入口，非发布者禁用并提示。

### 模块 2: NFT metadata 生成

**涉及层及关键设计:**

- 按 PRD §14 结构生成 JSON：

  ```json
  {
    "name": "BountyMint #{bountyId} — {agentName}",
    "description": "Winning artwork from a BountyMint creative bounty on Monad.",
    "image": "{已上传的 ipfs:// image URI}",
    "external_url": "https://.../bounty/{bountyId}",
    "attributes": [
      { "trait_type": "Creator Agent", "value": "{agentName}" },
      { "trait_type": "Style", "value": "{style}" },
      { "trait_type": "Network", "value": "Monad" },
      { "trait_type": "License Declaration", "value": "{licenseDeclaration}" }
    ],
    "bountymint": {
      "bountyId": "{bountyId}",
      "promptHash": "0x...",
      "imageHash": "0x...",
      "creatorAgent": "{agentName}",
      "licenseDeclaration": "{licenseDeclaration}"
    }
  }
  ```
- 复用 `4.commit-reveal-execution` 模块 1 的 `uploadToPinata` 上传该 JSON，得到最终 NFT `tokenURI`；注意此 URI 与 Reveal 阶段的 `metadataURI` 可以是同一份文件（Reveal 时已包含足够信息）或独立生成，取决于 `1.smart-contract-core` 的 `_setTokenURI` 实现选择——本设计选择复用 Reveal 阶段的 `metadataURI`，避免重复上传。

### 模块 3: 结算交易

**涉及层及关键设计:**

- 复用 `2.wallet-and-bounty-creation` 模块 3 的 pending/success/error 状态机模式（`useWriteContract` + `useWaitForTransactionReceipt`）。
- 交易成功后立即触发链上状态重读（`bounty.status`、`ownerOf(tokenId)`），驱动模块 4 结果页渲染。

### 模块 4: 获胜结果页

**涉及层及关键设计:**

- 展示：获胜作品大图、Creator Agent、奖励金额、NFT tokenId、图片 Hash、Prompt Hash、授权声明、`View on Explorer` 链接（拼接占位浏览器域名 + txHash）。
- 遵循 [[frontend]] 关于语言词典与动效（`prefers-reduced-motion`）的规则。

## 接口契约

- 合约调用：`awardWinner(uint256 bountyId, uint8 agentId) external`（来自 `1.smart-contract-core`）。
- 读取：`ownerOf(uint256 tokenId) returns (address)`（ERC721 标准接口）。

## 数据模型

无独立数据库；结果页所需数据全部来自合约读取（`Bounty`、`Submission`）与已上传的 metadata JSON（IPFS 读取）。

## 安全考虑

- 遵循 [[security]]：前端隐藏/禁用非发布者的操作入口，但最终权限判定以合约 `require(msg.sender == bounty.creator)` 为准，不依赖前端隐藏作为唯一防线。
- 二次确认弹窗防止误触发不可逆的链上结算操作。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| NFT metadataURI 来源 | 复用 Reveal 阶段已上传的 metadataURI | 避免重复上传 Pinata，减少一次外部依赖调用，降低演示失败点 |
| 权限校验 | 前端 + 合约双重校验 | 前端提升体验（禁用而非报错），合约是唯一安全边界 |
