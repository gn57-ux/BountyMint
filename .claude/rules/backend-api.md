---
description: API 设计规范、错误处理、中间件约定
globs: "app/api/**,src/app/api/**,pages/api/**"
---

# 后端 / 编排器规范

- 后端即 Next.js API Routes，承担 Prompt 构建、图片生成调用、存储上传、Commit/Reveal 执行器编排、缓存回退（PRD §15）。
- 核心接口（PRD §16）：
  - `POST /api/bounties/:id/generate` — 接收 brief + 授权声明，返回 `jobId` 与 agent 列表；
  - `GET /api/jobs/:jobId` — 返回各 Agent 状态（`generating/committed/revealed` 等）；轮询是更稳的 P0 实现，SSE（`GET /api/jobs/:jobId/events`）为 P1。
- 三个 Creator Agent（PixelForge / NeonMuse / MythicAI）是确定性角色模板，由同一编排器并行调用同一图片生成服务，不部署独立 Agent 系统（PRD §7.2）。
- 并发策略（PRD §13.2）：
  - 使用 `Promise.allSettled` 并发生成；
  - 每个请求独立超时；单 Agent 失败允许一次重试；
  - 超过全局演示超时后使用该 Agent 的缓存作品；
  - 无论真实生成还是缓存回退，都必须重新计算该悬赏对应的 Commit。
- 缓存降级（PRD §13.3）：预置三种风格的合法备用作品；触发后仍需正常走 metadata 生成、Commit、Reveal 全流程，不得绕过链上流程。
- `executor` 角色代表受信地址，只用于提交/揭晓 Creator Agent 的作品，不得用于提取悬赏资金（PRD §19.1、§12.5）。
- 错误处理需覆盖 PRD §17 的降级表：RPC 失败指数退避重试、图片生成失败一次重试后走缓存、存储失败切换备用存储、Commit 部分失败只重试失败的 Agent。
