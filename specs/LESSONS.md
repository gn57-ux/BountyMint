# 经验时间线

## 2026-08-14 — Feature 1: smart-contract-core / 依赖改造为真实 Submodule

- 把 vendor 进来的 `contracts/lib/forge-std`、`contracts/lib/openzeppelin-contracts` 换成固定 commit 的真实 git submodule 时，`git submodule add` 后手动 `git checkout <pin>` 到子仓库里；如果之后**从外层仓库**对该子模块路径执行 `git submodule update --init --recursive`，会把子仓库 HEAD 重置回 `git submodule add` 当时记录的旧 commit，手动 checkout 的 pin 会丢失。若是**切进子仓库目录内部**执行同一条命令（为了拉它自己的嵌套 lib，如 openzeppelin-contracts 依赖的 erc4626-tests/forge-std/halmos-cheatcodes），则不会查询外层索引、也不会重置子仓库自身 HEAD。正确顺序：先 `submodule add` → 进子仓库 `checkout` 到目标 tag/commit → **仍在子仓库目录内**跑 `submodule update --init --recursive` 拉嵌套依赖（不要从外层仓库带路径调用同一命令）→ 确认子仓库 HEAD 与嵌套依赖版本都正确后，回到外层仓库 **重新 `git add` 该子模块路径**，把最终 pin 的 commit 写回外层索引。详见 [[git-submodule-nested-checkout-reset]]。
- `contracts/.gitignore` 只写了 `codex-review/`，虽然根目录 `.gitignore` 已经忽略 `.env`/`out/`/`cache/`/`broadcast/`（无前导 `/` 的规则任意深度生效），Codex review 仍判定为 P1：子目录作为独立 Foundry 工程时其 `.gitignore` 应自包含，不应依赖根目录规则隐式生效。已在 `contracts/.gitignore` 显式补齐。
- 合约 `commitWork`/`revealWork` 最初只在 `refundExpiredBounty` 里校验 `deadline`，Commit/Reveal 阶段完全不检查，导致过期悬赏仍可继续接受提交、与退款交易产生排序竞争。已在两个函数入口加 `require(block.timestamp <= bounty.deadline, ...)`。详见 [[contract-submission-deadline-enforcement]]。

## 2026-08-14 — Feature 2: wallet-and-bounty-creation / Next.js 脚手架 + 钱包连接 + 创建悬赏

- 仓库当时还没有前端骨架，`npx create-next-app@latest .` 在仓库名含大写字母（`BountyMint`）时会因 npm 包名限制直接拒绝创建；改为在临时目录脚手架化，再把生成的文件（`src/`、`public/`、`package.json` 等）搬进仓库根目录，并把 `package.json`/`package-lock.json` 里的 `name` 手动改成合法的 `bounty-mint`。
- 本项目实际用的是 Next.js 16（这套沙箱环境的时间线比训练数据新），行为和约定与训练数据里的 Next.js 有实质性差异（`next dev` 会自动生成/维护根目录 `AGENTS.md`/`CLAUDE.md`，提示"写代码前先读 `node_modules/next/dist/docs/`"）。开发前先读了 `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`，确认了几个直接影响写法的点：`params`/`searchParams` 全面异步化、`LayoutProps<'/'>` 等全局类型 helper 需要跑一次 `next build`/`next dev`（而不是裸 `tsc --noEmit`）才能生成、Turbopack 默认开启。**如果后续 feature 还在这个 Next 16 环境里开发，同样先读一遍这份 upgrade 文档，不要直接套训练数据里的 Next.js 13/14/15 写法。**
- `tsconfig.json` 里 `target: "ES2017"`（create-next-app 生成的默认值）不支持 BigInt 字面量（如 `0n`），而 wagmi/viem 的合约金额、chainId 比较大量用到 bigint 字面量，编译期会报 `BigInt literals are not available when targeting lower than ES2020`。改成 `target: "ES2020"` 解决；接下来的 feature（尤其涉及合约调用的）不用再重复踩这个坑。
- RainbowKit（2.2.11）要求 `wagmi: ^2.9.0`，但 npm 上 wagmi 最新已经是 3.x，装 `wagmi@latest` 会与 RainbowKit peer dep 冲突；显式装 `wagmi@2.19.5`（v2 线最新版）才对齐。design.md 里"风险点"提前预判了这个版本兼容问题，属于按预案排查即解决。
- RainbowKit + Turbopack（`next build`）在完全不选用 Coinbase/Base 钱包的情况下仍会因为其内置连接器打包方式，级联报出一串 `@x402/*` 找不到模块的构建错误；根因和一次性解法见 [[rainbowkit-turbopack-base-account-bundle-break]]，是这次 Feature 2 里最花时间定位的坑，值得后续任何 RainbowKit + Turbopack 项目直接复用结论。
- 悬赏发布表单没有沿用 Stitch 设计稿里"授权声明"用下拉选择许可类型（CC0/Commercial/Personal）的样式，而是换成了单个 checkbox + PRD §7.1 的固定授权文案——因为 `specs/2.wallet-and-bounty-creation/requirements.md`/`design.md`（经用户确认的权威规格）明确写的是"checkbox，固定文案"，与 Stitch 视觉稿的下拉选择器不一致时，功能规格优先于视觉稿的具体控件类型，视觉稿只作为布局/间距/组件结构的母版。
