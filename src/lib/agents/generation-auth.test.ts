import { test } from "node:test";
import assert from "node:assert/strict";
import { privateKeyToAccount } from "viem/accounts";

import { buildGenerationAuthMessage, verifyGenerationSignature } from "./generation-auth.ts";

// Deterministic throwaway test private keys — never used for real funds.
const CREATOR_KEY = `0x${"11".repeat(32)}` as const;
const OTHER_KEY = `0x${"22".repeat(32)}` as const;

const creatorAccount = privateKeyToAccount(CREATOR_KEY);
const otherAccount = privateKeyToAccount(OTHER_KEY);

test("verifyGenerationSignature accepts a signature from the on-chain creator", async () => {
  const message = buildGenerationAuthMessage("7", "make a dragon");
  const signature = await creatorAccount.signMessage({ message });

  const ok = await verifyGenerationSignature({
    bountyId: "7",
    brief: "make a dragon",
    signature,
    creator: creatorAccount.address,
  });
  assert.equal(ok, true);
});

test("verifyGenerationSignature rejects a signature from a different account", async () => {
  const message = buildGenerationAuthMessage("7", "make a dragon");
  const signature = await otherAccount.signMessage({ message });

  const ok = await verifyGenerationSignature({
    bountyId: "7",
    brief: "make a dragon",
    signature,
    creator: creatorAccount.address,
  });
  assert.equal(ok, false);
});

test("verifyGenerationSignature rejects a signature replayed against a different brief", async () => {
  const signature = await creatorAccount.signMessage({
    message: buildGenerationAuthMessage("7", "make a dragon"),
  });

  const ok = await verifyGenerationSignature({
    bountyId: "7",
    brief: "make something else entirely",
    signature,
    creator: creatorAccount.address,
  });
  assert.equal(ok, false);
});

test("verifyGenerationSignature rejects the zero address (bounty does not exist)", async () => {
  const message = buildGenerationAuthMessage("999", "anything");
  const signature = await creatorAccount.signMessage({ message });

  const ok = await verifyGenerationSignature({
    bountyId: "999",
    brief: "anything",
    signature,
    creator: "0x0000000000000000000000000000000000000000",
  });
  assert.equal(ok, false);
});
