"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface WatchlistItem {
  id: string;
  companyUrl: string;
  companyName: string | null;
  createdAt: string;
  lastGeneratedAt: string | null;
}

function displayUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Added today";
  if (diffDays === 1) return "Added yesterday";
  if (diffDays < 7) return `Added ${diffDays}d ago`;
  return `Added ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function formatLastRun(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Last run today";
  if (diffDays === 1) return "Last run yesterday";
  if (diffDays < 7) return `Last run ${diffDays}d ago`;
  return `Last run ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/watchlist")
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setError("Failed to load watchlist."))
      .finally(() => setLoading(false));
  }, []);

  async function removeItem(id: string) {
    setRemovingId(id);
    await fetch(`/api/watchlist/${id}`, { method: "DELETE" }).catch(() => {});
    setItems((prev) => prev.filter((i) => i.id !== id));
    setRemovingId(null);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Companies you&apos;re tracking. Generate fresh hooks any time a new signal appears.
          </p>
        </div>
        <Link
          href="/app/hooks"
          className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          + Add company
        </Link>
      </div>

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

      {!loading && !error && items.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
            <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-zinc-300 mb-1">No companies watched yet</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Generate hooks for a company and click &ldquo;Watch&rdquo; to add it here.
          </p>
          <Link
            href="/app/hooks"
            className="inline-block bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Find a company →
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">
                    {item.companyName || displayUrl(item.companyUrl)}
                  </span>
                  {item.companyName && (
                    <span className="text-xs text-zinc-600">{displayUrl(item.companyUrl)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-zinc-600">{formatDate(item.createdAt)}</p>
                  {item.lastGeneratedAt && (
                    <>
                      <span className="text-zinc-800">·</span>
                      <p className="text-xs text-emerald-600">{formatLastRun(item.lastGeneratedAt)}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/app/history?search=${encodeURIComponent(item.companyUrl)}`}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  History
                </Link>
                <Link
                  href={`/app/hooks?url=${encodeURIComponent(item.companyUrl)}`}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-violet-700 bg-violet-900/20 text-violet-400 hover:bg-violet-900/40 hover:text-violet-300 transition-colors"
                >
                  Generate hooks →
                </Link>
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={removingId === item.id}
                  className="text-xs text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50 px-1"
                  title="Remove from watchlist"
                >
                  {removingId === item.id ? "…" : "✕"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
