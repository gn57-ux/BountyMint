import { test } from "node:test";
import assert from "node:assert/strict";

import { computeCommitHash, computeImageHash, computeMetadataHash } from "./hash.ts";

// Fixed test vector, independently cross-verified byte-for-byte against
// `cast abi-encode "f(uint256,uint8,bytes32,bytes32,bytes32)" ...` +
// `cast keccak` (Foundry).
// This pins the exact encoding so a future refactor can't silently drift from
// contracts/src/BountyMint.sol's commitHash formula (AC-004).
const BOUNTY_ID = 42n;
const AGENT_ID = 1;
const IMAGE_BYTES = "0x1234" as const;
const METADATA_URI = "pending://job_test/1";
const SALT = `0x${"11".repeat(32)}` as const;

const EXPECTED_IMAGE_HASH = "0x56570de287d73cd1cb6092bb8fdee6173974955fdef345ae579ee9f475ea7432";
const EXPECTED_METADATA_HASH = "0x6b91c828882649ae90d3824033d539fb8ac35805f002336a1db39cf82608f282";
const EXPECTED_COMMIT_HASH = "0x93f5129e2e3c632d38e191955f57265f00f734d757ca620af028a1d14e3a83d2";

test("computeImageHash matches the contract's keccak256(imageBuffer)", () => {
  assert.equal(computeImageHash(Buffer.from(IMAGE_BYTES.slice(2), "hex")), EXPECTED_IMAGE_HASH);
});

test("computeMetadataHash matches the contract's keccak256(bytes(metadataURI))", () => {
  assert.equal(computeMetadataHash(METADATA_URI), EXPECTED_METADATA_HASH);
});

test("computeCommitHash matches contracts/src/BountyMint.sol's commitHash formula", () => {
  const commitHash = computeCommitHash({
    bountyId: BOUNTY_ID,
    agentId: AGENT_ID,
    imageHash: EXPECTED_IMAGE_HASH,
    metadataURI: METADATA_URI,
    salt: SALT,
  });
  assert.equal(commitHash, EXPECTED_COMMIT_HASH);
});

test("computeCommitHash changes if any single field changes", () => {
  const base = {
    bountyId: BOUNTY_ID,
    agentId: AGENT_ID,
    imageHash: EXPECTED_IMAGE_HASH,
    metadataURI: METADATA_URI,
    salt: SALT,
  } as const;
  const baseline = computeCommitHash(base);

  assert.notEqual(computeCommitHash({ ...base, bountyId: 43n }), baseline);
  assert.notEqual(computeCommitHash({ ...base, agentId: 2 }), baseline);
  assert.notEqual(computeCommitHash({ ...base, metadataURI: "pending://job_test/2" }), baseline);
  assert.notEqual(computeCommitHash({ ...base, salt: `0x${"22".repeat(32)}` }), baseline);
});
