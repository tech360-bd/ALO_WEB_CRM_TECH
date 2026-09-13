import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/facebook/webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
// Verifies the webhook subscription with Facebook.
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "Invalid verification" }, { status: 403 });
}

// POST /api/facebook/webhook
// PUBLIC webhook — receives Facebook Leadgen / Page events.
// Verifies X-Hub-Signature-256 (HMAC SHA-256) against FACEBOOK_APP_SECRET.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256") || "";

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Process each entry/changes — typically Leadgen webhook payloads
    const entries: any[] = Array.isArray(payload?.entry) ? payload.entry : [];
    const processed: any[] = [];

    for (const entry of entries) {
      const changes: any[] = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        if (change?.field === "leadgen") {
          const leadData = change?.value || {};
          const providerEventId =
            String(leadData?.leadgen_id || leadData?.id || `fb-lead-${entry?.id || ""}-${Date.now()}`);

          // Idempotency: skip if already processed
          const existing = await db.webhookEvent.findUnique({
            where: { provider_eventId: { provider: "FACEBOOK", eventId: providerEventId } },
          }).catch(() => null);

          if (existing) {
            processed.push({ idempotent: true, providerEventId });
            continue;
          }

          // Persist raw webhook event
          const webhookEvent = await db.webhookEvent.create({
            data: {
              provider: "FACEBOOK",
              eventId: providerEventId,
              eventType: "LEADGEN",
              payload: JSON.stringify(payload),
              verified: true,
              processed: false,
            },
          }).catch(() => null);

          // Process the lead (best-effort) — capture as a Lead row
          try {
            const fieldData = leadData?.field_data || [];
            const getFieldValue = (name: string) =>
              fieldData.find((f: any) => f?.name?.toLowerCase() === name.toLowerCase())?.values?.[0];

            const fullName = getFieldValue("full_name") || getFieldValue("name") || `Facebook Lead ${entry?.id || ""}`;
            const email = getFieldValue("email");
            const phone = getFieldValue("phone_number") || getFieldValue("phone");

            const leadCount = await db.lead.count();
            const newLead = await db.lead.create({
              data: {
                leadId: `ALO-FB-${(10001 + leadCount + 1).toString()}`,
                fullName: String(fullName),
                email: email ? String(email) : null,
                phone: phone ? String(phone) : "N/A",
                source: "FACEBOOK_LEAD_ADS",
                sourceDetail: `Facebook leadgen_id=${leadData?.leadgen_id || ""}`,
                notes: `Auto-imported from Facebook Lead Ads webhook. Raw payload stored in WebhookEvent ${webhookEvent?.id ?? ""}`,
                status: "NEW",
                welcomeSent: false,
              },
            });

            // Mark webhook event as processed
            if (webhookEvent) {
              await db.webhookEvent.update({
                where: { id: webhookEvent.id },
                data: { processed: true, processedAt: new Date() },
              }).catch(() => {});
            }

            processed.push({ leadId: newLead.id, providerEventId });
          } catch (e: any) {
            processed.push({ error: e?.message || "Failed to process lead", providerEventId });
          }
        } else {
          processed.push({ ignored: true, field: change?.field });
        }
      }
    }

    return NextResponse.json({ success: true, processed });
  } catch (err: any) {
    console.error("[facebook/webhook POST] error", err);
    return NextResponse.json({ error: err?.message || "Webhook processing failed" }, { status: 500 });
  }
}

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.FACEBOOK_APP_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[facebook/webhook] FACEBOOK_APP_SECRET missing — rejecting in production");
      return false;
    }
    console.warn("[facebook/webhook] FACEBOOK_APP_SECRET not configured — skipping signature check (dev only)");
    return true;
  }

  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }
  const expected = signature.slice("sha256=".length);
  const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(hmac);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
