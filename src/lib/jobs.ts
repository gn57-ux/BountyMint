import type { Address, Hex } from "viem";

import type { AgentId } from "./agents/personas";

export type AgentJobStatus =
  | "generating"
  | "generated"
  | "cache_fallback"
  | "committed"
  | "revealed"
  | "failed";

export interface AgentJobState {
  agentId: AgentId;
  name: string;
  status: AgentJobStatus;
  payoutAddress: Address;
  source?: "generated" | "cache_fallback";
  imageBuffer?: Buffer;
  imageHash?: Hex;
  metadataURI?: string;
  commitHash?: Hex;
  // Server-internal only — must never appear in a public API response before
  // the corresponding on-chain Commit lands (specs/3.agent-orchestration-generation
  // design.md, PRD §1.1). Revealing it early would let anyone forge the winning
  // Commit/Reveal pair. See toPublicAgentState below and its test coverage.
  salt?: Hex;
  error?: string;
}

export interface JobState {
  jobId: string;
  bountyId: string;
  status: "generating" | "generated" | "failed";
  agents: AgentJobState[];
  createdAt: number;
}

// The subset of AgentJobState that is safe to hand back over the public
// GET /api/jobs/:jobId API — explicitly excludes `salt` (see AC-006) and the
// server-internal `imageBuffer`/`error` fields.
export type PublicAgentState = Pick<
  AgentJobState,
  "agentId" | "name" | "status" | "payoutAddress" | "imageHash" | "metadataURI" | "commitHash"
>;

export function toPublicAgentState(agent: AgentJobState): PublicAgentState {
  return {
    agentId: agent.agentId,
    name: agent.name,
    status: agent.status,
    payoutAddress: agent.payoutAddress,
    imageHash: agent.imageHash,
    metadataURI: agent.metadataURI,
    commitHash: agent.commitHash,
  };
}

// Process-in-memory only, no persistence — matches PRD §15.2: this store tracks
// transient generation progress, not business state. The browser recovers
// business state (bounty/Commit/Reveal/winner) from on-chain reads, so losing
// this map is expected and does not corrupt anything on-chain.
//
// Known limitation on the Vercel deploy target: if a POST and a later GET land
// on different warm serverless instances, this Map won't have the jobId and
// GET /api/jobs/:jobId returns 404 even though generation is proceeding fine
// server-side. Fixing this properly means external shared storage, which PRD
// §15.2 explicitly rules out for business state — and job progress isn't
// business state, so we accept the risk here rather than add a database for a
// hackathon demo. See specs/memory/vercel-serverless-in-memory-job-store-tradeoff.md.
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

// Guards against duplicate concurrent generation jobs for the same bounty —
// each job spawns three paid OpenAI requests, so repeated POSTs for the same
// bountyId while one is already in flight would otherwise multiply cost for
// no benefit (see specs/memory/ for the codex-review finding this addresses).
export function findActiveJobByBountyId(bountyId: string): JobState | undefined {
  for (const job of jobs.values()) {
    if (job.bountyId === bountyId && job.status === "generating") {
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

function recomputeJobStatus(job: JobState): void {
  const allSettled = job.agents.every((a) => a.status !== "generating");
  const allFailed = job.agents.every((a) => a.status === "failed");
  job.status = !allSettled ? "generating" : allFailed ? "failed" : "generated";
}
