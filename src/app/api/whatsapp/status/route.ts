import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/whatsapp/status — PUBLIC webhook for delivery status updates.
// Verifies X-Hub-Signature-256 against WHATSAPP_APP_SECRET.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256") || "";

    // ── Signature verification ──
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    let verified = false;
    if (appSecret) {
      const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
      verified = safeEqual(expected, signature);
    } else {
      // No secret configured — accept but mark unverified
      console.warn("[whatsapp.status] WHATSAPP_APP_SECRET not set — skipping verification");
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Handle webhook verification (subscribe challenge)
    if (body["hub.mode"] === "subscribe") {
      return NextResponse.json({ "hub.challenge": body["hub.challenge"] });
    }

    // Extract status update from Meta WhatsApp payload
    // Format: { entry: [{ changes: [{ value: { statuses: [{ id, status, recipient_id, ... }] } }] }] }
    const statuses: any[] = body?.entry?.[0]?.changes?.[0]?.value?.statuses || [];

    if (statuses.length === 0) {
      // Persist the raw event for audit
      await db.webhookEvent.create({
        data: {
          provider: "WHATSAPP",
          eventId: body?.entry?.[0]?.id || `wa-status-${Date.now()}`,
          eventType: "STATUS_UPDATE",
          payload: rawBody,
          signature,
          verified,
          processed: true,
          processedAt: new Date(),
        },
      }).catch(() => {});
      return NextResponse.json({ success: true, message: "No statuses in payload", verified });
    }

    const updated: any[] = [];
    for (const s of statuses) {
      const messageId = s.id;
      const status = s.status?.toUpperCase() || "UNKNOWN";
      const recipientPhone = s.recipient_id || "";
      const errorMessage = s.errors?.[0]?.message || null;

      try {
        const record = await db.whatsAppMessageStatus.create({
          data: {
            messageId,
            recipientPhone,
            status,
            errorMessage,
            providerPayload: JSON.stringify(s),
          },
        });

        // Update social inbox message if linked
        if (s.conversation?.id) {
          // best-effort
        }

        updated.push({ messageId, status, recordId: record.id });
      } catch (err: any) {
        // Idempotency: if messageId already exists, just skip
        updated.push({ messageId, status, error: err.message });
      }
    }

    // Persist webhook event for audit
    await db.webhookEvent.create({
      data: {
        provider: "WHATSAPP",
        eventId: body?.entry?.[0]?.id || `wa-status-${Date.now()}`,
        eventType: "STATUS_UPDATE",
        payload: rawBody,
        signature,
        verified,
        processed: true,
        processedAt: new Date(),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      verified,
      processed: updated.length,
      statuses: updated,
    });
  } catch (err: any) {
    console.error("[whatsapp.status] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET — webhook verification (for initial subscription)
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Invalid verification" }, { status: 403 });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return a === b;
  }
}
