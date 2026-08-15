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

const POLL_INTERVAL_MS = 2000;

type ArenaState = "signing" | "starting" | "polling" | "done" | "error";

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

export function CreatorArena({ bountyId, brief }: { bountyId: bigint; brief: string }) {
  const t = dictionary;
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [state, setState] = useState<ArenaState>("signing");
  const [error, setError] = useState<string>();
  const [jobId, setJobId] = useState<string>();
  const [agents, setAgents] = useState<PublicAgentState[]>(
    AGENT_PERSONAS.map((persona) => ({
      agentId: persona.id,
      name: persona.name,
      status: "generating",
      payoutAddress: "0x0000000000000000000000000000000000000000",
    })),
  );

  const startedRef = useRef(false);

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
      const body = (await response.json()) as { jobId?: string; error?: string };
      if (!response.ok || !body.jobId) {
        throw new Error(body.error || `HTTP ${response.status}`);
      }
      setJobId(body.jobId);
      setState("polling");
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

  useEffect(() => {
    if (!jobId || state !== "polling") return;

    let cancelled = false;
    async function poll() {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const body = (await response.json()) as { status?: string; agents?: PublicAgentState[] };
        if (cancelled || !body.agents) return;
        setAgents(body.agents);
        if (body.status === "revealed" || body.status === "failed") {
          setState("done");
        }
      } catch {
        // Transient poll failure — the next interval tick retries.
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    void poll();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId, state]);

  return (
    <section className="w-full">
      <h2 className="mb-4 font-subheading text-subheading text-primary">{t.arena.title}</h2>

      {state === "signing" || state === "starting" ? (
        <p className="text-body-sm text-on-surface-variant">{t.arena.signPrompt}</p>
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
