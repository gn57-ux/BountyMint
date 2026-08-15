---
title: 进程内内存 job store 在 Vercel Serverless 多实例下无法跨实例共享——已知且接受的取舍
feature: 3.agent-orchestration-generation
type: decision
tags: [vercel, serverless, in-memory-store, tradeoff, prd-15.2]
date: 2026-08-15
---

**问题/场景**：`src/lib/jobs.ts` 用进程内 `Map<jobId, JobState>` 保存图片生成进度（`POST /api/bounties/:id/generate` 写入，`GET /api/jobs/:jobId` 读取）。Codex review 判定这是 P1：Vercel Serverless 函数默认多实例，POST 和之后的轮询 GET 完全可能落在不同的暖实例上，导致 GET 读不到 POST 写的 jobId，返回 404；实例回收也会丢掉全部进度。这个判断在通用 Serverless 场景下是对的。

**解法/结论**：不引入数据库或外部共享存储来修这个问题——这是本项目已经做过的、有意的取舍，不是遗漏：

- PRD §15.2 明确区分"业务状态"（悬赏/Commit/Reveal/获胜者/tokenId，必须以合约读取为准）和"生成进度"（临时后端状态，允许轮询丢失）；job store 属于后者，设计上本来就不要求跨会话/跨实例持久化。
- 黑客松演示环境是单一活跃实例连续跑完一次完整流程（创建悬赏 → 触发生成 → 轮询到完成 → Commit/Reveal → Award），不涉及长时间运行后 Vercel 扩缩容出多个实例的场景；真正出现"POST 和 GET 落在不同实例"的情况需要相当的并发流量或实例被回收后冷启动，这在演示用途下概率极低。
- 加一个外部共享存储（Redis/KV/数据库）来解决这个理论风险，本身就违反 PRD §15.2"不含数据库/独立索引器"的硬约束，属于为小概率场景引入不成比例的架构复杂度。
- 已用的缓解手段：`src/app/api/bounties/[id]/generate/route.ts` 用 `after()`（而不是裸的 fire-and-forget promise）注册后台编排任务，确保同一次调用里 Serverless 函数不会在响应返回后被立刻回收——这解决的是"同一实例内响应已返回、进程被杀导致生成中断"的问题（codex review 003036 的 finding 2），和"跨实例 Map 不共享"（finding 1）是两个不同的风险点，不能混为一谈。

**复用方式**：以后如果哪个 feature 想直接照抄这个"进程内 Map"模式去存业务状态（悬赏结果、Commit/Reveal 记录、获胜者等），要先确认那类状态是不是本来就该以链上读取为准——如果是，同样接受"内存态可丢失、前端从链上恢复"的设计；如果那类状态本身就是唯一权威来源（没有链上或其他持久层兜底），进程内 Map 就不再是可接受的取舍，必须用持久化存储，不能照搬这条记录里的结论。
