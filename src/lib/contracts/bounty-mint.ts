import type { Address } from "viem";

// Mirrors contracts/src/BountyMint.sol (specs/1.smart-contract-core). Extend this ABI
// as later features (Commit/Reveal, award, refund) need more of the contract surface.
export const bountyMintAbi = [
  {
    type: "function",
    name: "createBounty",
    stateMutability: "payable",
    inputs: [
      { name: "promptHash", type: "bytes32" },
      { name: "deadline", type: "uint64" },
    ],
    outputs: [{ name: "bountyId", type: "uint256" }],
  },
  {
    type: "function",
    name: "bounties",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "reward", type: "uint256" },
      { name: "promptHash", type: "bytes32" },
      { name: "deadline", type: "uint64" },
      { name: "status", type: "uint8" },
      { name: "commitCount", type: "uint8" },
      { name: "revealCount", type: "uint8" },
      { name: "winningAgentId", type: "uint8" },
      { name: "tokenId", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "commitWork",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "agentId", type: "uint8" },
      { name: "commitHash", type: "bytes32" },
      { name: "payoutAddress", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revealWork",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "agentId", type: "uint8" },
      { name: "imageHash", type: "bytes32" },
      { name: "metadataURI", type: "string" },
      { name: "salt", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "submissions",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint8" },
    ],
    outputs: [
      { name: "commitHash", type: "bytes32" },
      { name: "imageHash", type: "bytes32" },
      { name: "metadataURI", type: "string" },
      { name: "payoutAddress", type: "address" },
      { name: "revealed", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "awardWinner",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "agentId", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "event",
    name: "BountyCreated",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "reward", type: "uint256", indexed: false },
      { name: "promptHash", type: "bytes32", indexed: false },
      { name: "deadline", type: "uint64", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WorkCommitted",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "agentId", type: "uint8", indexed: true },
      { name: "commitHash", type: "bytes32", indexed: false },
      { name: "payoutAddress", type: "address", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WorkRevealed",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "agentId", type: "uint8", indexed: true },
      { name: "imageHash", type: "bytes32", indexed: false },
      { name: "metadataURI", type: "string", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WinnerAwarded",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "agentId", type: "uint8", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "reward", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const;

export const bountyMintAddress = (process.env.NEXT_PUBLIC_BOUNTY_MINT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as Address;

export const BountyStatus = {
  Open: 0,
  Creating: 1,
  Revealed: 2,
  Awarded: 3,
  Cancelled: 4,
} as const;
