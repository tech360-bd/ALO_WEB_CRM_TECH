import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, comparePassword } from '@/lib/auth';
import { requireAuth } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';
import { validatePassword } from '@/app/api/auth/reset-password/route';

// ============================================================
// CHANGE PASSWORD API (logged-in user)
// POST /api/auth/change-password
// Auth required — verifies the current password before setting
// the new one. Clears forcePasswordChange on success.
// ============================================================

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const ip = request.headers.get('x-forwarded-for') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json().catch(() => ({}));
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from the current password' },
        { status: 400 }
      );
    }

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      return NextResponse.json({ error: pwdError }, { status: 400 });
    }

    // Fetch the user's current password hash.
    const user = await db.user.findUnique({
      where: { id: auth.user.id },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const matches = await comparePassword(currentPassword, user.password);
    if (!matches) {
      await logAudit({
        userId: auth.user.id,
        action: 'auth.password_change_failed',
        module: 'auth',
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await db.user.update({
      where: { id: auth.user.id },
      data: {
        password: passwordHash,
        forcePasswordChange: false,
      },
    });

    await logAudit({
      userId: auth.user.id,
      action: 'auth.password_changed',
      module: 'auth',
      ip,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[change-password] POST error:', error);
    return NextResponse.json(
      { error: 'Password change failed' },
      { status: 500 }
    );
  }
}
