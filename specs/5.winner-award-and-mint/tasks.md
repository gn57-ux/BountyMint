# winner-award-and-mint — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始任务 |

## 项目信息

- 项目名: bounty-mint
- 架构类型: Web3 dApp
- specs 路径: specs/5.winner-award-and-mint/

## 任务列表

### 功能 1: 选择与确认

- [ ] T-001: 获胜作品选择 UI（仅 Revealed 可点击 + 仅发布者可见）+ 二次确认弹窗 ~15min

### 功能 2: metadata 与结算

- [ ] T-002: NFT metadata JSON 生成（按 PRD §14 规范，复用已上传 metadataURI）~15min
- [ ] T-003: `awardWinner` 合约写入集成（pending/success/error 状态机，复用 feature 2 模式）~30min

### 功能 3: 结果展示

- [ ] T-004: 获胜结果页（大图/Agent/奖励/tokenId/Hash/授权声明/浏览器链接）~30min
- [ ] T-005: Award 后链上状态刷新（`ownerOf` 校验 + 悬赏状态同步为 Awarded）~15min

## 依赖关系

- T-001 依赖 `4.T-004`（已 Reveal 的作品卡片数据）
- T-002 依赖 T-001
- T-003 依赖 T-002、`1.T-005`、`2.T-004`（复用交易状态机模式）
- T-004 依赖 T-003
- T-005 依赖 T-003

## 风险点

- 若 metadataURI 复用 Reveal 阶段文件导致 NFT 展示信息与"获胜"上下文不完全匹配（如缺少最终奖励金额字段），需在演示前人工检查渲染效果，必要时改为独立生成（工作量变化记录在此风险点，不预先拆任务）。
