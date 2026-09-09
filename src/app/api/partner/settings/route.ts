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
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const marketingQuota = await db.partnerMarketingQuota.findUnique({
      where: { partnerId: profile.partnerId },
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const marketingUsage = await db.partnerMarketingUsage.findFirst({
      where: { partnerId: profile.partnerId, monthYear: currentMonth },
    });

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          partnerId: profile.partnerId,
          companyName: profile.companyName,
          contactPerson: profile.contactPerson,
          city: profile.city,
          address: profile.address,
          approvalStatus: profile.approvalStatus,
          totalLeads: profile.totalLeads,
          activeStudents: profile.activeStudents,
          commissionPending: profile.commissionPending,
          commissionPaid: profile.commissionPaid,
        },
        marketingQuota: marketingQuota
          ? {
              monthlyImageLimit: marketingQuota.monthlyImageLimit,
              monthlyVideoLimit: marketingQuota.monthlyVideoLimit,
              videoDurationLimitSeconds: marketingQuota.videoDurationLimitSeconds,
              autoPublishAllowed: marketingQuota.autoPublishAllowed,
              requiresAloApproval: marketingQuota.requiresAloApproval,
              status: marketingQuota.status,
            }
          : null,
        marketingUsage: {
          monthYear: currentMonth,
          imagesUsed: marketingUsage?.imagesUsed ?? 0,
          videosUsed: marketingUsage?.videosUsed ?? 0,
          ideasSubmitted: marketingUsage?.ideasSubmitted ?? 0,
          postsScheduled: marketingUsage?.postsScheduled ?? 0,
          postsPublished: marketingUsage?.postsPublished ?? 0,
        },
      },
    });
  } catch (error) {
    console.error('[PARTNER SETTINGS] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth || auth instanceof NextResponse) {
    return auth instanceof NextResponse ? auth : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { emailNotifications, smsNotifications, whatsappNotifications, inAppNotifications } = body;

    await db.partnerProfile.update({
      where: { userId: auth.userId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Settings updated',
      preferences: {
        emailNotifications: emailNotifications ?? true,
        smsNotifications: smsNotifications ?? true,
        whatsappNotifications: whatsappNotifications ?? false,
        inAppNotifications: inAppNotifications ?? true,
      },
    });
  } catch (error) {
    console.error('[PARTNER SETTINGS] POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth || auth instanceof NextResponse) {
    return auth instanceof NextResponse ? auth : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { companyName, contactPerson, email, phone, address } = body;

    const existing = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    const profileUpdateData: Record<string, unknown> = { updatedAt: new Date() };
    if (companyName !== undefined) profileUpdateData.companyName = companyName;
    if (contactPerson !== undefined) profileUpdateData.contactPerson = contactPerson;
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

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('[PARTNER SETTINGS] PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
