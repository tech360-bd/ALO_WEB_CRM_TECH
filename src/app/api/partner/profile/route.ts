import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || new URL(origin).origin === new URL(request.url).origin;
}

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const profile = await db.partnerProfile.findUnique({ where: { userId: auth.userId } });
    if (!profile) return NextResponse.json({ success: false, error: 'Partner profile not found.' }, { status: 404 });

    const [studentCount, leadCount, applicationCount, user] = await Promise.all([
      db.portalStudentProfile.count({ where: { partnerId: profile.partnerId } }),
      db.partnerLead.count({ where: { partnerId: profile.partnerId } }),
      db.portalStudentApplication.count({ where: { studentProfile: { partnerId: profile.partnerId } } }),
      db.portalUser.findUnique({ where: { id: auth.userId }, select: { email: true, phone: true } }),
    ]);

    return NextResponse.json({
      success: true,
      profile: {
        partnerId: profile.partnerId,
        companyName: profile.companyName,
        contactPerson: profile.contactPerson,
        businessType: profile.businessType,
        city: profile.city,
        address: profile.address,
        approvalStatus: profile.approvalStatus,
        totalLeads: leadCount,
        activeStudents: studentCount,
        studentCount,
        applicationCount,
      },
      user: { email: user?.email || '', phone: user?.phone || '' },
    });
  } catch (error) {
    console.error('[PARTNER PROFILE] GET error:', error);
    return NextResponse.json({ success: false, error: 'Partner profile could not be loaded.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: 'Cross-origin profile update denied.' }, { status: 403 });

  try {
    const body = await request.json().catch(() => ({}));
    const existing = await db.partnerProfile.findUnique({ where: { userId: auth.userId } });
    if (!existing) return NextResponse.json({ success: false, error: 'Partner profile not found.' }, { status: 404 });
    const existingUser = await db.portalUser.findUnique({ where: { id: auth.userId }, select: { email: true } });
    if (!existingUser) return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 });

    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : existing.companyName;
    const contactPerson = typeof body.contactPerson === 'string' ? body.contactPerson.trim() : existing.contactPerson;
    const businessType = typeof body.businessType === 'string' ? body.businessType.trim() : existing.businessType;
    const city = typeof body.city === 'string' ? body.city.trim() : existing.city;
    const address = typeof body.address === 'string' ? body.address.trim() : existing.address;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

    if (!companyName || companyName.length > 200 || contactPerson.length > 200 || businessType.length > 100 || city.length > 100 || address.length > 1000 || phone.length > 40) {
      return NextResponse.json({ success: false, error: 'One or more profile fields are missing or exceed allowed length.' }, { status: 400 });
    }
    if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (email && email !== existingUser.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Email changes require verification in Partner Settings.' }, { status: 409 });
    }

    try {
      const [updatedProfile, updatedUser] = await db.$transaction(async (tx) => {
        const savedProfile = await tx.partnerProfile.update({
          where: { userId: auth.userId },
          data: { companyName, contactPerson, businessType, city, address, updatedAt: new Date() },
        });
        const savedUser = email || body.phone !== undefined
          ? await tx.portalUser.update({
              where: { id: auth.userId },
              data: { ...(email ? { email } : {}), ...(body.phone !== undefined ? { phone } : {}) },
              select: { email: true, phone: true },
            })
          : null;
        return [savedProfile, savedUser] as const;
      });
      return NextResponse.json({ success: true, profile: updatedProfile, user: updatedUser });
    } catch (error: any) {
      if (error?.code === 'P2002') return NextResponse.json({ success: false, error: 'That email address is already used by another account.' }, { status: 409 });
      throw error;
    }
  } catch (error) {
    console.error('[PARTNER PROFILE] PUT error:', error);
    return NextResponse.json({ success: false, error: 'Partner profile could not be updated.' }, { status: 500 });
  }
}
