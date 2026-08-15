# agent-orchestration-generation — 需求规格

## 概述

实现后端编排器：三套 Creator Agent Prompt、OpenAI 并发图片生成、内容 Hash 计算、缓存回退，以及生成状态查询 API，覆盖 PRD §13、§16 与用户流程 §9.2 前半段。

## 项目信息

- 项目名: bounty-mint
- 架构类型: Web3 dApp（单仓库：前端 + API 编排器 + Solidity 合约，无数据库）

## 需求版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始需求 |

## 用户故事

- 作为悬赏发布者，我希望三个 Creator Agent 并行创作，以便快速获得多个风格化方案。
- 作为系统，我希望图片 API 失败时自动使用缓存作品，以便演示不因外部服务故障中断。

## 功能需求

1. [F-001] 定义 PixelForge / NeonMuse / MythicAI 三套固定 persona 与风格 Prompt 模板，用户 Brief 动态注入共享约束（PRD §13.1）。
2. [F-002] 使用 OpenAI 图片生成 API，对三个 Agent 并发调用（`Promise.allSettled`），每个请求独立超时。
3. [F-003] 单个 Agent 生成失败时允许一次重试；超过全局演示超时后改用该 Agent 的预置缓存作品。
4. [F-004] 为每张图片（真实生成或缓存）计算 `imageHash`、`metadataHash`、随机 `salt`，并推导 `commitHash`（复用 `1.smart-contract-core` 的计算公式）。
5. [F-005] 提供 `POST /api/bounties/:id/generate` 接收 `brief`、`licenseDeclaration` 与 `signature`，返回 `jobId` 与三 Agent 列表；提供 `GET /api/jobs/:jobId` 返回各 Agent 当前状态。
6. [F-006] 每个 Agent 的 job 结果必须保留并向 Feature 4 交付 `agentId`、`imageHash`、`metadataURI`（允许待上传占位）、`salt`、`payoutAddress`、`commitHash`；不得以图片 URL 作为唯一输出。
7. [F-007] `POST /api/bounties/:id/generate` 必须先从链上读取该 `bountyId` 对应的 `creator`（不存在则 404），再校验调用方提供的 `signature` 是对 `buildGenerationAuthMessage(bountyId, brief)` 的 EIP-191 签名且恢复地址等于 `creator`；未通过校验一律拒绝创建 job，防止任何知道 bountyId 的匿名调用者抢先提交内容并消耗付费生成额度（codex-review 2026-08-15 finding）。

## 非功能需求

- 性能: 三个 Agent 并发生成的全局超时需控制在可支撑 60-90 秒演示节奏内（具体超时阈值由 `3.T-002` 实现时设定，建议 20-30 秒后触发缓存回退）。
- 安全: OpenAI API Key 仅存在于服务端环境变量，不暴露给前端。
- 兼容性: 图片存储的实际上传由 `4.commit-reveal-execution` 负责，本 feature 只产出图片二进制/URL 与其 Hash。

## 验收标准

- [ ] [AC-001] 三个 Agent 的 Prompt 内容不同且均包含用户 Brief 与共享约束。
- [ ] [AC-002] 正常网络下三个 Agent 均返回图片且风格可区分。
- [ ] [AC-003] 模拟 OpenAI API 超时/失败，验证一次重试后仍失败会自动切换到缓存作品。
- [ ] [AC-004] 无论真实生成或缓存回退，`commitHash` 均能正确计算且与 `1.smart-contract-core` 的公式一致。
- [ ] [AC-005] `GET /api/jobs/:jobId` 能正确反映三个 Agent 各自的实时状态（generating/committed 等，committed 状态由 feature 4 驱动更新）。
- [ ] [AC-006] 三个 Agent 均产出 Feature 4 所需完整字段，`agentId` 固定为 1/2/3，Hash/salt 为 32 字节值，且任何私密 salt 不会在 Commit 完成前返回给浏览器。
- [ ] [AC-007] 未提供签名、签名与链上 `creator` 不匹配、或 `bountyId` 在链上不存在时，`POST /api/bounties/:id/generate` 一律拒绝（400/403/404）且不创建 job、不触发 OpenAI 调用。

## 依赖

- `1.smart-contract-core`（commitHash 计算公式一致性）
- OpenAI 图片生成 API（gpt-image / DALL·E，已确认）

## 开放问题

- 无（OpenAI 已确认为图片生成服务商）
