"use client";

import { useAccount } from "wagmi";

import { dictionary } from "@/lib/i18n";
import { monadChain } from "@/lib/monad-chain";
import { useNetworkSwitch } from "@/lib/network-switch-context";

export function NetworkBanner() {
  const t = dictionary;
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending, error } = useNetworkSwitch();

  if (!isConnected || chainId === monadChain.id) {
    return null;
  }

  return (
    <div className="mt-20 w-full border-b border-border-dark bg-error-container/20 px-margin-mobile py-3 text-center text-body-sm text-on-error-container md:px-gutter">
      <p>
        {t.wallet.networkMismatch} —{" "}
        <button
          type="button"
          disabled={isPending}
          onClick={() => switchChain({ chainId: monadChain.id })}
          className="font-medium underline underline-offset-2 hover:text-primary disabled:opacity-60"
        >
          {isPending ? t.wallet.switching : t.wallet.switchNetwork}
        </button>
      </p>
      {error ? (
        <div className="mx-auto mt-2 max-w-xl rounded-md border border-border-dark bg-deep-charcoal p-3 text-left font-mono-data text-mono-data text-on-surface-variant">
          <p className="mb-1 text-on-surface">{t.wallet.switchFailed}：</p>
          <p>RPC: {monadChain.rpcUrls.default.http[0]}</p>
          <p>Chain ID: {monadChain.id}</p>
          <p>Explorer: {monadChain.blockExplorers?.default.url}</p>
        </div>
      ) : null}
    </div>
  );
}
