import { readFile } from "node:fs/promises";
import path from "node:path";

import type { AgentPersona } from "./personas";

// Pre-baked per-style placeholders (public/assets/fallback/*.png) used when live
// generation fails or blows the global demo timeout. See
// specs/3.agent-orchestration-generation/design.md module 3.
export async function readFallbackImage(persona: AgentPersona): Promise<Buffer> {
  const filePath = path.join(process.cwd(), "public", "assets", "fallback", `${persona.slug}.png`);
  return readFile(filePath);
}
