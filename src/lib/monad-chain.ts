import { defineChain } from "viem";

const rpcUrl = process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://replace-with-monad-testnet-rpc";
const explorerUrl = process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL || "https://replace-with-monad-explorer";
const chainId = Number(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID ?? 0);

// Placeholder Monad network parameters — replace with the official values on competition day.
// See specs/7.deploy-and-demo-readiness/tasks.md T-002.
export const monadChain = defineChain({
  id: chainId,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: explorerUrl },
  },
  testnet: true,
});
