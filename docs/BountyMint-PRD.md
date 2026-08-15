# BountyMint PRD

> AI-Native Creative Bounties on Monad  
> **Post a vision. Let agents compete. Mint the winner.**

## 1. 文档信息

| 项目 | 内容 |
|---|---|
| 产品名称 | BountyMint |
| 文档版本 | v1.0 Hackathon MVP |
| 产品形态 | Monad 链上 AI 创作悬赏 DApp |
| 开发模式 | 单人、单日完成 |
| 目标网络 | Monad 官方指定可用网络，以比赛当天文档为准 |
| 目标交付 | 公网 Demo、公开 GitHub、已部署合约、真实链上交易、演示视频 |
| 核心受众 | 黑客松评委、Monad 用户、AI 创作者与数字资产爱好者 |

## 2. 产品摘要

BountyMint 是一个部署在 Monad 上的 AI 原生创作悬赏协议。用户输入创作需求并锁定 MON 奖金，多个具有不同风格策略的 Creator Agent 并行生成作品。作品先提交哈希承诺，再统一揭晓；用户选择获胜作品后，合约自动向获胜创作者支付奖金，并把作品铸造成带有创作来源、提示词摘要、授权声明和链上证明的 NFT。

MVP 重点不是搭建完整 NFT Marketplace，而是展示一条无需平台托管的完整创作交易链路：

```text
发布创意与锁定奖金
→ 多个 Creator Agent 并行创作
→ Commit 防抢跑
→ Reveal 同时揭晓
→ 用户选择获胜作品
→ 奖金自动结算
→ 获胜作品铸造
```

## 3. 背景与问题

AI 降低了数字内容生产成本，但创意委托仍存在以下问题：

1. 买方需要在多个工具或创作者之间反复尝试，无法直接围绕同一需求比较结果。
2. 创作者提交作品后，付款依赖中心化平台或人工承诺。
3. AI 作品的生成来源、提交时间和提示词声明缺少可验证记录。
4. 普通 NFT 平台以“先创作、再上架”为中心，不能表达“需求和奖金先出现、创作者围绕需求竞争”的过程。

BountyMint 将悬赏、作品提交、选择、付款和铸造组合成一个可验证流程。

## 4. 产品目标

### 4.1 MVP 目标

在一次 60–90 秒的演示中，让用户完成：

1. 连接钱包；
2. 输入创意并锁定测试 MON；
3. 看到三个 Creator Agent 并行创作；
4. 看到三个作品完成 Commit 并统一 Reveal；
5. 选择一个获胜作品；
6. 在同一笔业务流程中完成奖金支付和 NFT 铸造；
7. 查看真实交易哈希和链上作品证明。

### 4.2 成功标准

- 公网环境可以从创建悬赏运行到铸造成功；
- 至少产生一条真实 Monad 悬赏与结算记录；
- 获胜 Agent 地址收到奖金；
- 悬赏发布者收到获胜 NFT；
- 页面显示可点击的区块浏览器交易链接；
- 图片 API 失败时，演示仍能使用缓存作品完成；
- 页面刷新后能够从合约恢复关键业务状态；
- 评委无需阅读 README 即可理解产品流程。

### 4.3 非目标

MVP 不解决：

- 法律意义上的版权确权；
- NFT 二级市场；
- DAO 与平台 Token；
- 去中心化 AI 推理；
- 通用仲裁；
- AI 自动评判作品质量；
- 多链与跨链；
- 完整用户账户体系；
- 生产级内容安全与侵权检测。

## 5. 产品定位与差异化

### 5.1 定位

**BountyMint 是需求驱动的 AI 创作协议，不是普通 NFT Marketplace。**

| 类型 | 核心流程 |
|---|---|
| NFT Marketplace | 创作者先铸造，买方再浏览购买 |
| AI 图片工具 | 用户选择模型并单次生成 |
| 自由职业平台 | 发布需求、人工应标、人工交付和付款 |
| BountyMint | 需求和奖金先上链，多个 Agent 竞争，选择后自动结算并铸造 |

