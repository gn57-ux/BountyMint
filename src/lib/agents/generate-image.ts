import OpenAI from "openai";

const REQUEST_TIMEOUT_MS = 15_000;

let client: OpenAI | undefined;

// Checked by the caller (orchestrate.ts) before attempting generation at all —
// OpenAI is a soft dependency for this demo (see specs/3.agent-orchestration-generation),
// so an unset key must route straight to the cache fallback without waiting on
// a network round trip or the global generation deadline.
export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

async function requestImage(prompt: string): Promise<Buffer> {
  const response = await getClient().images.generate(
    { model: "gpt-image-1", prompt, size: "1024x1024", n: 1 },
    { timeout: REQUEST_TIMEOUT_MS },
  );

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI image generation returned no image data");
  }
  return Buffer.from(b64, "base64");
}

// One retry on failure per specs/3.agent-orchestration-generation/design.md §模块2.
// Errors are intentionally not logged with full detail here — see security.md:
// image-generation failures must not leak API-key-adjacent response bodies.
export async function generateImage(prompt: string): Promise<Buffer> {
  try {
    return await requestImage(prompt);
  } catch {
    return await requestImage(prompt);
  }
}
