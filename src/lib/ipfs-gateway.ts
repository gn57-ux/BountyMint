// Resolves an ipfs:// URI to an https URL the browser can actually fetch.
// Used only after Reveal (src/lib/jobs.ts gates ipfs URIs until then).
export function toGatewayUrl(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return `https://gateway.pinata.cloud/ipfs/${uri.slice("ipfs://".length)}`;
  }
  return uri;
}