### 5.2 核心创新点

1. **Demand-first creation**：创作围绕公开需求与已锁定奖金发生。
2. **Multi-agent creative competition**：多个风格 Agent 对同一 Brief 并行产出。
3. **Commit/Reveal provenance**：作品先承诺、后揭晓，证明提交顺序并降低复制与抢跑风险。
4. **Atomic award and mint**：选中作品后，奖励支付与 NFT 铸造在同一业务动作中完成。

### 5.3 正确版权表述

产品只声明：

> BountyMint 在链上记录作品来源声明、提交时间、内容哈希、授权条款摘要和结算关系，为作品归属与交易提供可验证证据。

不得宣传“区块链自动获得版权”或“NFT 等于法律版权”。

## 6. 目标用户与用户故事

### 6.1 MVP 用户

- 希望快速获得多个创意方向的普通用户；
- 游戏、社区或品牌活动的内容需求方；
- 使用 AI 工具创作数字内容的创作者；
- 希望体验 Monad 链上应用的用户。

### 6.2 核心用户故事

**作为悬赏发布者**，我希望输入一个创作想法并锁定奖金，以便多个 AI Creator 围绕同一需求生成方案。

**作为悬赏发布者**，我希望作品同时揭晓，以便公平比较不同创作风格。

**作为悬赏发布者**，我希望选中作品后自动付款和铸造，以便获得可验证的数字资产。

**作为 Creator Agent**，我希望我的作品提交时间、内容哈希和获奖记录被写入链上，以便形成公开的创作履历。

## 7. 核心演示场景

### 7.1 默认创作 Brief

```text
为 Monad 创作一个赛博朋克守护兽。
要求：紫色能量、未来城市背景、适合作为社区头像。
奖金：1 MON。
授权声明：获胜作品允许悬赏发布者用于非独占商业展示。
```

### 7.2 Creator Agent

| Agent | 定位 | 风格策略 |
|---|---|---|
| PixelForge | 游戏资产设计师 | 像素艺术、限制色板、轮廓清晰 |
| NeonMuse | 未来主义视觉设计师 | 赛博朋克、霓虹、电影光影 |
| MythicAI | 世界观概念艺术家 | 奇幻生物、史诗构图、丰富叙事 |

三个 Agent 是三个确定性角色模板，由同一个后端编排器并行调用同一个图片生成服务，不要求部署三个独立 Agent 系统。

### 7.3 演示高潮

三个作品生成后保持模糊，只展示已确认的 Commit 状态。全部 Commit 完成后，作品同时 Reveal。用户选择 `NeonMuse`，页面展示：

```text
BOUNTY WINNER
NeonMuse Agent

Reward: 1 MON
Provenance: Verified
License: Commercial Use Declaration
NFT: Minted on Monad
```

随后展示资金流动画、NFT 铸造动画和真实区块浏览器链接。

## 8. 功能范围与优先级

### 8.1 P0：必须完成

| 模块 | 功能 | 验收标准 |
|---|---|---|
| 钱包 | 连接钱包、校验网络、切换网络 | 用户能看到地址和 MON 余额 |
| 悬赏 | 输入 Brief、奖金、截止时间、授权声明 | 合约创建悬赏并锁定 MON |
| Agent 编排 | 三套 Prompt 并行调用图片 API | 返回三张不同风格图片或触发缓存回退 |
| Commit | 计算作品承诺 Hash 并写入合约 | 合约存在三个 Agent 的 Commit 事件 |
| Reveal | 验证 salt 与 metadata 对应 Commit | 三个作品均能成功 Reveal |
| 选择获胜者 | 发布者选择一个已 Reveal 作品 | 非发布者和重复选择必须失败 |
| 结算 | 向获胜创作者地址支付奖金 | 获胜地址余额变化，合约余额正确 |
| NFT | 为发布者铸造获胜作品 | `ownerOf(tokenId)` 为发布者 |
| 证明 | 展示 Prompt Hash、图片 Hash、交易 Hash | 链接能打开对应浏览器页面 |
| 可靠性 | 缓存回退、错误提示、状态恢复 | 图片 API 失败或刷新页面后仍可继续演示 |

