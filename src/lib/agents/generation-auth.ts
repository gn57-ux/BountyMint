import { keccak256, recoverMessageAddress, toBytes, zeroAddress, type Address, type Hex } from "viem";

// Binds the signed authorization to the exact brief content (via its hash) so a
// captured signature can't be replayed with a different brief for the same
// bounty — see codex-review/review-20260815-004651.md finding 1.
export function buildGenerationAuthMessage(bountyId: string, brief: string): string {
  return `BountyMint generation authorization\nbounty:${bountyId}\nbriefHash:${keccak256(toBytes(brief))}`;
}

// Pure signature check — the caller is responsible for sourcing `creator` from
// an on-chain read (see src/app/api/bounties/[id]/generate/route.ts), which is
// what also rejects bounty IDs that don't exist or don't fit uint256.
export async function verifyGenerationSignature(params: {
  bountyId: string;
  brief: string;
  signature: Hex;
  creator: Address;
}): Promise<boolean> {
  if (params.creator === zeroAddress) return false;
  try {
    const recovered = await recoverMessageAddress({
      message: buildGenerationAuthMessage(params.bountyId, params.brief),
      signature: params.signature,
    });
    return recovered.toLowerCase() === params.creator.toLowerCase();
  } catch {
    return false;
  }
}
