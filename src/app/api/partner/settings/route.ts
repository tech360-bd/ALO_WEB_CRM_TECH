import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function isBoolRecord(value: unknown, keys: string[]): Record<string, boolean> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const result: Record<string, boolean> = {};
  for (const key of keys) {
    if (typeof source[key] !== 'boolean') return null;
    result[key] = source[key] as boolean;
  }
  return result;
}

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const [profile, user, storedPreferences] = await Promise.all([
      db.partnerProfile.findUnique({ where: { userId: auth.userId } }),
      db.portalUser.findUnique({ where: { id: auth.userId }, select: { email: true, phone: true } }),
      db.communicationPreference.findFirst({ where: { ownerType: 'partner', ownerId: auth.userId } }),
    ]);
    if (!profile) return NextResponse.json({ success: false, error: 'Partner profile not found.' }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          partnerId: profile.partnerId,
          companyName: profile.companyName,
          contactPerson: profile.contactPerson,
          businessType: profile.businessType,
          city: profile.city,
          address: profile.address,
          approvalStatus: profile.approvalStatus,
        },
        user: { email: user?.email || '', phone: user?.phone || '' },
        preferences: {
          emailAllowed: storedPreferences?.emailAllowed ?? true,
          smsAllowed: storedPreferences?.smsAllowed ?? true,
          whatsappAllowed: storedPreferences?.whatsappAllowed ?? false,
          phoneAllowed: storedPreferences?.phoneAllowed ?? true,
          marketingAllowed: storedPreferences?.marketingAllowed ?? true,
          transactionalAllowed: storedPreferences?.transactionalAllowed ?? true,
        },
      },
    });
  } catch (error) {
    console.error('[PARTNER SETTINGS] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load partner settings.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: 'Cross-origin settings mutation denied.' }, { status: 403 });

  try {
    const body = await request.json().catch(() => ({}));
    const section = typeof body.section === 'string' ? body.section : '';
    const data = body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : body;
    const profile = await db.partnerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ success: false, error: 'Partner profile not found.' }, { status: 404 });

    if (section === 'account') {
      const companyName = typeof data.companyName === 'string' ? data.companyName.trim() : '';
      const contactPerson = typeof data.contactPerson === 'string' ? data.contactPerson.trim() : profile.contactPerson;
      const address = typeof data.address === 'string' ? data.address.trim() : profile.address;
      const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
      const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
      if (!companyName || companyName.length > 200) return NextResponse.json({ success: false, error: 'Company name is required and must be 200 characters or fewer.' }, { status: 400 });
      if (contactPerson.length > 200 || address.length > 1000 || phone.length > 40) return NextResponse.json({ success: false, error: 'One or more account fields exceed the allowed length.' }, { status: 400 });
      if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
      const currentUser = await db.portalUser.findUnique({ where: { id: auth.userId }, select: { email: true } });
      if (!currentUser) return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 });
      if (email !== currentUser.email.toLowerCase()) return NextResponse.json({ success: false, error: 'Email changes must be verified from the email-change section before saving account details.' }, { status: 409 });

      try {
        const [updatedProfile, updatedUser] = await db.$transaction([
          db.partnerProfile.update({ where: { userId: auth.userId }, data: { companyName, contactPerson, address, updatedAt: new Date() } }),
          db.portalUser.update({ where: { id: auth.userId }, data: { phone, updatedAt: new Date() }, select: { email: true, phone: true } }),
        ]);
        return NextResponse.json({ success: true, data: { profile: updatedProfile, user: updatedUser } });
      } catch (error: any) {
        if (error?.code === 'P2002') return NextResponse.json({ success: false, error: 'That email address is already used by another account.' }, { status: 409 });
        throw error;
      }
    }

    if (section === 'notifications') {
      const preferences = isBoolRecord(data, ['emailAllowed', 'smsAllowed', 'whatsappAllowed', 'phoneAllowed', 'marketingAllowed', 'transactionalAllowed']);
      if (!preferences) return NextResponse.json({ success: false, error: 'All notification channel preferences must be boolean values.' }, { status: 400 });
      const existing = await db.communicationPreference.findFirst({ where: { ownerType: 'partner', ownerId: auth.userId } });
      const saved = existing
        ? await db.communicationPreference.update({ where: { id: existing.id }, data: preferences })
        : await db.communicationPreference.create({ data: { ownerType: 'partner', ownerId: auth.userId, ...preferences, consentSource: 'partner_portal_settings' } });
      return NextResponse.json({ success: true, data: { preferences: saved } });
    }

    if (section === 'password') {
      const currentPassword = typeof data.currentPassword === 'string' ? data.currentPassword : '';
      const newPassword = typeof data.newPassword === 'string' ? data.newPassword : '';
      if (!currentPassword || newPassword.length < 8 || !/\d/.test(newPassword)) {
        return NextResponse.json({ success: false, error: 'Current password is required. New password must be at least 8 characters and include a number.' }, { status: 400 });
      }
      const user = await db.portalUser.findUnique({ where: { id: auth.userId } });
      if (!user) return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash || '').catch(() => false);
      if (!valid) return NextResponse.json({ success: false, error: 'Current password is incorrect.' }, { status: 400 });
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await db.$transaction([
        db.portalUser.update({ where: { id: auth.userId }, data: { passwordHash, firstLoginRequired: false } }),
        db.portalSession.updateMany({ where: { userId: auth.userId, id: { not: auth.sessionId }, revokedAt: null }, data: { revokedAt: new Date() } }),
      ]);
      return NextResponse.json({ success: true, message: 'Password updated. Other active sessions were revoked.' });
    }

    return NextResponse.json({ success: false, error: 'Unsupported settings section.' }, { status: 400 });
  } catch (error) {
    console.error('[PARTNER SETTINGS] PUT error:', error);
    return NextResponse.json({ success: false, error: 'Partner settings could not be saved.' }, { status: 500 });
  }
}
