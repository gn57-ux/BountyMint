"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Hash } from "viem";
import {
  BaseError,
  decodeEventLog,
  formatEther,
  keccak256,
  parseEther,
  toBytes,
  UserRejectedRequestError,
} from "viem";
import { useAccount, useBalance, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { GavelIcon, PaymentsIcon, RocketLaunchIcon, ScheduleIcon } from "@/components/icons";
import { dictionary } from "@/lib/i18n";
import { bountyMintAbi, bountyMintAddress } from "@/lib/contracts/bounty-mint";
import { monadChain } from "@/lib/monad-chain";

const DEFAULT_BRIEF =
  "为 Monad 创作一个赛博朋克守护兽。\n要求：紫色能量、未来城市背景、适合作为社区头像。";
const DEFAULT_REWARD = "1";
const DEFAULT_DEADLINE_HOURS = "2";

type TxState = "idle" | "pending" | "success" | "error";

export function CreateBountyForm({
  onCreated,
}: {
  onCreated?: (result: { bountyId: bigint; txHash: Hash; brief: string }) => void;
}) {
  const t = dictionary;
  const { address, isConnected, chainId } = useAccount();
  const { data: balance } = useBalance({ address, chainId: monadChain.id });

  const [brief, setBrief] = useState(DEFAULT_BRIEF);
  const [reward, setReward] = useState(DEFAULT_REWARD);
  const [deadlineHours, setDeadlineHours] = useState(DEFAULT_DEADLINE_HOURS);
  const [licenseAccepted, setLicenseAccepted] = useState(false);
  const [txHash, setTxHash] = useState<Hash>();
  const [rejected, setRejected] = useState(false);

  const { writeContractAsync, isPending: isSigning, error: writeError, reset: resetWrite } =
    useWriteContract();
  const {
    data: receipt,
    isLoading: isMining,
    isSuccess: isMined,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash, chainId: monadChain.id });

  const rewardValue = useMemo(() => {
    try {
      return reward.trim() === "" ? 0n : parseEther(reward);
    } catch {
      return null;
    }
  }, [reward]);

  const deadlineHoursValue = useMemo(() => {
    const n = Number(deadlineHours);
    return Number.isFinite(n) && Number.isInteger(n) && n > 0 ? n : null;
  }, [deadlineHours]);

  const insufficientBalance =
    balance !== undefined && rewardValue !== null && rewardValue > balance.value;

  const isReverted = isMined && receipt?.status === "reverted";
  const isSuccessful = isMined && receipt?.status === "success";

  const state: TxState = isSuccessful
    ? "success"
    : isSigning || isMining
      ? "pending"
      : rejected || writeError || receiptError || isReverted
        ? "error"
        : "idle";

  const canSubmit =
    isConnected &&
    chainId === monadChain.id &&
    brief.trim().length > 0 &&
    rewardValue !== null &&
    rewardValue > 0n &&
    !insufficientBalance &&
    deadlineHoursValue !== null &&
    licenseAccepted &&
    state !== "pending";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || rewardValue === null || deadlineHoursValue === null) return;

    setRejected(false);
    resetWrite();
    setTxHash(undefined);

    // Trimmed once here and reused for the on-chain promptHash, the
    // Commit/Reveal auth signature, and the generate request body — the
    // backend also trims defensively, but the frontend must sign the exact
    // string it trims to, or verification fails with a spurious 403 (codex-review
    // 2026-08-15 finding 1).
    const trimmedBrief = brief.trim();
    const promptHash = keccak256(toBytes(trimmedBrief));
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineHoursValue * 3600);

    try {
      const hash = await writeContractAsync({
        address: bountyMintAddress,
        abi: bountyMintAbi,
        functionName: "createBounty",
        args: [promptHash, deadline],
        value: rewardValue,
        chainId: monadChain.id,
      });
      setTxHash(hash);
    } catch (err) {
      if (
        err instanceof BaseError &&
        err.walk((e) => e instanceof UserRejectedRequestError)
      ) {
        setRejected(true);
        return;
      }
      // Non-rejection errors surface through writeError below.
    }
  }

  useEffect(() => {
    if (!isSuccessful || !receipt || !txHash) return;

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: bountyMintAbi,
          eventName: "BountyCreated",
          data: log.data,
          topics: log.topics,
        });
        onCreated?.({ bountyId: decoded.args.bountyId, txHash, brief: brief.trim() });
        break;
      } catch {
        // Not the BountyCreated log (e.g. an ERC20/transfer log); keep scanning.
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessful, receipt, txHash]);

  return (
    <section className="relative w-full rounded-xl border border-border-dark bg-deep-charcoal p-6 md:p-8">
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-[rgba(131,110,249,0.03)]" />
      <form className="relative z-10 flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="glow-focus group flex flex-col gap-2 rounded-lg transition-all duration-300">
          <label className="sr-only" htmlFor="vision">
            {t.form.visionLabel}
          </label>
          <textarea
            id="vision"
            rows={6}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={t.form.visionPlaceholder}
            disabled={state === "pending"}
            className="w-full resize-y rounded-lg border border-border-dark bg-background p-4 font-body-lg text-body-lg text-on-surface placeholder:text-outline focus:ring-0 disabled:opacity-60"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="reward"
              className="flex items-center gap-1 font-label-caps text-label-caps uppercase text-on-surface-variant"
            >
              <PaymentsIcon className="h-3.5 w-3.5" />
              {t.form.rewardLabel}
            </label>
            <input
              id="reward"
              type="number"
              min="0"
              step="0.01"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              disabled={state === "pending"}
              className="w-full rounded-md border border-border-dark bg-background px-4 py-3 font-mono-data text-mono-data text-on-surface transition-colors focus:border-monad-purple focus:ring-1 focus:ring-monad-purple disabled:opacity-60"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="deadline"
              className="flex items-center gap-1 font-label-caps text-label-caps uppercase text-on-surface-variant"
            >
              <ScheduleIcon className="h-3.5 w-3.5" />
              {t.form.deadlineLabel}
            </label>
            <input
              id="deadline"
              type="number"
              min="1"
              step="1"
              required
              value={deadlineHours}
              onChange={(e) => setDeadlineHours(e.target.value)}
              disabled={state === "pending"}
              className="w-full rounded-md border border-border-dark bg-background px-4 py-3 font-mono-data text-mono-data text-on-surface transition-colors focus:border-monad-purple focus:ring-1 focus:ring-monad-purple disabled:opacity-60"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="license"
              className="flex items-center gap-1 font-label-caps text-label-caps uppercase text-on-surface-variant"
            >
              <GavelIcon className="h-3.5 w-3.5" />
              {t.form.licenseLabel}
            </label>
            <label
              htmlFor="license"
              className="flex h-full items-center gap-2 rounded-md border border-border-dark bg-background px-4 py-3 text-body-sm text-on-surface-variant"
            >
              <input
                id="license"
                type="checkbox"
                checked={licenseAccepted}
                onChange={(e) => setLicenseAccepted(e.target.checked)}
                disabled={state === "pending"}
                className="h-4 w-4 shrink-0 rounded border-border-dark bg-background accent-monad-purple disabled:opacity-60"
              />
              <span>{t.form.licenseStatement}</span>
            </label>
          </div>
        </div>

        <div className="mt-2 flex flex-col items-center justify-between gap-4 border-t border-border-dark pt-6 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              {t.form.walletBalance}
            </span>
            <span className="font-mono-data text-mono-data text-primary">
              {balance ? `${formatEther(balance.value)} ${balance.symbol}` : "—"}
            </span>
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-monad-purple px-8 py-4 font-headline-lg-mobile text-headline-lg-mobile text-white shadow-[0_0_20px_rgba(131,110,249,0.3)] transition-all hover:shadow-[0_0_30px_rgba(131,110,249,0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none md:w-auto"
          >
            {state === "pending" ? (
              isSigning ? t.form.submitPending : t.form.txPending
            ) : (
              <>
                {t.form.submit}
                <RocketLaunchIcon className="h-5 w-5" />
              </>
            )}
          </button>
        </div>

        {!isConnected ? (
          <p className="text-body-sm text-on-surface-variant">{t.form.submitConnectFirst}</p>
        ) : insufficientBalance && rewardValue !== null && balance ? (
          <p className="text-body-sm text-error">
            {t.form.submitInsufficientBalance.replace(
              "{amount}",
              formatEther(rewardValue - balance.value),
            )}
          </p>
        ) : deadlineHoursValue === null ? (
          <p className="text-body-sm text-error">{t.form.submitInvalidDeadline}</p>
        ) : !licenseAccepted ? (
          <p className="text-body-sm text-on-surface-variant">{t.form.submitNeedsLicense}</p>
        ) : null}

        {rejected ? <p className="text-body-sm text-error">{t.form.txRejected}</p> : null}
        {isReverted ? <p className="text-body-sm text-error">{t.form.txReverted}</p> : null}
        {writeError && !rejected ? (
          <p className="text-body-sm text-error">
            {t.form.txError}: {writeError.message}
          </p>
        ) : null}
        {receiptError ? (
          <p className="text-body-sm text-error">
            {t.form.txError}: {receiptError.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
