const PIN_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

// Storage plan is Pinata only (specs/4.commit-reveal-execution — no fallback
// tier chosen for this feature). Missing config fails loudly rather than
// silently degrading, so an unconfigured deploy is visible, not mistaken for
// a working one — see .claude/rules/security.md on not faking on-chain state.
export function isPinataConfigured(): boolean {
  return Boolean(process.env.PINATA_JWT);
}

async function pinataPost(url: string, init: RequestInit): Promise<string> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error("PINATA_JWT is not configured");
  }
  const response = await fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) {
    // Only the status is surfaced — the body could echo back request details
    // adjacent to credentials, and PRD security guidance says not to log
    // full third-party API responses.
    throw new Error(`Pinata request failed with status ${response.status}`);
  }
  const body = (await response.json()) as { IpfsHash?: string };
  if (!body.IpfsHash) {
    throw new Error("Pinata response missing IpfsHash");
  }
  return `ipfs://${body.IpfsHash}`;
}

export async function pinImageToIPFS(buffer: Buffer, filename: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]), filename);
  return pinataPost(PIN_FILE_URL, { method: "POST", body: form });
}

export async function pinJsonToIPFS(json: unknown, name: string): Promise<string> {
  return pinataPost(PIN_JSON_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pinataContent: json, pinataMetadata: { name } }),
  });
}
