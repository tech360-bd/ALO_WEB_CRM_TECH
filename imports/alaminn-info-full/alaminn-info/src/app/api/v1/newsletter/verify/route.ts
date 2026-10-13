/**
 * Newsletter verification endpoint.
 * GET /api/v1/newsletter/verify?token=xxx
 * Confirms a subscriber's email and sends a welcome email.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTransactional } from "@/lib/email";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || !/^[a-f0-9]{32}$/i.test(token)) {
    return NextResponse.redirect(
      `${env().siteUrl}/#newsletter?verified=0&error=invalid_token`
    );
  }

  try {
    const sub = await db.newsletterSubscriber.findFirst({
      where: { token, status: "pending" },
    });
    if (!sub) {
      return NextResponse.redirect(
        `${env().siteUrl}/#newsletter?verified=0&error=not_found`
      );
    }

    await db.newsletterSubscriber.update({
      where: { id: sub.id },
      data: { status: "confirmed", token: null },
    });

    await db.auditLog.create({
      data: {
        action: "newsletter.confirmed",
        resource: "newsletter",
        resourceId: sub.id,
        meta: JSON.stringify({ email: sub.email }),
      },
    });

    // Send welcome email. Failure is logged but doesn't block verification.
    await sendTransactional(
      "newsletterWelcome",
      { name: sub.name, email: sub.email },
      { to: sub.email, triggeredBy: "newsletter.confirmed" }
    ).catch(() => null);

    return NextResponse.redirect(
      `${env().siteUrl}/#newsletter?verified=1`
    );
  } catch (e) {
    console.error("[newsletter/verify] error", e);
    return NextResponse.redirect(
      `${env().siteUrl}/#newsletter?verified=0&error=server`
    );
  }
}
