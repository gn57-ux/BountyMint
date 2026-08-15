# agent-orchestration-generation — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始任务 |

## 项目信息

- 项目名: bounty-mint
- 架构类型: Web3 dApp
- specs 路径: specs/3.agent-orchestration-generation/

## 任务列表

### 功能 1: Prompt 与生成封装

- [x] T-001: 三套 Agent persona Prompt 模板 + 共享约束拼接函数 ~15min
- [x] T-002: OpenAI 图片生成调用封装（单请求超时 + 失败重试一次）~30min

### 功能 2: 并发编排与 Hash

- [x] T-003: `Promise.allSettled` 并发编排三个 Agent 生成 + 全局超时触发缓存 ~30min
- [x] T-004: imageHash/metadataHash/salt 计算与 commitHash 生成函数 ~15min
- [x] T-005: 预置三种风格缓存回退图片 + 缓存读取逻辑 ~30min

### 功能 3: API 接口

- [x] T-006: `POST /api/bounties/:id/generate` 与 `GET /api/jobs/:jobId` 接口实现（含内存 job 状态管理）~30min
- [x] T-007: 补齐 Feature 4 交接契约（agentId/imageHash/metadataURI/salt/payoutAddress/commitHash）及 salt 服务端保密测试 ~15min
- [x] T-008: `POST /api/bounties/:id/generate` 链上 creator 校验 + EIP-191 签名鉴权（codex-review 2026-08-15 finding 1/2 修复），拒绝未授权调用与不存在/超范围的 bountyId ~20min
- [x] T-009: OpenAI 降级为可选软依赖（2026-08-15 用户决策）——`OPENAI_API_KEY` 未配置时 `orchestrate.ts` 跳过网络调用直接用缓存作品，`GET /api/jobs/:jobId` 暴露 `source` 供前端标注 Demo fallback ~15min

## 依赖关系

- T-002 依赖 T-001
- T-003 依赖 T-002、T-005
- T-004 依赖 T-003
- T-006 依赖 T-003、T-004
- T-007 依赖 T-004、T-006
- 本 feature 整体依赖 `1.T-002`（commitHash 计算需与合约公式一致）

## 风险点

- OpenAI 图片生成的真实响应耗时若明显超过预估的 15-30s 超时窗口，需要在演示前用真实网络环境重新校准超时阈值（T-002/T-003）。
- metadataURI 在本 feature 阶段为占位值，真实 IPFS URI 由 `4.T-001` 上传后回填并重算 commitHash，两个 feature 交接处需联调验证一致性。
