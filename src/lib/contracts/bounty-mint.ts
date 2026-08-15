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
