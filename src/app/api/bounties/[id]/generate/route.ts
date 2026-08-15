import { after, NextResponse } from "next/server";
import { zeroAddress, type Hex } from "viem";

import { runFullPipeline } from "@/lib/agents/pipeline";
import { AGENT_PERSONAS } from "@/lib/agents/personas";
import { verifyGenerationSignature } from "@/lib/agents/generation-auth";
import { getPayoutAddress } from "@/lib/agents/payout-addresses";
import { bountyMintAbi, bountyMintAddress } from "@/lib/contracts/bounty-mint";
import { createJob, findActiveJobByBountyId } from "@/lib/jobs";
import { LICENSE_DECLARATION } from "@/lib/license";
import { publicClient } from "@/lib/monad-client";
import { isRequestRateLimited } from "@/lib/rate-limit";

// Covers the full chained pipeline (specs/4.commit-reveal-execution): the 25s
// generation deadline, two Pinata uploads per agent, three parallel commit
// txs, then three sequential reveal txs — each awaited to a confirmed
// receipt — so the `after()` background work below isn't cut off mid-flight
// on platforms that enforce a duration cap.
export const maxDuration = 120;

interface GenerateRequestBody {
  brief?: unknown;
  // Must equal LICENSE_DECLARATION exactly — the frontend's checkbox only ever
  // sends that fixed text, so any other value means the caller bypassed the UI
  // (or the actual acceptance) rather than a legitimate declaration.
  licenseDeclaration?: unknown;
  // EIP-191 personal-sign signature over buildGenerationAuthMessage(id, brief),
  // proving the caller controls the wallet that created this bounty on-chain.
  // Without this, any caller who knows a bounty ID could preempt the real
  // publisher and burn paid OpenAI requests on an arbitrary brief — see
  // codex-review/review-20260815-004651.md finding 1.
  signature?: unknown;
}

export async function POST(request: Request, context: RouteContext<"/api/bounties/[id]/generate">) {
  const { id } = await context.params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid bounty id" }, { status: 400 });
  }

  if (isRequestRateLimited(request)) {
    return NextResponse.json({ error: "Too many requests, please slow down" }, { status: 429 });
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof parsed !== "object" || parsed === null) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const body = parsed as GenerateRequestBody;

  const brief = typeof body.brief === "string" ? body.brief.trim() : "";
  const licenseDeclaration =
    typeof body.licenseDeclaration === "string" ? body.licenseDeclaration.trim() : "";

  if (!brief) {
    return NextResponse.json({ error: "brief is required" }, { status: 400 });
  }
  if (licenseDeclaration !== LICENSE_DECLARATION) {
    return NextResponse.json(
      { error: "licenseDeclaration must match the fixed authorization statement" },
      { status: 400 },
    );
  }

  const signature = typeof body.signature === "string" ? body.signature.trim() : "";
  if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) {
    return NextResponse.json({ error: "signature is required" }, { status: 400 });
  }

  // Reading the bounty from chain also rejects IDs that don't fit uint256 or
  // don't exist yet (creator defaults to the zero address) — see finding 2.
  let creator: `0x${string}`;
  try {
    const bounty = await publicClient.readContract({
      address: bountyMintAddress,
      abi: bountyMintAbi,
      functionName: "bounties",
      args: [BigInt(id)],
    });
    creator = bounty[0];
  } catch {
    return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
  }
  if (creator === zeroAddress) {
    return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
  }

  const authorized = await verifyGenerationSignature({
    bountyId: id,
    brief,
    signature: signature as Hex,
    creator,
  });
  if (!authorized) {
    return NextResponse.json(
      { error: "signature does not match the bounty creator" },
      { status: 403 },
    );
  }

  const activeJob = findActiveJobByBountyId(id);
  if (activeJob) {
    return NextResponse.json({
      jobId: activeJob.jobId,
      status: activeJob.status,
      agents: AGENT_PERSONAS.map((persona) => persona.name),
    });
  }

  const job = createJob(
    id,
    AGENT_PERSONAS.map((persona) => ({
      agentId: persona.id,
      name: persona.name,
      payoutAddress: getPayoutAddress(persona),
    })),
  );

  // The client polls GET /api/jobs/:jobId for progress instead of waiting on
  // this request (specs/3.agent-orchestration-generation/design.md). Registered
  // via `after()` rather than a bare unawaited call so serverless platforms
  // (the deploy target is Vercel) keep this invocation alive until generation
  // actually finishes instead of tearing it down right after the response is
  // sent — see maxDuration above and specs/memory/ for the codex-review finding.
  after(() => runFullPipeline(job.jobId, BigInt(id), brief));

  return NextResponse.json({
    jobId: job.jobId,
    status: job.status,
    agents: AGENT_PERSONAS.map((persona) => persona.name),
  });
}
