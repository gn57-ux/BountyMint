---
title: RainbowKit + Turbopack 构建失败——不选用 Coinbase/Base 钱包也会被拖入 cdp-sdk
feature: 2.wallet-and-bounty-creation
type: pitfall
tags: [rainbowkit, wagmi, turbopack, nextjs, coinbase, wallet-connect, bundling]
date: 2026-08-14
---

**问题/场景**：项目用 `next build`（Turbopack，Next.js 16 默认）+ RainbowKit 2.2.11 + wagmi 2.19.5。即使 `wagmiConfig` 里用 `connectorsForWallets` 显式只选了 `injectedWallet`/`metaMaskWallet`/`rainbowWallet`/`walletConnectWallet`（完全没有引用 Coinbase/Base 相关的 wallet 函数），`next build` 仍然报一串 `Module not found: Can't resolve '@x402/...'`，链路是：`@rainbow-me/rainbowkit/dist/index.js`（RainbowKit 把所有内置钱包连接器都静态打进同一个 `index.js`，不会因为你没 import 某个钱包函数就被摇树掉）→ 静态 import `@wagmi/connectors` 的 `baseAccount.js` → 该文件内部 `await import('@base-org/account')`（真正的动态 import）→ `@base-org/account` → `@coinbase/cdp-sdk` → cdp-sdk 内部又用 `Promise.all([...].map(spec => import(spec)))` 的模式去动态加载一批**根本没安装**的可选支付协议包 `@x402/core/client`、`@x402/evm/exact/client` 等。cdp-sdk 的意图是运行时软失败（这些包缺失时才降级），但 Turbopack 在打包动态 import 目标产物时会**提前静态解析**这些 specifier，缺失就直接编译报错，而不是留到运行时。

**解法/结论**：不要一个一个 alias `@x402/*` 子路径去堵（会挖出更深的坑——比如某个子路径是**静态** `import { toClientEvmSigner } from "@x402/evm"`，空 stub 会因为"具名导出不存在"报另一个错，五个子路径堵完可能还有第六个）。正确做法是在源头拦一次：用 `next.config.ts` 的 `turbopack.resolveAlias` 把 `@base-org/account`（`@wagmi/connectors` 的 `baseAccount.js` 里那一行动态 import 的目标）整个 alias 到一个只导出同名占位函数（`createBaseAccountSDK`）的本地 stub 文件。因为项目根本没有在 `connectorsForWallets` 里选用 Base/Coinbase 钱包，这条连接器分支运行时永远不会被真正调用，stub 抛错也无所谓；关键是 Turbopack 打包阶段再也不会往 `@base-org/account` 更深处（cdp-sdk、x402）走，一次 alias 解决全部级联报错。

**复用方式**：任何项目接入 RainbowKit（不管是走 `getDefaultConfig` 还是手动 `connectorsForWallets`），只要用 Turbopack 构建且不需要 Coinbase Smart Wallet / Base Account 连接器，大概率会先撞到这个问题（这不是本项目代码写错，是 RainbowKit 的钱包连接器没有按选用情况做打包期摇树，且 cdp-sdk 的可选依赖模式和 Turbopack 的动态 import 静态解析策略不兼容）。复现特征：报错链路里能看到 `@wagmi/connectors/.../baseAccount.js` 和 `@coinbase/cdp-sdk`。直接对 `@base-org/account` 做 `turbopack.resolveAlias` 到本地 stub，不用管 RainbowKit/wagmi 具体小版本号——同一条链路大概率复现，除非未来 RainbowKit 把钱包连接器拆成真正按需加载的子包。
