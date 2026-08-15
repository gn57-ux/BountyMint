---
description: 组件规范、状态管理、路由约定
globs: "app/**,src/app/**,components/**,src/components/**"
---

# 前端规范

- 技术栈：Next.js + TypeScript + Tailwind CSS + wagmi/viem（PRD §15.1）。
- MVP 使用单页体验，减少路由和跨页状态同步复杂度（PRD §10）。
- 状态来源分层（PRD §15.2）：
  - 奖金、悬赏状态、Commit/Reveal、获胜者、tokenId → 一律从合约读取，禁止在前端自建为唯一真相源；
  - 图片生成进度 → 后端临时状态（轮询 `GET /api/jobs/:jobId`，P1 可切 SSE）；
  - 作品图片/metadata → 外部存储（IPFS 优先，见 §13.4）。
- 页面刷新后必须能从合约状态和 job 状态恢复关键业务状态（P0 验收项）。
- 视觉还原以现有中文桌面设计稿为主视觉母版；中文稿缺失的状态复用对应英文设计稿的同一组件结构，只换文案，不重排布局（PRD §11.0）。
- 所有用户可见文案通过集中式语言词典管理，默认 `zh-CN`，禁止组件内硬编码文案。
- 动效（Commit 模糊/锁定、Reveal 翻转、奖金流动、NFT 铸造动画等）不得阻塞业务操作，并须支持 `prefers-reduced-motion`（PRD §11.2）。
- 关键交互需要二次确认：`Award` 前必须弹窗确认获胜 Agent、奖金和授权声明（PRD §9.3、§18.2）。
