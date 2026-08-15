// @wagmi/connectors' baseAccount.js dynamically imports @base-org/account, whose
// dependency chain (@coinbase/cdp-sdk -> optional @x402/* payment-scheme packages)
// isn't installed and breaks Turbopack's static import resolution. We never select
// the Coinbase/Base Account wallet in src/lib/wagmi-config.ts, so this connector
// is unreachable at runtime — stub the SDK factory it would otherwise dynamically
// import. See specs/memory/ for the full write-up if this needs revisiting.
export function createBaseAccountSDK(): never {
  throw new Error("BountyMint does not support the Coinbase/Base Account connector.");
}
