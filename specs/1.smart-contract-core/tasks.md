# smart-contract-core — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始任务 |

## 项目信息

- 项目名: bounty-mint
- 架构类型: Web3 dApp
- specs 路径: specs/1.smart-contract-core/

## 任务列表

### 功能 1: 合约骨架与数据结构

- [ ] T-001: 初始化 Foundry 工程，定义 `BountyStatus` 枚举、`Bounty`/`Submission` 结构体与 mapping 骨架 ~15min

### 功能 2: 核心状态转换接口

- [ ] T-002: 实现 `createBounty`（锁资 + deadline/零奖金校验）+ 单元测试 ~30min
- [ ] T-003: 实现 `commitWork`（executor 权限 + 防重复 Commit）+ 单元测试 ~30min
- [ ] T-004: 实现 `revealWork`（commitHash 校验）+ 单元测试（含错误 salt 场景）~30min
- [ ] T-005: 实现 `awardWinner`（ReentrancyGuard + 支付 + ERC721 铸造）+ 单元测试（含重入攻击场景）~30min
- [ ] T-006: 实现 `refundExpiredBounty` + 边界测试（截止前 revert、已 Awarded revert、截止后成功）~30min

### 集成与部署

- [ ] T-007: 编写 Foundry 部署脚本，使用占位 Monad RPC/Chain ID 环境变量 ~15min

## 依赖关系

- T-002 → T-003 → T-004 → T-005（状态机顺序推进，需按序实现）
- T-006 依赖 T-002（需要 Bounty 状态与 deadline 字段）
- T-007 依赖 T-002~T-006 全部完成

## 风险点

- `awardWinner` 的重入测试需要构造恶意 `payoutAddress` 合约，实现与调试耗时可能超出预估，若超时优先保证 `nonReentrant` 修饰器正确性，重入测试可简化为断言修饰器存在 + 手动构造一次攻击尝试。
- Monad RPC/Chain ID 为占位值，T-007 产出的部署脚本在比赛当天需要替换真实参数后才能实际部署（跟踪见 `7.T-002`）。
