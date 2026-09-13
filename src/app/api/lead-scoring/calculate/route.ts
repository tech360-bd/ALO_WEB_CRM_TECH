import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/lead-scoring/calculate
// Calculate a lead score for a visitor / marketing profile.
// Auth: any staff member.
// Body: { visitorId?, marketingProfileId? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.visitorId && !body?.marketingProfileId) {
      return NextResponse.json(
        { error: "visitorId or marketingProfileId is required" },
        { status: 400 }
      );
    }

    const { calculateLeadScore } = await import("@/lib/lead-scoring-engine");
    const breakdown = await calculateLeadScore(body);
    return NextResponse.json(breakdown);
  } catch (err: any) {
    console.error("[lead-scoring/calculate] error", err);
    return NextResponse.json({ error: err?.message || "Failed to calculate score" }, { status: 500 });
  }
}
