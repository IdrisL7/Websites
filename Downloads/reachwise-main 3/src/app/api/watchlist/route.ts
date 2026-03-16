import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db
    .select()
    .from(schema.watchlist)
    .where(eq(schema.watchlist.userId, session.user.id))
    .orderBy(desc(schema.watchlist.createdAt));

  // Fetch most recent generation timestamp per company URL
  const lastGenRows = await db
    .select({
      companyUrl: schema.generatedHooks.companyUrl,
      lastGeneratedAt: sql<string>`max(created_at)`,
    })
    .from(schema.generatedHooks)
    .where(eq(schema.generatedHooks.userId, session.user.id))
    .groupBy(schema.generatedHooks.companyUrl);

  const lastGenMap = Object.fromEntries(lastGenRows.map((r) => [r.companyUrl, r.lastGeneratedAt]));

  const enriched = items.map((item) => ({
    ...item,
    lastGeneratedAt: lastGenMap[item.companyUrl] || null,
  }));

  return NextResponse.json({ items: enriched });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as { companyUrl?: string; companyName?: string };
  if (!body.companyUrl) {
    return NextResponse.json({ error: "companyUrl is required" }, { status: 400 });
  }

  try {
    const [inserted] = await db
      .insert(schema.watchlist)
      .values({
        userId: session.user.id,
        companyUrl: body.companyUrl,
        companyName: body.companyName || null,
      })
      .returning();
    return NextResponse.json({ item: inserted });
  } catch {
    // Unique constraint = already watching
    const [existing] = await db
      .select()
      .from(schema.watchlist)
      .where(
        and(
          eq(schema.watchlist.userId, session.user.id),
          eq(schema.watchlist.companyUrl, body.companyUrl),
        ),
      )
      .limit(1);
    return NextResponse.json({ item: existing, alreadyWatching: true });
  }
}
