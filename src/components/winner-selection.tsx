"use client";

import { useEffect, useState } from "react";
import { formatEther, type Hash } from "viem";
import { useAccount, useBalance, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { getPersona, type AgentId } from "@/lib/agents/personas";
import { bountyMintAbi, bountyMintAddress, BountyStatus } from "@/lib/contracts/bounty-mint";
import { dictionary } from "@/lib/i18n";
import { toGatewayUrl } from "@/lib/ipfs-gateway";
import type { PublicAgentState } from "@/lib/jobs";
import { LICENSE_DECLARATION } from "@/lib/license";
import { monadChain } from "@/lib/monad-chain";

type Stage = "select" | "confirm" | "pending" | "confirming" | "success" | "error";

function ConfirmModal({
  agent,
  reward,
  onCancel,
  onConfirm,
}: {
  agent: PublicAgentState;
  reward: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = dictionary;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border-dark bg-deep-charcoal p-6">
        <h3 className="mb-4 font-subheading text-subheading text-primary">{t.winner.confirmTitle}</h3>
        <dl className="mb-6 flex flex-col gap-2 text-body-sm">
          <div className="flex justify-between">
            <dt className="text-on-surface-variant">{t.winner.confirmAgent}</dt>
            <dd className="text-on-surface">{agent.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-on-surface-variant">{t.winner.confirmReward}</dt>
            <dd className="font-mono-data text-on-surface">{reward} MON</dd>
          </div>
          <div>
            <dt className="mb-1 text-on-surface-variant">{t.winner.confirmLicense}</dt>
            <dd className="text-on-surface">{LICENSE_DECLARATION}</dd>
          </div>
        </dl>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border-dark px-4 py-2 text-body-sm text-on-surface-variant hover:text-primary"
          >
            {t.winner.cancelButton}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-monad-purple px-4 py-2 text-body-sm text-white hover:shadow-[0_0_20px_rgba(131,110,249,0.4)]"
          >
            {t.winner.confirmButton}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WinnerSelection({ bountyId, agents }: { bountyId: bigint; agents: PublicAgentState[] }) {
  const t = dictionary;
  const { address } = useAccount();
  const explorerBase = monadChain.blockExplorers?.default.url;

  const { data: bounty, isLoading: isBountyLoading, refetch: refetchBounty } = useReadContract({
    address: bountyMintAddress,
    abi: bountyMintAbi,
    functionName: "bounties",
    args: [bountyId],
    chainId: monadChain.id,
  });

  const isCreator = Boolean(address) && Boolean(bounty) && address?.toLowerCase() === bounty?.[0].toLowerCase();
  const alreadyAwarded = bounty?.[4] === BountyStatus.Awarded;
  const winningTokenId = bounty?.[8];
  const winningAgentId = bounty?.[7] as AgentId | undefined;
  const revealedAgents = agents.filter((a) => a.status === "revealed");

  // "success"/"error" are derived from on-chain data (bounty status, receipt),
  // not stored — storing them and syncing via useEffect caused cascading
  // setState-in-effect renders (react-hooks/set-state-in-effect). Only the
  // pre-transaction UI steps are genuinely local/user-driven state.
  const [manualStage, setManualStage] = useState<"select" | "confirm" | "pending">("select");
  const [selected, setSelected] = useState<PublicAgentState | null>(null);
  const [submitError, setSubmitError] = useState<string>();
  const [txHash, setTxHash] = useState<Hash>();

  // Once the bounty is actually Awarded on-chain, the winner shown must come
  // from `winningAgentId` (chain truth), never the locally-clicked `selected`
  // — if this tab's award tx is still pending while a different tab/tx
  // already awarded a different agent, `selected` would otherwise keep
  // showing this tab's stale pick instead of the real on-chain winner.
  // `selected` only drives the pre-confirmation UI (confirm modal, pending
  // state).
  const winner = alreadyAwarded
    ? revealedAgents.find((a) => a.agentId === winningAgentId)
    : (selected ?? revealedAgents.find((a) => a.agentId === winningAgentId));
  const winnerPersona = winningAgentId ? getPersona(winningAgentId) : undefined;

  const { writeContractAsync, reset: resetWrite } = useWriteContract();
  const { data: receipt, isSuccess: isMined } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: monadChain.id,
  });

  const { data: verifiedOwner } = useReadContract({
    address: bountyMintAddress,
    abi: bountyMintAbi,
    functionName: "ownerOf",
    args: winningTokenId !== undefined ? [winningTokenId] : undefined,
    chainId: monadChain.id,
    query: { enabled: Boolean(alreadyAwarded && winningTokenId !== undefined) },
  });

  // Balance evidence for the payout flow (requirements.md F-006: "奖金前后余额/
  // 流向") — the recipient's current balance, fetched only once truly Awarded,
  // as on-chain proof the transfer actually landed.
  const { data: payoutBalance } = useBalance({
    address: winner?.payoutAddress,
    chainId: monadChain.id,
    query: { enabled: Boolean(alreadyAwarded && winner?.payoutAddress) },
  });

  const txSucceeded = isMined && receipt?.status === "success";
  const txReverted = isMined && receipt?.status !== "success";
  // Success is only shown once the *refetched* bounty struct itself confirms
  // Awarded — the receipt alone isn't enough: right after mining, `bounty` is
  // still the pre-award read (tokenId 0, no owner), and if the refetch below
  // ever failed that stale/wrong data would render as if it were final.
  // "confirming" covers the gap between the tx confirming and the contract
  // read catching up.
  const stage: Stage = alreadyAwarded
    ? "success"
    : txSucceeded
      ? "confirming"
      : txReverted
        ? "error"
        : manualStage;
  const error = txReverted ? t.winner.awardError : submitError;

  // Refetch on-chain bounty state once the award tx mines — on ANY outcome,
  // not just success. A revert here doesn't necessarily mean nothing
  // happened: it commonly means a competing award tx (another tab, another
  // signer) landed first, which already put the bounty in a real Awarded
  // state. Only refetching on success would leave `bounty` stale at
  // "Revealed" forever in that case, stuck showing a generic failure instead
  // of the actual on-chain winner. Keep retrying on a short interval until
  // the refetch reflects Awarded — a side effect on an external system (the
  // read-contract cache), not a local setState.
  useEffect(() => {
    if (!isMined || alreadyAwarded) return;
    void refetchBounty();
    const interval = setInterval(() => void refetchBounty(), 1500);
    return () => clearInterval(interval);
  }, [isMined, alreadyAwarded, refetchBounty]);

  function openConfirm(agent: PublicAgentState) {
    if (!isCreator || alreadyAwarded || manualStage === "pending") return;
    // Clear any previous (possibly reverted) tx so its stale receipt can't
    // keep forcing `stage` to "error" and blocking the confirm modal from
    // reopening for a retry.
    setTxHash(undefined);
    setSubmitError(undefined);
    setSelected(agent);
    setManualStage("confirm");
  }

  async function confirmAward() {
    if (!selected) return;
    setManualStage("pending");
    setSubmitError(undefined);
    resetWrite();
    try {
      const hash = await writeContractAsync({
        address: bountyMintAddress,
        abi: bountyMintAbi,
        functionName: "awardWinner",
        args: [bountyId, selected.agentId],
        chainId: monadChain.id,
      });
      setTxHash(hash);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "unknown error");
      setManualStage("select");
    }
  }

  if (isBountyLoading) {
    return <p className="text-body-sm text-on-surface-variant">{t.winner.loadingBounty}</p>;
  }

  if (!isCreator) {
    return (
      <p className="text-body-sm text-on-surface-variant">
        {t.winner.notCreator}
        {bounty ? ` (${bounty[0]})` : ""}
      </p>
    );
  }

  if (stage === "confirming") {
    return <p className="text-body-sm text-on-surface-variant">{t.winner.confirmingChainState}</p>;
  }

  if (stage === "success") {
    return (
      <section className="w-full rounded-xl border border-border-dark bg-deep-charcoal p-6 md:p-8">
        <h2 className="mb-4 font-subheading text-subheading text-primary">{t.winner.resultTitle}</h2>
        <div className="flex flex-col gap-6 md:flex-row">
          {winner?.imageURI ? (
            // eslint-disable-next-line @next/next/no-img-element -- ipfs gateway URL
            <img
              src={toGatewayUrl(winner.imageURI)}
              alt={winner.name}
              className="aspect-square w-full max-w-xs rounded-lg object-cover"
            />
          ) : null}
          <dl className="flex flex-1 flex-col gap-2 text-body-sm">
            <div className="flex justify-between">
              <dt className="text-on-surface-variant">{t.winner.resultAgent}</dt>
              <dd className="text-on-surface">{winner?.name ?? winnerPersona?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-on-surface-variant">{t.winner.resultReward}</dt>
              <dd className="font-mono-data text-on-surface">
                {bounty ? formatEther(bounty[1]) : "—"} MON
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-on-surface-variant">{t.winner.resultTokenId}</dt>
              <dd className="font-mono-data text-on-surface">{winningTokenId?.toString() ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-on-surface-variant">{t.winner.resultOwner}</dt>
              <dd className="font-mono-data text-on-surface">{verifiedOwner ?? "—"}</dd>
            </div>
            {verifiedOwner && bounty && verifiedOwner.toLowerCase() === bounty[0].toLowerCase() ? (
              <p className="text-body-sm text-success-green">{t.winner.resultOwnerVerified}</p>
            ) : null}
            {winner?.imageHash ? (
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">{t.winner.resultImageHash}</dt>
                <dd className="truncate font-mono-data text-on-surface">{winner.imageHash}</dd>
              </div>
            ) : null}
            {winner?.metadataURI ? (
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">{t.winner.resultMetadataURI}</dt>
                <dd className="truncate font-mono-data text-on-surface">{winner.metadataURI}</dd>
              </div>
            ) : null}
            {bounty ? (
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">{t.winner.resultPromptHash}</dt>
                <dd className="truncate font-mono-data text-on-surface">{bounty[2]}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-on-surface-variant">{t.winner.resultLicense}</dt>
              <dd className="text-right text-on-surface">{LICENSE_DECLARATION}</dd>
            </div>
            {winner?.payoutAddress ? (
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">{t.winner.resultPayoutAddress}</dt>
                <dd className="truncate font-mono-data text-on-surface">{winner.payoutAddress}</dd>
              </div>
            ) : null}
            {payoutBalance ? (
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">{t.winner.resultPayoutBalance}</dt>
                <dd className="font-mono-data text-on-surface">
                  {formatEther(payoutBalance.value)} {payoutBalance.symbol}
                </dd>
              </div>
            ) : null}
            {txHash && explorerBase ? (
              <a
                href={`${explorerBase}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-body-sm text-on-surface-variant underline underline-offset-2 hover:text-primary"
              >
                {t.winner.resultTx}: {t.winner.viewOnExplorer}
              </a>
            ) : null}
          </dl>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <h2 className="mb-4 font-subheading text-subheading text-primary">{t.winner.title}</h2>
      <p className="mb-4 text-body-sm text-on-surface-variant">{t.winner.selectPrompt}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {revealedAgents.map((agent) => (
          <button
            key={agent.agentId}
            type="button"
            onClick={() => openConfirm(agent)}
            disabled={stage === "pending"}
            className="flex flex-col gap-2 rounded-lg border border-border-dark bg-deep-charcoal p-4 text-left transition-colors hover:border-monad-purple disabled:cursor-not-allowed disabled:opacity-50"
          >
            {agent.imageURI ? (
              // eslint-disable-next-line @next/next/no-img-element -- ipfs gateway URL
              <img
                src={toGatewayUrl(agent.imageURI)}
                alt={agent.name}
                className="aspect-square w-full rounded-md object-cover"
              />
            ) : null}
            <span className="font-label-caps text-label-caps uppercase text-on-surface">{agent.name}</span>
            <span className="text-body-sm text-primary">{t.winner.selectButton}</span>
          </button>
        ))}
      </div>

      {stage === "confirm" && selected ? (
        <ConfirmModal
          agent={selected}
          reward={bounty ? formatEther(bounty[1]) : "?"}
          onCancel={() => setManualStage("select")}
          onConfirm={() => void confirmAward()}
        />
      ) : null}

      {stage === "pending" ? (
        <p className="mt-4 text-body-sm text-on-surface-variant">{t.winner.awardPending}</p>
      ) : null}
      {error ? (
        <p className="mt-4 text-body-sm text-error">
          {t.winner.awardError}: {error}
        </p>
      ) : null}
    </section>
  );
}