### 8.2 P1：核心完成后再做

- 创作阶段 SSE 实时状态；
- 图片揭晓动画；
- 奖金资金流动画；
- Agent 历史获奖次数；
- 分享获胜作品；
- 简单画廊展示已完成悬赏；
- 将图片和 metadata 上传 IPFS。

### 8.3 P2：赛后功能

- 社区投票和加权评审；
- 多轮淘汰赛；
- 创作者自行注册 Agent；
- ERC-20 奖金；
- 版税自动分账；
- 二级市场；
- 争议和仲裁；
- 内容安全、相似度与侵权检测；
- 多模型、多提供商路由；
- Creator Agent 声誉与跨平台身份。

## 9. 用户流程

### 9.1 创建悬赏

1. 用户打开首页；
2. 点击 `Connect Wallet`；
3. 输入 Brief 或使用默认 Brief；
4. 选择奖金金额；
5. 确认授权声明；
6. 点击 `Launch Bounty`；
7. 钱包确认交易；
8. 页面进入 `CREATING` 状态。

### 9.2 Agent 创作与提交

1. 后端接收 `bountyId` 和 Brief；
2. 编排器构建三份风格 Prompt；
3. 并发调用图片生成 API；
4. 每张图片生成 `imageHash`、`metadataHash` 和随机 `salt`；
5. 计算 `commitHash`；
6. 通过执行器提交三个 Commit；
7. 全部完成后上传 metadata；
8. 调用 Reveal；
9. 前端统一展示三张作品。

### 9.3 选择、付款与铸造

1. 用户点击一张作品；
2. 弹窗确认获胜 Agent、奖金和授权；
3. 用户调用 `awardWinner`；
4. 合约验证调用者和悬赏状态；
5. 合约更新状态；
6. 合约支付奖金；
7. 合约为发布者铸造 NFT；
8. 页面展示获胜状态、tokenId 和交易链接。

### 9.4 退款

若截止时间后没有成功 Reveal 或发布者未能完成流程，发布者可调用退款。已完成结算的悬赏不可退款。

## 10. 信息架构与界面

MVP 使用单页体验，减少路由和状态同步复杂度。

### 10.1 顶部导航

- BountyMint Logo；
- `How it works`；
- 网络状态；
- 钱包按钮。

### 10.2 Hero / 创建区

- 标题：`Post a vision. Let agents compete. Mint the winner.`；
- Brief 输入框；
- 奖金输入；
- 授权声明选择；
- `Launch Bounty` 按钮。

### 10.3 创作竞技场

三个 Creator 卡片横向排列，每张卡包含：

- Agent 名称与头像；
- 风格说明；
- 状态：`Ideating / Generating / Committed / Revealed`；
- 模糊或清晰作品；
- Commit Hash 缩略值；
- 选择按钮。

### 10.4 链上时间线

```text
Bounty Created
→ Reward Escrowed
→ 3 Agents Generating
→ 3 Works Committed
→ Works Revealed
→ Winner Selected
→ Reward Paid
→ NFT Minted
```

每个完成节点显示交易状态；关键节点提供浏览器链接。

### 10.5 获胜结果

- 大图展示获胜作品；
- Creator Agent；
- 奖励金额；
- NFT tokenId；
- 图片和 Prompt Hash；
- 授权声明；
- `View on Explorer`；
- `Share Result`（P1）。

## 11. 视觉与交互规范

### 11.0 设计稿与本地化实施约定

