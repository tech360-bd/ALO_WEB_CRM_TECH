import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateLeadScore } from "@/lib/lead-scoring-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "COUNSELOR"];

// POST /api/lead-scoring/calculate
// Auth required (SUPER_ADMIN, ADMIN, or COUNSELOR).
// Body: { visitorId? } OR { marketingProfileId? }
// Returns: composite lead score + breakdown + tier.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "Forbidden — requires SUPER_ADMIN, ADMIN, or COUNSELOR role" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { visitorId, marketingProfileId } = body as {
    visitorId?: string;
    marketingProfileId?: string;
  };

  if (!visitorId && !marketingProfileId) {
    return NextResponse.json(
      { error: "Either visitorId or marketingProfileId is required" },
      { status: 400 }
    );
  }

  try {
    const breakdown = await calculateLeadScore({ visitorId, marketingProfileId });
    return NextResponse.json({ ok: true, breakdown });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json(
      { error: e?.message || "Failed to calculate lead score" },
      { status: 500 }
    );
  }
}
