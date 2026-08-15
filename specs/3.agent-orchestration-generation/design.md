# agent-orchestration-generation — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始设计 |

> 跨项目经验检索：`YD_EXPERIENCE_REPO` 未配置，经验增强本次不可用，已跳过，不影响当前工作流。

## 项目架构

- 架构类型: Web3 dApp（单仓库）
- 涉及层: 后端编排器（Next.js API Routes）、外部服务（OpenAI 图片生成）

## 功能模块设计

### 模块 1: Prompt 构建

**涉及层及关键设计:**

- 固定模板（PRD §13.1）：
  ```text
  [System persona]
  You are {agentName}, a specialist in {style}.

  [User brief]
  {bountyBrief}

  [Shared constraints]
  Square composition, one primary character, no text, polished presentation,
  suitable for a digital collectible showcase.
  ```
- 三套 persona 常量（对应 [[backend-api]] 规则）：
  - PixelForge — 像素艺术、限制色板、轮廓清晰；
  - NeonMuse — 赛博朋克、霓虹、电影光影；
  - MythicAI — 奇幻生物、史诗构图、丰富叙事。

### 模块 2: 并发图片生成

**涉及层及关键设计:**

- `Promise.allSettled([genPixelForge(brief), genNeonMuse(brief), genMythicAI(brief)])`，每个子调用内部设超时（建议 15s）+ 失败后一次重试。
- OpenAI 图片生成封装为独立函数 `generateImage(prompt): Promise<Buffer>`，隔离 provider 细节，便于赛后替换。
- 全局编排超时（建议 25-30s）到达后，尚未完成的 Agent 直接标记为 `cache_fallback` 并读取预置图片，不再等待其原始请求。

### 模块 3: Hash 计算与缓存回退

**涉及层及关键设计:**

- `imageHash = keccak256(imageBuffer)`，`metadataHash = keccak256(metadataURI 字符串)`（实际 URI 由 feature 4 上传 Pinata 后回填，本模块先用占位/临时 URI 计算结构，最终 commitHash 由 feature 4 在上传完成后重算一次）。
- `salt = randomBytes(32)`。
- 预置缓存作品：`/assets/fallback/{pixelforge,neonmuse,mythicai}.png` 三张静态图，随包一起部署，触发回退时直接读取本地文件转 Buffer。

### 模块 4: 生成类 API

**涉及层及关键设计:**

- `POST /api/bounties/:id/generate`：入参 `{ brief, licenseDeclaration, signature }`，创建内存态 job（`Map<jobId, JobState>`，进程内，无数据库，符合 PRD §15.2），立即返回 `{ jobId, status: "generating", agents: [...] }`，并异步触发模块 2 的并发生成。
  - 鉴权（codex-review 2026-08-15 finding 1/2 修复）：先用服务端 `publicClient.readContract` 读取链上 `bounties(bountyId)`；`creator` 为零地址（未铸造/ID 超出 `uint256` 编码范围）→ 404。再用 `src/lib/agents/generation-auth.ts` 的 `verifyGenerationSignature` 校验 `signature` 是 `creator` 对 `buildGenerationAuthMessage(bountyId, brief)`（把 brief 的 keccak256 绑进签名消息，防止签名被重放到不同 brief）的 EIP-191 签名 → 不匹配 403。前端（Feature 4 的创作竞技场触发点）在调用本接口前需用悬赏发布者钱包对该消息签名。
- `GET /api/jobs/:jobId`：返回 `{ status, agents: [{ id, name, status }] }`；`status` 字段由三个 Agent 状态聚合（详见 [[backend-api]]）。
- job 状态在服务重启后丢失属预期（无持久化要求），前端刷新恢复依赖链上状态，图片生成进度本身不需要跨会话恢复（PRD §15.2）。

## 接口契约

```json
POST /api/bounties/:id/generate
Request:  { "brief": "...", "licenseDeclaration": "Non-exclusive commercial display", "signature": "0x..." }
  // signature = creator wallet's EIP-191 personal-sign over buildGenerationAuthMessage(bountyId, brief)
Response: { "jobId": "job_123", "status": "generating", "agents": ["PixelForge", "NeonMuse", "MythicAI"] }

GET /api/jobs/:jobId
Response: { "status": "committed", "agents": [{ "id": 1, "name": "PixelForge", "status": "committed", "imageHash": "0x...", "metadataURI": "pending://...", "payoutAddress": "0x...", "commitHash": "0x..." }, ...] }
```

## 数据模型

进程内内存 Map（非持久化）：`jobId -> { bountyId, agents: [{ agentId, name, status, imageBuffer?, imageHash?, metadataURI?, salt?, payoutAddress, commitHash?, error? }] }`。`salt` 只保存在服务端 job 内部，Commit 完成前不得通过公共 GET 响应泄露；Feature 4 上传 IPFS 后以真实 `metadataURI` 重算并覆盖最终 `commitHash`。

## 安全考虑

- OpenAI API Key 通过服务端环境变量注入，遵循 [[security]]，不进入前端 bundle、日志或 Git。
- 图片生成失败信息只记录必要错误类型，不记录完整 API 响应体（避免意外泄露 Key 相关信息）。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 图片生成服务商 | OpenAI (gpt-image/DALL·E) | 用户已确认；官方 SDK 简单、出图质量稳定、按次计费适合演示规模 |
| Job 状态存储 | 进程内内存 Map | PRD §15.2 明确不引入数据库，且生成进度属临时状态非业务状态；已知代价：Vercel 多实例下 POST 与轮询 GET 可能落在不同实例导致 404，判定为黑客松演示规模下可接受的风险而非缺陷，细节见 `specs/memory/vercel-serverless-in-memory-job-store-tradeoff.md` |
| 轮询 vs SSE | 轮询（P0），SSE 留作 P1 | PRD §16 明确轮询是更稳的 P0 实现 |
