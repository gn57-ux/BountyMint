import { test } from "node:test";
import assert from "node:assert/strict";

import { createJob, findActiveJobByBountyId, getJob } from "../jobs.ts";
import { runOrchestration } from "./orchestrate.ts";

// This is a real end-to-end run of the orchestration module (no mocking):
// with OPENAI_API_KEY unset it must skip straight to the pre-baked cache
// images under public/assets/fallback, and still compute real hashes.
test("runOrchestration falls back to cache images with real hashes when OPENAI_API_KEY is unset", async () => {
  const original = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    createJob("99", [
      { agentId: 1, name: "PixelForge", payoutAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" },
      { agentId: 2, name: "NeonMuse", payoutAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
      { agentId: 3, name: "MythicAI", payoutAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
    ]);
    const job = findActiveJobByBountyId("99");
    assert.ok(job);

    await runOrchestration(job.jobId, 99n, "a test brief");

    const finished = getJob(job.jobId);
    assert.ok(finished);
    assert.equal(finished.status, "generated");
    for (const agent of finished.agents) {
      assert.equal(agent.status, "cache_fallback");
      assert.equal(agent.source, "cache_fallback");
      assert.match(agent.imageHash ?? "", /^0x[0-9a-f]{64}$/);
      assert.match(agent.commitHash ?? "", /^0x[0-9a-f]{64}$/);
      assert.match(agent.salt ?? "", /^0x[0-9a-f]{64}$/);
    }
  } finally {
    if (original === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = original;
  }
});
