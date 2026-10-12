import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// WhatsApp webhook — receives messages from WhatsApp Business API
// Also simulates comment-to-lead and keyword-trigger automation
// Includes idempotency via WebhookEvent + ContactMatchReview for unknown senders
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

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Handle WhatsApp webhook verification
  if (body["hub.mode"] === "subscribe") {
    return NextResponse.json({ "hub.challenge": body["hub.challenge"] });
  }

  const from: string | undefined = body.from || body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
  const messageText: string | undefined = body.text || body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

  // Compute a stable eventId for idempotency
  // Prefer provider message id, fall back to hash of from + messageText
  const providerMessageId: string | undefined =
    body.messageId ||
    body.id ||
    body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id ||
    body.entry?.[0]?.id;
  const fallbackEventId = providerMessageId || `wa-${from || "unknown"}-${(messageText || "").slice(0, 60)}-${Date.now().toString().slice(-6)}`;

  // ─── IDEMPOTENCY CHECK ───
  // Look up WebhookEvent by (provider=WHATSAPP, eventId). If processed, short-circuit.
  let webhookEvent: any = null;
  try {
    webhookEvent = await db.webhookEvent.findUnique({
      where: { provider_eventId: { provider: "WHATSAPP", eventId: fallbackEventId } },
    });
  } catch {
    // eventId may be null in DB (unique constraint handles null specially). Continue.
  }

  if (webhookEvent && webhookEvent.processed) {
    // Already processed — return cached summary without re-processing
    return NextResponse.json({
      success: true,
      idempotent: true,
      message: "Webhook already processed",
      webhookEventId: webhookEvent.id,
    });
  }

  if (!from || !messageText) {
    // Persist the raw event for debugging, mark as errored
    if (!webhookEvent) {
      try {
        await db.webhookEvent.create({
          data: {
            provider: "WHATSAPP",
            eventId: fallbackEventId,
            eventType: body.object || body.entry?.[0]?.changes?.[0]?.field || "UNKNOWN",
            payload: JSON.stringify(body),
            verified: false,
            processed: false,
            errorMessage: "Missing 'from' or message text",
          },
        });
      } catch {}
    }
    return NextResponse.json({ error: "Missing from or message text" }, { status: 400 });
  }

  // Persist the raw webhook event for audit / idempotency
  if (!webhookEvent) {
    try {
      webhookEvent = await db.webhookEvent.create({
        data: {
          provider: "WHATSAPP",
          eventId: fallbackEventId,
          eventType: body.object || body.entry?.[0]?.changes?.[0]?.field || "MESSAGE",
          payload: JSON.stringify(body),
          verified: true,
          processed: false,
        },
      });
    } catch {
      // unique constraint may have raced — re-fetch
      try {
        webhookEvent = await db.webhookEvent.findUnique({
          where: { provider_eventId: { provider: "WHATSAPP", eventId: fallbackEventId } },
        });
      } catch {}
    }
  }

  try {
    // 1. Check keyword triggers
    const triggers = await db.keywordTrigger.findMany({ where: { status: "ACTIVE", platform: { in: ["ALL", "WHATSAPP"] } } });
    const matchedTrigger = triggers.find((t) => messageText.toLowerCase().includes(t.keyword.toLowerCase()));

    let autoReply = "Hello! I'm ALO AI Assistant. How can I help you with your study abroad journey?";
    let keywordTriggered: string | null = null;

    if (matchedTrigger) {
      autoReply = matchedTrigger.autoReplyText;
      keywordTriggered = matchedTrigger.keyword;
      await db.keywordTrigger.update({ where: { id: matchedTrigger.id }, data: { triggerCount: { increment: 1 } } });
    }

    // Rule-based replies (no AI cost) for common greetings
    const lowerMsg = messageText.toLowerCase().trim();
    if (/^(hi|hello|hey|salam|assalam|asa|হাই|হ্যালো|সালাম)/.test(lowerMsg)) {
      autoReply = "Hello! 👋 Welcome to ALO Education. I'm your AI assistant. How can I help you today? You can ask about:\n• Study abroad options\n• University courses\n• IELTS/PTE preparation\n• Visa guidance\n• Scholarships\n\nOr share your phone number and our counselor will contact you.";
    } else if (/^(thanks|thank you|dhonnobad|ধন্যবাদ)/.test(lowerMsg)) {
      autoReply = "You're welcome! 😊 Is there anything else I can help you with?";
    } else if (/^(bye|goodbye|allahr hafez|আল্লাহ হাফেজ)/.test(lowerMsg)) {
      autoReply = "Goodbye! Feel free to message us anytime. ALO Education is here for you 24/7. 🌟";
    }

    // 2. Check if sender is an existing student (by phone — both raw and normalized)
    const normalizedFrom = normalizePhone(from);
    const existingStudent = await db.student.findFirst({
      where: { OR: [{ mobile: from }, ...(normalizedFrom ? [{ mobile: normalizedFrom }, { altMobile: from }, { altMobile: normalizedFrom }] : [])] },
    });
    let leadId: string | null = null;
    let studentId: string | null = existingStudent?.id || null;

    // 3. If no existing student, check for existing lead
    if (!studentId) {
      const existingLead = await db.lead.findFirst({
        where: { OR: [{ phone: from }, ...(normalizedFrom ? [{ phone: normalizedFrom }, { altPhone: from }, { altPhone: normalizedFrom }] : [])] },
      });
      leadId = existingLead?.id || null;
    }

    // 4. If no existing lead/student and keyword matched (auto-create-lead), create new lead + student
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

      // Create student profile
      const studentCount = await db.student.count();
      const newStudent = await db.student.create({
        data: {
          studentId: `AE-${new Date().getFullYear()}${(100001 + studentCount).toString()}`,
          firstName: `WhatsApp`,
          lastName: from.slice(-4),
          fullName: `WhatsApp ${from.slice(-4)}`,
          email: `wa_${from.slice(-4)}@aloeducation.com`,
          mobile: from,
          nationality: "Bangladeshi",
          leadId: newLead.id,
          profileCompletion: 5,
          status: "ACTIVE",
        },
      });
      studentId = newStudent.id;

      // Create timeline event
      await db.timelineEvent.create({
        data: {
          leadId: newLead.id,
          type: "LEAD_CREATED",
          title: "Lead auto-created from WhatsApp",
          description: `Keyword "${keywordTriggered}" triggered auto lead creation. Message: ${messageText.slice(0, 100)}`,
        },
      });

      // Create follow-up task
      const counselors = await db.user.findMany({ where: { role: "COUNSELOR", status: "ACTIVE" } });
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
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          },
        });
      }
    } else if (!leadId && !studentId && !matchedTrigger) {
      // ─── NEW: instead of silently creating a lead, log a ContactMatchReview for manual triage ───
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

    // 5. Save incoming message
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

    // 6. Save AI auto-reply
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

    // 7. Create SLA event
    await db.slaEvent.create({
      data: {
        channel: "WHATSAPP",
        studentId,
        counselorId: existingStudent?.counselorId,
        receivedAt: new Date(),
        status: "PENDING",
        slaMinutes: 40,
      },
    });

    // 8. Save to CRM timeline
    if (studentId) {
      await db.timelineEvent.create({
        data: {
          studentId,
          type: "MESSAGE_SENT",
          title: "WhatsApp message received + AI reply sent",
          description: `Inbound: "${messageText.slice(0, 100)}" → AI Reply: "${autoReply.slice(0, 100)}"`,
        },
      });
    }

    // 9. Audit log
    await db.auditLog.create({
      data: {
        action: "AI_ACTION",
        resource: "SocialInboxMessage",
        resourceId: inboundMessage.id,
        details: JSON.stringify({ from, keywordTriggered, autoCreated: !leadId && matchedTrigger?.autoCreateLead, aiReply: autoReply.slice(0, 100) }),
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
      inboundMessage,
      outboundMessage,
      leadId,
      studentId,
      keywordTriggered,
      autoReply,
      autoCreated: !leadId && matchedTrigger?.autoCreateLead,
      webhookEventId: webhookEvent?.id || null,
    });
  } catch (error: any) {
    // Mark webhook event as errored (but not processed) so it can be retried
    if (webhookEvent) {
      try {
        await db.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: { errorMessage: error?.message || "Processing failed" },
        });
      } catch {}
    }
    return NextResponse.json({ error: error?.message || "Webhook processing failed" }, { status: 500 });
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
