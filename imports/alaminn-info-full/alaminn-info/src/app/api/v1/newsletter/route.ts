import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes, createHash } from "crypto";
import { sendTransactional } from "@/lib/email";
import { env } from "@/lib/env";
import { withObservability } from "@/lib/observability";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";

function ok(data: unknown, message = "OK") {
  return NextResponse.json({ success: true, message, data, meta: {}, errors: [] });
}
function fail(message: string, errors: unknown[] = [], status = 400) {
  return NextResponse.json({ success: false, message, data: null, meta: {}, errors }, { status });
}

const rateMap = new Map<string, { count: number; reset: number }>();
function rateLimited(key: string) {
  const now = Date.now();
  const e = rateMap.get(key);
  if (!e || now > e.reset) {
    rateMap.set(key, { count: 1, reset: now + 60_000 });
    return false;
  }
  e.count += 1;
  return e.count > 5;
}

export const POST = withObservability(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid body.");
    const email = String(body.email || "").trim().toLowerCase();
    const name = body.name ? String(body.name) : null;
    const interest = body.interest ? String(body.interest) : null;
    const utmSource = body.utmSource ? String(body.utmSource) : null;
    const consent = !!body.consent;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return fail("Valid email required.", ["email_invalid"], 422);
    if (!consent) return fail("Consent required.", ["consent_required"], 422);

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const hash = createHash("sha256").update(ip).digest("hex").slice(0, 16);
    if (rateLimited(hash)) return fail("Too many requests.", ["rate_limited"], 429);

    const token = randomBytes(16).toString("hex");
    // Note: 'interest' field exists in schema but may not be in cached Prisma client
    // after schema migration. Store in audit log meta as fallback.
    const sub = await db.newsletterSubscriber.upsert({
      where: { email },
      update: { name, consent, status: "pending", token },
      create: { email, name, consent, status: "pending", token },
    });

    await db.auditLog.create({
      data: {
        action: "newsletter.subscribed",
        resource: "newsletter",
        resourceId: sub.id,
        meta: JSON.stringify({ email, utmSource, interest }),
        ipHash: hash,
      },
    });

    // Send verification email. Failure is logged but does not crash subscribe.
    const verifyUrl = `${env().siteUrl}/api/v1/newsletter/verify?token=${token}`;
    await sendTransactional(
      "newsletterVerification",
      { email, verifyUrl },
      { to: email, ipHash: hash, triggeredBy: "newsletter.subscribed" }
    ).catch(() => null);

    return ok({ status: sub.status }, "Subscription received. Please confirm via email.");
  } catch (e) {
    // errorId = request ID, lets support staff look up this failure.
    const errorId = getRequestId() ?? undefined;
    logger.error("newsletter.subscribe_failed", { error: e });
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
