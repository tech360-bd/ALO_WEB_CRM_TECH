import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/integrations/3cx/call/journal
// PUBLIC webhook — receives call events from 3CX.
// Verifies the X-3CX-Signature header against the integration's webhookSecret.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-3cx-signature") || req.headers.get("x-hub-signature-256");

    const { getActive3cxIntegration, verify3cxWebhookSignature, journalCall } =
      await import("@/lib/threecx-integration");

    const integ = await getActive3cxIntegration();
    const secret = integ?.webhookSecret ?? null;

    if (!verify3cxWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = await journalCall({
      providerEventId: String(payload.providerEventId || payload.eventId || payload.callId || `3cx-call-${Date.now()}`),
      threecxCallId: payload.threecxCallId || payload.callId,
      callType: (payload.callType || "INCOMING").toUpperCase(),
      fromNumber: String(payload.fromNumber || payload.from || ""),
      toNumber: String(payload.toNumber || payload.to || ""),
      extension: payload.extension,
      status: payload.status,
      duration: Number(payload.duration) || 0,
      startTimestamp: payload.startTimestamp ? new Date(payload.startTimestamp) : undefined,
      endTimestamp: payload.endTimestamp ? new Date(payload.endTimestamp) : undefined,
      recordingPath: payload.recordingPath,
      recordingMetadata: payload.recordingMetadata,
      transcriptionStatus: payload.transcriptionStatus,
      transcriptionText: payload.transcriptionText,
      consentRecorded: payload.consentRecorded,
      studentId: payload.studentId,
      leadId: payload.leadId,
      partnerId: payload.partnerId,
      employeeId: payload.employeeId,
      callNotes: payload.callNotes,
      disposition: payload.disposition,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[3cx/call/journal] error", err);
    return NextResponse.json({ error: err?.message || "Journal failed" }, { status: 500 });
  }
}
