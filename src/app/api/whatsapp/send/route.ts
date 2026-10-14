import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limiter";
import { sendWhatsAppMessage } from "@/lib/whatsapp-cloud-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/whatsapp/send — send one WhatsApp message from an official ALO number.
 *
 * Hardened 2026-10-13. What was wrong before:
 *   • the only authorization test was `role !== "STUDENT"`, so ANY other
 *     authenticated account (partner, marketing, finance, an external-facing
 *     role) could send WhatsApp traffic from ALO's official number;
 *   • there was no rate limit, so one client loop could burn the number's
 *     messaging quality rating;
 *   • the route hand-rolled its own Graph API call instead of using
 *     `sendWhatsAppMessage`, so it skipped text-length validation, phone
 *     normalization and provider status persistence, and it pinned v18.0;
 *   • a failed send was dropped. `WhatsAppRetryQueue` existed, the retry job
 *     existed, but nothing ever enqueued a row, so the retry engine could never
 *     run against real data.
 *
 * Body: { to, templateName?, templateLanguage?, text? }
 */

/** Roles permitted to send WhatsApp from an official ALO number. */
const ALLOWED_SENDER_ROLES = new Set([
  'super_admin', 'admin', 'ceo', 'coo',
  'branch_manager', 'department_manager', 'counselor', 'senior_counselor',
  'application_manager', 'application_team', 'application_officer', 'document_officer',
  'visa_officer', 'visa_interview_officer', 'front_desk', 'support', 'support_staff',
  'marketing_manager', 'finance',
]);

function callerRoles(sessionUser: Record<string, unknown>): string[] {
  const raw = [
    ...(Array.isArray(sessionUser?.roles) ? (sessionUser.roles as unknown[]) : []),
    sessionUser?.role,
    sessionUser?.userType,
  ];
  return raw
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .map((value) => value.toLowerCase());
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Deny by default: an unrecognised role is not a sender.
    const roles = callerRoles(session.user as Record<string, unknown>);
    const authorized = roles.some((role) => ALLOWED_SENDER_ROLES.has(role));
    if (!authorized) {
      return NextResponse.json(
        { error: "Forbidden", detail: "This role is not authorized to send WhatsApp messages." },
        { status: 403 }
      );
    }

    const userId = String((session.user as Record<string, unknown>).id ?? (session.user as Record<string, unknown>).email ?? 'unknown');
    const limit = checkRateLimit(`whatsapp-send:${userId}`, 'whatsapp_send');
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many messages", detail: "WhatsApp send rate limit reached. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))) } }
      );
    }

    let body: { to?: string; templateName?: string; templateLanguage?: string; text?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { to, templateName, templateLanguage, text } = body;
    if (!to || typeof to !== 'string') {
      return NextResponse.json({ error: "to (recipient phone) is required" }, { status: 400 });
    }
    if (!templateName && !text) {
      return NextResponse.json({ error: "Either templateName or text is required" }, { status: 400 });
    }

    // Single canonical sender: validates length, normalizes the number, calls the
    // provider and records the accepted message plus its delivery status.
    const sendResult = await sendWhatsAppMessage({
      to,
      text,
      templateName,
      templateLanguage,
    });

    if (!sendResult.success || !sendResult.messageId) {
      const sendError = sendResult.error || "WhatsApp provider did not confirm the message.";

      // Queue a text send for controlled retry (max 3 attempts). Template sends
      // are not retried here: the queue stores only text, so retrying one would
      // silently downgrade an approved template to plain text.
      let retryQueued = false;
      const retryPhone = (to || '').replace(/\D/g, '');
      if (!templateName && text && retryPhone && !/not configured/i.test(sendError)) {
        try {
          await db.whatsAppRetryQueue.create({
            data: {
              messageId: '',
              recipientPhone: retryPhone,
              messageBody: text,
              attemptCount: 0,
              maxAttempts: 3,
              lastError: sendError.slice(0, 400),
              nextRetryAt: new Date(Date.now() + 15 * 60 * 1000),
              status: 'pending',
            },
          });
          retryQueued = true;
        } catch {
          /* queueing is best-effort; the failure is still reported below */
        }
      }

      await db.auditLog.create({
        data: {
          userId,
          action: "WHATSAPP_SEND_FAILED",
          resource: "WhatsApp",
          resourceId: retryPhone || to,
          details: JSON.stringify({
            templateName: templateName ?? null,
            retryQueued,
            notConfigured: /not configured/i.test(sendError),
          }),
        },
      }).catch(() => {});

      return NextResponse.json(
        {
          success: false,
          error: "WhatsApp send failed",
          detail: sendError,
          retryQueued,
        },
        { status: /not configured/i.test(sendError) ? 503 : 502 }
      );
    }

    await db.auditLog.create({
      data: {
        userId,
        action: "WHATSAPP_SEND",
        resource: "SocialInboxMessage",
        resourceId: sendResult.socialMessageId ?? sendResult.messageId,
        details: JSON.stringify({ templateName: templateName ?? null, messageId: sendResult.messageId }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      messageId: sendResult.messageId,
      socialMessageId: sendResult.socialMessageId ?? null,
      statusRecorded: sendResult.statusRecorded ?? false,
    });
  } catch (err: unknown) {
    console.error("[whatsapp.send] error:", err);
    return NextResponse.json({ error: "WhatsApp send failed" }, { status: 500 });
  }
}
