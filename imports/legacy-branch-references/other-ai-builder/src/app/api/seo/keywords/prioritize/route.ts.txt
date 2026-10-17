import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/seo/keywords/prioritize
// Recompute priorityScore for all keywords.
// Auth: any logged-in user.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prioritizeKeywords } = await import("@/lib/keyword-research-engine");
    const result = await prioritizeKeywords();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[seo/keywords/prioritize] error", err);
    return NextResponse.json({ error: err?.message || "Prioritize failed" }, { status: 500 });
  }
}
