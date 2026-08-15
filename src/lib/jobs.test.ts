import { test } from "node:test";
import assert from "node:assert/strict";
import type { Hex } from "viem";

import { createJob, getJob, toPublicAgentState, updateAgentState, type AgentJobState } from "./jobs.ts";

const PAYOUT_ADDRESSES = {
  1: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  2: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  3: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
} as const;

// AC-006: "任何私密 salt 不会在 Commit 完成前返回给浏览器". toPublicAgentState is the
// single boundary responsible for that guarantee — it builds a fresh object
// literal (never spreads the internal AgentJobState) so a future field added
// to AgentJobState can't leak by accident.
test("toPublicAgentState never includes the salt field, even when set", () => {
  const secretSalt: Hex = `0x${"9".repeat(64)}`;
  const agent: AgentJobState = {
    agentId: 1,
    name: "PixelForge",
    status: "generated",
    payoutAddress: PAYOUT_ADDRESSES[1],
    imageHash: `0x${"1".repeat(64)}`,
    metadataURI: "pending://job_test/1",
    commitHash: `0x${"2".repeat(64)}`,
    salt: secretSalt,
  };

  const publicView = toPublicAgentState(agent);

  assert.equal("salt" in publicView, false);
  assert.equal(JSON.stringify(publicView).includes(secretSalt.slice(2)), false);
  // The rest of the public contract fields (specs/3.agent-orchestration-generation
  // design.md interface contract) must still be present.
  assert.equal(publicView.agentId, 1);
  assert.equal(publicView.payoutAddress, PAYOUT_ADDRESSES[1]);
  assert.equal(publicView.imageHash, agent.imageHash);
  assert.equal(publicView.commitHash, agent.commitHash);
});

test("a GET /api/jobs/:jobId-style response never leaks salt after generation completes", () => {
  const job = createJob("42", [
    { agentId: 1, name: "PixelForge", payoutAddress: PAYOUT_ADDRESSES[1] },
    { agentId: 2, name: "NeonMuse", payoutAddress: PAYOUT_ADDRESSES[2] },
    { agentId: 3, name: "MythicAI", payoutAddress: PAYOUT_ADDRESSES[3] },
  ]);

  const secretSalt: Hex = `0x${"9".repeat(64)}`;
  updateAgentState(job.jobId, 1, {
    status: "cache_fallback",
    source: "cache_fallback",
    imageHash: `0x${"1".repeat(64)}`,
    metadataURI: "pending://job_test/1",
    commitHash: `0x${"2".repeat(64)}`,
    salt: secretSalt,
  });

  const stored = getJob(job.jobId);
  assert.ok(stored);
  assert.equal(stored.agents[0].salt, secretSalt); // the internal store DOES keep it

  const responseBody = { status: stored.status, agents: stored.agents.map(toPublicAgentState) };
  assert.equal(JSON.stringify(responseBody).includes(secretSalt.slice(2)), false);
});

test("createJob assigns payoutAddress immediately and updateAgentState never overwrites it", () => {
  const job = createJob("7", [{ agentId: 1, name: "PixelForge", payoutAddress: PAYOUT_ADDRESSES[1] }]);
  assert.equal(job.agents[0].payoutAddress, PAYOUT_ADDRESSES[1]);

  updateAgentState(job.jobId, 1, { status: "generated" });
  assert.equal(getJob(job.jobId)?.agents[0].payoutAddress, PAYOUT_ADDRESSES[1]);
});

test("job status is generating until every agent settles, then aggregates", () => {
  const job = createJob("8", [
    { agentId: 1, name: "PixelForge", payoutAddress: PAYOUT_ADDRESSES[1] },
    { agentId: 2, name: "NeonMuse", payoutAddress: PAYOUT_ADDRESSES[2] },
  ]);
  assert.equal(job.status, "generating");

  updateAgentState(job.jobId, 1, { status: "generated" });
  assert.equal(getJob(job.jobId)?.status, "generating");

  updateAgentState(job.jobId, 2, { status: "cache_fallback" });
  assert.equal(getJob(job.jobId)?.status, "generated");
});
