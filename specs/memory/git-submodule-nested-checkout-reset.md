---
title: git submodule add 后手动 checkout 会被嵌套 submodule update 重置
feature: 1.smart-contract-core
type: pitfall
tags: [git, submodule, foundry, forge-std, openzeppelin, tooling]
date: 2026-08-14
---

**问题/场景**：把 vendor 进仓库的第三方库（forge-std、openzeppelin-contracts）改造为固定 commit 的真实 git submodule。`git submodule add <url> <path>` 之后在子仓库里 `git checkout <pinned-commit-or-tag>`，然后因为该子仓库自己还有嵌套依赖（如 openzeppelin-contracts 依赖 erc4626-tests / halmos-cheatcodes / forge-std），需要对它跑 `git submodule update --init --recursive` 才能拉齐嵌套内容。

**解法/结论**：重置只发生在**从外层（超级）仓库**对该子模块路径执行 `git submodule update --init --recursive <path>`（或不带路径但覆盖到它）的场景——此时 git 会按外层仓库索引里记录的 gitlink commit（即 `submodule add` 时的默认分支 HEAD，而不是之后手动 checkout 的 pin）把子仓库 HEAD 重置回去。**如果是把工作目录切进子仓库内部再执行 `git submodule update --init --recursive`**（用于拉子仓库自己的嵌套依赖），这条命令只会初始化/更新它自身的嵌套子模块，不会查询、也不会重置外层仓库对它的 gitlink 记录，子仓库自身 HEAD 不受影响。正确顺序是：
1. 外层仓库执行 `git submodule add <url> <path>`（此时外层索引记录的是默认分支 HEAD）
2. `cd <path>`，`git checkout <pinned-tag-or-sha>`（子仓库 HEAD 变为目标 pin，但外层索引仍是第 1 步的旧值，尚未同步）
3. 若该依赖自己还有嵌套 submodule，**继续在子仓库目录内**（不要回到外层仓库、也不要从外层仓库带路径参数调用）执行 `git submodule update --init --recursive` 拉嵌套依赖——此调用不会重置第 2 步设好的 HEAD
4. **切勿**在这一步之前或之后从外层仓库对该路径执行 `git submodule update --init --recursive <path>`，那会用第 1 步记录的旧 commit 覆盖第 2 步的 pin
5. 确认子仓库自身 HEAD 仍是目标 pin（`git rev-parse HEAD`）且嵌套依赖版本符合预期（`git submodule status`）后，回到外层仓库执行 `git add <path>`，把最终 pin 的 commit 写回外层索引（`git status` 应显示为 `A  <path>`，`git diff --stat` 只体现 gitlink 一行变化，不体现子仓库内部文件）

**复用方式**：任何项目把 vendor 依赖迁移为真实 git submodule、且该依赖自身还有嵌套 submodule 时，关键是分清两种调用语境——「从外层仓库对某子模块路径跑 update」会按外层索引重置该子模块；「在子模块目录内部跑 update」只影响它自己的嵌套子模块、不动它自身 HEAD。按上面顺序操作，最后用 `git submodule status`（显示 tag 名如 `(v5.7.0)`）和 `git diff --stat HEAD -- <path>` 双重确认 pin 没有被覆盖，再提交。
