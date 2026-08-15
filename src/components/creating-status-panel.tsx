import type { Hash } from "viem";

import { dictionary } from "@/lib/i18n";
import { monadChain } from "@/lib/monad-chain";

export function CreatingStatusPanel({ bountyId, txHash }: { bountyId: bigint; txHash: Hash }) {
  const t = dictionary;

  return (
    <section className="relative w-full rounded-xl border border-border-dark bg-deep-charcoal p-6 md:p-8">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-success-green" />
        <p className="text-subheading font-subheading text-primary">{t.status.creatingTitle}</p>
      </div>
      <p className="mt-2 font-mono-data text-mono-data text-on-surface-variant">
        {t.status.bountyIdLabel} #{bountyId.toString()}
      </p>
      <p className="mt-2 text-body-sm text-on-surface-variant">{t.status.creatingBody}</p>
      <a
        href={`${monadChain.blockExplorers?.default.url}/tx/${txHash}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-body-sm text-on-surface-variant underline underline-offset-2 hover:text-primary"
      >
        {t.form.viewOnExplorer}
      </a>
    </section>
  );
}
