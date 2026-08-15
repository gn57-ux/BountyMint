---
title: 用 cast abi-encode + cast keccak 交叉验证 TS 侧 hash 计算与合约公式一致
feature: 3.agent-orchestration-generation
type: reusable
tags: [viem, keccak256, commitHash, foundry, cast, cross-verification]
date: 2026-08-14
---

**问题/场景**：`commitHash` 的计算公式（`keccak256(abi.encode(bountyId, agentId, imageHash, keccak256(bytes(metadataURI)), salt))`）定义在 Solidity 合约里（`contracts/src/BountyMint.sol`），但实际计算发生在 TypeScript 侧（`src/lib/hash.ts`，用 viem 的 `encodeAbiParameters` + `keccak256`）。这类"两侧各自实现同一个哈希公式"的场景，最容易出的错是 TS 侧的类型/编码细节和 Solidity 的 `abi.encode` 不完全一致（比如漏了某个字段、`bytes32` 用错了字符串转 bytes 的方式、`uint8`/`uint256` 顺序错位），而这种错只有在真正调用 `revealWork` 时才会通过 `require(expectedHash == submission.commitHash)` 暴露，调试成本很高。

**解法/结论**：不用等到端到端联调，本地用 Foundry 自带的 `cast` 工具（`$HOME/.foundry/bin` 下）独立复算同一个测试向量，直接比对十六进制结果是否逐字节相同：
```bash
IMAGE_HASH=$(cast keccak 0x1234)                        # keccak256(imageBuffer) 的等价物
META_HASH=$(cast keccak "some-uri-string")               # keccak256(bytes(metadataURI)) 的等价物，纯字符串参数会按 UTF-8 bytes 处理
ENCODED=$(cast abi-encode "f(uint256,uint8,bytes32,bytes32,bytes32)" 42 1 "$IMAGE_HASH" "$META_HASH" "$SALT")
cast keccak "$ENCODED"                                    # 等价于 Solidity 的 keccak256(abi.encode(...))
```
把这个结果和 TS 侧 `computeCommitHash(...)` 对同一组输入的输出做字符串比较，完全相等就说明两侧编码规则一致。本次验证三个哈希（imageHash/metadataHash/commitHash）逐一比对完全吻合。

**复用方式**：任何 feature 只要在 TS/前端侧重新实现了一遍合约里定义的 hash 公式（尤其是 `abi.encode` 组合多个字段的场景），开发完就应该跑一遍这个交叉验证，而不是只靠 `forge test` 里的固定测试向量或者等实际链上调用报错。`cast abi-encode`/`cast keccak` 两个子命令组合几乎可以复算任何 Solidity 里 `keccak256(abi.encode(...))`/`keccak256(abi.encodePacked(...))` 的结果，只要把参数类型签名和顺序抄对。specs/4.commit-reveal-execution 里真实 metadataURI 回填后重算 commitHash 时，同样应该用这个方法先自查一遍再联调。
