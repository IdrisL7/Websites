import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await db
    .select()
    .from(schema.userTemplates)
    .where(eq(schema.userTemplates.userId, session.user.id))
    .orderBy(desc(schema.userTemplates.createdAt));

  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as {
    hookText?: string;
    angle?: string;
    companyUrl?: string;
    companyName?: string;
    note?: string;
  };

  if (!body.hookText?.trim()) {
    return NextResponse.json({ error: "hookText is required" }, { status: 400 });
  }

  const [inserted] = await db
    .insert(schema.userTemplates)
    .values({
      userId: session.user.id,
      hookText: body.hookText.trim(),
      angle: (body.angle as "trigger" | "risk" | "tradeoff") || null,
      companyUrl: body.companyUrl || null,
      companyName: body.companyName || null,
      note: body.note || null,
    })
    .returning();

  return NextResponse.json({ template: inserted });
}
