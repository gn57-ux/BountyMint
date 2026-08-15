# wallet-and-bounty-creation — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始设计 |

> 跨项目经验检索：`YD_EXPERIENCE_REPO` 未配置，经验增强本次不可用，已跳过，不影响当前工作流。

## 项目架构

- 架构类型: Web3 dApp（单仓库）
- 涉及层: 前端（Next.js + Tailwind + RainbowKit/wagmi）、合约读写（依赖 `1.smart-contract-core` 的 ABI）

## 功能模块设计

### 模块 1: 钱包连接与网络校验

**涉及层及关键设计:**

- `WagmiConfig` + RainbowKit `ConnectButton` 接入顶部导航（对应 [[frontend]] 规则的组件规范）。
- 自定义 Monad chain 定义（`defineChain`），RPC URL / Chain ID 使用占位环境变量 `NEXT_PUBLIC_MONAD_RPC_URL` / `NEXT_PUBLIC_MONAD_CHAIN_ID`，比赛当天替换（见 `PLAN.md` 选型确认）。
- `useAccount` + `useBalance` 读取地址与 MON 余额；`useSwitchChain` 处理切链，失败时提示手动在钱包添加网络。

### 模块 2: 创建悬赏表单

**涉及层及关键设计:**

- 表单字段：Brief（textarea，预填 PRD §7.1 默认 Brief）、奖金（number，单位 MON）、截止时间（默认当前时间 + 2 小时，可调整）、授权声明（checkbox，固定文案见 PRD §7.1）。
- 提交前计算 `promptHash = keccak256(toBytes(brief))`（前端用 viem `keccak256`/`toHex`），与合约 `createBounty(promptHash, deadline)` 参数一致。
- 所有文案通过语言词典（`zh-CN`）取值，不硬编码。

### 模块 3: 交易发起与状态机

**涉及层及关键设计:**

- 使用 wagmi `useWriteContract` + `useWaitForTransactionReceipt` 管理 `pending → success/error` 状态。
- 三态 UI：`idle`（可编辑）→ `pending`（禁用表单，显示 spinner）→ `success`（写入本地页面状态 `CREATING`，跳转创作竞技场区）/`error`（恢复 `idle`，保留输入，展示错误原因）。
- 用户拒绝签名（`UserRejectedRequestError`）单独捕获，直接恢复为可编辑态，不展示为系统错误。

## 接口契约

- 合约调用：`createBounty(bytes32 promptHash, uint64 deadline) payable returns (uint256 bountyId)`（来自 `1.smart-contract-core`）。
- 创建成功后，`bountyId` 通过前端路由/状态传递给 `3.agent-orchestration-generation` 的 `POST /api/bounties/:id/generate` 调用（该接口由 feature 3 提供）。

## 数据模型

无独立数据库；表单状态为组件内 state，`bountyId` 之后的状态一律以链上读取为准（PRD §15.2）。

## 安全考虑

- 遵循 [[security]]：不在前端硬编码任何私钥/API Key；奖金金额、deadline 在前端做基础校验，最终以合约 `require` 为准，不假设前端校验已足够。
- 网络切换失败或用户使用不支持自动加链的钱包时，展示 Monad 网络参数供手动添加（RPC/Chain ID/浏览器地址，占位值在比赛当天替换）。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 钱包连接库 | RainbowKit + wagmi | 用户已确认；开箱即用的连接弹窗和切链 UI，节省黑客松开发时间 |
| promptHash 计算位置 | 前端计算后连同 deadline 一起传给合约 | 避免额外链下服务参与关键路径，创建交易保持原子 |
| 表单状态管理 | React 组件内 state（无全局状态库） | 单页应用规模小，引入 Redux/Zustand 属过度设计 |