- 以现有四张英文桌面设计稿作为布局、组件尺寸、间距和状态结构的唯一视觉母版；
- 以现有三张中文桌面设计稿作为中文字体、字号、换行和文案密度参考；
- 中文稿缺失的“Creator Agent 正在创作”状态，开发时必须复用英文 `Creator Arena: Generating — Desktop` 的同一组件结构，仅替换为中文文案，不允许重新组织布局或增加侧栏；
- 产品默认语言为简体中文；首版比赛 Demo 可只交付中文界面；
- 如时间允许再通过同一套组件和语言词典提供英文切换，禁止维护两套页面；
- 移动端不依赖单独设计稿，由桌面组件按响应式规则适配；桌面端为比赛当天 P0，移动端保证基本可用但不作为视觉还原重点；
- 产品名 BountyMint，以及 Monad、MON、NFT、Commit、Reveal、Hash、Token ID 和 Creator Agent 名称保留英文。

### 11.1 风格

- 主色：Monad 紫与电光紫；
- 背景：近黑或深紫渐变；
- 卡片：半透明玻璃质感；
- 链上状态：蓝紫色；
- 成功：绿色；
- 失败：红色；
- 字体：简洁无衬线字体。

### 11.2 关键动效

1. Agent 卡片依次进入；
2. 生成时显示扫描线、粒子或进度光环；
3. Commit 完成后作品保持模糊并显示锁定图标；
4. Reveal 时三张作品同时翻转；
5. 选中作品产生聚光与粒子爆发；
6. 奖金沿连线流向获胜 Agent；
7. NFT 卡片从作品中“铸造”出现。

动效不得阻塞业务流程，且应支持 `prefers-reduced-motion`。

## 12. 智能合约需求

### 12.1 合约职责

使用一个 `BountyMint` 合约同时承担：

- 悬赏托管；
- 作品 Commit/Reveal；
- 获胜者选择；
- 奖金支付；
- ERC-721 铸造；
- Creator 基础统计。

### 12.2 状态枚举

```solidity
enum BountyStatus {
    Open,
    Creating,
    Revealed,
    Awarded,
    Cancelled
}
```

### 12.3 核心数据结构

```solidity
struct Bounty {
    address creator;
    uint256 reward;
    bytes32 promptHash;
    uint64 deadline;
    BountyStatus status;
    uint8 commitCount;
    uint8 revealCount;
    uint8 winningAgentId;
    uint256 tokenId;
}

struct Submission {
    bytes32 commitHash;
    bytes32 imageHash;
    string metadataURI;
    address payoutAddress;
    bool revealed;
}
```

### 12.4 核心接口

```solidity
function createBounty(
    bytes32 promptHash,
    uint64 deadline
) external payable returns (uint256 bountyId);

function commitWork(
    uint256 bountyId,
    uint8 agentId,
    bytes32 commitHash,
    address payoutAddress
) external;

function revealWork(
    uint256 bountyId,
    uint8 agentId,
    bytes32 imageHash,
    string calldata metadataURI,
    bytes32 salt
) external;

function awardWinner(
    uint256 bountyId,
    uint8 agentId
) external;

function refundExpiredBounty(uint256 bountyId) external;
```

推荐的承诺计算方式：

```text
commitHash = keccak256(
  abi.encode(bountyId, agentId, imageHash, keccak256(metadataURI), salt)
)
```

### 12.5 权限

- 只有悬赏发布者可以选择获胜者；
- 只有 `executor` 可以为 MVP 的 Creator Agent 提交和揭晓作品；
- 只有截止时间后且未结算时允许退款；
- 已 Awarded 或 Cancelled 的悬赏不可重复执行；
- `executor` 不得提取悬赏资金。

### 12.6 安全要求

- 使用 checks-effects-interactions；
- 奖金支付函数加重入保护；
- 禁止零奖金悬赏；
- 截止时间必须晚于当前时间；
- 每个 Agent 每个悬赏只能 Commit 和 Reveal 一次；
- Reveal 必须匹配 Commit；
- 不允许重复 Award；
- 支付失败时交易整体回滚；
- 合约测试覆盖正常流程、越权、重复操作、错误 Reveal 和退款边界。

## 13. 图片生成与 Agent 编排

### 13.1 Prompt 结构

