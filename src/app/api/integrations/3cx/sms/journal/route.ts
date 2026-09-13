import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/integrations/3cx/sms/journal
// PUBLIC webhook — receives SMS events from 3CX.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-3cx-signature") || req.headers.get("x-hub-signature-256");

    const { getActive3cxIntegration, verify3cxWebhookSignature, journalSms } =
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

    const result = await journalSms({
      providerEventId: String(payload.providerEventId || payload.eventId || `3cx-sms-${Date.now()}`),
      direction: payload.direction || "OUTBOUND",
      fromNumber: String(payload.fromNumber || payload.from || ""),
      toNumber: String(payload.toNumber || payload.to || ""),
      messageText: String(payload.messageText || payload.text || ""),
      deliveryStatus: payload.deliveryStatus,
      extension: payload.extension,
      studentId: payload.studentId,
      leadId: payload.leadId,
      partnerId: payload.partnerId,
      employeeId: payload.employeeId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[3cx/sms/journal] error", err);
    return NextResponse.json({ error: err?.message || "Journal failed" }, { status: 500 });
  }
}
