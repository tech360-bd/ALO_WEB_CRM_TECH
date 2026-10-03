import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateDraftMode } from "@/lib/communication/approval-modes";

export const dynamic = "force-dynamic";

// GET — list communication drafts (filter by status / studentId)
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const studentId = req.nextUrl.searchParams.get("studentId");
    const channel = req.nextUrl.searchParams.get("channel");
    const riskLevel = req.nextUrl.searchParams.get("riskLevel");

    const where: any = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (channel) where.channel = channel;
    if (riskLevel) where.riskLevel = riskLevel;

    const drafts = await db.communicationDraft.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ drafts });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch drafts" }, { status: 500 });
  }
}

// POST — create AI draft
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      channel,
      socialInboxMessageId,
      studentId,
      leadId,
      applicationId,
      draftBody,
      aiGenerated,
      aiConfidence,
      aiReasoning,
      riskLevel,
      riskFlags,
      mode,
      createdBy,
    } = body;

    if (!channel || !draftBody) {
      return NextResponse.json({ error: "channel and draftBody are required" }, { status: 400 });
    }

    // §130/§175 — only the four documented approval modes; high-risk content
    // (payment/visa/immigration/legal/financial evidence or HIGH/CRITICAL)
    // can never be registered for auto-send.
    const decision = validateDraftMode({ mode, riskLevel, riskFlags });
    if (!decision.ok) {
      return NextResponse.json({ error: decision.error }, { status: 422 });
    }

    const draft = await db.communicationDraft.create({
      data: {
        channel,
        socialInboxMessageId,
        studentId,
        leadId,
        applicationId,
        draftBody,
        aiGenerated: typeof aiGenerated === "boolean" ? aiGenerated : true,
        aiConfidence: typeof aiConfidence === "number" ? aiConfidence : 0,
        aiReasoning,
        riskLevel: riskLevel || "LOW",
        riskFlags: typeof riskFlags === "string" ? riskFlags : JSON.stringify(riskFlags || []),
        mode: decision.mode,
        status: "DRAFT",
        createdBy,
      },
    });
    return NextResponse.json(
      {
        draft,
        requiresHumanReview: decision.requiresHumanReview,
        displayLabel: "AI GENERATED DRAFT",
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create draft" }, { status: 500 });
  }
}
