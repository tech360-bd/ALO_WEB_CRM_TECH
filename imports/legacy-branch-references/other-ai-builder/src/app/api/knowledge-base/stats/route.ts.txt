import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/knowledge-base/stats
// Aggregate knowledge base stats. Auth: any logged-in user.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getKnowledgeBaseStats } = await import("@/lib/knowledge-base-engine");
    const stats = await getKnowledgeBaseStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("[knowledge-base/stats] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load stats" }, { status: 500 });
  }
}
