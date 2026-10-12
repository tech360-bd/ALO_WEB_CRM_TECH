import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";

export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return NextResponse.json({ success: false, user: null, authenticated: false }, { status: 200 });
    }
    const auth = authResult;
    return NextResponse.json({
      success: true,
      authenticated: true,
      user: { id:auth.userId, identityDomain:auth.identityDomain, email:auth.email, name:auth.name, userType:auth.userType },
      session: { userId: auth.userId, identityDomain:auth.identityDomain, roles: auth.roles, permissions: auth.permissions }
    }, {headers:{'Cache-Control':'private, no-store'}});
  } catch (e) {
    return NextResponse.json({ success: false, user: null, authenticated: false }, { status: 200 });
  }
}

export async function POST(request: Request) {
  return NextResponse.json({ success: false, error: "Use /api/portal-auth/login" }, { status: 405 });
}

