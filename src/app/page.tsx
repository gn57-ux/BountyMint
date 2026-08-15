import Link from "next/link";

import { RocketLaunchIcon } from "@/components/icons";
import { dictionary } from "@/lib/i18n";

export default function Landing() {
  const t = dictionary;

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-margin-mobile text-center md:px-gutter">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          color: "var(--color-on-surface)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full motion-safe:animate-pulse"
        style={{
          background: "radial-gradient(circle, rgba(131,110,249,0.30), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,var(--color-deep-charcoal)_100%)]"
      />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <span className="rounded-full border border-border-dark bg-surface-container-lowest px-4 py-1.5 font-label-caps text-label-caps uppercase tracking-[0.08em] text-on-surface-variant">
          {t.landing.badge}
        </span>

        <h1 className="font-display-hero text-display-hero tracking-tighter text-on-surface md:text-[88px] md:leading-[1.02] md:tracking-[-2px]">
          {t.nav.brand}
        </h1>

        <p className="max-w-lg text-body-lg text-on-surface-variant">{t.landing.tagline}</p>

        <Link
          href="/app"
          className="mt-4 flex items-center justify-center gap-2 rounded-md bg-monad-purple px-8 py-4 font-headline-lg-mobile text-headline-lg-mobile text-white shadow-[0_0_20px_rgba(131,110,249,0.3)] transition-all hover:shadow-[0_0_40px_rgba(131,110,249,0.55)]"
        >
          {t.landing.enterButton}
          <RocketLaunchIcon className="h-5 w-5" />
        </Link>
      </div>

      <div className="absolute bottom-10 flex items-center gap-2 text-label-caps text-on-surface-variant">
        <span className="h-1.5 w-1.5 rounded-full bg-monad-purple" />
        <span className="font-label-caps uppercase tracking-[0.08em]">{t.landing.poweredBy}</span>
      </div>
    </main>
  );
}
