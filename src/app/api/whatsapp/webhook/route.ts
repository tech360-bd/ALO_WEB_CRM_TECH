import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

// WhatsApp webhook — receives inbound messages from WhatsApp Business API
// Includes signature verification (X-Hub-Signature-256), outbound send via Meta API,
// and status routing. Keeps existing business logic (keyword triggers, auto lead creation,
// SLA tracking, etc.).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Normalize Bangladeshi phone numbers to international format
function normalizePhone(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("01") && digits.length === 11) {
    digits = "880" + digits;
  } else if (digits.startsWith("+880")) {
    digits = digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith("1")) {
    digits = "880" + digits;
  }
  return digits;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return a === b;
  }
}

function verifySignature(rawBody: string, signature: string): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error("[whatsapp.webhook] WHATSAPP_APP_SECRET is required — rejecting webhook");
    return false;
  }
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

async function sendOutboundViaApi(recipientPhone: string, text: string): Promise<{ messageId: string | null; apiResponse: any }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { messageId: null, apiResponse: { error: "WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured" } };
  }

  const payload = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "text",
    text: { body: text },
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    const messageId = json?.messages?.[0]?.id || null;
    return { messageId, apiResponse: json };
  } catch (err: any) {
    return { messageId: null, apiResponse: { error: err.message } };
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";

  // ── Signature verification ──
  const signatureValid = verifySignature(rawBody, signature);
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

  // Handle WhatsApp webhook verification
  if (body["hub.mode"] === "subscribe") {
    return NextResponse.json({ "hub.challenge": body["hub.challenge"] });
  }

  // ── STATUS ROUTING ──
  // If payload contains statuses, route to status webhook logic
  const statuses: any[] = body?.entry?.[0]?.changes?.[0]?.value?.statuses || [];
  if (statuses.length > 0) {
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
        updated.push({ messageId, status, recordId: record.id });
      } catch (err: any) {
        updated.push({ messageId, status, error: err.message });
      }
    }
    await db.webhookEvent.create({
      data: {
        provider: "WHATSAPP",
        eventId: body?.entry?.[0]?.id || `wa-status-${Date.now()}`,
        eventType: "STATUS_UPDATE",
        payload: rawBody,
        signature,
        verified: signatureValid,
        processed: true,
        processedAt: new Date(),
      },
    }).catch(() => {});
    return NextResponse.json({ success: true, routed: "status", processed: updated.length, statuses: updated });
  }

  // ── INBOUND MESSAGE HANDLING (existing business logic) ──
  const from: string | undefined =
    body.from || body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
  const messageText: string | undefined =
    body.text || body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

  const providerMessageId: string | undefined =
    body.messageId ||
    body.id ||
    body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id ||
    body.entry?.[0]?.id;
  const fallbackEventId =
    providerMessageId ||
    `wa-${from || "unknown"}-${(messageText || "").slice(0, 60)}-${Date.now().toString().slice(-6)}`;

  // ─── IDEMPOTENCY CHECK ───
  let webhookEvent: any = null;
  try {
    webhookEvent = await db.webhookEvent.findUnique({
      where: { provider_eventId: { provider: "WHATSAPP", eventId: fallbackEventId } },
    });
  } catch {
    // eventId may be null in DB. Continue.
  }

  if (webhookEvent && webhookEvent.processed) {
    return NextResponse.json({
      success: true,
      idempotent: true,
      message: "Webhook already processed",
      webhookEventId: webhookEvent.id,
    });
  }

  if (!from || !messageText) {
    if (!webhookEvent) {
      try {
        await db.webhookEvent.create({
          data: {
            provider: "WHATSAPP",
            eventId: fallbackEventId,
            eventType: body.object || body.entry?.[0]?.changes?.[0]?.field || "UNKNOWN",
            payload: rawBody,
            signature,
            verified: signatureValid,
            processed: false,
            errorMessage: "Missing 'from' or message text",
          },
        });
      } catch {}
    }
    return NextResponse.json({ error: "Missing from or message text" }, { status: 400 });
  }

  if (!webhookEvent) {
    try {
      webhookEvent = await db.webhookEvent.create({
        data: {
          provider: "WHATSAPP",
          eventId: fallbackEventId,
          eventType: body.object || body.entry?.[0]?.changes?.[0]?.field || "MESSAGE",
          payload: rawBody,
          signature,
          verified: signatureValid,
          processed: false,
        },
      });
    } catch {
      try {
        webhookEvent = await db.webhookEvent.findUnique({
          where: { provider_eventId: { provider: "WHATSAPP", eventId: fallbackEventId } },
        });
      } catch {}
    }
  }

  try {
    // 1. Check keyword triggers
    const triggers = await db.keywordTrigger.findMany({
      where: { status: "ACTIVE", platform: { in: ["ALL", "WHATSAPP"] } },
    });
    const matchedTrigger = triggers.find((t) =>
      messageText.toLowerCase().includes(t.keyword.toLowerCase())
    );

    let autoReply =
      "Hello! I'm ALO AI Assistant. How can I help you with your study abroad journey?";
    let keywordTriggered: string | null = null;

    if (matchedTrigger) {
      autoReply = matchedTrigger.autoReplyText;
      keywordTriggered = matchedTrigger.keyword;
      await db.keywordTrigger.update({
        where: { id: matchedTrigger.id },
        data: { triggerCount: { increment: 1 } },
      });
    }

    // Rule-based replies
    const lowerMsg = messageText.toLowerCase().trim();
    if (/^(hi|hello|hey|salam|assalam|asa|হাই|হ্যালো|সালাম)/.test(lowerMsg)) {
      autoReply =
        "Hello! 👋 Welcome to ALO Education. I'm your AI assistant. How can I help you today? You can ask about:\n• Study abroad options\n• University courses\n• IELTS/PTE preparation\n• Visa guidance\n• Scholarships\n\nOr share your phone number and our counselor will contact you.";
    } else if (/^(thanks|thank you|dhonnobad|ধন্যবাদ)/.test(lowerMsg)) {
      autoReply = "You're welcome! 😊 Is there anything else I can help you with?";
    } else if (/^(bye|goodbye|allahr hafez|আল্লাহ হাফেজ)/.test(lowerMsg)) {
      autoReply =
        "Goodbye! Feel free to message us anytime. ALO Education is here for you 24/7. 🌟";
    }

    // 2. Check if sender is an existing student
    const normalizedFrom = normalizePhone(from);
    const existingStudent = await db.student.findFirst({
      where: {
        OR: [
          { phone: from },
          ...(normalizedFrom ? [{ phone: normalizedFrom }] : []),
        ],
      },
    });
    let leadId: string | null = null;
    let studentId: string | null = existingStudent?.id || null;

    // 3. If no existing student, check for existing lead
    if (!studentId) {
      const existingLead = await db.lead.findFirst({
        where: {
          OR: [
            { phone: from },
            ...(normalizedFrom
              ? [
                  { phone: normalizedFrom },
                  { altPhone: from },
                  { altPhone: normalizedFrom },
                ]
              : []),
          ],
        },
      });
      leadId = existingLead?.id || null;
    }

    // 4. If no existing lead/student and keyword matched, create new
    if (!leadId && !studentId && matchedTrigger?.autoCreateLead) {
      const count = await db.lead.count();
      const newLead = await db.lead.create({
        data: {
          leadId: `ALO-L-${(10001 + count + 1).toString()}`,
          fullName: `WhatsApp ${from.slice(-4)}`,
          phone: from,
          source: "WHATSAPP",
          sourceDetail: `WhatsApp AI - keyword: ${keywordTriggered}`,
          notes: `Auto-created from WhatsApp. First message: "${messageText}"`,
          status: "NEW",
          welcomeSent: false,
        },
      });
      leadId = newLead.id;

      const studentCount = await db.student.count();
      const newStudent = await db.student.create({
        data: {
          studentId: `AE-${new Date().getFullYear()}${(100001 + studentCount).toString()}`,
          name: `WhatsApp ${from.slice(-4)}`,
          email: `wa_${from.slice(-4)}@aloeducation.com`,
          phone: from,
          currentCountry: "Bangladesh",
          leadId: newLead.id,
          profileComplete: 5,
          status: "active",
        },
      });
      studentId = newStudent.id;

      await db.timelineEvent.create({
        data: {
          leadId: newLead.id,
          studentId: newStudent.id,
          stage: "lead_created",
          title: "Lead auto-created from WhatsApp",
          description: `Keyword "${keywordTriggered}" triggered auto lead creation. Message: ${messageText.slice(0, 100)}`,
          actor: "whatsapp-webhook",
          actionUrl: "",
        },
      });

      const counselors = await db.user.findMany({
        where: { role: "COUNSELOR", status: "ACTIVE" },
      });
      if (counselors.length > 0) {
        const assignedCounselor = counselors[0];
        await db.task.create({
          data: {
            title: `Follow up with WhatsApp lead ${from}`,
            assigneeId: assignedCounselor.id,
            studentId: newStudent.id,
            type: "FOLLOW_UP",
            priority: "HIGH",
            status: "PENDING",
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10),
          },
        });
      }
    } else if (!leadId && !studentId && !matchedTrigger) {
      await db.contactMatchReview.create({
        data: {
          incomingPhone: from,
          normalizedPhone: normalizedFrom,
          incomingName: body.name || body.profileName || null,
          incomingEmail: body.email || null,
          matchedStudentId: null,
          matchedLeadId: null,
          matchedPartnerId: null,
          matchConfidence: 0,
          matchReason: "NO_MATCH_WHATSAPP_INBOUND",
          status: "PENDING",
        },
      });
    }

    // 5. Save inbound message
    const inboundMessage = await db.socialInboxMessage.create({
      data: {
        platform: "WHATSAPP",
        direction: "INBOUND",
        senderId: from,
        senderName: from,
        messageText,
        conversationId: `wa-${from}`,
        leadId,
        studentId,
        aiHandled: true,
        aiDraftReply: autoReply,
        keywordTriggered,
        isRead: false,
      },
    });

    // 6. Save outbound (AI auto-reply)
    const outboundMessage = await db.socialInboxMessage.create({
      data: {
        platform: "WHATSAPP",
        direction: "OUTBOUND",
        senderName: "ALO AI",
        recipientId: from,
        messageText: autoReply,
        conversationId: `wa-${from}`,
        leadId,
        studentId,
        aiHandled: true,
        humanApproved: false,
        isRead: true,
        sentAt: new Date(),
      },
    });

    // 7. ── OUTBOUND SEND VIA META API ──
    // Send the auto-reply via the WhatsApp Business API (best-effort).
    let outboundApiResult: any = null;
    try {
      const sendResult = await sendOutboundViaApi(normalizedFrom || from, autoReply);
      outboundApiResult = sendResult;

      if (sendResult.messageId) {
        // Link the social message + record status
        await db.socialInboxMessage.update({
          where: { id: outboundMessage.id },
          data: { externalId: sendResult.messageId },
        }).catch(() => {});

        await db.whatsAppMessageStatus.create({
          data: {
            messageId: sendResult.messageId,
            socialMessageId: outboundMessage.id,
            recipientPhone: normalizedFrom || from,
            status: "SENT",
            providerPayload: JSON.stringify(sendResult.apiResponse),
          },
        }).catch(() => {});
      }
    } catch (err: any) {
      outboundApiResult = { error: err.message };
    }

    // 8. SLA event
    await db.slaEvent.create({
      data: {
        threadId: "",
        channel: "WHATSAPP",
        studentId: studentId ?? "",
        counselorId: existingStudent?.counselorId ?? "",
        eventType: "warning",
        firstMessageAt: new Date(),
      },
    });

    // 9. CRM timeline
    if (studentId) {
      await db.timelineEvent.create({
        data: {
          studentId,
          stage: "message_sent",
          title: "WhatsApp message received + AI reply sent",
          description: `Inbound: "${messageText.slice(0, 100)}" → AI Reply: "${autoReply.slice(0, 100)}"`,
          actor: "whatsapp-webhook",
          actionUrl: "",
        },
      });
    }

    // 10. Audit log
    await db.auditLog.create({
      data: {
        action: "AI_ACTION",
        resource: "SocialInboxMessage",
        resourceId: inboundMessage.id,
        details: JSON.stringify({
          from,
          keywordTriggered,
          autoCreated: !leadId && matchedTrigger?.autoCreateLead,
          aiReply: autoReply.slice(0, 100),
          signatureValid,
          outboundApiMessageId: outboundApiResult?.messageId || null,
        }),
      },
    });

    // ─── MARK WEBHOOK EVENT AS PROCESSED ───
    if (webhookEvent) {
      try {
        await db.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            processed: true,
            processedAt: new Date(),
            errorMessage: null,
          },
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      signatureValid,
      inboundMessage,
      outboundMessage,
      leadId,
      studentId,
      keywordTriggered,
      autoReply,
      autoCreated: !leadId && matchedTrigger?.autoCreateLead,
      outboundApi: outboundApiResult,
      webhookEventId: webhookEvent?.id || null,
    });
  } catch (error: any) {
    if (webhookEvent) {
      try {
        await db.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: { errorMessage: error?.message || "Processing failed" },
        });
      } catch {}
    }
    return NextResponse.json(
      { error: error?.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// GET — webhook verification
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Invalid verification" }, { status: 403 });
}
