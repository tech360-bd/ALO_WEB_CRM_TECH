import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/whatsapp/send — auth required. Sends a WhatsApp message via Meta API.
// Body: { to: string, templateName?: string, templateLanguage?: string, text?: string }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Allow all authenticated staff to send
    const role = (session.user as any).role;
    if (role === "STUDENT") {
      return NextResponse.json({ error: "Students cannot send WhatsApp messages" }, { status: 403 });
    }

    const body = await req.json();
    const { to, templateName, templateLanguage, text } = body;

    if (!to) {
      return NextResponse.json({ error: "to (recipient phone) is required" }, { status: 400 });
    }

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) {
      return NextResponse.json(
        { error: "WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID env vars must be set" },
        { status: 500 }
      );
    }

    // Normalize phone (Bangladesh)
    let normalized = to.replace(/\D/g, "");
    if (normalized.startsWith("01") && normalized.length === 11) {
      normalized = "880" + normalized.slice(1);
    } else if (normalized.startsWith("+880")) {
      normalized = normalized.slice(1);
    }

    // Build payload — either templated message or text message
    let messagePayload: any;
    if (templateName) {
      messagePayload = {
        messaging_product: "whatsapp",
        to: normalized,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage || "en_US" },
        },
      };
    } else if (text) {
      messagePayload = {
        messaging_product: "whatsapp",
        to: normalized,
        type: "text",
        text: { body: text },
      };
    } else {
      return NextResponse.json(
        { error: "Either templateName or text is required" },
        { status: 400 }
      );
    }

    // Send via Meta WhatsApp Business API
    const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messagePayload),
    });

    const apiResult = await apiResponse.json();

    if (!apiResponse.ok) {
      // Persist error status
      const messageId = apiResult?.messages?.[0]?.id || `failed-${Date.now()}`;
      await db.whatsAppMessageStatus.create({
        data: {
          messageId,
          recipientPhone: normalized,
          status: "FAILED",
          errorMessage: JSON.stringify(apiResult),
          providerPayload: JSON.stringify(apiResult),
        },
      }).catch(() => {});

      return NextResponse.json(
        { error: "WhatsApp API error", apiError: apiResult },
        { status: 502 }
      );
    }

    const messageId = apiResult?.messages?.[0]?.id || `sent-${Date.now()}`;

    // Persist outbound message
    const outbound = await db.socialInboxMessage.create({
      data: {
        platform: "WHATSAPP",
        direction: "OUTBOUND",
        senderName: "ALO Education",
        recipientId: normalized,
        messageText: text || `[Template: ${templateName}]`,
        conversationId: `wa-${normalized}`,
        externalId: messageId,
        aiHandled: false,
        humanApproved: true,
        isRead: true,
        sentAt: new Date(),
      },
    });

    await db.whatsAppMessageStatus.create({
      data: {
        messageId,
        socialMessageId: outbound.id,
        recipientPhone: normalized,
        status: "SENT",
        providerPayload: JSON.stringify(apiResult),
      },
    }).catch(() => {});

    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "WHATSAPP_SEND",
        resource: "SocialInboxMessage",
        resourceId: outbound.id,
        details: JSON.stringify({ to: normalized, templateName, messageId }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      messageId,
      outbound,
      apiResponse: apiResult,
    });
  } catch (err: any) {
    console.error("[whatsapp.send] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
