import { createWalletClient, http, type Account } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { monadChain } from "./monad-chain.ts";

// executor represents a trusted server-held signer used only to submit/reveal
// Creator Agent work (commitWork/revealWork) — never to withdraw bounty funds
// (PRD §19.1/§12.5, .claude/rules/backend-api.md). Private key only ever read
// from a server-side env var, never sent to the client.
function getExecutorAccount(): Account {
  const key = process.env.EXECUTOR_PRIVATE_KEY;
  if (!key) {
    throw new Error("EXECUTOR_PRIVATE_KEY is not configured");
  }
  return privateKeyToAccount(key as `0x${string}`);
}

export function isExecutorConfigured(): boolean {
  return Boolean(process.env.EXECUTOR_PRIVATE_KEY);
}

export function getExecutorAddress() {
  return getExecutorAccount().address;
}

export function getExecutorWalletClient() {
  return createWalletClient({
    account: getExecutorAccount(),
    chain: monadChain,
    transport: http(),
  });
}
