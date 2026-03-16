import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq, sql, and, gte } from "drizzle-orm";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch usage events for this user
  const eventCounts = await db
    .select({
      event: schema.usageEvents.event,
      count: sql<number>`count(*)`,
    })
    .from(schema.usageEvents)
    .where(
      and(
        eq(schema.usageEvents.userId, userId),
        gte(schema.usageEvents.createdAt, thirtyDaysAgo),
      ),
    )
    .groupBy(schema.usageEvents.event);

  const eventMap = Object.fromEntries(
    eventCounts.map((e) => [e.event, e.count]),
  );

  const recentEvents = await db
    .select()
    .from(schema.usageEvents)
    .where(
      and(
        eq(schema.usageEvents.userId, userId),
        gte(schema.usageEvents.createdAt, sevenDaysAgo),
      ),
    )
    .orderBy(sql`created_at DESC`)
    .limit(20);

  const hooksGenerated = eventMap.hook_generated || 0;
  const emailsSent = eventMap.email_sent || 0;
  const emailsOpened = eventMap.email_opened || 0;
  const emailsClicked = eventMap.email_clicked || 0;
  const emailsBounced = eventMap.email_bounced || 0;

  const emailsReplied = eventMap.email_replied || 0;
  const openRate = emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0;
  const clickRate = emailsOpened > 0 ? Math.round((emailsClicked / emailsOpened) * 100) : 0;
  const replyRate = emailsSent > 0 ? Math.round((emailsReplied / emailsSent) * 100) : 0;

  const stats = [
    { label: "Hooks Generated", value: hooksGenerated, sub: "last 30 days" },
    { label: "Emails Sent", value: emailsSent, sub: "last 30 days" },
    { label: "Open Rate", value: `${openRate}%`, sub: `${emailsOpened} opens` },
    { label: "Click Rate", value: `${clickRate}%`, sub: `${emailsClicked} clicks` },
    { label: "Replies", value: emailsReplied, sub: "last 30 days" },
    { label: "Reply Rate", value: `${replyRate}%`, sub: `${emailsReplied} replies` },
    { label: "Bounced", value: emailsBounced, sub: emailsBounced > 0 ? "check list hygiene" : "healthy" },
  ];

  // --- Hook Performance & Reply Classification queries ---

  // Get user's lead IDs
  const userLeadRows = await db
    .select({ id: schema.leads.id })
    .from(schema.leads)
    .where(eq(schema.leads.userId, userId));
  const userLeadIds = new Set(userLeadRows.map((l) => l.id));

  // Query inbound messages for reply classification
  const inboundMessages = await db
    .select()
    .from(schema.outboundMessages)
    .where(eq(schema.outboundMessages.direction, "inbound"))
    .limit(200);

  const userInbound = inboundMessages.filter((m) => userLeadIds.has(m.leadId));

  // Parse classifications
  const classificationCounts: Record<string, number> = {};
  for (const m of userInbound) {
    const meta = m.metadata as Record<string, unknown> | null;
    const cat = meta?.classification as string;
    if (cat) {
      classificationCounts[cat] = (classificationCounts[cat] || 0) + 1;
    }
  }

  const classificationLabels: Record<string, string> = {
    interested: "Interested",
    objection_budget: "Budget Objection",
    objection_timing: "Timing Objection",
    objection_authority: "Authority Objection",
    objection_need: "Need Objection",
    objection_competitor: "Competitor Objection",
    objection_status_quo: "Status Quo",
    not_now: "Not Now",
    wrong_person: "Wrong Person",
    unsubscribe: "Unsubscribe",
    ooo: "Out of Office",
  };

  const totalClassified = Object.values(classificationCounts).reduce((a, b) => a + b, 0);
  const classificationStats = Object.entries(classificationCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => ({
      category: cat,
      label: classificationLabels[cat] || cat,
      count,
      percentage: totalClassified > 0 ? Math.round((count / totalClassified) * 100) : 0,
    }));

  // --- Hook Performance queries ---
  const hookAngleRows = await db
    .select({
      angle: schema.generatedHooks.angle,
      count: sql<number>`count(*)`,
      avgQuality: sql<number>`round(avg(quality_score))`,
    })
    .from(schema.generatedHooks)
    .where(eq(schema.generatedHooks.userId, userId))
    .groupBy(schema.generatedHooks.angle);

  const hookTierRows = await db
    .select({
      tier: schema.generatedHooks.evidenceTier,
      count: sql<number>`count(*)`,
    })
    .from(schema.generatedHooks)
    .where(eq(schema.generatedHooks.userId, userId))
    .groupBy(schema.generatedHooks.evidenceTier);

  const [hookTotals] = await db
    .select({
      total: sql<number>`count(*)`,
      avgQuality: sql<number>`round(avg(quality_score))`,
    })
    .from(schema.generatedHooks)
    .where(eq(schema.generatedHooks.userId, userId));

  const angleMap = Object.fromEntries(hookAngleRows.map((r) => [r.angle, r]));
  const tierMap = Object.fromEntries(hookTierRows.map((r) => [r.tier, r.count]));
  const totalHooks = hookTotals?.total || 0;

  // --- Sequence Completion queries ---
  const completedSequences = await db
    .select({
      seqName: schema.sequences.name,
      count: sql<number>`count(*)`,
    })
    .from(schema.leadSequences)
    .innerJoin(schema.sequences, eq(schema.leadSequences.sequenceId, schema.sequences.id))
    .innerJoin(schema.leads, eq(schema.leadSequences.leadId, schema.leads.id))
    .where(
      and(
        eq(schema.leads.userId, userId),
        eq(schema.leadSequences.status, "completed"),
      ),
    )
    .groupBy(schema.sequences.name);

  const activeSequences = await db
    .select({
      seqName: schema.sequences.name,
      count: sql<number>`count(*)`,
    })
    .from(schema.leadSequences)
    .innerJoin(schema.sequences, eq(schema.leadSequences.sequenceId, schema.sequences.id))
    .innerJoin(schema.leads, eq(schema.leadSequences.leadId, schema.leads.id))
    .where(
      and(
        eq(schema.leads.userId, userId),
        eq(schema.leadSequences.status, "active"),
      ),
    )
    .groupBy(schema.sequences.name);

  const eventLabels: Record<string, string> = {
    hook_generated: "Hook generated",
    email_generated: "Email drafted",
    email_sent: "Email sent",
    email_opened: "Email opened",
    email_clicked: "Link clicked",
    email_replied: "Reply received",
    email_bounced: "Bounce",
    lead_created: "Lead created",
    followup_generated: "Follow-up generated",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
          >
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-zinc-600">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Hook Performance */}
      <h2 className="text-lg font-semibold mb-1 mt-8">Hook Performance</h2>
      <p className="text-sm text-zinc-500 mb-4">All time · {totalHooks} hooks generated{hookTotals?.avgQuality ? ` · avg quality ${hookTotals.avgQuality}` : ""}</p>
      {totalHooks === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-8">
          <p className="text-sm text-zinc-500">No hooks generated yet. Hook angle and tier breakdowns will appear here once you start generating.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Angle breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">By Angle</p>
            <div className="space-y-3">
              {(["trigger", "risk", "tradeoff"] as const).map((angle) => {
                const row = angleMap[angle];
                const count = row?.count || 0;
                const pct = totalHooks > 0 ? Math.round((count / totalHooks) * 100) : 0;
                const color = angle === "trigger" ? "bg-blue-500" : angle === "risk" ? "bg-rose-500" : "bg-amber-500";
                const textColor = angle === "trigger" ? "text-blue-400" : angle === "risk" ? "text-rose-400" : "text-amber-400";
                return (
                  <div key={angle}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium capitalize ${textColor}`}>{angle}</span>
                      <span className="text-xs text-zinc-500">{count} ({pct}%){row?.avgQuality ? ` · avg ${row.avgQuality}` : ""}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full">
                      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Tier breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">By Evidence Tier</p>
            <div className="space-y-3">
              {(["A", "B", "C"] as const).map((tier) => {
                const count = tierMap[tier] || 0;
                const pct = totalHooks > 0 ? Math.round((count / totalHooks) * 100) : 0;
                const color = tier === "A" ? "bg-emerald-500" : tier === "B" ? "bg-amber-500" : "bg-zinc-600";
                const textColor = tier === "A" ? "text-emerald-400" : tier === "B" ? "text-amber-400" : "text-zinc-400";
                const label = tier === "A" ? "Tier A — first-party / reputable" : tier === "B" ? "Tier B — secondary source" : "Tier C — low signal";
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${textColor}`}>{label}</span>
                      <span className="text-xs text-zinc-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full">
                      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reply Classification */}
      <h2 className="text-lg font-semibold mb-4">Reply Classification</h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-8">
        {classificationStats.length === 0 ? (
          <p className="text-sm text-zinc-500">No classified replies yet. Reply data will appear here as leads respond.</p>
        ) : (
          <div className="space-y-3">
            {classificationStats.map((stat) => (
              <div key={stat.category} className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 w-36 shrink-0">{stat.label}</span>
                <div className="flex-1 bg-zinc-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500 w-12 text-right">{stat.count} ({stat.percentage}%)</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sequence Completion Rates */}
      <h2 className="text-lg font-semibold mb-4">Sequence Completion</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {completedSequences.length === 0 && activeSequences.length === 0 ? (
          <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <p className="text-sm text-zinc-500">No sequence data yet. Enroll leads in sequences to track completion rates here.</p>
          </div>
        ) : (
          (() => {
            const seqNames = new Set([
              ...completedSequences.map((s) => s.seqName),
              ...activeSequences.map((s) => s.seqName),
            ]);
            const completedMap = Object.fromEntries(completedSequences.map((s) => [s.seqName, s.count]));
            const activeMap = Object.fromEntries(activeSequences.map((s) => [s.seqName, s.count]));
            return Array.from(seqNames).map((name) => {
              const completed = completedMap[name] || 0;
              const active = activeMap[name] || 0;
              const total = completed + active;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <div key={name} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-zinc-300 mb-2 truncate">{name}</p>
                  <p className="text-xl font-bold mb-1">{pct}%</p>
                  <p className="text-xs text-zinc-500">{completed} completed / {active} active</p>
                </div>
              );
            });
          })()
        )}
      </div>

      {/* Recent activity */}
      <h2 className="text-lg font-semibold mb-4">Recent Activity (7 days)</h2>
      {recentEvents.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-10 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">No activity yet</h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Generate hooks and send emails to see your open rates, click rates, and engagement
            metrics here. All activity from the last 30 days will be tracked.
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-zinc-800">
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((event) => {
                const meta = (event.metadata || {}) as Record<string, unknown>;
                return (
                  <tr
                    key={event.id}
                    className="border-t border-zinc-800/50"
                  >
                    <td className="px-4 py-3 text-zinc-300">
                      {eventLabels[event.event] || event.event}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs font-mono">
                      {(meta.to as string) || (meta.subject as string) || (meta.url as string) || "-"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 text-xs">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
