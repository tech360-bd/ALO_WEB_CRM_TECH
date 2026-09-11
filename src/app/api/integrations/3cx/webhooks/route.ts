import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getActive3cxIntegration,
  verify3cxWebhookSignature,
  lookupContactByPhone,
} from "@/lib/threecx-integration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/integrations/3cx/webhooks
// Receives webhook events from 3CX. Verifies signature, then journals based on event type.
export async function POST(req: NextRequest) {
  const integration = await getActive3cxIntegration();

  // Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("x-3cx-signature") || req.headers.get("x-signature");

  let body: any = null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // tolerate non-JSON payloads
  }

  // Verify signature if secret configured
  if (integration?.webhookSecret) {
    const valid = verify3cxWebhookSignature(rawBody, signature, integration.webhookSecret);
    if (!valid) {
      await db.auditLog.create({
        data: {
          action: "AI_ACTION",
          resource: "ThreeCxIntegration",
          resourceId: integration.id,
          details: JSON.stringify({ action: "WEBHOOK_SIGNATURE_FAILED" }),
        },
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // Persist raw webhook event for audit
  try {
    await db.webhookEvent.create({
      data: {
        provider: "3CX",
        eventId: body?.eventId || body?.CallId || `3cx-${Date.now()}`,
        eventType: body?.eventType || body?.type || "UNKNOWN",
        payload: rawBody.slice(0, 65000),
        verified: !!integration?.webhookSecret,
        processed: false,
      },
    });
  } catch {
    // duplicate event id — idempotent
  }

  // Best-effort: auto-journal call events if eventId present
  const eventType = (body?.eventType || body?.type || "").toUpperCase();
  if (eventType.includes("CALL") && (body?.CallId || body?.eventId)) {
    try {
      const fromNumber = body?.From || body?.CallerId || body?.fromNumber || "";
      const toNumber = body?.To || body?.DialedNumber || body?.toNumber || "";
      const callType = eventType.includes("MISSED") ? "MISSED" : eventType.includes("OUT") ? "OUTGOING" : "INCOMING";
      if (fromNumber && toNumber) {
        const { journalCall } = await import("@/lib/threecx-integration");
        await journalCall({
          provider: "3CX",
          providerEventId: body?.CallId || body?.eventId,
          threecxCallId: body?.CallId || null,
          callType,
          fromNumber,
          toNumber,
          duration: parseInt(body?.Duration || "0") || 0,
          extension: body?.Extension || null,
          status: body?.Status || null,
          startTimestamp: body?.StartTime ? new Date(body.StartTime) : null,
          endTimestamp: body?.EndTime ? new Date(body.EndTime) : null,
        });
      }
    } catch {
      // ignore journaling errors
    }
  }

  return NextResponse.json({ received: true, eventType });
}

// GET — webhook verification (3CX challenge handshake)
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get("challenge");
  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ status: "ok", provider: "3CX" });
}
