import { randomBytes } from "node:crypto";
import { bytesToHex, encodeAbiParameters, keccak256, toBytes, type Hex } from "viem";

// Mirrors contracts/src/BountyMint.sol's commitHash formula exactly:
//   commitHash = keccak256(abi.encode(bountyId, agentId, imageHash, keccak256(bytes(metadataURI)), salt))
// See specs/1.smart-contract-core and .claude/rules/smart-contract.md.

export function computeImageHash(imageBuffer: Buffer): Hex {
  return keccak256(imageBuffer);
}

export function computeMetadataHash(metadataURI: string): Hex {
  return keccak256(toBytes(metadataURI));
}

export function generateSalt(): Hex {
  return bytesToHex(randomBytes(32));
}

export function computeCommitHash(params: {
  bountyId: bigint;
  agentId: number;
  imageHash: Hex;
  metadataURI: string;
  salt: Hex;
}): Hex {
  const metadataHash = computeMetadataHash(params.metadataURI);
  return keccak256(
    encodeAbiParameters(
      [
        { type: "uint256" },
        { type: "uint8" },
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "bytes32" },
      ],
      [params.bountyId, params.agentId, params.imageHash, metadataHash, params.salt],
    ),
  );
}
