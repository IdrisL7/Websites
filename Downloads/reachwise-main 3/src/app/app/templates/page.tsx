"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface UserTemplate {
  id: string;
  hookText: string;
  angle: string | null;
  companyUrl: string | null;
  companyName: string | null;
  createdAt: string;
}

interface Template {
  id: string;
  industry: string;
  name: string;
  hook: string;
  angle: "trigger" | "risk" | "tradeoff";
  description: string;
}

const TEMPLATES: Template[] = [
  { id: "saas-1", industry: "SaaS", name: "New funding round", hook: "You just closed your Series B — are you scaling outbound before your board review in Q3, or waiting until pipeline proves itself?", angle: "tradeoff", description: "Use when a SaaS company has recently raised funding. The tradeoff angle forces a decision." },
  { id: "saas-2", industry: "SaaS", name: "Hiring surge", hook: "You're hiring 12 SDRs this quarter — what happens if their ramp time doubles because the messaging hasn't been pressure-tested?", angle: "risk", description: "Hiring signals indicate growth. The risk angle highlights what could go wrong without action." },
  { id: "saas-3", industry: "SaaS", name: "Product launch", hook: "Your new enterprise tier just went live — are outbound sequences already targeting the ICP shift, or is the team still using the old playbook?", angle: "trigger", description: "A product launch creates urgency. The trigger angle connects the event to an action." },
  { id: "fintech-1", industry: "Fintech", name: "Regulatory change", hook: "With PSD2 enforcement tightening next quarter, are your compliance workflows already stress-tested, or are you relying on the same manual review process?", angle: "risk", description: "Regulatory pressure is a powerful trigger. The risk angle works well with compliance-heavy industries." },
  { id: "fintech-2", industry: "Fintech", name: "Payment volume spike", hook: "Your processing volume jumped 40% last quarter — is your fraud detection scaling at the same pace, or is that delta becoming a liability?", angle: "tradeoff", description: "Growth metrics create natural tension. The tradeoff highlights the risk of not keeping systems in sync." },
  { id: "health-1", industry: "Healthcare", name: "EHR migration", hook: "You're mid-way through your Epic migration — is the patient communication layer keeping up, or is that falling through the cracks while IT stays focused on core records?", angle: "risk", description: "Major system migrations create operational blind spots. The risk angle surfaces the overlooked areas." },
  { id: "health-2", industry: "Healthcare", name: "Value-based care shift", hook: "Your payer mix is shifting toward value-based contracts — are your care coordination workflows built for outcomes reporting, or still optimized for fee-for-service?", angle: "tradeoff", description: "The tradeoff angle works well when a company is caught between two models." },
  { id: "ecom-1", industry: "E-commerce", name: "Peak season prep", hook: "Q4 is 6 weeks out — is your logistics stack ready for a 3x volume spike, or are you about to find out the hard way which bottleneck breaks first?", angle: "risk", description: "Seasonal urgency creates a natural deadline. Risk framing highlights what's at stake." },
  { id: "ecom-2", industry: "E-commerce", name: "Returns surge", hook: "Your return rate climbed to 28% last quarter — is that a product fit issue or a checkout experience problem, and do you know which one to fix first?", angle: "tradeoff", description: "Data anomalies open diagnostic conversations. The tradeoff frames two competing hypotheses." },
  { id: "agency-1", industry: "Agencies", name: "Client churn signal", hook: "You lost two retainer clients in the last 90 days — is that a delivery gap, a pricing gap, or a reporting gap? Each one needs a different fix.", angle: "tradeoff", description: "Churn opens a diagnostic conversation. Three possible causes = a natural tradeoff frame." },
  { id: "agency-2", industry: "Agencies", name: "Headcount growth", hook: "You're scaling from 15 to 30 people this year — are your project management systems built for that, or did they just get twice as fragile?", angle: "risk", description: "Scaling is exciting but risky. The risk angle surfaces the operational debt." },
  { id: "mfg-1", industry: "Manufacturing", name: "Supply chain disruption", hook: "Your key supplier is now a 90-day lead time — are you holding buffer stock that kills cash flow, or running lean and absorbing production risk?", angle: "tradeoff", description: "Supply chain pressure creates a classic risk/cost tradeoff. Both options have a cost." },
  { id: "mfg-2", industry: "Manufacturing", name: "Automation investment", hook: "You're investing in line automation this year — is the ROI calculation accounting for the 6-month ramp before yield catches up, or is that baked into next quarter's targets?", angle: "risk", description: "Capital investment creates expectation gaps. The risk angle surfaces the timing mismatch." },
];

