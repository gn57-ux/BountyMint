# BountyMint

AI-Native Creative Bounties on Monad — 用户锁定奖金发布创意悬赏，多个 Creator Agent 并行创作，Commit/Reveal 公平揭晓，获胜作品自动结算并铸造为 NFT。单人单日黑客松 MVP。

## 技术栈

- 语言: TypeScript（前端/编排器）、Solidity（合约）
- 前端: Next.js + Tailwind CSS + wagmi/viem
- 合约: Foundry + OpenZeppelin（ERC721、ReentrancyGuard、Ownable）
- 部署: Vercel（前端）、Monad 官方指定网络（合约）
- 存储: 优先 IPFS/去中心化存储，回退稳定公网对象存储，再回退项目静态资源
- 不含数据库/独立索引器：链上状态以合约读取为准（PRD §15.2）

> 项目当前仅有 `docs/BountyMint-PRD.md`，尚未生成代码骨架，以下命令为按 PRD 技术栈推荐的标准命令，实际以脚手架生成后的 `package.json` / `foundry.toml` 为准。

## 常用命令

- 安装依赖: `npm install`（前端）、`forge install`（合约）
- 开发运行: `npm run dev`
- 构建: `npm run build`
- 测试: `npm run test`（前端）、`forge test`（合约）
- Lint: `npm run lint`
- 合约部署: `forge script script/Deploy.s.sol --rpc-url $MONAD_RPC_URL --broadcast`

## 目录结构

```
docs/
  BountyMint-PRD.md      # 产品需求文档，唯一权威来源
app/ or src/app/          # Next.js 页面与组件（待创建）
  api/                     # 编排器 API Routes
contracts/ or src/contracts/  # Solidity 合约（待创建）
  BountyMint.sol
test/                     # Foundry 合约测试（待创建）
script/                   # Foundry 部署脚本（待创建）
```

## 规则

@rules/coding-style.md
@rules/testing.md
@rules/security.md
@rules/git-workflow.md
@rules/frontend.md
@rules/backend-api.md
@rules/smart-contract.md
