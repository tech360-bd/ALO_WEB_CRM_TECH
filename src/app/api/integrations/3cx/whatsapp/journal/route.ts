import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/integrations/3cx/whatsapp/journal
// PUBLIC webhook — receives WhatsApp-via-3CX events.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-3cx-signature") || req.headers.get("x-hub-signature-256");

    const { getActive3cxIntegration, verify3cxWebhookSignature, journalWhatsApp } =
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

    const result = await journalWhatsApp({
      providerEventId: String(payload.providerEventId || payload.eventId || `3cx-wa-${Date.now()}`),
      direction: payload.direction || "OUTBOUND",
      from: String(payload.fromNumber || payload.from || ""),
      to: String(payload.toNumber || payload.to || ""),
      messageText: String(payload.messageText || payload.text || ""),
      studentId: payload.studentId,
      leadId: payload.leadId,
      partnerId: payload.partnerId,
      employeeId: payload.employeeId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[3cx/whatsapp/journal] error", err);
    return NextResponse.json({ error: err?.message || "Journal failed" }, { status: 500 });
  }
}
