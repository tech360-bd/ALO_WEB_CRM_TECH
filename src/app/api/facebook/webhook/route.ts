import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/facebook/webhook — webhook verification.
// Meta sends hub.mode=subscribe, hub.verify_token, hub.challenge on subscription.
export async function GET(req: NextRequest) {
  try {
    const mode = req.nextUrl.searchParams.get("hub.mode");
    const token = req.nextUrl.searchParams.get("hub.verify_token");
    const challenge = req.nextUrl.searchParams.get("hub.challenge");

    // Look up any integration's verify token (or use env var)
    const envToken = process.env.FACEBOOK_VERIFY_TOKEN;
    let integrationToken: string | null = null;
    if (!envToken) {
      const integration = await db.facebookIntegration.findFirst({
        where: { verifyToken: { not: null } },
        select: { verifyToken: true },
      });
      integrationToken = integration?.verifyToken || null;
    }

    const expectedToken = envToken || integrationToken;

    if (mode === "subscribe" && token && expectedToken && token === expectedToken) {
      return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid verification — token mismatch" },
      { status: 403 }
    );
  } catch (err: any) {
    console.error("[facebook.webhook GET] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/facebook/webhook — signature-verified lead webhook.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256") || "";

    // ── Signature verification ──
    let signatureValid = false;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appSecret) {
      console.error("[facebook.webhook] FACEBOOK_APP_SECRET is required — rejecting webhook");
      return NextResponse.json(
        { error: "Webhook verification is not configured" },
        { status: 503 }
      );
    }
    const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
    signatureValid = safeEqual(expected, signature);
    if (!signatureValid) {
      return NextResponse.json(
        { error: "Invalid signature — webhook not verified" },
        { status: 401 }
      );
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Extract leadgen entries
    // Format: { entry: [{ id, changes: [{ field: "leadgen", value: { leadgen_id, form_id, page_id, created_time } }] }] }
    const entries: any[] = body?.entry || [];
    const processedLeads: any[] = [];

    for (const entry of entries) {
      const pageId = entry.id;
      const changes: any[] = entry.changes || [];

      for (const change of changes) {
        if (change.field !== "leadgen") continue;
        const value = change.value;
        const leadgenId = value?.leadgen_id;
        const formId = value?.form_id;
        const createdTime = value?.created_time ? new Date(value.created_time * 1000) : new Date();

        if (!leadgenId) continue;

        // Idempotency check — FacebookLeadRaw.leadgenId is @unique
        const existing = await db.facebookLeadRaw.findUnique({
          where: { leadgenId },
        });
        if (existing) {
          processedLeads.push({ leadgenId, skipped: "duplicate" });
          continue;
        }

        // Fetch lead data from Facebook Graph API
        let fieldData: any = {};
        let formName: string | null = null;
        try {
          const integration = await db.facebookIntegration.findUnique({
            where: { pageId: String(pageId) },
          });
          const token = integration?.pageAccessToken;
          if (token) {
            // Fetch lead details
            const leadRes = await fetch(
              `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${encodeURIComponent(token)}`
            );
            const leadJson = await leadRes.json();
            const fieldArray = leadJson?.field_data || [];
            for (const f of fieldArray) {
              fieldData[f.name] = Array.isArray(f.values) ? f.values[0] : f.values;
            }

            // Fetch form name
            if (formId) {
              const formRes = await fetch(
                `https://graph.facebook.com/v18.0/${formId}?fields=name&access_token=${encodeURIComponent(token)}`
              );
              const formJson = await formRes.json();
              formName = formJson?.name || null;
            }
          }
        } catch (err: any) {
          console.warn("[facebook.webhook] lead fetch failed:", err?.message);
        }

        // Normalize to lead fields
        const normalized = normalizeFbLead(fieldData);

        // Persist raw lead
        const rawLead = await db.facebookLeadRaw.create({
          data: {
            pageId: String(pageId),
            leadgenId,
            formId: formId || null,
            formName,
            fieldData: JSON.stringify(fieldData),
            normalizedData: JSON.stringify(normalized),
            processingStatus: "NEW",
            receivedAt: createdTime,
          },
        });

        // Try to match existing lead by phone/email
        let matchedLeadId: string | null = null;
        if (normalized.phone || normalized.email) {
          const conditions: any[] = [];
          if (normalized.phone) conditions.push({ phone: normalized.phone });
          if (normalized.email) conditions.push({ email: normalized.email });
          const existingLead = await db.lead.findFirst({ where: { OR: conditions } });
          if (existingLead) {
            matchedLeadId = existingLead.id;
          }
        }

        // If no match, create a new lead
        if (!matchedLeadId && (normalized.fullName || normalized.phone)) {
          const count = await db.lead.count();
          const newLead = await db.lead.create({
            data: {
              leadId: `ALO-L-${(10001 + count + 1).toString()}`,
              fullName: normalized.fullName || "Facebook Lead",
              email: normalized.email || null,
              phone: normalized.phone || "N/A",
              source: "FACEBOOK",
              sourceDetail: `Facebook form: ${formName || formId || "unknown"}`,
              notes: `Auto-created from Facebook lead ${leadgenId}`,
              status: "NEW",
              welcomeSent: false,
            },
          });
          matchedLeadId = newLead.id;

          // Trigger automation workflows (best-effort)
          try {
            const { scoreLead, autoAssignCounselor, createFollowUpTask } = await import("@/lib/crm-automation");
            await scoreLead(newLead.id).catch(() => {});
            await autoAssignCounselor(newLead.id).catch(() => {});
            await createFollowUpTask(newLead.id, 1).catch(() => {});
          } catch {}
        }

        // Update raw lead with match info
        if (matchedLeadId) {
          await db.facebookLeadRaw.update({
            where: { id: rawLead.id },
            data: {
              matchedLeadId,
              processingStatus: "MATCHED",
              processedAt: new Date(),
            },
          });
        }

        processedLeads.push({
          leadgenId,
          rawLeadId: rawLead.id,
          matchedLeadId,
          formName,
          normalized,
        });
      }

      // Update integration's lastWebhookAt
      await db.facebookIntegration.updateMany({
        where: { pageId: String(pageId) },
        data: { lastWebhookAt: new Date() },
      }).catch(() => {});
    }

    // Persist webhook event for audit
    await db.webhookEvent.create({
      data: {
        provider: "FACEBOOK",
        eventId: entries[0]?.id || `fb-${Date.now()}`,
        eventType: "LEAD_WEBHOOK",
        payload: rawBody,
        signature,
        verified: signatureValid,
        processed: true,
        processedAt: new Date(),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      signatureValid,
      processed: processedLeads.length,
      leads: processedLeads,
    });
  } catch (err: any) {
    console.error("[facebook.webhook POST] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function normalizeFbLead(fieldData: Record<string, any>): {
  fullName?: string;
  email?: string;
  phone?: string;
  preferredCountry?: string;
  preferredCourse?: string;
  preferredLevel?: string;
} {
  const get = (key: string) => {
    const v = fieldData[key];
    if (!v) return undefined;
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v[0];
    return String(v);
  };
  return {
    fullName: get("full_name") || get("name") || get("first_name") + (get("last_name") ? " " + get("last_name") : ""),
    email: get("email"),
    phone: get("phone_number") || get("phone"),
    preferredCountry: get("country") || get("preferred_country"),
    preferredCourse: get("course") || get("preferred_course"),
    preferredLevel: get("level") || get("study_level"),
  };
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return a === b;
  }
}
