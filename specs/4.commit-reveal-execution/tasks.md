# commit-reveal-execution — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始任务 |

## 项目信息

- 项目名: bounty-mint
- 架构类型: Web3 dApp
- specs 路径: specs/4.commit-reveal-execution/

## 任务列表

### 功能 1: 存储上传

- [x] T-001: Pinata 上传封装（图片 + metadata JSON，返回 ipfs:// URI）+ commitHash 重算 ~30min

### 功能 2: 链上提交

- [x] T-002: executor 并行提交 `commitWork`（三 Agent，含单 Agent 失败重试）~30min
- [x] T-003: executor 依次提交 `revealWork`（校验 salt/metadata 一致后调用）~30min

### 功能 3: 前端创作竞技场

- [x] T-004: 三张 Agent 卡片组件（状态机 + Committed 态模糊锁定）~30min — P0 冲刺范围：桌面端最小实现，不含翻转动画/移动端/英文（用户 2026-08-15 明确砍掉）
- [x] T-005: 前端轮询 job 状态驱动卡片状态更新 ~30min
- [x] T-006: Commit/Reveal 链上证明 UI（真实 txHash/receipt 状态/Monad Explorer 链接）~20min

## 验收状态说明

- 代码路径为真实实现（无 Mock 链上成功）：真实 Pinata REST 调用、真实 viem `walletClient.writeContract` 提交 `commitWork`/`revealWork`、真实 `waitForTransactionReceipt` 确认。
- 本沙箱环境没有配置 `PINATA_JWT`/`EXECUTOR_PRIVATE_KEY`/真实 Monad RPC（`.env` 从未创建），因此 requirements.md 里依赖真实外部服务的验收标准（AC-001/002/003/007）无法在本环境端到端验证，留待 Feature 7 提供真实凭据后现场核验；已用 `npm run test`/`next build`/`eslint` 验证类型正确性与纯函数逻辑。

## 依赖关系

- T-001 依赖 `3.T-004`（imageHash/salt 已计算）
- T-002 依赖 T-001、`1.T-003`
- T-003 依赖 T-002、`1.T-004`
- T-004 依赖 `3.T-006`（job 状态接口存在）
- T-005 依赖 T-002、T-003、T-004
- T-006 依赖 T-002、T-003、T-004

## 风险点

- executor 账户在依次提交 Reveal 时若 nonce 管理不当（如前端触发重复请求）可能导致交易卡住，T-003 需要显式管理 nonce 或串行 await。
- Pinata 上传耗时若不稳定，可能拖慢 Commit 提交节奏，建议 T-001 设置合理超时并在失败时提示重试而非静默卡死。
