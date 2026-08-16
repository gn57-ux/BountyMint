import { test } from "node:test";
import assert from "node:assert/strict";

import { createJob, findActiveJobByBountyId, getJob } from "../jobs.ts";
import { runFullPipeline } from "./pipeline.ts";

const PAYOUT_ADDRESSES = {
  1: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  2: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  3: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
} as const;

// This sandbox has no real Monad RPC / executor key / Pinata JWT configured
// (no .env file at all), so this is a real, unmocked
// exercise of runFullPipeline's setup-failure path (codex-review 2026-08-15
// finding 2): the chain read for promptHash fails against the placeholder RPC
// URL, and the pipeline must still resolve the job to a terminal state
// instead of leaving it stuck as permanently "active".
test("runFullPipeline resolves to a terminal failed job when chain setup fails, not stuck as active", async () => {
  const bountyId = "918273";
  const job = createJob(bountyId, [
    { agentId: 1, name: "PixelForge", payoutAddress: PAYOUT_ADDRESSES[1] },
    { agentId: 2, name: "NeonMuse", payoutAddress: PAYOUT_ADDRESSES[2] },
    { agentId: 3, name: "MythicAI", payoutAddress: PAYOUT_ADDRESSES[3] },
  ]);

  await runFullPipeline(job.jobId, BigInt(bountyId), "a test brief");

  const finished = getJob(job.jobId);
  assert.ok(finished);
  assert.equal(finished.status, "failed");
  for (const agent of finished.agents) {
    assert.equal(agent.status, "failed");
    assert.ok(agent.error);
  }
  // The whole point of resolving to a terminal state: a fresh generate call
  // for this bounty must not be blocked by a permanently-active job.
  assert.equal(findActiveJobByBountyId(bountyId), undefined);
});
