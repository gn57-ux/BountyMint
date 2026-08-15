# BountyMint

> BountyMint is an AI-native creative bounty protocol on Monad: post a vision, let creator agents compete, and automatically reward and mint the winning work.

BountyMint 是部署在 Monad 上的 AI 原生创作悬赏协议。用户锁定奖金并发布创意需求，多个 Creator Agent 以不同风格并行创作，作品通过 Commit/Reveal 机制公平揭晓。用户选出获胜作品后，合约自动支付奖励并铸造带有创作来源、内容哈希和授权声明的 NFT。

## 部署信息

| 项 | 值 |
| --- | --- |
| 网络 | Monad Testnet（Chain ID `10143`） |
| RPC | `https://testnet-rpc.monad.xyz/` |
| Explorer | `https://testnet.monadexplorer.com/` |
| 合约地址 | [`0x253722F7A82321979CC4a0eE876C9399907C971C`](https://testnet.monadexplorer.com/address/0x253722F7A82321979CC4a0eE876C9399907C971C) |
| 部署交易 | [`0x45073e4690defc5502f3e4a814e1f6d4f27d33376e1f5ecb9c40cb41653fc910`](https://testnet.monadexplorer.com/tx/0x45073e4690defc5502f3e4a814e1f6d4f27d33376e1f5ecb9c40cb41653fc910) |
| 公网 Demo URL | `<TBD: Vercel 部署后填入>` |
| 一笔真实创建悬赏交易 | `<TBD: 端到端演示后填入>` |
| 一笔真实 Award/NFT 铸造交易 | `<TBD: 端到端演示后填入>` |

## 技术架构

```text
Browser
├── Next.js UI
├── wagmi / viem wallet client
└── contract reads and writes
          │
          ├─────────────── Monad RPC
          │                       │
          │                 BountyMint.sol
          │
          └── Next.js API / Orchestrator
                  ├── Prompt builder
                  ├── Image generation provider (OpenAI，可选)
                  ├── Storage uploader (Pinata / IPFS)
                  ├── Commit/Reveal executor
                  └── Cache fallback
```

- 前端：Next.js + TypeScript + Tailwind CSS + wagmi/viem + RainbowKit
- 合约：Solidity + Foundry + OpenZeppelin（ERC721、ReentrancyGuard、Ownable）
- 状态来源：奖金/Commit/Reveal/获胜者/tokenId 一律从合约读取；生成进度是后端临时状态；不引入数据库
- 图片生成为可选软依赖：未配置 `OPENAI_API_KEY` 时自动使用 `public/assets/fallback/` 下预置作品，Commit/Reveal/Award 仍走真实链上流程

## 本地运行

### 前端 + 编排器

```bash
npm install
cp .env.example .env
npm run dev
```

### 合约（Foundry）

```bash
cd contracts
forge install
cp .env.example .env
forge test
```

部署（需要真实 Monad Testnet MON 与部署者私钥，见 `contracts/.env.example`）：

```bash
cd contracts
source .env
forge script script/Deploy.s.sol --rpc-url "$MONAD_RPC_URL" --broadcast
```

部署成功后，把输出的合约地址写入根目录 `.env`（`NEXT_PUBLIC_BOUNTY_MINT_ADDRESS`）以及本文件顶部的部署信息表格。

## 环境变量

根目录 `.env.example` 与 `contracts/.env.example` 只列变量名，不含真实值：

- `NEXT_PUBLIC_MONAD_RPC_URL` / `NEXT_PUBLIC_MONAD_CHAIN_ID` / `NEXT_PUBLIC_MONAD_EXPLORER_URL` — Monad 网络参数
- `NEXT_PUBLIC_BOUNTY_MINT_ADDRESS` — 合约部署地址
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — RainbowKit 钱包连接
- `OPENAI_API_KEY` — 可选，图片生成软依赖
- `PINATA_JWT` — 图片/metadata 上传 IPFS
- `EXECUTOR_PRIVATE_KEY` — 服务端 executor，仅用于提交/揭晓作品，不可提取悬赏资金
- `AGENT_PAYOUT_ADDRESS_{PIXELFORGE,NEONMUSE,MYTHICAI}` — 各 Creator Agent 收款地址（未设置时回退到 Anvil 测试地址）
- `APP_URL` — 本应用公网 Origin，用于 NFT metadata 的 `external_url`

`contracts/.env.example` 另含 `DEPLOYER_PRIVATE_KEY`、`EXECUTOR_ADDRESS`、`MONAD_CHAIN_ID` 等部署脚本用变量。

所有私钥/API Key 只通过部署平台（Vercel）环境变量注入，不写入代码仓库。

## 核心流程

1. 连接钱包，发布悬赏（描述 + 奖金 + 截止时间 + 授权声明），锁定 MON 到合约。
2. 签名授权后触发三个 Creator Agent（PixelForge / NeonMuse / MythicAI）并行创作。
3. 图片与 metadata 上传 IPFS，executor 提交三笔 `commitWork`。
4. 三笔提交全部完成后，executor 依次提交 `revealWork`，三份作品同时揭晓。
5. 发布者选择获胜作品，二次确认后调用 `awardWinner`：合约支付奖励并铸造 NFT。
6. 结果页展示真实交易 Hash、NFT tokenId、`ownerOf` 校验与 Monad Explorer 链接。

## 演示脚本（60-90 秒）

1. **开场**：今天 AI 能快速生成内容，但创作委托仍然依赖平台、人工比较和付款承诺。BountyMint 把创意需求、AI 竞争、作品证明和奖励结算放进同一条 Monad 链上流程。
2. **创建**：发布一个"Monad 赛博朋克守护兽"的需求，并锁定 1 MON。奖金已经进入合约，获胜创作者不需要相信平台会不会付款。
3. **创作与 Reveal**：三个 Creator Agent 正在以不同风格并行创作。作品先提交 Hash，在所有提交完成前不会公开，因此不能看到别人的作品后再复制。现在三个作品同时揭晓。
4. **结算**：选择获胜作品，合约在同一条业务流程里向创作者支付奖励，并把获胜作品铸造成 NFT。这里是实际交易、作品 Hash、授权声明和 Monad 浏览器记录。
5. **结尾**：普通 NFT 市场等待用户购买已经存在的作品；BountyMint 让需求和奖金先出现，让 AI 创作者围绕真实创意竞争。

## 已知范围限制

- 本次演示范围为桌面 Chrome，不含移动端适配。
- 默认语言为简体中文，未提供英文切换。
- 无数据库：图片生成进度是进程内临时状态，见 `specs/memory/vercel-serverless-in-memory-job-store-tradeoff.md`。
