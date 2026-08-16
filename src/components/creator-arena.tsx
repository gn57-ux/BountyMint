"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

import { buildGenerationAuthMessage } from "@/lib/agents/generation-auth";
import { AGENT_PERSONAS } from "@/lib/agents/personas";
import { toGatewayUrl } from "@/lib/ipfs-gateway";
import type { PublicAgentState } from "@/lib/jobs";
import { dictionary } from "@/lib/i18n";
import { LICENSE_DECLARATION } from "@/lib/license";
import { monadChain } from "@/lib/monad-chain";

type ArenaState = "signing" | "starting" | "done" | "error";

function agentStatusLabel(t: typeof dictionary, agent: PublicAgentState): string {
  switch (agent.status) {
    case "generating":
      return t.arena.agentGenerating;
    case "generated":
    case "cache_fallback":
      return t.arena.agentPreparing;
    case "committed":
      return t.arena.agentCommitted;
    case "revealed":
      return t.arena.agentRevealed;
    case "failed":
      return t.arena.agentFailed;
    default:
      return agent.status;
  }
}

function receiptLabel(t: typeof dictionary, status: PublicAgentState["commitReceiptStatus"]): string {
  if (status === "pending") return t.arena.receiptPending;
  if (status === "confirmed") return t.arena.receiptConfirmed;
  if (status === "failed") return t.arena.receiptFailed;
  return "";
}

function AgentCard({ agent }: { agent: PublicAgentState }) {
  const t = dictionary;
  const revealed = agent.status === "revealed";
  const explorerBase = monadChain.blockExplorers?.default.url;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-dark bg-deep-charcoal p-4">
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-label-caps uppercase text-on-surface">{agent.name}</span>
        {agent.source === "cache_fallback" ? (
          <span className="rounded bg-surface-container-lowest px-2 py-0.5 text-label-caps text-on-surface-variant">
            {t.arena.demoFallback}
          </span>
        ) : null}
      </div>

      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-border-dark bg-background">
        {revealed && agent.imageURI ? (
          // eslint-disable-next-line @next/next/no-img-element -- ipfs gateway URL, not a static/local asset
          <img
            src={toGatewayUrl(agent.imageURI)}
            alt={agent.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-body-sm text-on-surface-variant">
            {agent.status === "committed" ? "🔒" : "…"}
          </span>
        )}
      </div>

      <p className="text-body-sm text-on-surface-variant">{agentStatusLabel(t, agent)}</p>

      {agent.commitTxHash ? (
        <p className="font-mono-data text-mono-data text-on-surface-variant">
          {t.arena.commitTxLabel}: {receiptLabel(t, agent.commitReceiptStatus)}
          {explorerBase ? (
            <>
              {" "}
              ·{" "}
              <a
                href={`${explorerBase}/tx/${agent.commitTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-primary"
              >
                {t.arena.viewOnExplorer}
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      {agent.revealTxHash ? (
        <p className="font-mono-data text-mono-data text-on-surface-variant">
          {t.arena.revealTxLabel}: {receiptLabel(t, agent.revealReceiptStatus)}
          {explorerBase ? (
            <>
              {" "}
              ·{" "}
              <a
                href={`${explorerBase}/tx/${agent.revealTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-primary"
              >
                {t.arena.viewOnExplorer}
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

export function CreatorArena({
  bountyId,
  brief,
  onRevealed,
}: {
  bountyId: bigint;
  brief: string;
  onRevealed?: (agents: PublicAgentState[]) => void;
}) {
  const t = dictionary;
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [state, setState] = useState<ArenaState>("signing");
  const [error, setError] = useState<string>();
  const [agents, setAgents] = useState<PublicAgentState[]>(
    AGENT_PERSONAS.map((persona) => ({
      agentId: persona.id,
      name: persona.name,
      status: "generating",
      payoutAddress: "0x0000000000000000000000000000000000000000",
    })),
  );

  const startedRef = useRef(false);

  // POST /api/bounties/:id/generate now awaits the full pipeline (generation,
  // Pinata upload, 3 commits, 3 reveals — well under a minute in practice)
  // and returns the final agent states directly, instead of returning a
  // jobId to poll GET /api/jobs/:jobId afterward. On Vercel, that poll could
  // land on a different serverless instance than the one running the
  // background job, whose in-memory store never had it — confirmed live on
  // the deployed demo as three cards
  // stuck on "generating" forever. Awaiting the single request sidesteps the
  // cross-instance dependency entirely.
  async function attemptGeneration() {
    setState("signing");
    setError(undefined);

    let signature: `0x${string}`;
    try {
      signature = await signMessageAsync({
        message: buildGenerationAuthMessage(bountyId.toString(), brief),
      });
    } catch {
      setState("error");
      setError(t.arena.signRejected);
      return;
    }

    setState("starting");
    try {
      const response = await fetch(`/api/bounties/${bountyId.toString()}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, licenseDeclaration: LICENSE_DECLARATION, signature }),
      });
      const body = (await response.json()) as {
        status?: string;
        agents?: PublicAgentState[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error || `HTTP ${response.status}`);
      }
      if (!Array.isArray(body.agents)) {
        throw new Error("Unexpected response from server");
      }

      setAgents(body.agents);
      setState("done");

      // job.status "revealed" only means every agent *settled* (revealed or
      // permanently failed) — the contract itself only reaches its Revealed
      // status once all three actually revealed (bounty.revealCount ==
      // AGENT_COUNT). If one agent's reveal failed, the job still resolves
      // to "revealed" here (so it isn't stuck as permanently active), but
      // awardWinner would revert for every agent — so only hand off to
      // winner selection when every agent is individually "revealed".
      const allRevealed = body.agents.every((a) => a.status === "revealed");
      if (body.status === "revealed" && allRevealed) {
        onRevealed?.(body.agents);
      }
    } catch (err) {
      setState("error");
      setError(t.arena.startError.replace("{error}", err instanceof Error ? err.message : "unknown"));
    }
  }

  useEffect(() => {
    if (startedRef.current || !address) return;
    startedRef.current = true;
    void attemptGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return (
    <section className="w-full">
      <h2 className="mb-4 font-subheading text-subheading text-primary">{t.arena.title}</h2>

      {state === "signing" ? (
        <p className="text-body-sm text-on-surface-variant">{t.arena.signPrompt}</p>
      ) : null}
      {state === "starting" ? (
        <p className="text-body-sm text-on-surface-variant">{t.arena.startingBody}</p>
      ) : null}
      {state === "error" && error ? (
        <div className="mb-4 flex items-center gap-3">
          <p className="text-body-sm text-error">{error}</p>
          <button
            type="button"
            onClick={() => void attemptGeneration()}
            className="rounded-md border border-border-dark px-3 py-1 text-body-sm text-on-surface-variant hover:text-primary"
          >
            {t.arena.retry}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.agentId} agent={agent} />
        ))}
      </div>
    </section>
  );
}
