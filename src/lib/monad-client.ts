import { createPublicClient, http } from "viem";

import { monadChain } from "./monad-chain";

// Server-side read client shared by any API route that needs to verify
// on-chain bounty state (creator, status, deadline) before acting on it.
export const publicClient = createPublicClient({
  chain: monadChain,
  transport: http(),
});
