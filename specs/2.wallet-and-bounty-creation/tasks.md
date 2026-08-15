# wallet-and-bounty-creation — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始任务 |

## 项目信息

- 项目名: bounty-mint
- 架构类型: Web3 dApp
- specs 路径: specs/2.wallet-and-bounty-creation/

## 任务列表

### 功能 1: 钱包与网络

- [ ] T-001: 集成 RainbowKit + wagmi，`ConnectButton` 接入顶部导航，展示地址/MON 余额 ~30min
- [ ] T-002: 自定义 Monad chain 配置（占位 RPC/Chain ID）+ 网络校验与一键切换组件 ~15min

### 功能 2: 创建悬赏表单

- [ ] T-003: Brief/奖金/截止时间/授权声明表单组件（含默认 Brief 预填）~30min

### 功能 3: 创建交易

- [ ] T-004: `createBounty` 合约写入集成（promptHash 计算 + pending/success/error 状态机）~30min
- [ ] T-005: 创建成功跳转 CREATING 状态 + 语言词典接入 + 拒绝交易时保留表单内容 ~15min

## 依赖关系

- T-002 依赖 T-001
- T-004 依赖 T-002、T-003
- T-005 依赖 T-004
- 本 feature 整体依赖 `1.T-002`（`createBounty` 合约接口需先实现）

## 风险点

- 若比赛当天 Monad RPC 与占位配置差异较大（如自定义 gas 逻辑），T-002/T-004 可能需要临时调整，建议留出缓冲时间。
- RainbowKit 版本与 wagmi v2 的兼容性需在 T-001 开始前确认（不同大版本 API 差异较大）。
