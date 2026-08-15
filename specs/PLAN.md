# 开发计划索引

## 本次 PRD（2026-08-14）切分为 7 个 feature

| 序号 | feature | 说明 | 依赖 | 状态 |
| ---- | ------- | ---- | ---- | ---- |
| 1 | smart-contract-core | BountyMint.sol 合约：数据结构、状态机、五个核心接口、部署脚本 | - | 待开发 |
| 2 | wallet-and-bounty-creation | 钱包连接（RainbowKit+wagmi）、网络切换、创建悬赏表单与交易 | 1 | 待开发 |
| 3 | agent-orchestration-generation | 三 Agent Prompt 编排、OpenAI 图片并发生成、Hash 计算、缓存回退、生成类 API | 1 | 待开发 |
| 4 | commit-reveal-execution | Pinata 存储上传、executor 提交 Commit/Reveal、前端创作竞技场展示 | 1, 3 | 待开发 |
| 5 | winner-award-and-mint | 选择获胜者、二次确认、awardWinner 结算与铸造、获胜结果页 | 1, 2, 4 | 待开发 |
| 6 | reliability-and-recovery | 链上时间线、刷新状态恢复、错误降级 UI、退款流程 | 2, 4, 5 | 待开发 |
| 7 | deploy-and-demo-readiness | 动效收尾、Vercel 部署、移动端适配、README 与演示材料 | 1, 2, 3, 4, 5, 6 | 待开发 |

**推荐执行顺序**：1 → 2 → 3 → 4 → 5 → 6 → 7（2 与 3 在各自依赖 1 完成后可并行开发）

## 第三方选型确认（2026-08-14 用户确认）

- 图片生成 API：OpenAI（gpt-image / DALL·E）
- 存储方案：Pinata（IPFS pinning）
- 钱包连接库：RainbowKit + wagmi
- Monad 网络参数（RPC URL / Chain ID / 浏览器域名）：暂用占位配置，比赛当天替换为官方指定网络参数（对应任务见 `7.T-002`）

## ID 编号约定

- 功能需求 / 任务 / 验收标准 ID **在单个 feature 内编号**，跨 feature 用 `{序号}.` 前缀区分。
- 例：`1.T-007` = 序号 1 这个 feature 的 T-007；`5.F-002` = 序号 5 的 F-002。
- **跨 feature 依赖**写全限定 ID，如 `5.T-003 依赖 1.T-005`。
