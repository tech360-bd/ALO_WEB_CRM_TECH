import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { normalizeRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

function ok(data: unknown, message = "OK") {
  return NextResponse.json({ success: true, message, data, meta: {}, errors: [] });
}

/**
 * GET /api/v1/auth/session
 *
 * Returns the current redacted session (or 401 if not authenticated).
 * Used by the Command Center on mount to detect an existing valid
 * session cookie and skip the login form.
 */
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated.", data: null, meta: {}, errors: ["unauthenticated"] },
      { status: 401 }
    );
  }
  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true },
    });
    if (!user || user.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Session invalid.", data: null, meta: {}, errors: ["session_invalid"] },
        { status: 401 }
      );
    }
    const role = normalizeRole(user.role) ?? "VIEWER";
    return ok(
      {
        user: { id: user.id, email: user.email, name: user.name, role },
        expiresAt: session.expiresAt,
      },
      "Session active."
    );
  } catch (e) {
    console.error("[auth/session] error", e);
    return NextResponse.json(
      { success: false, message: "Session check failed.", data: null, meta: {}, errors: ["server_error"] },
      { status: 500 }
    );
  }
}
