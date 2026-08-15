# commit-reveal-execution — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始设计 |

> 跨项目经验检索：`YD_EXPERIENCE_REPO` 未配置，经验增强本次不可用，已跳过，不影响当前工作流。

## 项目架构

- 架构类型: Web3 dApp（单仓库）
- 涉及层: 后端编排器（executor 逻辑、Pinata 集成）、智能合约（Commit/Reveal 调用方）、前端（创作竞技场 UI）

## 功能模块设计

### 模块 1: Pinata 上传

**涉及层及关键设计:**

- 封装 `uploadToPinata(buffer, filename): Promise<string>`（返回 `ipfs://<cid>`），使用 Pinata REST API（`pinFileToIPFS`）。
- metadata JSON（按 PRD §14 结构，字段见 `5.T-002`）单独上传，得到 `metadataURI`。
- 上传完成后用真实 `metadataURI` 重算 `keccak256(bytes(metadataURI))`，替换 `3.agent-orchestration-generation` 阶段的占位值，得到最终 `commitHash`。

### 模块 2: Commit 执行器

**涉及层及关键设计:**

- 服务端持有 `executor` 私钥（viem `privateKeyToAccount`，从环境变量读取），对三个 Agent 并行调用 `commitWork(bountyId, agentId, commitHash, payoutAddress)`。
- `payoutAddress` 为各 Creator Agent 的固定收款地址（MVP 阶段可为同一 executor 管理的三个测试地址，或部署时预设常量，不做用户可配置）。
- 单个 Agent 提交失败（gas 不足、nonce 冲突等）时只重试该 Agent，成功的 Agent 不重复提交（对应 [[backend-api]] 错误处理约定）。
- 三个 Commit 均成功后，更新内存 job 状态为 `committed`，供前端轮询。

### 模块 3: Reveal 执行器

**涉及层及关键设计:**

- 全部 Commit 确认后，executor 依次（或并行，视 nonce 管理复杂度选择依次更简单可靠）调用 `revealWork(bountyId, agentId, imageHash, metadataURI, salt)`。
- Reveal 成功后更新 job 状态为 `revealed`；三个 Agent 均 `revealed` 后 job 整体状态置为 `revealed`，供前端触发"同时翻转"动画。

### 模块 4: 前端创作竞技场

**涉及层及关键设计:**

- 三张 Agent 卡片组件（对应 [[frontend]] 规则），状态枚举 `Ideating/Generating/Committed/Revealed` 映射自 `GET /api/jobs/:jobId` 的 `agents[].status`。
- `Committed` 态展示模糊图（CSS `filter: blur()`）+ 锁定图标，不请求/展示原图 URL。
- 前端检测到 job 整体状态从 `committed` → `revealed` 时，统一触发三卡片的翻转动画（而非各自独立触发），避免因轮询时间差先后揭晓。
- 轮询间隔建议 2s，收到终态（`revealed` 或 `error`）后停止轮询。

## 接口契约

- 内部沿用 `3.agent-orchestration-generation` 的 `GET /api/jobs/:jobId`，扩展 `agents[].status` 取值范围至 `committed`/`revealed`。
- 无新增对外 HTTP 接口；Commit/Reveal 为后端内部异步流程，由 `generate` 请求触发后自动串联执行。

## 数据模型

延用 `3.agent-orchestration-generation` 的内存 job 状态，新增字段：`agents[].commitTxHash`、`agents[].commitReceiptStatus`、`agents[].revealTxHash`、`agents[].revealReceiptStatus`、`agents[].metadataURI`（最终 IPFS URI）。状态只能由 Monad RPC receipt 与合约读取推进，前端计时器仅负责轮询，不得自行把状态置为成功。

前端在每张卡片下提供可折叠的链上证明区：展示缩略交易 Hash、Pending/Confirmed/Failed、当前网络 `Monad Testnet` 与 Explorer 链接。演示主画面保持简洁，但评委无需打开开发者工具即可验证交易。

## 安全考虑

- 遵循 [[security]]：executor 私钥只通过服务端环境变量提供；Pinata API Key 同样只在服务端使用。
- Reveal 前端严禁通过任何接口提前泄露图片 URL 或风格描述，防止用户在全部 Commit 完成前推断作品内容。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 存储方案 | Pinata (IPFS pinning) | 用户已确认；REST API 简单，满足"内容可验证"定位 |
| Reveal 提交顺序 | 依次提交（非并行） | 避免同一 executor 账户 nonce 冲突导致的复杂重试逻辑，黑客松时间有限优先稳定性 |
| 前端揭晓同步方式 | 依赖 job 整体状态而非各 Agent 独立状态触发动画 | 满足 PRD "三张作品同时翻转"的演示效果要求，避免链上确认时间差导致割裂体验 |
