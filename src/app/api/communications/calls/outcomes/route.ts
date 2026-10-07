import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateRecordingConsent } from "@/lib/communication/call-consent";

export const dynamic = "force-dynamic";

// GET — list call outcomes
export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get("studentId");
    const outcome = req.nextUrl.searchParams.get("outcome");
    const counselorId = req.nextUrl.searchParams.get("counselorId");

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (outcome) where.outcome = outcome;
    if (counselorId) where.counselorId = counselorId;

    const outcomes = await db.callOutcome.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ outcomes });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch call outcomes" }, { status: 500 });
  }
}

// POST — create call outcome (links to PhoneCallLog if callLogId provided)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      callLogId,
      outcome,
      summary,
      studentVisibleNote,
      internalNote,
      nextAction,
      followUpAt,
      consentRecorded,
      recordingPath,
      counselorId,
      studentId,
      applicationId,
      duration,
    } = body;

    if (!outcome) {
      return NextResponse.json({ error: "outcome is required" }, { status: 400 });
    }

    const validOutcomes = ["ANSWERED", "NO_ANSWER", "BUSY", "CALLBACK_REQUESTED", "WRONG_NUMBER", "RESOLVED", "ESCALATED"];
    if (!validOutcomes.includes(outcome)) {
      return NextResponse.json({ error: `outcome must be one of: ${validOutcomes.join(", ")}` }, { status: 400 });
    }

    // §144 — a recording may only be stored when consent was recorded: the
    // boolean must be true AND the internal note must state what the caller
    // was told. The guard also produces the machine-readable consent marker
    // (retention/RBAC/audit line) appended to the internal note.
    const consentCheck = validateRecordingConsent({
      recordingPath,
      recordingConsent: consentRecorded,
      consentText: internalNote,
      retentionDays: body.recordingRetentionDays,
    });
    if (!consentCheck.ok) {
      return NextResponse.json({ error: consentCheck.error }, { status: 422 });
    }
    const effectiveInternalNote = consentCheck.noteMarker
      ? `${internalNote ? `${internalNote}\n` : ""}${consentCheck.noteMarker}`
      : internalNote;

    // If callLogId is provided, link to existing PhoneCallLog and pull duration if missing
    let resolvedCallLogId: string | null = callLogId || null;
    let resolvedDuration = typeof duration === "number" ? duration : 0;
    if (callLogId) {
      const callLog = await db.phoneCallLog.findUnique({ where: { id: callLogId } });
      if (callLog) {
        resolvedCallLogId = callLog.id;
        if (resolvedDuration === 0 && callLog.duration) resolvedDuration = callLog.duration;
        if (!studentId && callLog.studentId) {
          // inherit student linkage
        }
      } else {
        return NextResponse.json({ error: "PhoneCallLog not found for given callLogId" }, { status: 400 });
      }
    }

    const callOutcome = await db.callOutcome.create({
      data: {
        callLogId: resolvedCallLogId,
        outcome,
        summary,
        studentVisibleNote,
        internalNote: effectiveInternalNote,
        nextAction,
        followUpAt: followUpAt ? new Date(followUpAt) : null,
        consentRecorded: typeof consentRecorded === "boolean" ? consentRecorded : false,
        recordingPath,
        counselorId,
        studentId,
        applicationId,
        duration: resolvedDuration,
      },
    });
    return NextResponse.json({ callOutcome }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create call outcome" }, { status: 500 });
  }
}
