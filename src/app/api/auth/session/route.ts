import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return NextResponse.json({ success: false, user: null, authenticated: false }, { status: 200 });
    }
    const auth = authResult;
    const user = await db.portalUser.findUnique({
      where: { id: auth.userId },
      select: {
        id: true, email: true, name: true, userType: true, status: true,
        roles: { select: { role: { select: { name: true, label: true } } } }
      }
    });
    return NextResponse.json({
      success: true,
      authenticated: true,
      user,
      session: { id: auth.sessionId, userId: auth.userId, roles: auth.roles, permissions: auth.permissions }
    });
  } catch (e) {
    return NextResponse.json({ success: false, user: null, authenticated: false }, { status: 200 });
  }
}

export async function POST(request: Request) {
  return NextResponse.json({ success: false, error: "Use /api/portal-auth/login" }, { status: 405 });
}

