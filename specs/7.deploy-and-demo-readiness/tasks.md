# deploy-and-demo-readiness — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始任务 |

## 项目信息

- 项目名: bounty-mint
- 架构类型: Web3 dApp
- specs 路径: specs/7.deploy-and-demo-readiness/

## 任务列表

### 功能 1: 动效

- [ ] T-001: Reveal 翻转/资金流/NFT 铸造动效 + `prefers-reduced-motion` 支持 ~30min — **2026-08-15 用户明确砍掉**（P0 冲刺范围：不做复杂动画），保持现有无动画的即时状态切换

### 功能 2: 部署

- [x] T-002: Monad Testnet(10143) 合约部署完成（真实 `forge script --broadcast`，见 README 部署信息表）。Vercel 部署仍由用户自行在网站上 Import 仓库完成（2026-08-15 用户决定），不在本任务范围内跟踪

### 功能 3: 适配与材料

- [ ] T-003: 桌面 Chrome 无痕窗口与演示分辨率检查（连接弹窗/表单/三卡片/结果页）~10min — 需要真实钱包扩展驱动浏览器点击，本次改用 API 层（cast + curl）驱动的端到端 smoke test 替代验证核心链路；真实浏览器点击流程留给用户在 Vercel 部署后验收
- [x] T-004: README（合约地址/公网 URL/运行说明）+ 演示脚本材料整理 ~30min — 合约地址、真实创建悬赏交易、真实 Award/NFT 交易均已回填；公网 Demo URL 与项目截图待 Vercel 部署后补充（不阻塞代码交付）
- [x] T-005: Monad 原生演示验收（锁资→3 Commit→3 Reveal→Award 支付+NFT）+ Explorer 证据清单 ~20min — 2026-08-15 完整跑通（bounty #3）：真实锁资 0.01 MON、真实 Pinata 上传（6 次 pin）、3 笔真实 commitWork、3 笔真实 revealWork、1 笔真实 awardWinner；链上核验 `ownerOf(tokenId)` 等于发布者、获胜 payout 地址余额精确等于 `bounty.reward`。过程中发现并修复真实问题：`AGENT_PAYOUT_ADDRESS_*` 若使用 Anvil 众所周知的默认地址，在公开网络上可能已被第三方通过 EIP-7702 委托接管，导致 `awardWinner` 内部支付失败——详见 `specs/LESSONS.md` 2026-08-15 条目

## 部署与验收说明（2026-08-15）

合约已真实部署并完成一次完整端到端 Monad 原生验收（见 README 部署信息表与 `specs/LESSONS.md`）。Vercel 公网部署、GitHub 仓库创建与推送均由用户自行处理（2026-08-15 用户决定），不在此任务清单跟踪范围内；T-003 的浏览器无痕窗口点击验收留给用户在拿到公网 URL 后自行执行。

## 依赖关系

- T-001 依赖 `4.T-005`、`5.T-004`
- T-002 依赖 `1.T-007`、feature 1-6 全部功能可运行
- T-003 依赖 T-002（需要可访问的部署环境进行桌面浏览器测试）
- T-004 依赖 T-002、T-003
- T-005 依赖 T-001、T-002、T-004

## 风险点

- Monad 官方网络参数在比赛当天才公布，T-002 存在等待官方信息的硬性外部依赖，不受开发进度控制，建议提前准备好"参数一到位立即可执行"的部署 checklist。
- 五次端到端演示彩排（验收标准 AC-005）不属于开发任务，但需要在 T-004 完成后单独预留时间执行，不在本任务清单的时间预算内。
