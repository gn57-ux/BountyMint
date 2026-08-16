import type { Address, Hash, Hex } from "viem";

import type { AgentId } from "./agents/personas.ts";

export type AgentJobStatus =
  | "generating"
  | "generated"
  | "cache_fallback"
  | "committed"
  | "revealed"
  | "failed";

// Tracks the transient lifecycle of a single on-chain tx separately from the
// coarse `status` above — `status` only flips to "committed"/"revealed" once
// the corresponding receipt confirms, so the UI can show
// Pending/Confirmed/Failed underneath a card
// that's still showing "generated" while its commit tx is in flight.
export type TxReceiptStatus = "pending" | "confirmed" | "failed";

export interface AgentJobState {
  agentId: AgentId;
  name: string;
  status: AgentJobStatus;
  payoutAddress: Address;
  source?: "generated" | "cache_fallback";
  imageBuffer?: Buffer;
  imageHash?: Hex;
  imageURI?: string;
  metadataURI?: string;
  commitHash?: Hex;
  commitTxHash?: Hash;
  commitReceiptStatus?: TxReceiptStatus;
  revealTxHash?: Hash;
  revealReceiptStatus?: TxReceiptStatus;
  // Server-internal only — must never appear in a public API response before
  // the corresponding on-chain Commit lands (PRD §1.1). Revealing it early
  // would let anyone forge the winning
  // Commit/Reveal pair. See toPublicAgentState below and its test coverage.
  salt?: Hex;
  error?: string;
}

export type JobStatus = "generating" | "generated" | "committed" | "revealed" | "failed";

export interface JobState {
  jobId: string;
  bountyId: string;
  status: JobStatus;
  agents: AgentJobState[];
  createdAt: number;
}

// The subset of AgentJobState that is safe to hand back over the public
// GET /api/jobs/:jobId API — explicitly excludes `salt` (see AC-006) and the
// server-internal `imageBuffer`/`error` fields. `source` is exposed so the UI
// can label cache-fallback artwork as a demo fallback without implying the
// on-chain Commit/Reveal for it is any less real.
export type PublicAgentState = Pick<
  AgentJobState,
  | "agentId"
  | "name"
  | "status"
  | "payoutAddress"
  | "source"
  | "imageHash"
  | "imageURI"
  | "metadataURI"
  | "commitHash"
  | "commitTxHash"
  | "commitReceiptStatus"
  | "revealTxHash"
  | "revealReceiptStatus"
>;

export function toPublicAgentState(agent: AgentJobState): PublicAgentState {
  // imageURI/metadataURI point at the actual artwork (metadataURI's JSON embeds
  // the image URI too) — Feature 4 fills these in as soon as Pinata upload
  // finishes, which is well before the on-chain Reveal. Gating them on
  // status === "revealed" is what actually enforces "揭晓前不展示任何作品内容"
  // until reveal; imageHash/commitHash are just
  // fingerprints and stay public throughout, same as before.
  const revealed = agent.status === "revealed";
  return {
    agentId: agent.agentId,
    name: agent.name,
    status: agent.status,
    payoutAddress: agent.payoutAddress,
    source: agent.source,
    imageHash: agent.imageHash,
    imageURI: revealed ? agent.imageURI : undefined,
    metadataURI: revealed ? agent.metadataURI : undefined,
    commitHash: agent.commitHash,
    commitTxHash: agent.commitTxHash,
    commitReceiptStatus: agent.commitReceiptStatus,
    revealTxHash: agent.revealTxHash,
    revealReceiptStatus: agent.revealReceiptStatus,
  };
}

// Process-in-memory only, no persistence — matches PRD §15.2: this store tracks
// transient generation progress, not business state. The browser recovers
// business state (bounty/Commit/Reveal/winner) from on-chain reads, so losing
// this map is expected and does not corrupt anything on-chain.
//
// Known limitation on the Vercel deploy target: if two requests (e.g. a
// POST and a GET) land on different warm serverless instances, this Map
// won't have the jobId on the second one. This was previously a "low
// probability" risk POST /api/bounties/:id/generate + GET /api/jobs/:jobId
// polling accepted (PRD §15.2 rules out a database for business state, and
// job progress isn't business state) — until it reproduced live and broke
// the deployed demo. generate/route.ts now awaits
// the full pipeline in-request and returns the final result directly
// instead of relying on a later poll to observe completion, so the primary
// flow no longer depends on this Map being shared across instances. GET
// /api/jobs/:jobId still has the same limitation if anything calls it.
const jobs = new Map<string, JobState>();

export function createJob(
  bountyId: string,
  agents: readonly { agentId: AgentId; name: string; payoutAddress: Address }[],
): JobState {
  const jobId = `job_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const job: JobState = {
    jobId,
    bountyId,
    status: "generating",
    agents: agents.map((a) => ({
      agentId: a.agentId,
      name: a.name,
      status: "generating",
      payoutAddress: a.payoutAddress,
    })),
    createdAt: Date.now(),
  };
  jobs.set(jobId, job);
  return job;
}

export function getJob(jobId: string): JobState | undefined {
  return jobs.get(jobId);
}

// Guards against duplicate concurrent pipeline runs for the same bounty — a
// job is "active" from the moment it's created until it reaches a terminal
// state (revealed or failed). Without this, a duplicate POST while Commit/Reveal
// txs are still in flight (job.status === "generated" or "committed", not
// "generating") would kick off a second full pipeline for the same bounty,
// wasting a second round of paid OpenAI/Pinata calls and racing on-chain
// commitWork calls that would just revert as "already committed".
export function findActiveJobByBountyId(bountyId: string): JobState | undefined {
  for (const job of jobs.values()) {
    if (job.bountyId === bountyId && job.status !== "revealed" && job.status !== "failed") {
      return job;
    }
  }
  return undefined;
}

export function updateAgentState(jobId: string, agentId: AgentId, patch: Partial<AgentJobState>): void {
  const job = jobs.get(jobId);
  if (!job) return;
  const agent = job.agents.find((a) => a.agentId === agentId);
  if (!agent) return;
  Object.assign(agent, patch);
  recomputeJobStatus(job);
}

// Tolerates a permanently-failed agent alongside others that keep progressing
// (e.g. one agent's Pinata upload fails while the other two commit fine) —
// the contract itself is the real gate: revealWork reverts unless all three
// commits landed, so the commit/reveal executor (src/lib/agents/pipeline.ts)
// only attempts reveal once exactly three agents reach "committed", never
// inferring readiness from this aggregate alone.
function recomputeJobStatus(job: JobState): void {
  const statuses = job.agents.map((a) => a.status);
  if (statuses.some((s) => s === "generating")) {
    job.status = "generating";
    return;
  }
  if (statuses.every((s) => s === "failed")) {
    job.status = "failed";
    return;
  }
  if (statuses.every((s) => s === "revealed" || s === "failed")) {
    job.status = "revealed";
    return;
  }
  if (statuses.every((s) => s === "committed" || s === "revealed" || s === "failed")) {
    job.status = "committed";
    return;
  }
  job.status = "generated";
}
