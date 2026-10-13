import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

function ok(message = "Signed out.") {
  return NextResponse.json({ success: true, message, data: null, meta: {}, errors: [] });
}

function ipHash(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/**
 * POST /api/v1/auth/logout
 * Clears the session cookie and logs the event.
 */
export async function POST(req: NextRequest) {
  try {
    // Best-effort audit log (we don't strictly need a session here)
    const { getSessionFromRequest } = await import("@/lib/auth");
    const session = getSessionFromRequest(req);
    if (session) {
      try {
        await db.auditLog.create({
          data: {
            actorId: session.userId,
            action: "auth.logout",
            resource: "user",
            resourceId: session.userId,
            meta: JSON.stringify({ role: session.role }),
            ipHash: ipHash(req),
          },
        });
      } catch {
        // no-op — audit log failure must not block logout
      }
    }
    await clearSessionCookie();
    return ok();
  } catch (e) {
    console.error("[auth/logout] error", e);
    // Still clear the cookie even if audit fails
    await clearSessionCookie();
    return ok();
  }
}
