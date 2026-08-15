# smart-contract-core — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-08-14 | v1 | 初始设计 |

> 跨项目经验检索：`YD_EXPERIENCE_REPO` 未配置，经验增强本次不可用，已跳过，不影响当前工作流。

## 项目架构

- 架构类型: Web3 dApp（单仓库）
- 涉及层: 智能合约（Solidity + Foundry）

## 功能模块设计

### 模块 1: 数据结构与状态机

遵循 [[smart-contract]] 规则中固定的状态机与结构体定义（PRD §12.2-12.3）：

```solidity
enum BountyStatus { Open, Creating, Revealed, Awarded, Cancelled }

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

- `mapping(uint256 => Bounty) public bounties;`
- `mapping(uint256 => mapping(uint8 => Submission)) public submissions;`（bountyId → agentId → Submission）
- `uint256 public nextBountyId;`
- `address public executor;`（部署时设定，仅 `Ownable` 可更换）

### 模块 2: createBounty

**涉及层及关键设计:**

- `payable`，`msg.value` 即 `reward`；`require(msg.value > 0)`、`require(deadline > block.timestamp)`。
- 状态置为 `Open`，`nextBountyId++`，emit `BountyCreated(bountyId, creator, reward, promptHash, deadline)`。

### 模块 3: commitWork / revealWork

**涉及层及关键设计:**

- `commitWork`：`require(msg.sender == executor)`，`require(submissions[bountyId][agentId].commitHash == 0)`（防重复），写入 `commitHash`/`payoutAddress`，`bounty.commitCount++`，状态置 `Creating`（首次 commit 时）。
- `revealWork`：`require(msg.sender == executor)`，重算 `keccak256(abi.encode(bountyId, agentId, imageHash, keccak256(bytes(metadataURI)), salt))` 与存储的 `commitHash` 比对，不等则 revert；写入 `imageHash`/`metadataURI`/`revealed = true`，`bounty.revealCount++`；`revealCount` 达到 3 时状态置 `Revealed`。

### 模块 4: awardWinner（结算 + 铸造）

**涉及层及关键设计:**

- 继承 `ReentrancyGuard`，函数加 `nonReentrant`。
- checks：`require(msg.sender == bounty.creator)`、`require(bounty.status == BountyStatus.Revealed)`、`require(submissions[bountyId][agentId].revealed)`。
- effects：先将 `bounty.status = Awarded`、`bounty.winningAgentId = agentId`，再计算 `tokenId`。
- interactions：`(bool ok,) = payoutAddress.call{value: bounty.reward}("")`，失败则 revert（整体回滚）；随后 `_safeMint(bounty.creator, tokenId)` 并 `_setTokenURI` 为获胜作品的 `metadataURI`。
- emit `WinnerAwarded(bountyId, agentId, tokenId, reward)`。

### 模块 5: refundExpiredBounty

**涉及层及关键设计:**

- `require(block.timestamp > bounty.deadline)`、`require(bounty.status != BountyStatus.Awarded && bounty.status != BountyStatus.Cancelled)`。
- effects 先置 `Cancelled`，再 `payable(bounty.creator).call{value: bounty.reward}("")`，失败 revert。

## 接口契约

```solidity
function createBounty(bytes32 promptHash, uint64 deadline) external payable returns (uint256 bountyId);
function commitWork(uint256 bountyId, uint8 agentId, bytes32 commitHash, address payoutAddress) external;
function revealWork(uint256 bountyId, uint8 agentId, bytes32 imageHash, string calldata metadataURI, bytes32 salt) external;
function awardWinner(uint256 bountyId, uint8 agentId) external;
function refundExpiredBounty(uint256 bountyId) external;
```

## 数据模型

见「模块 1」的 `Bounty` / `Submission` 结构体与两个 mapping；无链下数据库（PRD §15.2）。

## 安全考虑

- 遵循 [[security]] 规则：checks-effects-interactions、`ReentrancyGuard`、零奖金/deadline 校验、每 Agent 每悬赏单次 Commit/Reveal、禁止重复 Award、支付失败整体回滚。
- `executor` 仅有 Commit/Reveal 权限，无法转移合约资金（无提款接口）。
- Monad RPC URL / Chain ID 在部署脚本中使用占位环境变量，比赛当天替换（见 `7.T-002`）。

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| NFT 标准 | OpenZeppelin ERC721 + ERC721URIStorage | 现成审计过的实现，减少自研合约的安全风险 |
| 重入防护 | OpenZeppelin ReentrancyGuard | 标准做法，覆盖 awardWinner/refundExpiredBounty 的外部调用 |
| 权限模型 | 单一 executor 地址（非多签） | MVP 单人开发时间有限，PRD §19.3 已将多执行器/TEE 列为赛后演进项 |
