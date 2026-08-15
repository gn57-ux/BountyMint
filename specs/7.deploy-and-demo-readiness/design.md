# deploy-and-demo-readiness — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始设计 |

> 跨项目经验检索：`YD_EXPERIENCE_REPO` 未配置，经验增强本次不可用，已跳过，不影响当前工作流。

## 项目架构

- 架构类型: Web3 dApp（单仓库）
- 涉及层: 前端（动效、响应式）、部署配置（Vercel、合约部署）、文档

## 功能模块设计

### 模块 1: 关键动效

**涉及层及关键设计:**

- 使用 CSS transition/Framer Motion（视前端已有依赖选择，避免引入过重的动画库）实现：Reveal 三卡片同步翻转（`rotateY`）、奖金沿连线流向获胜 Agent（SVG path + 移动的圆点/粒子）、NFT 卡片"铸造"出现（scale + opacity 过渡）。
- 全局通过 `useReducedMotion`（或 CSS `@media (prefers-reduced-motion: reduce)`）判断，降级为瞬时状态切换，不阻塞任何后续操作（对应 [[frontend]] 规则）。

### 模块 2: 部署配置

**涉及层及关键设计:**

- Vercel 环境变量清单：`OPENAI_API_KEY`、`PINATA_API_KEY`/`PINATA_SECRET`、`EXECUTOR_PRIVATE_KEY`、`NEXT_PUBLIC_MONAD_RPC_URL`、`NEXT_PUBLIC_MONAD_CHAIN_ID`、`NEXT_PUBLIC_MONAD_EXPLORER_URL`、`NEXT_PUBLIC_CONTRACT_ADDRESS`。
- `.env.example` 仅列出上述变量名（对应 [[security]] 规则）。
- 合约部署：使用 `1.smart-contract-core` 的 Foundry 部署脚本，将占位 RPC/Chain ID 替换为比赛当天真实值后执行 `forge script ... --broadcast`，部署产出的合约地址写回前端环境变量与 README。

### 模块 3: 移动端适配

**涉及层及关键设计:**

- 依赖 [[frontend]] 规则"移动端不依赖单独设计稿，由桌面组件按响应式规则适配"；本模块只做检查与必要的 Tailwind 断点修正，不重新设计布局。
- 重点检查：钱包连接弹窗、表单输入、三卡片横向排列在窄屏下的堆叠、结果页信息不溢出。

### 模块 4: README 与演示材料

**涉及层及关键设计:**

- README 包含：项目简介、合约地址、公网 Demo URL、本地运行说明、`.env.example` 说明、架构图（文字版即可，复用 PRD §15 的架构图）。
- 演示材料：项目截图（4 个核心状态：发布悬赏/创作中/揭晓/结算铸造）、60-90 秒演示脚本（直接复用 PRD §23 台词）。

## 接口契约

无新增接口；本 feature 为收尾与配置性质。

## 数据模型

无。

## 安全考虑

- 遵循 [[security]]：所有密钥通过 Vercel 平台环境变量注入；提交前用 `git log`/`git diff` 检查确认无密钥泄露到历史提交。
- 演示钱包仅保留少量测试网资产（PRD §19.2）。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 动效实现方式 | CSS transition 优先，复杂粒子效果视时间预算决定是否引入库 | 黑客松时间有限，优先保证功能正确性而非动效精致度（PRD §25 优先级原则） |
| 部署平台 | Vercel | 用户已在 PRD 中指定，前端天然适配 Next.js |
