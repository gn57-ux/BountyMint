import { test } from "node:test";
import assert from "node:assert/strict";

import { buildMetadata } from "./metadata.ts";
import { AGENT_PERSONAS } from "./personas.ts";

// Locks the shape to docs/BountyMint-PRD.md §14 — this JSON becomes the
// ERC-721 tokenURI at award time, so field names/nesting must stay stable.
test("buildMetadata matches the PRD §14 shape", () => {
  const metadata = buildMetadata({
    bountyId: "1",
    persona: AGENT_PERSONAS[1],
    imageURI: "ipfs://image-cid",
    imageHash: `0x${"1".repeat(64)}`,
    promptHash: `0x${"2".repeat(64)}`,
    licenseDeclaration: "Non-exclusive commercial display",
    appUrl: "https://example.com",
  });

  assert.equal(metadata.name, "BountyMint #1 — NeonMuse");
  assert.equal(metadata.image, "ipfs://image-cid");
  assert.equal(metadata.external_url, "https://example.com/bounty/1");
  assert.deepEqual(
    metadata.attributes.map((a) => a.trait_type),
    ["Creator Agent", "Style", "Network", "License Declaration"],
  );
  assert.equal(metadata.bountymint.bountyId, "1");
  assert.equal(metadata.bountymint.creatorAgent, "NeonMuse");
  assert.equal(metadata.bountymint.imageHash, `0x${"1".repeat(64)}`);
});
