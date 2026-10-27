// GET /api/super-admin/acting-as/current
//
// Returns the Acting-As context resolved server-side by the auth middleware.
// The client never asserts its own effective identity; it only renders what
// the server already authorised for this request.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { isActingAs, isSuperAdmin } from '@/lib/super-admin/access';

export const dynamic = 'force-dynamic';

async function handleGet(_request: Request, auth: AuthContext) {
  if (!isSuperAdmin(auth)) {
    return NextResponse.json({ success: false, error: 'SUPER_ADMIN role required.' }, { status: 403 });
  }

  if (!isActingAs(auth)) {
    return NextResponse.json({
      success: true,
      active: false,
      realActor: { userId: auth.actorUserId, email: auth.actorEmail, name: auth.actorName },
    });
  }

  const employee = await db.employee.findUnique({
    where: { userId: auth.userId },
    select: { id: true, employeeId: true, name: true, role: true, department: true, branch: true },
  }).catch(() => null);

  return NextResponse.json({
    success: true,
    active: true,
    realActor: { userId: auth.actorUserId, email: auth.actorEmail, name: auth.actorName },
    actingAs: {
      userId: auth.userId,
      email: auth.email,
      name: auth.name,
      role: auth.actingAsRole || auth.userType,
      sessionId: auth.actingAsSessionId || null,
      expiresAt: auth.actingAsExpiresAt?.toISOString() || null,
      employee,
    },
  });
}

export const GET = withAuth(handleGet);