const INDUSTRIES = [...new Set(TEMPLATES.map((t) => t.industry))];

const angleColors: Record<string, string> = {
  trigger: "text-blue-400 bg-blue-900/30 border-blue-800",
  risk: "text-red-400 bg-red-900/30 border-red-800",
  tradeoff: "text-amber-400 bg-amber-900/30 border-amber-800",
};

function displayUrl(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

export default function TemplatesPage() {
  const [filter, setFilter] = useState<string>("All");
  const [copied, setCopied] = useState<string | null>(null);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setUserTemplates(d.templates || []))
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, []);

  const filtered = filter === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.industry === filter);

  async function copyHook(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function removeUserTemplate(id: string) {
    setRemovingId(id);
    await fetch(`/api/templates/${id}`, { method: "DELETE" }).catch(() => {});
    setUserTemplates((prev) => prev.filter((t) => t.id !== id));
    setRemovingId(null);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hook Templates</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Pre-built hooks by industry, plus your saved generations.
          </p>
        </div>
        <Link
          href="/app/hooks"
          className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          Generate hooks →
        </Link>
      </div>

      {/* My Saved Hooks */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
          My Saved Hooks
          {!loadingUser && userTemplates.length > 0 && (
            <span className="text-[10px] bg-violet-900/30 text-violet-400 border border-violet-800/50 px-1.5 py-0.5 rounded font-medium">
              {userTemplates.length}
            </span>
          )}
        </h2>
        {loadingUser ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 animate-pulse">
                <div className="h-4 bg-zinc-800 rounded w-2/3 mb-2" />
                <div className="h-3 bg-zinc-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : userTemplates.length === 0 ? (
          <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-lg px-5 py-6 text-center">
            <p className="text-sm text-zinc-500">No saved hooks yet.</p>
            <p className="text-xs text-zinc-600 mt-1">
              Generate hooks and click <span className="text-zinc-400">Save</span> on any hook to add it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {userTemplates.map((t) => (
              <div key={t.id} className="bg-zinc-900 border border-violet-900/30 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {t.angle && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${angleColors[t.angle] || "text-zinc-400 bg-zinc-800 border-zinc-700"}`}>
                      {t.angle}
                    </span>
                  )}
                  {(t.companyName || t.companyUrl) && (
                    <span className="text-xs text-zinc-600">
                      {t.companyName || displayUrl(t.companyUrl!)}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => copyHook(t.id, t.hookText)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {copied === t.id ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => removeUserTemplate(t.id)}
                      disabled={removingId === t.id}
                      className="text-xs text-zinc-700 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Remove"
                    >
                      {removingId === t.id ? "…" : "✕"}
                    </button>
                  </div>
                </div>
                <p className="text-zinc-200 text-sm">{t.hookText}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Industry templates */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-sm font-semibold text-zinc-400 shrink-0">Industry Templates</h2>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {["All", ...INDUSTRIES].map((industry) => (
          <button
            key={industry}
            onClick={() => setFilter(industry)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filter === industry
                ? "bg-emerald-900/30 border-emerald-800 text-emerald-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            {industry}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((template) => (
          <div key={template.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-zinc-500">{template.industry}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${angleColors[template.angle]}`}>
                {template.angle}
              </span>
              <span className="text-xs text-zinc-600">{template.name}</span>
              <button
                onClick={() => copyHook(template.id, template.hook)}
                className="text-xs text-zinc-500 hover:text-zinc-300 ml-auto transition-colors"
              >
                {copied === template.id ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-zinc-200 mb-2">{template.hook}</p>
            <p className="text-xs text-zinc-500">{template.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
