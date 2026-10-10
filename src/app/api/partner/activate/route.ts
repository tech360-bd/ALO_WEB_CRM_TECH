import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!/^[a-f0-9]{64}$/.test(token) || password.length < 10 || password.length > 128) {
    return NextResponse.json({ success: false, error: 'A valid invitation and a password of 10–128 characters are required.' }, { status: 400 });
  }
  const tokenHash = createHash('sha256').update(`partner-activation:${token}`).digest('hex');
  try {
    const invitation = await db.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!invitation || invitation.used || invitation.expiresAt <= new Date()) return NextResponse.json({ success: false, error: 'Invitation is invalid or expired. Request a new invitation.' }, { status: 400 });
    const user = await db.portalUser.findFirst({ where: { id: invitation.userId, userType: 'PARTNER', status: 'pending_activation', partnerProfile: { approvalStatus: { in: ['approved', 'active'] } } } });
    if (!user) return NextResponse.json({ success: false, error: 'This invitation cannot activate the account.' }, { status: 403 });
    const passwordHash = await bcrypt.hash(password, 12);
    const activated = await db.$transaction(async tx => {
      const claimed = await tx.passwordResetToken.updateMany({ where: { id: invitation.id, used: false, expiresAt: { gt: new Date() } }, data: { used: true, usedAt: new Date() } });
      if (claimed.count !== 1) return false;
      const changed = await tx.portalUser.updateMany({ where: { id: user.id, status: 'pending_activation' }, data: { passwordHash, emailVerified: true, status: 'active' } });
      if (changed.count !== 1) throw new Error('Account state changed during activation');
      await tx.portalAuditLog.create({ data: { actorUserId: user.id, action: 'PARTNER_ACCOUNT_ACTIVATED', entityType: 'PortalUser', entityId: user.id } });
      return true;
    });
    return NextResponse.json(activated ? { success: true, message: 'Account activated. You can now sign in.' } : { success: false, error: 'Invitation has already been used.' }, { status: activated ? 200 : 409 });
  } catch { return NextResponse.json({ success: false, error: 'Account activation is temporarily unavailable.' }, { status: 503 }); }
}