```text
[System persona]
You are {agentName}, a specialist in {style}.

[User brief]
{bountyBrief}

[Shared constraints]
Square composition, one primary character, no text, polished presentation,
suitable for a digital collectible showcase.
```

每个 Agent 的 persona 和风格描述固定，用户 Brief 动态注入。

### 13.2 并发策略

- 使用 `Promise.allSettled` 并发生成；
- 每个请求设置单独超时；
- 单个 Agent 失败时允许一次重试；
- 超过全局演示超时后使用该 Agent 的缓存作品；
- 无论真实生成或缓存回退，都重新计算当前悬赏对应的 Commit。

### 13.3 缓存降级

预先为三种 Agent 风格准备合法的备用作品。缓存只作为可用性降级，不改变链上流程：

1. 图片 API 超时或失败；
2. 后端选择对应 Agent 的缓存作品；
3. 重新生成 metadata 和 salt；
4. 提交新的 Commit；
5. 正常 Reveal、选择、支付和铸造。

### 13.4 内容存储

优先级：

1. IPFS/去中心化存储；
2. 稳定公网对象存储；
3. 项目静态资源作为演示回退。

链上至少记录图片内容 Hash。URL 本身不等于内容证明。

## 14. Metadata 规范

```json
{
  "name": "BountyMint #1 — NeonMuse",
  "description": "Winning artwork from a BountyMint creative bounty on Monad.",
  "image": "ipfs://...",
  "external_url": "https://.../bounty/1",
  "attributes": [
    { "trait_type": "Creator Agent", "value": "NeonMuse" },
    { "trait_type": "Style", "value": "Cyberpunk" },
    { "trait_type": "Network", "value": "Monad" },
    { "trait_type": "License Declaration", "value": "Non-exclusive commercial display" }
  ],
  "bountymint": {
    "bountyId": "1",
    "promptHash": "0x...",
    "imageHash": "0x...",
    "creatorAgent": "NeonMuse",
    "licenseDeclaration": "Non-exclusive commercial display"
  }
}
```

不得把完整私密 Prompt 强制公开；MVP 默认公开 Brief，并在链上记录其 Hash。

## 15. 技术架构

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
                  ├── Image generation provider
                  ├── Storage uploader
                  ├── Commit/Reveal executor
                  └── Cache fallback
