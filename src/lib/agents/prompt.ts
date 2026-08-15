import type { AgentPersona } from "./personas";

// Fixed template per specs/3.agent-orchestration-generation/design.md — shared
// constraints keep the three outputs directly comparable for the winner pick.
const SHARED_CONSTRAINTS =
  "Square composition, one primary character, no text, polished presentation, " +
  "suitable for a digital collectible showcase.";

export function buildPrompt(persona: AgentPersona, brief: string): string {
  return [
    `You are ${persona.name}, a specialist in ${persona.style}.`,
    "",
    brief.trim(),
    "",
    SHARED_CONSTRAINTS,
  ].join("\n");
}
