"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface HistoryHook {
  id: string;
  hookText: string;
  angle: string;
  confidence: string;
  evidenceTier: string;
  qualityScore: number;
  sourceSnippet: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  triggerType: string | null;
}

interface HistoryBatch {
  batchId: string;
  companyUrl: string;
  companyName: string | null;
  createdAt: string;
  hooks: HistoryHook[];
}

const tierColors: Record<string, string> = {
  A: "text-emerald-400 bg-emerald-900/30 border-emerald-800",
  B: "text-amber-400 bg-amber-900/30 border-amber-800",
  C: "text-zinc-400 bg-zinc-800 border-zinc-700",
};

const angleColors: Record<string, string> = {
  trigger: "text-violet-400 bg-violet-900/20 border-violet-800/50",
  risk: "text-red-400 bg-red-900/20 border-red-800/50",
  tradeoff: "text-sky-400 bg-sky-900/20 border-sky-800/50",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function displayUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function BatchRow({ batch }: { batch: HistoryBatch }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [watchState, setWatchState] = useState<"idle" | "watching" | "watched">("idle");

  async function watch() {
    setWatchState("watching");
    try {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyUrl: batch.companyUrl, companyName: batch.companyName }),
      });
      setWatchState("watched");
    } catch {
      setWatchState("idle");
    }
  }

  async function copyHook(hook: HistoryHook) {
    let text = hook.hookText;
    if (hook.sourceSnippet) text += `\nEvidence: ${hook.sourceSnippet}`;
    if (hook.sourceUrl) text += `\nSource: ${hook.sourceUrl}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(hook.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const topHook = batch.hooks[0];
  const angles = [...new Set(batch.hooks.map((h) => h.angle))];
  const tierCounts = batch.hooks.reduce<Record<string, number>>((acc, h) => {
    acc[h.evidenceTier] = (acc[h.evidenceTier] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <svg className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-zinc-200">
                {batch.companyName || displayUrl(batch.companyUrl)}
              </span>
              {batch.companyName && (
                <span className="text-xs text-zinc-600">{displayUrl(batch.companyUrl)}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-zinc-500">{formatDate(batch.createdAt)}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-xs text-zinc-500">{batch.hooks.length} hook{batch.hooks.length !== 1 ? "s" : ""}</span>
              {Object.entries(tierCounts).sort().map(([tier, count]) => (
                <span key={tier} className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${tierColors[tier] || tierColors.C}`}>
                  {count}× Tier {tier}
                </span>
              ))}
              {angles.map((a) => (
                <span key={a} className={`text-[10px] font-medium px-1.5 py-0.5 rounded border capitalize ${angleColors[a] || ""}`}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 pl-7 sm:pl-0">
          <button
            onClick={watch}
            disabled={watchState !== "idle"}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:cursor-default ${
              watchState === "watched"
                ? "border-violet-700 bg-violet-900/30 text-violet-400"
                : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-60"
            }`}
          >
            {watchState === "watched" ? "✓ Watching" : watchState === "watching" ? "…" : "Watch"}
          </button>
          <Link
            href={`/app/hooks?url=${encodeURIComponent(batch.companyUrl)}`}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-violet-400 transition-colors"
          >
            Re-run →
          </Link>
        </div>
      </div>

      {/* Top hook preview (always visible, collapsed view) */}
      {!expanded && topHook && (
        <div className="border-t border-zinc-800 px-5 py-3 bg-black/20">
          <p className="text-xs text-zinc-400 line-clamp-2">{topHook.hookText}</p>
        </div>
      )}

      {/* Expanded hooks */}
      {expanded && (
        <div className="border-t border-zinc-800 divide-y divide-zinc-800/60">
          {batch.hooks.map((hook) => (
            <div key={hook.id} className="px-5 py-3 bg-black/20 hover:bg-black/40 transition-colors">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${tierColors[hook.evidenceTier] || tierColors.C}`}>
                  Tier {hook.evidenceTier}
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border capitalize ${angleColors[hook.angle] || ""}`}>
                  {hook.angle}
                </span>
                {hook.triggerType && (
                  <span className="text-[10px] text-zinc-600">{hook.triggerType}</span>
                )}
                <span className="text-[10px] text-zinc-600 ml-auto">Q: {hook.qualityScore}</span>
              </div>
              <p className="text-sm text-zinc-200 mb-1.5">{hook.hookText}</p>
              {hook.sourceSnippet && (
                <p className="text-xs text-zinc-600 italic border-l-2 border-zinc-700 pl-2 mb-1.5 line-clamp-2">
                  {hook.sourceSnippet}
                </p>
              )}
              <div className="flex items-center gap-2">
                {hook.sourceUrl && (
                  <a
                    href={hook.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-zinc-600 hover:text-zinc-400 underline underline-offset-2 truncate max-w-[240px]"
                  >
                    {hook.sourceTitle || hook.sourceUrl}
                  </a>
                )}
                <button
                  onClick={() => copyHook(hook)}
                  className="text-[10px] font-medium px-2 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0 ml-auto"
                >
                  {copiedId === hook.id ? "Copied!" : hook.sourceSnippet ? "Copy + Evidence" : "Copy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [batches, setBatches] = useState<HistoryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/hooks/history")
      .then((r) => r.json())
      .then((data) => {
        setBatches(data.batches || []);
      })
      .catch(() => setError("Failed to load history."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? batches.filter((b) => {
        const q = search.toLowerCase();
        return (
          b.companyUrl.toLowerCase().includes(q) ||
          (b.companyName?.toLowerCase().includes(q) ?? false)
        );
      })
    : batches;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hook History</h1>
          <p className="text-sm text-zinc-500 mt-1">
            All previously generated hooks, grouped by company.
          </p>
        </div>
        <Link
          href="/app/hooks"
          className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          + Generate new
        </Link>
      </div>

      {batches.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company..."
            className="w-full sm:w-64 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!loading && !error && batches.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
            <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-zinc-300 mb-1">No history yet</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Generate hooks for a company to see them here.
          </p>
          <Link
            href="/app/hooks"
            className="inline-block bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Generate hooks →
          </Link>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((batch) => (
            <BatchRow key={batch.batchId} batch={batch} />
          ))}
        </div>
      )}

      {!loading && search && filtered.length === 0 && batches.length > 0 && (
        <p className="text-sm text-zinc-500 text-center py-8">
          No results for &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
