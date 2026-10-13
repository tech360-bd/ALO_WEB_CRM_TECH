import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash, randomBytes } from "crypto";
import { sendTransactional } from "@/lib/email";
import { withObservability } from "@/lib/observability";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

function ipHash(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function ok(data: unknown, message = "OK", meta: unknown = {}) {
  return NextResponse.json({ success: true, message, data, meta, errors: [] });
}

function fail(message: string, errors: unknown[] = [], status = 400) {
  return NextResponse.json({ success: false, message, data: null, meta: {}, errors }, { status });
}

// Simple in-memory rate limiting (per IP hash)
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 5; // per window
const RATE_WINDOW = 60_000; // 1 min

function rateLimited(key: string) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + RATE_WINDOW });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

// basic spam heuristic
function isSpam(body: Record<string, unknown>) {
  const honey = body["website"]; // honeypot
  if (honey) return true;
  const text = [body.currentChallenge, body.desiredOutcome, body.notes]
    .filter(Boolean)
    .join(" ");
  if (/viagra|casino|crypto airdrop|http:\/\/\S+\.(ru|cn)/i.test(text)) return true;
  return false;
}

export const POST = withObservability(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Invalid request body.");

    // honeypot + spam
    if (isSpam(body)) return fail("Submission rejected.", ["spam"]);

    // rate limit
    const hash = ipHash(req);
    if (rateLimited(hash)) {
      return fail("Too many submissions. Please try again shortly.", ["rate_limited"], 429);
    }

    // validate required
    const type = String(body.type || "").trim();
    const fullName = String(body.fullName || "").trim();
    const email = normalizeEmail(String(body.email || ""));

    const errors: string[] = [];
    if (!type) errors.push("type_required");
    if (!fullName) errors.push("fullName_required");
    if (!email) errors.push("email_required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email_invalid");
    if (!body.privacyConsent) errors.push("privacyConsent_required");
    if (!body.commsConsent) errors.push("commsConsent_required");
    if (type === "student-referral" && !body.studentDataConsent)
      errors.push("studentDataConsent_required");
    if (errors.length) return fail("Validation failed.", errors, 422);

    // normalize phone
    const phone = body.phone ? normalizePhone(String(body.phone)) : null;

    // detect duplicate (same email + type within 24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingContact = await db.contact.findFirst({ where: { email } });
    let duplicate = false;
    if (existingContact) {
      const recent = await db.inquiry.findFirst({
        where: {
          contactId: existingContact.id,
          type,
          createdAt: { gte: since },
        },
      });
      duplicate = !!recent;
    }

    // create or update contact
    const contact = await db.contact.upsert({
      where: { email },
      update: {
        fullName,
        phone: phone ?? existingContact?.phone ?? null,
        whatsapp: body.whatsapp ? String(body.whatsapp) : existingContact?.whatsapp ?? null,
        organization: body.organization ? String(body.organization) : existingContact?.organization ?? null,
        role: body.role ? String(body.role) : existingContact?.role ?? null,
        country: body.country ? String(body.country) : existingContact?.country ?? null,
        city: body.city ? String(body.city) : existingContact?.city ?? null,
        preferredChannel: body.preferredChannel ? String(body.preferredChannel) : existingContact?.preferredChannel ?? null,
        source: (body.utmSource as string) || existingContact?.source || null,
      },
      create: {
        fullName,
        email,
        phone,
        whatsapp: body.whatsapp ? String(body.whatsapp) : null,
        organization: body.organization ? String(body.organization) : null,
        role: body.role ? String(body.role) : null,
        country: body.country ? String(body.country) : null,
        city: body.city ? String(body.city) : null,
        preferredChannel: body.preferredChannel ? String(body.preferredChannel) : "email",
        source: (body.utmSource as string) || null,
        status: "active",
      },
    });

    // generate reference
    const reference = `ALM-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;

    // create inquiry
    const inquiry = await db.inquiry.create({
      data: {
        reference,
        type,
        contactId: contact.id,
        currentChallenge: body.currentChallenge ? String(body.currentChallenge) : null,
        desiredOutcome: body.desiredOutcome ? String(body.desiredOutcome) : null,
        timeline: body.timeline ? String(body.timeline) : null,
        scope: body.scope ? String(body.scope) : null,
        existingSystem: body.existingSystem ? String(body.existingSystem) : null,
        preferredTime: body.preferredTime ? String(body.preferredTime) : null,
        notes: body.notes ? String(body.notes) : null,
        utmSource: body.utmSource ? String(body.utmSource) : null,
        utmMedium: body.utmMedium ? String(body.utmMedium) : null,
        utmCampaign: body.utmCampaign ? String(body.utmCampaign) : null,
        referralSource: body.referralSource ? String(body.referralSource) : null,
        privacyConsent: !!body.privacyConsent,
        commsConsent: !!body.commsConsent,
        marketingConsent: !!body.marketingConsent,
        studentDataConsent: !!body.studentDataConsent,
        status: duplicate ? "reviewing" : "new",
        ipHash: hash,
      },
    });

    // create opportunity for non-referral inquiry types
    if (type !== "student-referral") {
      await db.opportunity.create({
        data: {
          contactId: contact.id,
          inquiryId: inquiry.id,
          title: `${type.replace(/-/g, " ")} — ${contact.fullName}`,
          stage: "new",
          priority: "medium",
        },
      });
    } else {
      // route student referral to ALO Education pipeline
      await db.studentReferral.create({
        data: {
          contactId: contact.id,
          inquiryId: inquiry.id,
          studentName: fullName,
          interestCountry: body.country ? String(body.country) : null,
          consent: !!body.studentDataConsent,
          stage: "consent-confirmed",
        },
      });
    }

    // create follow-up task
    await db.task.create({
      data: {
        title: `Follow up: ${contact.fullName} (${reference})`,
        description: `Inquiry type: ${type}. Acknowledge within one business day via ${body.preferredChannel || "email"}.`,
        priority: "medium",
        status: "open",
        contactId: contact.id,
        relatedType: "inquiry",
        relatedId: inquiry.id,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // audit log
    await db.auditLog.create({
      data: {
        action: "inquiry.created",
        resource: "inquiry",
        resourceId: inquiry.id,
        meta: JSON.stringify({ reference, type, duplicate }),
        ipHash: hash,
      },
    });

    // Send confirmation email to the inquirer + internal notification.
    // Email failures are logged but never crash the inquiry submission.
    await sendTransactional(
      "inquiryConfirmation",
      { name: fullName, reference, inquiryType: type, email },
      { to: email, ipHash: hash, triggeredBy: "inquiry.created", skipLog: false }
    ).catch(() => null);

    await sendTransactional(
      "inquiryReceivedInternal",
      {
        reference,
        name: fullName,
        email,
        inquiryType: type,
        currentChallenge: body.currentChallenge ? String(body.currentChallenge) : null,
        organization: body.organization ? String(body.organization) : null,
      },
      {
        to: "hello@alaminn.info",
        bcc: "system@alaminn.info",
        ipHash: hash,
        triggeredBy: "inquiry.created",
        skipLog: false,
      }
    ).catch(() => null);

    return ok(
      { reference, status: inquiry.status, duplicate, expectedResponse: "Acknowledgement within one business day" },
      "Inquiry received."
    );
  } catch (e) {
    // errorId = request ID, so support staff can locate the exact log
    // lines for this failure without revealing the underlying exception.
    const errorId = getRequestId() ?? undefined;
    logger.error("inquiries.create_failed", { error: e });
    return NextResponse.json(
      {
        success: false,
        message: "Internal error.",
        data: null,
        meta: errorId ? { errorId } : {},
        errors: ["server_error"],
      },
      { status: 500 }
    );
  }
});
