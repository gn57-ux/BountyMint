"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useChainId } from "wagmi";

import { dictionary } from "@/lib/i18n";
import { monadChain } from "@/lib/monad-chain";
import { useNetworkSwitch } from "@/lib/network-switch-context";

export function Header() {
  const t = dictionary;
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useNetworkSwitch();
  const onMonad = chainId === monadChain.id;

  return (
    <header className="fixed top-0 left-0 z-50 flex h-20 w-full items-center justify-between border-b border-border-dark bg-background px-margin-mobile text-primary md:px-gutter">
      <div className="mx-auto flex w-full max-w-container-max items-center justify-between">
        <div className="font-display-hero text-display-hero tracking-tighter text-on-surface">
          {t.nav.brand}
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#how-it-works"
            className="font-medium text-on-surface-variant transition-colors duration-200 hover:text-primary"
          >
            {t.nav.howItWorks}
          </a>
          <a
            href="#finished-bounties"
            className="font-medium text-on-surface-variant transition-colors duration-200 hover:text-primary"
          >
            {t.nav.finishedBounties}
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="px-2 text-body-sm text-on-surface-variant transition-colors hover:text-primary"
            title={t.nav.languageToggle}
          >
            {t.nav.languageToggle}
          </button>

          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              if (!ready) {
                return <div className="h-9 w-32 animate-pulse rounded-full bg-surface-container" />;
              }

              if (!connected) {
                return (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="rounded-md border border-border-dark bg-deep-charcoal px-4 py-2 text-body-sm font-medium text-on-surface transition-colors duration-200 hover:text-primary"
                  >
                    {t.wallet.connect}
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!onMonad) {
                        switchChain?.({ chainId: monadChain.id });
                        return;
                      }
                      openChainModal();
                    }}
                    className="hidden items-center gap-2 rounded-full border border-border-dark bg-deep-charcoal px-3 py-1.5 font-mono-data text-mono-data md:flex"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${onMonad ? "bg-success-green" : "bg-error-red"}`}
                    />
                    <span className="text-on-surface-variant">
                      {isSwitching
                        ? t.wallet.switching
                        : onMonad
                          ? t.wallet.networkStatusLabel
                          : t.wallet.switchNetwork}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={openAccountModal}
                    className="rounded-md border border-border-dark bg-deep-charcoal px-4 py-2 text-body-sm font-medium text-on-surface transition-colors duration-200 hover:text-primary"
                  >
                    {account.displayName}
                    {account.displayBalance ? ` · ${account.displayBalance}` : ""}
                  </button>
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}
