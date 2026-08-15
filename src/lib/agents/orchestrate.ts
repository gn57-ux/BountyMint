import { computeCommitHash, computeImageHash, generateSalt } from "../hash.ts";
import { updateAgentState } from "../jobs.ts";
import { readFallbackImage } from "./fallback.ts";
import { generateImage, isOpenAIConfigured } from "./generate-image.ts";
import { AGENT_PERSONAS, type AgentPersona } from "./personas.ts";
import { buildPrompt } from "./prompt.ts";

const GLOBAL_TIMEOUT_MS = 25_000;

type RaceResult = { kind: "image"; buffer: Buffer } | { kind: "timeout" };

function withGlobalDeadline(promise: Promise<Buffer>, deadlineMs: number): Promise<RaceResult> {
  return Promise.race([
    promise.then((buffer): RaceResult => ({ kind: "image", buffer })),
    new Promise<RaceResult>((resolve) => {
      setTimeout(() => resolve({ kind: "timeout" }), deadlineMs);
    }),
  ]);
}

// Real metadataURI only exists after specs/4.commit-reveal-execution uploads the
// image/metadata to Pinata; commitHash gets recomputed there once it's known.
// See specs/3.agent-orchestration-generation/design.md module 3.
function placeholderMetadataURI(jobId: string, agentId: number): string {
  return `pending://${jobId}/${agentId}`;
}

async function generateForAgent(
  jobId: string,
  bountyId: bigint,
  persona: AgentPersona,
  brief: string,
): Promise<void> {
  const prompt = buildPrompt(persona, brief);
  let imageBuffer: Buffer;
  let source: "generated" | "cache_fallback";

  // OpenAI is a soft dependency for this demo (specs/3.agent-orchestration-generation):
  // without a configured key, skip straight to the pre-baked cache image instead of
  // opening a network request that's guaranteed to fail and racing it against the
  // global deadline — no wasted retry, no wasted wait.
  if (!isOpenAIConfigured()) {
    imageBuffer = await readFallbackImage(persona);
    source = "cache_fallback";
  } else {
    try {
      const raced = await withGlobalDeadline(generateImage(prompt), GLOBAL_TIMEOUT_MS);
      if (raced.kind === "image") {
        imageBuffer = raced.buffer;
        source = "generated";
      } else {
        imageBuffer = await readFallbackImage(persona);
        source = "cache_fallback";
      }
    } catch {
      // generateImage already retries once internally; any remaining failure
      // (or the timeout branch above) falls back to the pre-baked cache image.
      imageBuffer = await readFallbackImage(persona);
      source = "cache_fallback";
    }
  }

  const imageHash = computeImageHash(imageBuffer);
  const salt = generateSalt();
  const metadataURI = placeholderMetadataURI(jobId, persona.id);
  const commitHash = computeCommitHash({
    bountyId,
    agentId: persona.id,
    imageHash,
    metadataURI,
    salt,
  });

  updateAgentState(jobId, persona.id, {
    status: source,
    source,
    imageBuffer,
    imageHash,
    metadataURI,
    commitHash,
    salt,
  });
}

// Runs all three agents concurrently and lets each update the job store
// independently as it settles (not after Promise.all resolves), so
// GET /api/jobs/:jobId reflects real-time per-agent progress instead of
// waiting for the slowest agent. The caller (the POST route handler) still
// awaits the returned promise from inside next/server's `after()` so the
// serverless function isn't torn down before generation actually finishes —
// see that route for why a bare fire-and-forget call isn't safe there.
export async function runOrchestration(jobId: string, bountyId: bigint, brief: string): Promise<void> {
  await Promise.all(
    AGENT_PERSONAS.map((persona) =>
      generateForAgent(jobId, bountyId, persona, brief).catch((error: unknown) => {
        updateAgentState(jobId, persona.id, {
          status: "failed",
          error: error instanceof Error ? error.message : "unknown error",
        });
      }),
    ),
  );
}
