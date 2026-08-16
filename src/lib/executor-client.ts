import { createWalletClient, http, type Account, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { monadChain } from "./monad-chain.ts";

// viem's privateKeyToAccount requires a "0x"-prefixed hex string, but a key
// pasted from a wallet export or password manager commonly omits it — accept
// either form rather than failing on a purely cosmetic difference.
function normalizePrivateKey(key: string): Hex {
  const trimmed = key.trim();
  return (trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`) as Hex;
}

// executor represents a trusted server-held signer used only to submit/reveal
// Creator Agent work (commitWork/revealWork) — never to withdraw bounty funds
// (PRD §19.1/§12.5). Private key only ever read
// from a server-side env var, never sent to the client.
function getExecutorAccount(): Account {
  const key = process.env.EXECUTOR_PRIVATE_KEY;
  if (!key) {
    throw new Error("EXECUTOR_PRIVATE_KEY is not configured");
  }
  return privateKeyToAccount(normalizePrivateKey(key));
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
