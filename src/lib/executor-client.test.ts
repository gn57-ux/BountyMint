import { test } from "node:test";
import assert from "node:assert/strict";

import { getExecutorAddress } from "./executor-client.ts";

// Deterministic throwaway test key — never used for real funds.
const KEY_NO_PREFIX = "11".repeat(32);
const KEY_WITH_PREFIX = `0x${KEY_NO_PREFIX}`;

test("getExecutorAddress accepts a private key with or without a 0x prefix", () => {
  const original = process.env.EXECUTOR_PRIVATE_KEY;
  try {
    process.env.EXECUTOR_PRIVATE_KEY = KEY_WITH_PREFIX;
    const withPrefix = getExecutorAddress();

    process.env.EXECUTOR_PRIVATE_KEY = KEY_NO_PREFIX;
    const withoutPrefix = getExecutorAddress();

    assert.equal(withPrefix, withoutPrefix);
  } finally {
    if (original === undefined) delete process.env.EXECUTOR_PRIVATE_KEY;
    else process.env.EXECUTOR_PRIVATE_KEY = original;
  }
});
