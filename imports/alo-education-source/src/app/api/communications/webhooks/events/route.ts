import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — list webhook events (filter by provider / processed)
export async function GET(req: NextRequest) {
  try {
    const provider = req.nextUrl.searchParams.get("provider");
    const processed = req.nextUrl.searchParams.get("processed");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100", 10);

    const where: any = {};
    if (provider) where.provider = provider;
    if (processed !== null && processed !== undefined && processed !== "") {
      where.processed = processed === "true";
    }

    const events = await db.webhookEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Number.isFinite(limit) && limit > 0 ? limit : 100,
    });
    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch webhook events" }, { status: 500 });
  }
}
