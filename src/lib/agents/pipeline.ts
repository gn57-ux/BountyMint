import type { Hex } from "viem";

import { bountyMintAbi, bountyMintAddress } from "../contracts/bounty-mint.ts";
import { getExecutorWalletClient } from "../executor-client.ts";
import { computeCommitHash } from "../hash.ts";
import { getJob, updateAgentState, type AgentJobState } from "../jobs.ts";
import { LICENSE_DECLARATION } from "../license.ts";
import { publicClient } from "../monad-client.ts";
import { pinImageToIPFS, pinJsonToIPFS } from "../storage/pinata.ts";
import { buildMetadata } from "./metadata.ts";
import { getPersona } from "./personas.ts";
import { runOrchestration } from "./orchestrate.ts";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

// Marks every not-yet-failed agent as failed with the same setup error, so a
// pipeline-level exception (chain read, executor init) still leaves the job in
// a terminal state instead of stuck in "generated"/"committed" forever — an
// orphaned non-terminal job permanently blocks findActiveJobByBountyId from
// ever allowing a retry for this bounty (src/lib/jobs.ts).
function failAgents(jobId: string, agents: readonly AgentJobState[], error: unknown) {
  const message = errorMessage(error);
  for (const agent of agents) {
    if (agent.status === "failed") continue;
    updateAgentState(jobId, agent.agentId, { status: "failed", error: message });
  }
}

async function uploadAndFinalizeCommitHash(bountyId: bigint, promptHash: Hex, jobId: string, agent: AgentJobState) {
  if (!agent.imageBuffer || !agent.imageHash || !agent.salt) return;
  try {
    const persona = getPersona(agent.agentId);
    // The deterministic demo artwork already ships with the web app. Keep the
    // demo path independent from third-party storage availability so a Pinata
    // outage or credential issue cannot block the real Monad Commit/Reveal
    // walkthrough. Live model outputs still use Pinata below.
    const appUrl = APP_URL.replace(/\/$/, "");
    const imageURI =
      agent.source === "cache_fallback"
        ? `${appUrl}/assets/fallback/${persona.slug}.png`
        : await pinImageToIPFS(agent.imageBuffer, `bounty-${bountyId}-${persona.slug}.png`);
    const metadata = buildMetadata({
      bountyId: bountyId.toString(),
      persona,
      imageURI,
      imageHash: agent.imageHash,
      promptHash,
      licenseDeclaration: LICENSE_DECLARATION,
      appUrl: APP_URL,
    });
    const metadataURI =
      agent.source === "cache_fallback"
        ? `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString("base64")}`
        : await pinJsonToIPFS(metadata, `bounty-${bountyId}-${persona.slug}-metadata.json`);
    const commitHash = computeCommitHash({
      bountyId,
      agentId: agent.agentId,
      imageHash: agent.imageHash,
      metadataURI,
      salt: agent.salt,
    });
    updateAgentState(jobId, agent.agentId, { imageURI, metadataURI, commitHash });
  } catch (error) {
    updateAgentState(jobId, agent.agentId, { status: "failed", error: errorMessage(error) });
  }
}

