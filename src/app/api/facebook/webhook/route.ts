import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { createLeadWithReference } from '@/lib/lead-reference';
import { decryptStoredToken } from "@/lib/social/token-encryption";
import { handleAfterHoursMessage } from '@/lib/communication/after-hours';

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
      // Stored encrypted at rest; decrypt before comparing.
      integrationToken = decryptStoredToken(integration?.verifyToken) || null;
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
          const token = decryptStoredToken(integration?.pageAccessToken);
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
          // §125 — same canonical reference generator as WhatsApp and the web
          // forms, so a Facebook lead cannot collide with a simultaneous one.
          const newLead = await createLeadWithReference(db, {
              fullName: normalized.fullName || "Facebook Lead",
              email: normalized.email || null,
              phone: normalized.phone || "N/A",
              source: "FACEBOOK",
              sourceDetail: `Facebook form: ${formName || formId || "unknown"}`,
              notes: `Auto-created from Facebook lead ${leadgenId}`,
              status: "NEW",
              welcomeSent: false,
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

    // Handle Messenger page messages. Generated replies remain human-review
    // drafts. Only a configured, pre-approved after-hours acknowledgement may
    // be sent, and only after the linked follow-up task is durably queued.
    const messengerReplies: any[] = [];
    if (body.object === 'page') {
      const { handleIntakeMessage } = await import('@/lib/ai-agents/student-intake-agent');
      for (const entry of entries) {
        const messagings: any[] = (entry as any).messaging || [];
        for (const ev of messagings) {
          const senderId = ev?.sender?.id?.toString();
          const text = ev?.message?.text || ev?.postback?.title || '';
          const attachments: any[] = ev?.message?.attachments || [];
          const mediaType = attachments[0]?.type === 'image' ? 'image' : attachments[0]?.type === 'file' ? 'document' : attachments[0]?.type === 'audio' ? 'voice' : null;
          const fileName = attachments[0]?.payload?.url?.split('/').pop();
          if (!senderId || (!text && !mediaType)) continue;
          const mid = ev?.message?.mid;
          if (mid) {
            const dup = await db.webhookEvent.findUnique({ where: { provider_eventId: { provider: 'FACEBOOK', eventId: mid } } }).catch(() => null) as any;
            if (dup?.processed) { messengerReplies.push({ mid, idempotent: true }); continue; }
          }
          try {
            const intake = await handleIntakeMessage({ channel: 'facebook', senderId, text: text || `[${mediaType}]`, mediaType: mediaType as any, mediaInfo: { fileName: fileName as string, mime: attachments[0]?.payload?.mime_type } });
            const previous = await db.socialInboxMessage.findFirst({
              where: { platform: 'FACEBOOK', senderId },
              orderBy: { createdAt: 'desc' },
              select: { leadId: true, studentId: true },
            }).catch(() => null);
            const linkedLeadId = previous?.leadId || null;
            const linkedStudentId = previous?.studentId || null;
            const conversationId = `fb-${senderId}`;
            const inbound = await db.socialInboxMessage.create({
              data: {
                platform: 'FACEBOOK', direction: 'INBOUND', senderId,
                messageText: text || `[${mediaType}]`, conversationId,
                leadId: linkedLeadId || undefined,
                studentId: linkedStudentId || undefined,
                aiHandled: true, aiDraftReply: intake.reply.slice(0, 5000), humanApproved: false,
              } as any,
            });

            let autoReplySent = false;
            try {
              const afterHours = await handleAfterHoursMessage({
                channel: 'facebook_messenger',
                message: text || `[${mediaType}]`,
                leadId: linkedLeadId || undefined,
                studentId: linkedStudentId || undefined,
              });
              if (afterHours.autoReply && afterHours.followUpQueued) {
                const outbound = await db.socialInboxMessage.create({
                  data: {
                    platform: 'FACEBOOK', direction: 'OUTBOUND', senderName: 'ALO Education',
                    recipientId: senderId, messageText: afterHours.autoReply,
                    conversationId, leadId: linkedLeadId || undefined,
                    studentId: linkedStudentId || undefined,
                    aiHandled: false, humanApproved: false,
                    messageMediaMetadata: JSON.stringify({ deliveryStatus: 'PENDING', source: 'approved_after_hours_template', automationApproved: true }),
                  } as any,
                }).catch(() => null);
                if (outbound?.id) {
                  const integration = await db.facebookIntegration.findFirst({ where: { pageId: String((entry as any).id) } });
                  const token = decryptStoredToken(integration?.pageAccessToken) || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
                  if (token) {
                    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${encodeURIComponent(token)}`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ recipient: { id: senderId }, message: { text: afterHours.autoReply.slice(0, 1900) } }),
                    }).catch(() => null);
                    const result = response?.ok ? await response.json().catch(() => null) : null;
                    if (response?.ok && result?.message_id) {
                      autoReplySent = true;
                      await db.socialInboxMessage.update({
                        where: { id: outbound.id },
                        data: {
                          externalId: String(result.message_id), sentAt: new Date(),
                          messageMediaMetadata: JSON.stringify({ deliveryStatus: 'SENT', source: 'approved_after_hours_template', automationApproved: true }),
                        },
                      }).catch(() => {});
                    } else {
                      await db.socialInboxMessage.update({
                        where: { id: outbound.id },
                        data: { messageMediaMetadata: JSON.stringify({ deliveryStatus: 'FAILED', source: 'approved_after_hours_template', automationApproved: true }) },
                      }).catch(() => {});
                    }
                  } else {
                    await db.socialInboxMessage.update({
                      where: { id: outbound.id },
                      data: { messageMediaMetadata: JSON.stringify({ deliveryStatus: 'NOT_CONFIGURED', source: 'approved_after_hours_template', automationApproved: true }) },
                    }).catch(() => {});
                  }
                }
              }
            } catch (error) {
              console.error('[facebook.webhook] after-hours automation failed closed', { error: error instanceof Error ? error.name : 'UnknownError' });
            }
            if (mid) await db.webhookEvent.create({ data: { provider: 'FACEBOOK', eventId: mid, eventType: 'MESSAGING', payload: JSON.stringify(ev), signature, verified: signatureValid, processed: true, processedAt: new Date() } as any }).catch(() => {});
            messengerReplies.push({ mid: mid || null, state: intake.context.state, aiDraftSaved: Boolean(inbound?.id), autoReplySent });
          } catch {
            messengerReplies.push({ mid: mid || null, error: 'processing_failed' });
          }
        }
      }
    }

    // Persist webhook event for audit
    await db.webhookEvent.create({
      data: {
        provider: "FACEBOOK",
        eventId: entries[0]?.id || `fb-${Date.now()}`,
        eventType: processedLeads.length ? "LEAD_WEBHOOK" : "MESSAGING",
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
      messenger: messengerReplies.length ? { processed: messengerReplies.length, replies: messengerReplies } : undefined,
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
