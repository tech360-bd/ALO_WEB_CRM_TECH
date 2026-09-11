import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { journalCall } from "@/lib/threecx-integration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/integrations/3cx/call/journal
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    providerEventId,
    threecxCallId,
    callType,
    fromNumber,
    toNumber,
    duration,
    extension,
    status,
    startTimestamp,
    endTimestamp,
    recordingMetadata,
    recordingPath,
    transcriptionStatus,
    transcriptionText,
    consentRecorded,
    studentId,
    leadId,
    partnerId,
    employeeId,
    callNotes,
    disposition,
    provider,
  } = body;

  if (!providerEventId || !callType || !fromNumber || !toNumber) {
    return NextResponse.json(
      { error: "providerEventId, callType, fromNumber, toNumber are required" },
      { status: 400 }
    );
  }

  try {
    const result = await journalCall({
      provider,
      providerEventId,
      threecxCallId,
      callType,
      fromNumber,
      toNumber,
      duration,
      extension,
      status,
      startTimestamp: startTimestamp ? new Date(startTimestamp) : null,
      endTimestamp: endTimestamp ? new Date(endTimestamp) : null,
      recordingMetadata,
      recordingPath,
      transcriptionStatus,
      transcriptionText,
      consentRecorded,
      studentId,
      leadId,
      partnerId,
      employeeId,
      callNotes,
      disposition,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Journal failed" },
      { status: 400 }
    );
  }
}
