---
description: 测试约定、覆盖率要求
---

# 测试规范

## 合约测试（Foundry）

必须覆盖 PRD §18.1 / §12.6 列出的场景：

- 创建悬赏并锁资；成功路径 Commit/Reveal/Award；
- 权限：非 executor 无法 Commit/Reveal，非发布者无法 Award；
- 重复操作：重复 Commit、重复 Reveal、重复 Award 必须 revert；
- 错误 Reveal：salt/metadata 与 commitHash 不匹配必须 revert；
- 未 Reveal 的作品不可被选为获胜者；
- 退款边界：截止前不可退款，截止后允许退款，已 Awarded 不可退款；
- 重入攻击场景（结算函数）不能重复领取奖金。
- 测试文件命名 `*.t.sol`，与合约同名，使用 `forge test` 运行。

## 前端/编排器测试

- 关键路径（钱包连接、创建悬赏交易状态、Commit/Reveal 轮询、Award 二次确认）需要有可运行的测试或手动验收记录。
- 图片生成失败 → 缓存回退路径必须被验证（PRD §18.3 要求正式提交前至少一次端到端演示走缓存回退）。
- 页面刷新后从链上状态恢复的行为需要测试或手动验证。
