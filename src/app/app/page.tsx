"use client";

import { useState } from "react";
import type { Hash } from "viem";

import { CreateBountyForm } from "@/components/create-bounty-form";
import { CreatingStatusPanel } from "@/components/creating-status-panel";
import { CreatorArena } from "@/components/creator-arena";
import { Header } from "@/components/header";
import { NetworkBanner } from "@/components/network-banner";
import { WinnerSelection } from "@/components/winner-selection";
import { dictionary } from "@/lib/i18n";
import type { PublicAgentState } from "@/lib/jobs";

type CreatedBounty = { bountyId: bigint; txHash: Hash; brief: string };
type PageStatus = "idle" | "creating" | "revealed";

export default function AppHome() {
  const t = dictionary;
  const [status, setStatus] = useState<PageStatus>("idle");
  const [created, setCreated] = useState<CreatedBounty>();
  const [revealedAgents, setRevealedAgents] = useState<PublicAgentState[]>([]);

  function handleCreated(result: CreatedBounty) {
    setCreated(result);
    setStatus("creating");
  }

  function handleRevealed(agents: PublicAgentState[]) {
    setRevealedAgents(agents);
    setStatus("revealed");
  }

  return (
    <>
      <Header />
      <NetworkBanner />
      <main className="mx-auto flex w-full max-w-[1100px] flex-grow flex-col items-center justify-center px-margin-mobile py-section-gap pt-32 md:px-gutter">
        <section className="mb-12 w-full text-center">
          <h1 className="mb-6 whitespace-pre-line font-display-hero text-display-hero text-on-surface md:text-[64px] md:leading-[1.1] md:tracking-[-1.5px]">
            {t.hero.title}
          </h1>
          <p className="mx-auto max-w-2xl text-body-lg text-on-surface-variant">
            {t.hero.subtitle}
          </p>
        </section>

        <div className="flex w-full flex-col gap-8">
          {status === "revealed" && created ? (
            <WinnerSelection bountyId={created.bountyId} agents={revealedAgents} />
          ) : status === "creating" && created ? (
            <>
              <CreatingStatusPanel bountyId={created.bountyId} txHash={created.txHash} />
              <CreatorArena bountyId={created.bountyId} brief={created.brief} onRevealed={handleRevealed} />
            </>
          ) : (
            <CreateBountyForm onCreated={handleCreated} />
          )}
        </div>
      </main>
      <footer className="mt-auto flex w-full flex-col items-center justify-between gap-2 border-t border-border-dark bg-surface-container-lowest px-margin-mobile py-section-gap text-body-sm text-primary md:flex-row md:px-gutter">
        <div className="font-label-caps text-label-caps text-on-surface-variant">
          {t.footer.copyright}
        </div>
        <div className="flex gap-6">
          <a
            href="#"
            className="text-on-surface-variant underline transition-all hover:text-primary hover:opacity-80"
          >
            {t.footer.explorer}
          </a>
          <a
            href="#"
            className="text-on-surface-variant underline transition-all hover:text-primary hover:opacity-80"
          >
            {t.footer.github}
          </a>
          <a
            href="#"
            className="text-on-surface-variant underline transition-all hover:text-primary hover:opacity-80"
          >
            {t.footer.twitter}
          </a>
          <a
            href="#"
            className="text-on-surface-variant underline transition-all hover:text-primary hover:opacity-80"
          >
            {t.footer.discord}
          </a>
        </div>
      </footer>
    </>
  );
}
