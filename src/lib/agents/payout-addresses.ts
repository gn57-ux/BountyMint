import { getAddress, type Address } from "viem";

import type { AgentPersona } from "./personas";

// Placeholder Creator Agent payout wallets — replace with the official values
// on competition day (see specs/7.deploy-and-demo-readiness). Defaults are
// Anvil/Hardhat's well-known deterministic test accounts (from the standard
// "test test test test test test test test test test test junk" mnemonic),
// chosen because any Solidity developer immediately recognizes them as
// throwaway placeholders, not real fund-recipient addresses.
//
// SAFE for local Anvil only — NOT safe as a fallback on any public network.
// Because these private keys are famous/public, anyone can (and on Monad
// Testnet, someone already has) submit an EIP-7702 authorization delegating
// one of these addresses to an arbitrary contract on any chain. That turns
// what looks like a plain EOA into a smart account with its own fallback
// logic — awardWinner's low-level `payoutAddress.call{value: reward}("")`
// then depends on however that unrelated third-party contract behaves,
// which failed outright during a live Monad Testnet smoke test (2026-08-15,
// see specs/LESSONS.md). Set the AGENT_PAYOUT_ADDRESS_* env vars to real,
// never-before-used addresses (eth_getCode == 0x) before any real deploy —
// do not rely on this fallback past local development.
const DEFAULT_PAYOUT_ADDRESSES: Record<AgentPersona["slug"], Address> = {
  pixelforge: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  neonmuse: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  mythicai: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
};

function envVarName(persona: AgentPersona): string {
  return `AGENT_PAYOUT_ADDRESS_${persona.slug.toUpperCase()}`;
}

export function getPayoutAddress(persona: AgentPersona): Address {
  const fromEnv = process.env[envVarName(persona)]?.trim();
  return getAddress(fromEnv && fromEnv !== "" ? fromEnv : DEFAULT_PAYOUT_ADDRESSES[persona.slug]);
}
