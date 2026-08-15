# 经验时间线

## 2026-08-14 — Feature 1: smart-contract-core / 依赖改造为真实 Submodule

- 把 vendor 进来的 `contracts/lib/forge-std`、`contracts/lib/openzeppelin-contracts` 换成固定 commit 的真实 git submodule 时，`git submodule add` 后手动 `git checkout <pin>` 到子仓库里；如果之后**从外层仓库**对该子模块路径执行 `git submodule update --init --recursive`，会把子仓库 HEAD 重置回 `git submodule add` 当时记录的旧 commit，手动 checkout 的 pin 会丢失。若是**切进子仓库目录内部**执行同一条命令（为了拉它自己的嵌套 lib，如 openzeppelin-contracts 依赖的 erc4626-tests/forge-std/halmos-cheatcodes），则不会查询外层索引、也不会重置子仓库自身 HEAD。正确顺序：先 `submodule add` → 进子仓库 `checkout` 到目标 tag/commit → **仍在子仓库目录内**跑 `submodule update --init --recursive` 拉嵌套依赖（不要从外层仓库带路径调用同一命令）→ 确认子仓库 HEAD 与嵌套依赖版本都正确后，回到外层仓库 **重新 `git add` 该子模块路径**，把最终 pin 的 commit 写回外层索引。详见 [[git-submodule-nested-checkout-reset]]。
- `contracts/.gitignore` 只写了 `codex-review/`，虽然根目录 `.gitignore` 已经忽略 `.env`/`out/`/`cache/`/`broadcast/`（无前导 `/` 的规则任意深度生效），Codex review 仍判定为 P1：子目录作为独立 Foundry 工程时其 `.gitignore` 应自包含，不应依赖根目录规则隐式生效。已在 `contracts/.gitignore` 显式补齐。
- 合约 `commitWork`/`revealWork` 最初只在 `refundExpiredBounty` 里校验 `deadline`，Commit/Reveal 阶段完全不检查，导致过期悬赏仍可继续接受提交、与退款交易产生排序竞争。已在两个函数入口加 `require(block.timestamp <= bounty.deadline, ...)`。详见 [[contract-submission-deadline-enforcement]]。