// Sequential, not parallel — a parallel batch with pre-assigned explicit
// nonces leaves a permanent nonce gap on the executor account if any one
// submission fails before broadcasting (network error, RPC rejection): the
// chain will never mine a later nonce until the skipped one is filled, which
// would stall every subsequent commit/reveal for every future bounty on this
// executor, not just this job. Sequential + auto nonce (like reveal) avoids
// the gap entirely (codex-review 2026-08-15 finding 1).
async function submitCommit(bountyId: bigint, jobId: string, agent: AgentJobState) {
  if (!agent.commitHash) return;
  try {
    updateAgentState(jobId, agent.agentId, { commitReceiptStatus: "pending" });
    const walletClient = getExecutorWalletClient();
    const hash = await walletClient.writeContract({
      address: bountyMintAddress,
      abi: bountyMintAbi,
      functionName: "commitWork",
      args: [bountyId, agent.agentId, agent.commitHash, agent.payoutAddress],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      throw new Error("commitWork transaction reverted");
    }
    updateAgentState(jobId, agent.agentId, {
      status: "committed",
      commitTxHash: hash,
      commitReceiptStatus: "confirmed",
    });
  } catch (error) {
    updateAgentState(jobId, agent.agentId, {
      status: "failed",
      commitReceiptStatus: "failed",
      error: errorMessage(error),
    });
  }
}

async function submitReveal(bountyId: bigint, jobId: string, agent: AgentJobState) {
  if (!agent.imageHash || !agent.metadataURI || !agent.salt) {
    updateAgentState(jobId, agent.agentId, { status: "failed", error: "missing data for reveal" });
    return;
  }
  try {
    updateAgentState(jobId, agent.agentId, { revealReceiptStatus: "pending" });
    const walletClient = getExecutorWalletClient();
    const hash = await walletClient.writeContract({
      address: bountyMintAddress,
      abi: bountyMintAbi,
      functionName: "revealWork",
      args: [bountyId, agent.agentId, agent.imageHash, agent.metadataURI, agent.salt],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      throw new Error("revealWork transaction reverted");
    }
    updateAgentState(jobId, agent.agentId, {
      status: "revealed",
      revealTxHash: hash,
      revealReceiptStatus: "confirmed",
    });
  } catch (error) {
    // Reveal inputs are entirely executor-controlled (we computed commitHash
    // ourselves from the same imageHash/metadataURI/salt we reveal with), so a
    // genuine mismatch shouldn't occur in correct code — this branch is for
    // transient failures (RPC/gas), not the "wrong salt" scenario exercised by
    // contracts/test (specs/1.smart-contract-core), which is a contract-level
    // revert test, not an executor operational path. Marking the agent failed
    // (not just recording the receipt status) is what lets the job reach a
    // terminal state instead of sitting at "committed" forever — an agent
    // stuck at "committed" with no path to "revealed" or "failed" would keep
    // findActiveJobByBountyId treating this bounty as permanently active
    // (codex-review 2026-08-15 finding 3).
    updateAgentState(jobId, agent.agentId, {
      status: "failed",
      revealReceiptStatus: "failed",
      error: errorMessage(error),
    });
  }
}

// Chains Feature 4's on-chain Commit/Reveal execution directly after Feature
// 3's image generation completes, all within the same after() background
// invocation (specs/4.commit-reveal-execution design.md: "无新增对外 HTTP 接口；
// Commit/Reveal 为后端内部异步流程，由 generate 请求触发后自动串联执行").
export async function runFullPipeline(jobId: string, bountyId: bigint, brief: string): Promise<void> {
  await runOrchestration(jobId, bountyId, brief);

  const generated = getJob(jobId);
  if (!generated || generated.status !== "generated") return;

  let promptHash: Hex;
  try {
    const bounty = await publicClient.readContract({
      address: bountyMintAddress,
      abi: bountyMintAbi,
      functionName: "bounties",
      args: [bountyId],
    });
    promptHash = bounty[2];
  } catch (error) {
    // Chain read failed (bad RPC, bounty vanished) — nothing downstream can
    // proceed; fail every agent so the job doesn't hang (codex-review finding 2).
    failAgents(jobId, generated.agents, error);
    return;
  }

  await Promise.all(
    generated.agents
      .filter((agent) => agent.status !== "failed")
      .map((agent) => uploadAndFinalizeCommitHash(bountyId, promptHash, jobId, agent)),
  );

  const uploaded = getJob(jobId);
  if (!uploaded) return;
  const commitReady = uploaded.agents.filter((agent) => agent.status !== "failed" && agent.commitHash);
  if (commitReady.length === 0) return; // every agent already failed — job.status resolves to "failed" on its own

  try {
    // Resolve the executor account once up front so a missing/invalid
    // EXECUTOR_PRIVATE_KEY fails the whole batch clearly instead of failing
    // each agent independently with the same underlying cause.
    getExecutorWalletClient();
  } catch (error) {
    failAgents(jobId, commitReady, error);
    return;
  }

  // Sequential — see submitCommit's comment on why parallel + explicit nonce
  // is unsafe here.
  for (const agent of commitReady) {
    await submitCommit(bountyId, jobId, agent);
  }

  const committed = getJob(jobId)?.agents.filter((agent) => agent.status === "committed") ?? [];
  if (committed.length !== 3) return; // revealWork reverts unless all three commits landed

  // Sequential, not parallel — avoids nonce races on the same executor account
  // (specs/4.commit-reveal-execution design.md technical decision).
  for (const agent of committed) {
    await submitReveal(bountyId, jobId, agent);
  }
}
