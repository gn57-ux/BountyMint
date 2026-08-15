import type { Hex } from "viem";

import type { AgentPersona } from "./personas.ts";

// Shape fixed by docs/BountyMint-PRD.md §14 — do not add/rename fields without
// updating that spec, since this JSON becomes the ERC-721 tokenURI at award time.
export interface BountyMintMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: { trait_type: string; value: string }[];
  bountymint: {
    bountyId: string;
    promptHash: Hex;
    imageHash: Hex;
    creatorAgent: string;
    licenseDeclaration: string;
  };
}

export function buildMetadata(params: {
  bountyId: string;
  persona: AgentPersona;
  imageURI: string;
  imageHash: Hex;
  promptHash: Hex;
  licenseDeclaration: string;
  appUrl: string;
}): BountyMintMetadata {
  return {
    name: `BountyMint #${params.bountyId} — ${params.persona.name}`,
    description: "Winning artwork from a BountyMint creative bounty on Monad.",
    image: params.imageURI,
    external_url: `${params.appUrl}/bounty/${params.bountyId}`,
    attributes: [
      { trait_type: "Creator Agent", value: params.persona.name },
      { trait_type: "Style", value: params.persona.style },
      { trait_type: "Network", value: "Monad" },
      { trait_type: "License Declaration", value: params.licenseDeclaration },
    ],
    bountymint: {
      bountyId: params.bountyId,
      promptHash: params.promptHash,
      imageHash: params.imageHash,
      creatorAgent: params.persona.name,
      licenseDeclaration: params.licenseDeclaration,
    },
  };
}