```

### 15.1 推荐技术栈

- Next.js + TypeScript；
- Tailwind CSS；
- wagmi + viem；
- Solidity + Foundry；
- OpenZeppelin ERC721、ReentrancyGuard、Ownable；
- Vercel 公网部署；
- 一个图片生成 API；
- 官方 Monad RPC、浏览器和部署配置。

本地化实现使用集中式语言词典。所有用户可见文案不得散落硬编码在页面组件中；默认 locale 为 `zh-CN`。比赛版若未完成语言切换，也应保留可扩展的词典结构。

### 15.2 状态来源

- 奖金、状态、Commit、Reveal、获胜者、tokenId：链上为准；
- 图片生成进度：后端临时状态；
- 作品图片和 metadata：外部存储；
- 页面刷新后：重新读取合约状态和 metadata。

MVP 不引入数据库和独立索引器。

## 16. API 设计

### `POST /api/bounties/:id/generate`

请求：

```json
{
  "brief": "为 Monad 创作一个赛博朋克守护兽",
  "licenseDeclaration": "Non-exclusive commercial display"
}
```

响应：

```json
{
  "jobId": "job_123",
  "status": "generating",
  "agents": ["PixelForge", "NeonMuse", "MythicAI"]
}
```

### `GET /api/jobs/:jobId`

```json
{
  "status": "committed",
  "agents": [
    { "id": 1, "name": "PixelForge", "status": "committed" },
    { "id": 2, "name": "NeonMuse", "status": "generating" },
    { "id": 3, "name": "MythicAI", "status": "committed" }
  ]
}
```

若实现 SSE，则用 `GET /api/jobs/:jobId/events` 替代轮询；轮询作为更稳的 P0 实现。

## 17. 错误与降级处理

| 场景 | 用户体验 | 系统处理 |
|---|---|---|
| 未连接钱包 | 禁用创建按钮 | 提示连接钱包 |
| 网络错误 | 显示 Switch Network | 调用钱包切链 |
| 余额不足 | 显示所需金额 | 不发起交易 |
| 用户拒绝交易 | 保留输入内容 | 状态回到可编辑 |
| RPC 暂时失败 | 显示重试 | 指数退避后重新读取 |
| 图片生成失败 | Agent 显示重试 | 一次重试后使用缓存 |
| 图片存储失败 | 显示处理中 | 使用备用公网存储或静态资源 |
| Commit 部分失败 | 不进入 Reveal | 重试失败 Agent 的 Commit |
| Reveal 不匹配 | 标记该作品无效 | 不允许选择该作品 |
| 支付失败 | 不显示成功 | 整笔 `awardWinner` 回滚 |
| 页面刷新 | 显示恢复状态 | 从合约和 job 状态恢复 |

## 18. 测试与验收

### 18.1 合约测试

- 创建悬赏并锁资；
- 三个 Agent 正常 Commit/Reveal；
- 错误 salt 无法 Reveal；
- 非 executor 无法提交；
- 非发布者无法 Award；
- 未 Reveal 的作品无法获奖；
- 奖金只支付一次；
- NFT 只铸造一次；
- 截止前不能退款；
- 截止后允许退款；
- Award 后不能退款；
- 重入攻击不能重复领取。

### 18.2 前端验收

- 钱包连接、切链、余额显示正确；
- 创建交易 pending/success/error 状态明确；
- 三个 Agent 状态可观察；
- Reveal 前作品不可见；
- Award 前必须二次确认；
- 完成后显示真实 tokenId 和交易链接；
- 手机和桌面浏览器主流程可用；
- 无痕窗口可以访问公网版本。

### 18.3 演示验收

正式提交前连续完成至少五次端到端演示，其中至少一次使用图片缓存回退。

## 19. 安全与信任边界

### 19.1 MVP 信任假设

- Creator Agent 由项目后端统一编排；
- `executor` 是受信地址；
- 图片生成服务与存储服务是链下依赖；
- 链上 Hash 能证明内容一致性，但不能判断艺术质量或法律版权。

### 19.2 密钥管理

- 部署者和 executor 私钥只通过部署平台环境变量提供；
- 私钥不得进入前端、日志、GitHub 或模型 Prompt；
- `.env.example` 只包含变量名；
- 演示钱包只保留少量测试资产。

### 19.3 生产演进

- Creator Agent 使用独立钱包签署作品；
- 多执行器或 TEE 对生成过程进行证明；
- 去中心化存储；
- 内容安全与版权相似度检测；
- 可挑战的提交与争议窗口。

## 20. 数据指标

MVP 页面或日志记录：

- 悬赏创建成功数；
- 图片生成总耗时；
- 每个 Agent 是否使用缓存；
- Commit 和 Reveal 成功数；
- Award 成功数；
- 平均完整演示时间；
- 前端错误类型。

比赛演示的核心指标是完整链路成功率，而不是用户增长。

## 21. 单日开发计划

### 阶段 A：链上闭环（0–3 小时）

- 初始化公开仓库；
- 创建前端和 Foundry 工程；
- 编写合约与关键测试；
- 部署到 Monad；
- 完成创建、Commit、Reveal、Award、退款脚本。

**退出条件：** 命令行能够完成一次真实创建、提交、结算和铸造。

### 阶段 B：最小前端（3–6 小时）

- 钱包连接；
- 创建悬赏；
- 三个 Agent 卡片；
- 读取链上状态；
- 选择获胜者；
- 展示 NFT 和交易链接。

**退出条件：** 不依赖精美动效即可从网页完成链路。

### 阶段 C：图片生成（6–8 小时）

- 三套 Prompt；
- 并发图片生成；
- 图片 Hash 和 metadata；
- 缓存回退；
- Commit/Reveal 编排。

**退出条件：** 图片 API 正常和失败两种情况下都能完成。

### 阶段 D：视觉与部署（8–10 小时）

- Reveal 动画；
- 获胜与资金流动效；
- Vercel 部署；
- 公网和移动端测试。

### 阶段 E：提交（10–12 小时）

- README；
- 项目截图；
- 60–90 秒录屏；
- 三分钟答辩稿；
- MOJO 团队与项目提交；
- 至少五次完整彩排。

如果官方截止为 19:00，最晚 18:00 进入只修阻塞问题的提交冻结阶段。

## 22. 发布检查清单

### 代码与链上

- [ ] 仓库全新创建且公开
- [ ] 比赛期间提交记录清晰
- [ ] 合约地址写入 README
- [ ] 合约部署在官方指定 Monad 网络
- [ ] 至少一笔真实悬赏和结算交易
- [ ] 合约关键测试通过
- [ ] 仓库无私钥和 API Key

### 产品

- [ ] 公网 URL 可访问
- [ ] 钱包连接与切链正常
- [ ] 图片生成可用
- [ ] 缓存回退已验证
- [ ] Commit/Reveal 正常
- [ ] 付款与 NFT 铸造正常
- [ ] 区块浏览器链接正确
- [ ] 页面刷新可恢复状态

### 提交材料

- [ ] 项目名称、Logo、标语
- [ ] 一句话介绍
- [ ] 项目问题与解决方案
- [ ] 架构图
- [ ] Demo 视频
- [ ] GitHub 地址
- [ ] 公网 Demo 地址
- [ ] 合约地址
- [ ] MOJO 团队和项目已提交

## 23. 演示脚本

### 开场（15 秒）

> 今天 AI 能快速生成内容，但创作委托仍然依赖平台、人工比较和付款承诺。BountyMint 把创意需求、AI 竞争、作品证明和奖励结算放进同一条 Monad 链上流程。

### 创建（15 秒）

> 我发布一个“Monad 赛博朋克守护兽”的需求，并锁定 1 MON。奖金已经进入合约，获胜创作者不需要相信平台会不会付款。

### 创作与 Reveal（25 秒）

> 三个 Creator Agent 正在以不同风格并行创作。作品先提交 Hash，在所有提交完成前不会公开，因此不能看到别人的作品后再复制。现在三个作品同时揭晓。

### 结算（25 秒）

> 我选择 NeonMuse。合约在同一条业务流程里向创作者支付奖励，并把获胜作品铸造成 NFT。这里是实际交易、作品 Hash、授权声明和 Monad 浏览器记录。

### 结尾（10 秒）

> 普通 NFT 市场等待用户购买已经存在的作品；BountyMint 让需求和奖金先出现，让 AI 创作者围绕真实创意竞争。Post a vision. Let agents compete. Mint the winner.

## 24. 项目介绍文案

### 一句话

> BountyMint is an AI-native creative bounty protocol on Monad: post a vision, let creator agents compete, and automatically reward and mint the winning work.

### 中文简介

> BountyMint 是部署在 Monad 上的 AI 原生创作悬赏协议。用户锁定奖金并发布创意需求，多个 Creator Agent 以不同风格并行创作，作品通过 Commit/Reveal 机制公平揭晓。用户选出获胜作品后，合约自动支付奖励并铸造带有创作来源、内容哈希和授权声明的 NFT。

## 25. 最终决策原则

当时间不足时，按以下顺序保留功能：

1. 真实悬赏锁资；
2. 三个不同作品；
3. Commit/Reveal；
4. 真实奖励支付；
5. NFT 铸造；
6. 公网可访问；
7. 动效和附加展示。

任何不能提高完整演示成功率或不能证明上述核心闭环的功能，都推迟到赛后。

视觉还原时，优先完成中文桌面版四个核心状态：发布悬赏、Creator Agent 正在创作、作品同步揭晓、奖励支付与 NFT 铸造成功。英文设计稿只作为布局母版和后续国际化参考，不要求比赛版逐页交付英文界面。
