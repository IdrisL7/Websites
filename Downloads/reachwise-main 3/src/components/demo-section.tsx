"use client";

import { useState, useCallback } from "react";
import { HookForm } from "@/app/app/hooks/hook-form";
import { HookCard } from "@/app/app/hooks/hook-card";
import { CompanyIntelPanel } from "@/app/app/hooks/company-intel-panel";
import { Skeleton } from "@/components/ui/skeleton";
import type { CompanyIntelligence } from "@/lib/company-intel";
import type { StructuredHook } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Hook {
  text: string;
  angle: string;
  confidence: string;
  evidence_tier: string;
  quality_score?: number;
  quality_label?: "Excellent" | "Strong" | "Decent" | "Weak";
  generated_hook_id?: string;
  source_snippet?: string;
  source_url?: string;
  source_title?: string;
  source_date?: string;
  psych_mode?: string;
  why_this_works?: string;
  promise?: string;
  trigger_type?: string;
  bridge_quality?: string;
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

interface ChannelVariant {
  channel: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Sample hooks (pre-loaded, no API call)
// ---------------------------------------------------------------------------

const SAMPLE_STRUCTURED: StructuredHook[] = [
  {
    hook: "Gong just reported that AI-generated call summaries cut manual CRM entry by 65% for early adopters. Is your team capturing that \u2014 or are reps still logging notes themselves? We help SDR teams surface those deal signals before they slip through the cracks.",
    angle: "trigger",
    confidence: "high",
    evidence_tier: "A",
    evidence_snippet: "Gong\u2019s AI call summary feature reduced manual CRM data entry by 65% in early-adopter accounts, freeing reps to spend more time selling.",
    source_title: "Gong Revenue Intelligence Blog",
    source_date: "2025",
    source_url: "https://www.gong.io/blog",
    news_item: 1,
    psych_mode: "relevance",
    why_this_works: "Concrete stat from company\u2019s own blog creates urgency around adoption gap",
    promise: "We help SDR teams surface those deal signals before they slip through the cracks.",
  },
  {
    hook: "Gong\u2019s latest benchmarks show forecast accuracy drops 30% when teams rely on rep self-reports instead of conversation data. What\u2019s your current gap between pipeline calls and actual close rates? We help VP Sales leaders close that gap before it shows up in the board deck.",
    angle: "risk",
    confidence: "high",
    evidence_tier: "A",
    evidence_snippet: "Teams relying solely on rep-submitted forecasts saw a 30% drop in accuracy compared to those using conversation-based signals.",
    source_title: "Gong Labs \u2014 Forecast Accuracy Study",
    source_date: "2025",
    source_url: "https://www.gong.io/labs",
    news_item: 2,
    psych_mode: "symptom",
    why_this_works: "Quantified risk creates urgency for VP Sales who own forecast accuracy",
    promise: "We help VP Sales leaders close that gap before it shows up in the board deck.",
  },
  {
    hook: "Gong is pushing hard on AI deal scoring, but that means reps now have more dashboards competing for their selling time. Has the signal-to-noise ratio gotten better or worse as you\u2019ve added tooling? We help revenue teams cut that overhead without losing pipeline visibility.",
    angle: "tradeoff",
    confidence: "med",
    evidence_tier: "B",
    evidence_snippet: "Gong expands its analytics suite with AI-powered deal scoring, adding new dashboards for pipeline review and rep coaching.",
    source_title: "G2 Reviews \u2014 Gong Enterprise",
    source_date: "2025",
    source_url: "https://www.g2.com/products/gong/reviews",
    news_item: 3,
    psych_mode: "tradeoff_frame",
    why_this_works: "Acknowledges the tooling paradox VP Sales feel daily",
    promise: "We help revenue teams cut that overhead without losing pipeline visibility.",
  },
];

const SAMPLE_HOOKS_COMPANY = "Gong";

function mapStructuredToHook(h: StructuredHook): Hook {
  return {
    text: h.hook,
    angle: h.angle,
    confidence: h.confidence,
    evidence_tier: h.evidence_tier,
    source_snippet: h.evidence_snippet,
    source_url: h.source_url,
    source_title: h.source_title,
    source_date: h.source_date,
    psych_mode: h.psych_mode,
    why_this_works: h.why_this_works,
    promise: h.promise,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DemoSection() {
  // Form state
  const [companyName, setCompanyName] = useState("");
  const [url, setUrl] = useState("");
  const [targetRole, setTargetRole] = useState("Not sure / Any role");
  const [showCustomRole, setShowCustomRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [customPain, setCustomPain] = useState("");
  const [customPromise, setCustomPromise] = useState("");
  const [pitchContext, setPitchContext] = useState("");

  // Results state
  const [hooks, setHooks] = useState<Hook[]>(SAMPLE_STRUCTURED.map(mapStructuredToHook));
  const [overflowHooks, setOverflowHooks] = useState<Hook[]>([]);
  const [hookVariants, setHookVariants] = useState<Array<{ hook_index: number; variants: ChannelVariant[] }>>([]);
  const [activeChannel, setActiveChannel] = useState<Record<number, string>>({});
  const [companyIntel, setCompanyIntel] = useState<CompanyIntelligence | null>(null);
  const [companyDomain, setCompanyDomain] = useState("");

  // Action state
  const [copied, setCopied] = useState<number | null>(null);
  const [copiedEvidence, setCopiedEvidence] = useState<number | null>(null);
  const [generatingEmail, setGeneratingEmail] = useState<number | null>(null);
  const [generatedEmails, setGeneratedEmails] = useState<Record<number, GeneratedEmail>>({});
  const [copiedEmail, setCopiedEmail] = useState<number | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [lowSignal, setLowSignal] = useState(false);
  const [showingSample, setShowingSample] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [demoUsesLeft, setDemoUsesLeft] = useState(3);
  const [linkedinSlug, setLinkedinSlug] = useState<string | null>(null);
  const [firstPartyUrls, setFirstPartyUrls] = useState<Array<{ title: string; url: string; tier: string }>>([]);
  const [webUrls, setWebUrls] = useState<Array<{ title: string; url: string; tier: string }>>([]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function onSourceSelected(sourceUrl: string, name: string) {
    setUrl(sourceUrl);
    setCompanyName(name);
    setTimeout(() => {
      const form = document.getElementById("hooks-form") as HTMLFormElement;
      form?.requestSubmit();
    }, 50);
  }

  const doGenerate = useCallback(async () => {
    if (!url && !companyName) return;

    setLoading(true);
    setError("");
    setHooks([]);
    setOverflowHooks([]);
    setShowAll(false);
    setGeneratedEmails({});
    setHookVariants([]);
    setActiveChannel({});
    setCompanyIntel(null);
    setCompanyDomain("");
    setSuggestion("");
    setLowSignal(false);
    setShowingSample(false);
    setLinkedinSlug(null);
    setFirstPartyUrls([]);
    setWebUrls([]);

    try {
      const res = await fetch("/api/generate-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url ? (url.match(/^https?:\/\//) ? url : `https://${url}`) : undefined,
          companyName: companyName || undefined,
          targetRole: targetRole !== "Not sure / Any role" && targetRole !== "General"
            ? (targetRole === "Custom" ? customRoleInput.trim() || undefined : targetRole)
            : undefined,
          customPain: targetRole === "Custom" && customPain.trim() ? customPain.trim() : undefined,
          customPromise: targetRole === "Custom" && customPromise.trim() ? customPromise.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const code = data.code as string | undefined;
        if (code === "RATE_LIMITED") {
          setDemoUsesLeft(0);
          setError("You\u2019ve used all 3 free generations today. Sign up for unlimited hooks.");
          setLoading(false);
          return;
        }
        throw new Error(data.error || data.message || "Failed to generate hooks");
      }

      type RawHook = {
        hook: string; angle: string; confidence: string; evidence_tier: string;
        quality_score?: number; quality_label?: "Excellent" | "Strong" | "Decent" | "Weak";
        generated_hook_id?: string;
        evidence_snippet?: string; source_url?: string; source_title?: string;
        source_date?: string; psych_mode?: string; why_this_works?: string;
        trigger_type?: string; promise?: string; bridge_quality?: string;
      };

      const mapHook = (h: RawHook): Hook => ({
        text: h.hook, angle: h.angle, confidence: h.confidence, evidence_tier: h.evidence_tier,
        quality_score: h.quality_score, quality_label: h.quality_label, generated_hook_id: h.generated_hook_id,
        source_snippet: h.evidence_snippet, source_url: h.source_url, source_title: h.source_title,
        source_date: h.source_date, psych_mode: h.psych_mode, why_this_works: h.why_this_works,
        promise: h.promise, trigger_type: h.trigger_type, bridge_quality: h.bridge_quality,
      });

      const structured = data.structured_hooks as RawHook[] | undefined;
      const overflow = data.overflow_hooks as RawHook[] | undefined;

      if (structured && structured.length > 0) {
        setHooks(structured.map(mapHook));
        if (overflow && overflow.length > 0) setOverflowHooks(overflow.map(mapHook));
      } else if (Array.isArray(data.hooks)) {
        setHooks(data.hooks.map((h: string) => ({ text: h, angle: "trigger", confidence: "med", evidence_tier: "B" })));
      }

      if (data.hookVariants) setHookVariants(data.hookVariants);
      setCompanyIntel(data.companyIntel || null);
      if (data.suggestion) setSuggestion(data.suggestion);
      if (data.lowSignal) setLowSignal(true);
      if (data.linkedinSlug) setLinkedinSlug(data.linkedinSlug);
      if (data.firstPartyUrls) setFirstPartyUrls(data.firstPartyUrls);
      if (data.webUrls) setWebUrls(data.webUrls);
      if (data.companyDomain) setCompanyDomain(data.companyDomain);

      setDemoUsesLeft((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url, companyName, targetRole, customRoleInput, customPain, customPromise]);

  async function generateHooks(e: React.FormEvent) {
    e.preventDefault();
    if (!url && !companyName) return;
    if (targetRole === "Custom" && !customRoleInput.trim()) {
      setError("Enter a role name or pick one from the dropdown.");
      return;
    }
    await doGenerate();
  }

  async function copyHook(text: string, index: number) {
    const active = activeChannel[index] || "email";
    if (active !== "email") {
      const variantEntry = hookVariants.find((v) => v.hook_index === index);
      const variant = variantEntry?.variants.find((v) => v.channel === active);
      if (variant) {
        await navigator.clipboard.writeText(variant.text);
        setCopied(index);
        setTimeout(() => setCopied(null), 2000);
        return;
      }
    }
    await navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  }

  async function copyHookWithEvidence(hook: Hook, index: number) {
    const active = activeChannel[index] || "email";
    const hookText = (() => {
      if (active === "email") return hook.text;
      const variantEntry = hookVariants.find((v) => v.hook_index === index);
      return variantEntry?.variants.find((v) => v.channel === active)?.text || hook.text;
    })();
    let content = `Hook: ${hookText}`;
    if (hook.source_snippet) content += `\nEvidence: ${hook.source_snippet}`;
    if (hook.source_url) content += `\nSource: ${hook.source_url}`;
    await navigator.clipboard.writeText(content);
    setCopiedEvidence(index);
    setTimeout(() => setCopiedEvidence(null), 2000);
  }

  async function generateEmail(hook: Hook, index: number) {
    setGeneratingEmail(index);
    try {
      const res = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyUrl: url || companyName,
          hook: {
            hook: hook.text,
            angle: hook.angle,
            confidence: hook.confidence,
            evidence_tier: hook.evidence_tier,
            evidence_snippet: hook.source_snippet || "",
            source_title: hook.source_title || hook.source_url || "",
            source_url: hook.source_url || "",
            promise: hook.promise || "",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "RATE_LIMITED") {
          setError("You\u2019ve used all 3 free email generations today. Sign up to continue.");
          return;
        }
        throw new Error(data.error || "Failed to generate email");
      }
      setGeneratedEmails((prev) => ({ ...prev, [index]: data.email }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGeneratingEmail(null);
    }
  }

  async function copyEmail(email: GeneratedEmail, index: number) {
    const content = `Subject: ${email.subject}\n\n${email.body}`;
    await navigator.clipboard.writeText(content);
    setCopiedEmail(index);
    setTimeout(() => setCopiedEmail(null), 2000);
  }

  function runWithUrl(newUrl: string) {
    setUrl(newUrl);
    setTimeout(() => {
      const form = document.getElementById("hooks-form") as HTMLFormElement;
      form?.requestSubmit();
    }, 50);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const visibleHooks = showAll ? [...hooks, ...overflowHooks] : hooks;
  const totalCount = hooks.length + overflowHooks.length;

  return (
    <section id="demo" className="border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-36">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-xl text-center">
          <p className="mb-4 text-[0.9375rem] font-semibold text-violet-400">
            Live demo
          </p>
          <h2 className="text-[clamp(2.25rem,3.5vw,3.75rem)] font-bold leading-[1.04] tracking-[-0.02em] text-white">
            Try it now
          </h2>
          <p className="mt-5 text-[1.0625rem] leading-[1.6] text-zinc-400">
            Type a company name, pick a source, choose a role, and get hooks with evidence you can copy into outbound.
            <span className="text-zinc-500"> Limited to 3 generations per day.</span>
          </p>
        </div>

        {/* Form */}
        <HookForm
          onSourceSelected={onSourceSelected}
          companyName={companyName}
          setCompanyName={setCompanyName}
          targetRole={targetRole}
          setTargetRole={setTargetRole}
          showCustomRole={showCustomRole}
          setShowCustomRole={setShowCustomRole}
          customRoleInput={customRoleInput}
          setCustomRoleInput={setCustomRoleInput}
          customPain={customPain}
          setCustomPain={setCustomPain}
          customPromise={customPromise}
          setCustomPromise={setCustomPromise}
          pitchContext={pitchContext}
          setPitchContext={setPitchContext}
          isPaidUser={false}
          loading={loading}
          error={error}
          onSubmit={generateHooks}
        />

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm animate-scale-in">
            {error}
            {demoUsesLeft === 0 && (
              <a
                href="/register"
                className="ml-2 text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors font-medium"
              >
                Sign up free &rarr;
              </a>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mb-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 border-l-[3px] border-l-zinc-700">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-4/5 mb-3" />
                  <Skeleton className="h-12 w-full rounded mb-3" />
                  <div className="flex gap-2 pt-2 border-t border-zinc-800">
                    <Skeleton className="h-7 w-20 rounded-lg" />
                    <Skeleton className="h-7 w-28 rounded-lg" />
                    <Skeleton className="h-7 w-28 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        )}

        {/* Sample banner */}
        {showingSample && hooks.length > 0 && !loading && (
          <div className="mb-4 flex items-center gap-2 text-[0.8125rem]">
            <span className="rounded-full bg-violet-600/20 border border-violet-500/30 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-violet-300">
              Sample
            </span>
            <span className="text-zinc-400">
              Showing pre-generated hooks for <span className="font-medium text-zinc-200">{SAMPLE_HOOKS_COMPANY}</span>.
              Type a company name above to generate your own.
            </span>
          </div>
        )}

        {/* Suggestion / low signal */}
        {suggestion && (
          <div className={`border rounded-xl mb-6 text-sm ${lowSignal ? "bg-amber-900/30 border-amber-800" : "bg-blue-900/30 border-blue-800"}`}>
            <div className="px-4 pt-4 pb-2">
              <p className={`font-semibold mb-1 ${lowSignal ? "text-amber-200" : "text-blue-200"}`}>
                We need a better source to write your hooks
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">{suggestion}</p>
            </div>

            {linkedinSlug && (
              <div className="px-4 pb-3">
                <button
                  onClick={() => runWithUrl(`https://www.linkedin.com/company/${linkedinSlug}/about/`)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Use LinkedIn About page instead
                </button>
              </div>
            )}

            {firstPartyUrls.length > 0 && (
              <div className="px-4 pb-3">
                <p className="text-xs font-medium text-zinc-400 mb-1.5">Pages we found on their site:</p>
                <div className="space-y-1">
                  {firstPartyUrls.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => runWithUrl(d.url)}
                      className="block w-full text-left text-xs text-emerald-400 hover:text-emerald-300 truncate"
                    >
                      {d.title || d.url}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {webUrls.length > 0 && (
              <div className="px-4 pb-3">
                <p className="text-xs font-medium text-zinc-500 mb-1.5">Other sources:</p>
                <div className="space-y-1">
                  {webUrls.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => runWithUrl(d.url)}
                      className="block w-full text-left text-xs text-zinc-400 hover:text-zinc-300 truncate"
                    >
                      {d.title || d.url}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results: two-column layout matching dashboard */}
        {!loading && visibleHooks.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            {/* Left: hooks */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Top {visibleHooks.length} hook{visibleHooks.length !== 1 ? "s" : ""}
                  {totalCount > hooks.length && !showAll && (
                    <span className="text-zinc-500 text-sm font-normal ml-1">of {totalCount}</span>
                  )}
                  {lowSignal && <span className="text-amber-400 text-sm font-normal ml-2">(low signal)</span>}
                </h3>
              </div>

              {visibleHooks.map((hook, i) => (
                <HookCard
                  key={i}
                  hook={hook}
                  index={i}
                  companyDomain={companyDomain}
                  targetRole={targetRole}
                  customRoleInput={customRoleInput}
                  hookVariants={hookVariants}
                  activeChannel={activeChannel}
                  setActiveChannel={setActiveChannel}
                  copied={copied}
                  copiedEvidence={copiedEvidence}
                  generatingEmail={generatingEmail}
                  generatedEmails={generatedEmails}
                  copiedEmail={copiedEmail}
                  showCrmPush={false}
                  onCopyHook={copyHook}
                  onCopyHookWithEvidence={copyHookWithEvidence}
                  onGenerateEmail={generateEmail}
                  onCopyEmail={copyEmail}
                />
              ))}

              {overflowHooks.length > 0 && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                >
                  Show {overflowHooks.length} more hook{overflowHooks.length !== 1 ? "s" : ""}
                </button>
              )}
              {showAll && overflowHooks.length > 0 && (
                <button
                  onClick={() => setShowAll(false)}
                  className="w-full py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Show less
                </button>
              )}
            </div>

            {/* Right: company intel */}
            <div className="lg:sticky lg:top-20 space-y-4">
              {companyIntel && <CompanyIntelPanel intel={companyIntel} isBasic={true} />}
            </div>
          </div>
        )}

        {/* Signup CTA after results */}
        {!loading && hooks.length > 0 && !showingSample && (
          <div className="mt-10 text-center">
            <div className="inline-flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-8 py-6">
              <p className="text-sm text-zinc-400">
                {demoUsesLeft > 0
                  ? `${demoUsesLeft} free generation${demoUsesLeft !== 1 ? "s" : ""} remaining today`
                  : "You\u2019ve used all 3 free generations today"}
              </p>
              <a
                href="/register"
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.02] text-sm"
              >
                Sign up free for unlimited hooks
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <p className="text-xs text-zinc-600">
                Includes email generation, channel variants, CRM integration, and more.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
