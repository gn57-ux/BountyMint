---
title: Node 原生 test runner 跑 TS 测试的三个坑（extension、glob、tsconfig）
feature: 3.agent-orchestration-generation
type: reusable
tags: [node, testing, typescript, node:test, tsconfig]
date: 2026-08-15
---

**问题/场景**：项目没有引入 Vitest/Jest，直接用 Node 22（v22.22.3，内置 TS type-stripping）自带的 `node --test` 跑 `.test.ts` 文件（`src/lib/hash.test.ts`、`src/lib/jobs.test.ts`）。踩了三个坑，每个都会让测试直接跑不起来或报出误导性错误：

1. **相对导入不能省略 `.ts` 后缀**：TypeScript 项目里 `import { x } from "./hash"`（省略扩展名）是常规写法，Turbopack/webpack 这类 bundler 都认，但 Node 的原生 ESM resolver 不会像 bundler 那样自动尝试 `.ts` 后缀，会直接报 `ERR_MODULE_NOT_FOUND`。必须显式写成 `import { x } from "./hash.ts"`。
2. **显式 `.ts` 后缀反过来会被 `tsc`（`next build` 的类型检查阶段）拒绝**：报 `TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled`。需要在 `tsconfig.json` 的 `compilerOptions` 里加 `"allowImportingTsExtensions": true`（前提是已经有 `"noEmit": true` 或 `"emitDeclarationOnly": true`，本项目本来就是 `noEmit: true`，加这一项没有副作用）。
3. **CLI 参数不能传目录名**：`node --test src` 或 `node --test ./src` 会把 `src` 当成一个要 `require()` 的模块路径去解析，直接报 `Cannot find module '.../src'`，而不是像常见测试框架那样把目录当成递归搜索根。不传路径参数（裸 `node --test`）确实会从 cwd 递归发现所有 `*.test.*` 文件，但**会连仓库里所有其他目录一起扫**——本项目的 `contracts/lib/openzeppelin-contracts/test/` 里一大堆用 Hardhat/Mocha 写的 `.test.js` 文件（依赖 `hardhat` 包，这个 JS 项目里根本没装）全部被当成测试文件跑，直接炸掉几百个不相关的失败。正确写法是显式传 glob 字符串（整个字符串要加引号，防止 shell 自己展开）：`node --test 'src/**/*.test.ts'`，Node 自己会按 glob 展开、且只匹配这个模式下的文件。

**复用方式**：后续 feature（4/5/6/7）如果继续用 `node --test` 加测试文件，直接照抄这三点：新测试文件里相对 import 一律带 `.ts`；`tsconfig.json` 的 `allowImportingTsExtensions` 已经开了不用重复配置；`package.json` 的 `"test"` 脚本已经是 `node --test 'src/**/*.test.ts'` 这个安全 glob，新增测试文件只要放在 `src/**/*.test.ts` 路径下就会被自动发现，不需要改脚本。如果后续想测 React 组件（不只是纯逻辑），`node --test` 没有 DOM/JSX 环境，那时候再评估要不要引入 Vitest，不要生搬硬套这套裸 Node 方案。
