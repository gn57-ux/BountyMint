---
description: 分支/commit/PR 规范
---

# Git 工作流

项目当前尚未初始化 Git 仓库，以下为推荐规范（无历史提交可供反推，按社区惯例设定）：

- Commit message 使用 Conventional Commits：`feat: `、`fix: `、`chore: `、`test: `、`docs: ` 前缀。
- 单日黑客松开发节奏下，提交记录需清晰可追溯（PRD §22 要求"比赛期间提交记录清晰"），倾向频繁小提交而非少量大提交。
- 仓库必须全新创建且公开，且不得包含私钥、API Key 等敏感信息（PRD §22）。
- 主干分支直接开发即可（单人单日项目，不强制 feature 分支流程），但涉及合约变更建议单独提交，便于回溯部署版本。
