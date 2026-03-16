"use client";

import { Badge } from "./ui/badge";

const exampleHooks = [
  {
    angle: "trigger" as const,
    confidence: "high" as const,
    tier: "A" as const,
    text: "Gong just reported that AI-generated call summaries cut manual CRM entry by 65% for early adopters. Is your team capturing that \u2014 or are reps still logging notes themselves? We help SDR teams surface those deal signals before they slip through the cracks.",
    evidence: '"Gong\u2019s AI call summary feature reduced manual CRM data entry by 65% in early-adopter accounts, freeing reps to spend more time selling..."',
    source: "Gong Revenue Intelligence Blog",
    date: "2025",
    sourceUrl: "https://www.gong.io/blog",
  },
  {
    angle: "risk" as const,
    confidence: "high" as const,
    tier: "A" as const,
    text: "Gong\u2019s latest benchmarks show forecast accuracy drops 30% when teams rely on rep self-reports instead of conversation data. What\u2019s your current gap between pipeline calls and actual close rates? We help VP Sales leaders close that gap before it shows up in the board deck.",
    evidence: '"Teams relying solely on rep-submitted forecasts saw a 30% drop in accuracy compared to those using conversation-based signals..."',
    source: "Gong Labs \u2014 Forecast Accuracy Study",
    date: "2025",
    sourceUrl: "https://www.gong.io/labs",
  },
  {
    angle: "tradeoff" as const,
    confidence: "med" as const,
    tier: "B" as const,
    text: "Gong is pushing hard on AI deal scoring, but that means reps now have more dashboards competing for their selling time. Has the signal-to-noise ratio gotten better or worse as you\u2019ve added tooling? We help revenue teams cut that overhead without losing pipeline visibility.",
    evidence: '"Gong expands its analytics suite with AI-powered deal scoring, adding new dashboards for pipeline review and rep coaching..."',
    source: "G2 Reviews \u2014 Gong Enterprise",
    date: "2025",
    sourceUrl: "https://www.g2.com/products/gong/reviews",
  },
];

const angleBadgeVariant = {
  trigger: "trigger" as const,
  risk: "risk" as const,
  tradeoff: "tradeoff" as const,
};

const confidenceBadgeVariant = {
  high: "high" as const,
  med: "med" as const,
  low: "low" as const,
};

const tierBadgeVariant = {
  A: "tier-a" as const,
  B: "tier-b" as const,
  C: "tier-c" as const,
};

export function HeroHookPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:ml-auto">
      {/* Floating gradient orb */}
      <div className="pointer-events-none absolute -top-16 right-0 h-[300px] w-[300px] rounded-full bg-violet-600/[0.08] blur-[100px] animate-fade-in" />

      {/* Company name chip */}
      <div className="mb-4 flex items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700/50 bg-[#111119] px-4 py-2 text-[0.8125rem] font-mono text-zinc-400">
          <svg className="h-3.5 w-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
          </svg>
          gong.io
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-2.5 py-1 text-[0.625rem] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live from public data
        </div>
      </div>

      {/* Hook card stack */}
      <div className="space-y-3">
        {exampleHooks.map((hook, i) => (
          <div
            key={i}
            className={`animate-stagger-${i + 1} relative rounded-xl border border-zinc-700/40 bg-[#111119]/90 p-4 transition-all duration-200 hover:border-violet-500/25 hover:shadow-[0_4px_20px_rgba(139,92,246,0.08)] ${
              i === 0 ? "shadow-[0_4px_24px_rgba(0,0,0,0.3)]" : i === 1 ? "shadow-[0_2px_16px_rgba(0,0,0,0.2)]" : "shadow-[0_1px_8px_rgba(0,0,0,0.15)]"
            }`}
          >
            {/* Left border accent by angle */}
            <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${
              hook.angle === "trigger" ? "bg-blue-500/60" : hook.angle === "risk" ? "bg-rose-500/60" : "bg-amber-500/60"
            }`} />

            <div className="pl-2">
              <div className="mb-2 flex items-center gap-1.5 flex-wrap">
                <Badge variant={angleBadgeVariant[hook.angle]}>{hook.angle}</Badge>
                <Badge variant={confidenceBadgeVariant[hook.confidence]}>{hook.confidence}</Badge>
                <Badge variant={tierBadgeVariant[hook.tier]}>Tier {hook.tier}</Badge>
                {hook.tier === "B" && (
                  <Badge
                    variant="verification"
                    title="This hook is based on weaker/secondary evidence. We phrase it as a verification question rather than making claims."
                    className="cursor-help"
                  >
                    Verification hook
                  </Badge>
                )}
                <Badge variant="role">VP Sales</Badge>
              </div>
              <p className="text-[0.8125rem] leading-[1.55] text-zinc-300">
                {hook.text}
              </p>
            </div>
          </div>
        ))}

        {/* Evidence preview for first hook */}
        <div className="animate-stagger-3 rounded-xl border border-violet-500/15 bg-[#12101e] p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-violet-400/60">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Evidence
          </div>
          <div className="border-l-2 border-violet-500/30 pl-3">
            <p className="text-[0.75rem] leading-relaxed text-zinc-400 italic">
              {exampleHooks[0].evidence}
            </p>
            <div className="mt-2 flex flex-col gap-0.5">
              <p className="text-[0.6875rem] text-zinc-500 not-italic">
                {exampleHooks[0].source}
              </p>
              <p className="text-[0.625rem] text-zinc-600">
                {exampleHooks[0].date}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
