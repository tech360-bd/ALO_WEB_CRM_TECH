import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — list SLA justifications (filter by counselorId / status)
export async function GET(req: NextRequest) {
  try {
    const counselorId = req.nextUrl.searchParams.get("counselorId");
    const status = req.nextUrl.searchParams.get("status");
    const period = req.nextUrl.searchParams.get("period");

    const where: any = {};
    if (counselorId) where.counselorId = counselorId;
    if (status) where.status = status;
    if (period) where.period = period;

    const justifications = await db.slaJustification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ justifications });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch justifications" }, { status: 500 });
  }
}

// POST — create SLA justification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { counselorId, slaEventId, period, reason, category, explanation, evidence } = body;

    if (!counselorId || !reason || !category || !explanation) {
      return NextResponse.json({ error: "counselorId, reason, category, explanation are required" }, { status: 400 });
    }

    const periodValue = period || new Date().toISOString().slice(0, 7); // YYYY-MM

    const justification = await db.slaJustification.create({
      data: {
        counselorId,
        slaEventId,
        period: periodValue,
        reason,
        category,
        explanation,
        evidence,
        status: "PENDING",
      },
    });
    return NextResponse.json({ justification }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create justification" }, { status: 500 });
  }
}
