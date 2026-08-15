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

- [ ] T-001: Pinata 上传封装（图片 + metadata JSON，返回 ipfs:// URI）+ commitHash 重算 ~30min

### 功能 2: 链上提交

- [ ] T-002: executor 并行提交 `commitWork`（三 Agent，含单 Agent 失败重试）~30min
- [ ] T-003: executor 依次提交 `revealWork`（校验 salt/metadata 一致后调用）~30min

### 功能 3: 前端创作竞技场

- [ ] T-004: 三张 Agent 卡片组件（状态机 + Committed 态模糊锁定）~30min
- [ ] T-005: 前端轮询 job 状态 + 三卡片同步 Reveal 翻转动画触发 ~30min

## 依赖关系

- T-001 依赖 `3.T-004`（imageHash/salt 已计算）
- T-002 依赖 T-001、`1.T-003`
- T-003 依赖 T-002、`1.T-004`
- T-004 依赖 `3.T-006`（job 状态接口存在）
- T-005 依赖 T-002、T-003、T-004

## 风险点

- executor 账户在依次提交 Reveal 时若 nonce 管理不当（如前端触发重复请求）可能导致交易卡住，T-003 需要显式管理 nonce 或串行 await。
- Pinata 上传耗时若不稳定，可能拖慢 Commit 提交节奏，建议 T-001 设置合理超时并在失败时提示重试而非静默卡死。
