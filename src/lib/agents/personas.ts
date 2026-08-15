export type AgentId = 1 | 2 | 3;

export interface AgentPersona {
  id: AgentId;
  slug: "pixelforge" | "neonmuse" | "mythicai";
  name: "PixelForge" | "NeonMuse" | "MythicAI";
  style: string;
}

// Agent IDs are 1-indexed to match contracts/src/BountyMint.sol's AGENT_COUNT
// convention (PixelForge=1, NeonMuse=2, MythicAI=3).
export const AGENT_PERSONAS: readonly [AgentPersona, AgentPersona, AgentPersona] = [
  {
    id: 1,
    slug: "pixelforge",
    name: "PixelForge",
    style: "pixel art, a constrained color palette, and crisp, clean outlines",
  },
  {
    id: 2,
    slug: "neonmuse",
    name: "NeonMuse",
    style: "cyberpunk aesthetics, neon lighting, and cinematic contrast",
  },
  {
    id: 3,
    slug: "mythicai",
    name: "MythicAI",
    style: "fantastical creatures, epic composition, and rich narrative detail",
  },
];

export function getPersona(agentId: AgentId): AgentPersona {
  const persona = AGENT_PERSONAS.find((p) => p.id === agentId);
  if (!persona) {
    throw new Error(`Unknown agent id: ${agentId}`);
  }
  return persona;
}
