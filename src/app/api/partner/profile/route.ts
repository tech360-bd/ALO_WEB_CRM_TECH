import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth || auth instanceof NextResponse) {
    return auth instanceof NextResponse ? auth : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    // Get student count
    const studentCount = await db.partnerLead.count({
      where: { partnerId: profile.partnerId },
    });

    const applicationCount = await db.portalStudentApplication.count({
      where: {
        studentProfile: { partnerId: profile.partnerId },
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        studentCount,
        applicationCount,
      },
    });
  } catch (error) {
    console.error('[PARTNER PROFILE] GET error:', error);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth || auth instanceof NextResponse) {
    return auth instanceof NextResponse ? auth : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existing = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { companyName, contactPerson, businessType, city, address, email, phone } = body;

    const profileUpdateData: Record<string, unknown> = { updatedAt: new Date() };
    if (companyName !== undefined) profileUpdateData.companyName = companyName;
    if (contactPerson !== undefined) profileUpdateData.contactPerson = contactPerson;
    if (businessType !== undefined) profileUpdateData.businessType = businessType;
    if (city !== undefined) profileUpdateData.city = city;
    if (address !== undefined) profileUpdateData.address = address;

    const updatePromises: Promise<unknown>[] = [
      db.partnerProfile.update({
        where: { userId: auth.userId },
        data: profileUpdateData,
      }),
    ];

    if (email || phone) {
      updatePromises.push(
        db.portalUser.update({
          where: { id: auth.userId },
          data: {
            ...(email ? { email } : {}),
            ...(phone ? { phone } : {}),
          },
        })
      );
    }

    const [updatedProfile] = await Promise.all(updatePromises);

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error('[PARTNER PROFILE] PUT error:', error);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}
