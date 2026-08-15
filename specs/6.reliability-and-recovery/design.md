# reliability-and-recovery — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始设计 |

> 跨项目经验检索：`YD_EXPERIENCE_REPO` 未配置，经验增强本次不可用，已跳过，不影响当前工作流。

## 项目架构

- 架构类型: Web3 dApp（单仓库）
- 涉及层: 前端（时间线、错误 UI、退款）、合约读取（状态恢复的唯一真相源）

## 功能模块设计

### 模块 1: 链上时间线

**涉及层及关键设计:**

- 时间线节点状态从 `bounty.status` + `submissions[].revealed` 计数 + `bounty.winningAgentId` 派生（不新增链下状态），映射规则：
  - `Bounty Created`/`Reward Escrowed`：`bounty` 存在即完成；
  - `3 Agents Generating`：job 状态存在且未全部 committed；
  - `3 Works Committed`：`bounty.commitCount === 3`；
  - `Works Revealed`：`bounty.status === Revealed`；
  - `Winner Selected`/`Reward Paid`/`NFT Minted`：`bounty.status === Awarded`（三者在本合约设计中原子发生，UI 上可同时点亮，或按 tx 内 event 顺序做视觉分段）。
- 每个已完成节点关联对应交易哈希（创建/commit/reveal/award），拼接占位浏览器域名生成链接。

### 模块 2: 状态恢复

**涉及层及关键设计:**

- 页面加载时：若 URL/localStorage 中有 `bountyId`，直接用 wagmi `useReadContract` 批量读取 `bounties(bountyId)` 与三个 `submissions(bountyId, agentId)`。
- 若悬赏处于 `Creating` 阶段且本地找不到对应 `jobId`（例如换设备刷新），展示"创作进行中，请稍候"并仅依赖链上 `commitCount`/`revealCount` 轮询，不强依赖后端内存 job（因其不持久化，符合 PRD §15.2 的可接受降级）。
- `bountyId` 通过 URL query 持久化（如 `/?bounty=3`），保证分享/刷新链接可恢复。

### 模块 3: 错误与降级 UI

**涉及层及关键设计:**

按 PRD §17 表逐项实现（对应 [[frontend]] 规则）：

| 场景 | 实现方式 |
| ---- | ---- |
| 未连接钱包 | 创建按钮 `disabled`，hover 提示连接钱包 |
| 网络错误 | 复用 `2.T-002` 的 `Switch Network` 组件 |
| 余额不足 | 表单校验，提交前对比 `useBalance` 与所需金额 |
| 用户拒绝交易 | 捕获 `UserRejectedRequestError`，状态回退可编辑，不视为系统错误 |
| RPC 暂时失败 | wagmi 查询失败时指数退避重试（`retry`/`retryDelay` 配置），达到上限后展示"重试"按钮 |
| 图片生成失败 | Agent 卡片展示"重试中"，由后端一次重试后自动切缓存（`3.T-002/T-003`），前端只需正确渲染中间态 |
| 图片存储失败 | 后端捕获 Pinata 失败并降级（预留：静态资源占位图 + 提示"处理中"），前端展示统一"处理中"态 |
| Commit 部分失败 | 前端展示失败的具体 Agent 卡片为"重试中"，其余不受影响（依赖 `4.T-002` 的后端重试逻辑） |
| Reveal 不匹配 | 该 Agent 卡片标记"无效"，禁止被选择 |
| 支付失败 | `awardWinner` 交易 revert 时前端不展示成功态，保留在结算前状态 |
| 页面刷新 | 见模块 2 |

### 模块 4: 退款流程

**涉及层及关键设计:**

- 退款入口仅在 `block.timestamp > bounty.deadline && bounty.status !== Awarded && bounty.status !== Cancelled` 时展示（前端用当前时间与 `deadline` 比较 + 状态判断）。
- 复用 `2.wallet-and-bounty-creation` 的交易状态机模式调用 `refundExpiredBounty`。

## 接口契约

- 合约读取：`bounties(uint256)`、`submissions(uint256, uint8)`（均为 `1.smart-contract-core` 自动生成的 public getter）。
- 合约写入：`refundExpiredBounty(uint256 bountyId)`。

## 数据模型

无新增数据模型；完全基于合约读取 + 复用已有 job 状态接口。

## 安全考虑

- 遵循 [[security]]：退款按钮的前端可见性判断仅为体验优化，实际资金安全由合约 `require` 保证。
- RPC 重试需设置合理上限（如 3 次），避免无限请求消耗节点配额或造成页面假死。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| bountyId 持久化方式 | URL query 参数 | 无需引入 localStorage 复杂度，天然支持分享链接与刷新恢复 |
| 时间线节点粒度 | 复用现有链上字段派生，不新增合约事件索引 | PRD 明确不引入数据库/独立索引器，避免过度工程 |
