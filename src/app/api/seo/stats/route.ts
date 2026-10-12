import { NextResponse } from "next/server";
import { requireSeoStaff } from "@/lib/seo/request-access";
import { getSeoStats } from "@/lib/seo-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/seo/stats
export async function GET(req: Request) {
  const auth = await requireSeoStaff(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const stats = await getSeoStats();
    return NextResponse.json(stats);
  } catch { return NextResponse.json({error:'SEO statistics unavailable.'},{status:503}); }
}
