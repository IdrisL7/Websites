import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export interface HistoryHook {
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

export interface HistoryBatch {
  batchId: string;
  companyUrl: string;
  companyName: string | null;
  createdAt: string;
  hooks: HistoryHook[];
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch up to 500 most recent hooks for the user
  const rows = await db
    .select({
      id: schema.generatedHooks.id,
      batchId: schema.generatedHooks.batchId,
      companyUrl: schema.generatedHooks.companyUrl,
      companyName: schema.generatedHooks.companyName,
      hookText: schema.generatedHooks.hookText,
      angle: schema.generatedHooks.angle,
      confidence: schema.generatedHooks.confidence,
      evidenceTier: schema.generatedHooks.evidenceTier,
      qualityScore: schema.generatedHooks.qualityScore,
      sourceSnippet: schema.generatedHooks.sourceSnippet,
      sourceUrl: schema.generatedHooks.sourceUrl,
      sourceTitle: schema.generatedHooks.sourceTitle,
      triggerType: schema.generatedHooks.triggerType,
      createdAt: schema.generatedHooks.createdAt,
    })
    .from(schema.generatedHooks)
    .where(eq(schema.generatedHooks.userId, session.user.id))
    .orderBy(desc(schema.generatedHooks.createdAt))
    .limit(500);

  // Group by batchId, preserving the first (most recent) createdAt per batch
  const batchMap = new Map<string, HistoryBatch>();
  for (const row of rows) {
    if (!batchMap.has(row.batchId)) {
      batchMap.set(row.batchId, {
        batchId: row.batchId,
        companyUrl: row.companyUrl,
        companyName: row.companyName,
        createdAt: row.createdAt,
        hooks: [],
      });
    }
    batchMap.get(row.batchId)!.hooks.push({
      id: row.id,
      hookText: row.hookText,
      angle: row.angle,
      confidence: row.confidence,
      evidenceTier: row.evidenceTier,
      qualityScore: row.qualityScore,
      sourceSnippet: row.sourceSnippet,
      sourceUrl: row.sourceUrl,
      sourceTitle: row.sourceTitle,
      triggerType: row.triggerType,
    });
  }

  const batches = Array.from(batchMap.values()).slice(0, 100);

  return NextResponse.json({ batches });
}
