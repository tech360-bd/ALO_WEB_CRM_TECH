import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/partner-admin/company
 * PUT /api/partner-admin/company
 *
 * Company profile self-service for partner_super_admin.
 * Tenant isolation:
 *  - userType === 'partner' → use auth.user.referenceId (own partnerId)
 *  - userType === 'employee' with super_admin → may pass ?partnerId=, else 403
 */
function resolvePartnerId(auth: { user: { userType: string; referenceId: string | null; roles?: { name: string }[] } }, request: NextRequest): { partnerId: string | null; error?: NextResponse } {
  if (auth.user.userType === 'partner') {
    if (!auth.user.referenceId) return { partnerId: null, error: NextResponse.json({ error: 'Partner record missing on user' }, { status: 400 }) };
    return { partnerId: auth.user.referenceId };
  }
  if (auth.user.userType === 'employee') {
    const userRoles = auth.user.roles?.map((r) => r.name) ?? [];
    if (userRoles.includes('super_admin')) {
      const qp = new URL(request.url).searchParams.get('partnerId');
      return { partnerId: qp || null };
    }
    return { partnerId: null, error: NextResponse.json({ error: 'Forbidden — insufficient role' }, { status: 403 }) };
  }
  return { partnerId: null, error: NextResponse.json({ error: 'Forbidden — insufficient role' }, { status: 403 }) };
}

const COMPANY_FIELDS = [
  'companyName', 'contactPerson', 'phone', 'whatsappNumber', 'address',
  'city', 'country', 'website', 'businessType', 'panNumber', 'gstNumber',
  'bankName', 'bankAccount', 'bankBranch', 'ifscCode', 'swiftCode',
] as const;

export async function GET(request: NextRequest) {
  const authOrResponse = await requireRole(request, ['partner_super_admin', 'super_admin']);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  try {
    const { partnerId, error } = resolvePartnerId(auth, request);
    if (error) return error;
    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId is required (use ?partnerId=)' }, { status: 400 });
    }

    const partner = await db.partner.findUnique({
      where: { id: partnerId },
      include: { partnerStaff: { select: { id: true, name: true, role: true, status: true }, orderBy: { createdAt: 'asc' } } },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner record not found' }, { status: 404 });
    }

    // Pull notification + branding preferences from Setting
    const [notifSetting, brandingSetting] = await Promise.all([
      db.setting.findUnique({ where: { key: `partner_notifications_${partnerId}` } }).catch(() => null),
      db.setting.findUnique({ where: { key: `partner_branding_${partnerId}` } }).catch(() => null),
    ]);

    return NextResponse.json({
      partner,
      notificationPreferences: notifSetting?.value ? JSON.parse(notifSetting.value) : {
        emailOnApplicationUpdate: true,
        emailOnCommissionStatus: true,
        weeklyDigest: true,
      },
      branding: brandingSetting?.value ? JSON.parse(brandingSetting.value) : {
        primaryColor: '#0057B8',
        accentColor: '#E8501A',
        logoUrl: null,
      },
    });
  } catch (error) {
    console.error('partner-admin/company GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authOrResponse = await requireRole(request, ['partner_super_admin', 'super_admin']);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  try {
    const { partnerId, error } = resolvePartnerId(auth, request);
    if (error) return error;
    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId is required (use ?partnerId=)' }, { status: 400 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    for (const key of COMPANY_FIELDS) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const oldPartner = await db.partner.findUnique({ where: { id: partnerId } });
    if (!oldPartner) {
      return NextResponse.json({ error: 'Partner record not found' }, { status: 404 });
    }

    let updated = oldPartner;
    if (Object.keys(updateData).length > 0) {
      updated = await db.partner.update({
        where: { id: partnerId },
        data: updateData,
      });
    }

    // Persist notification preferences + branding as Setting records
    if (body.notificationPreferences && typeof body.notificationPreferences === 'object') {
      await upsertSetting(`partner_notifications_${partnerId}`, JSON.stringify(body.notificationPreferences), 'partner_preferences');
    }
    if (body.branding && typeof body.branding === 'object') {
      await upsertSetting(`partner_branding_${partnerId}`, JSON.stringify(body.branding), 'partner_preferences');
    }

    await logAudit({
      userId: auth.user.id,
      action: 'partner_company_update',
      module: 'partner_admin',
      recordId: partnerId,
      oldData: oldPartner,
      newData: updated,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ partner: updated });
  } catch (error) {
    console.error('partner-admin/company PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function upsertSetting(key: string, value: string, group: string) {
  const existing = await db.setting.findUnique({ where: { key } }).catch(() => null);
  if (existing) {
    await db.setting.update({ where: { key }, data: { value } });
  } else {
    await db.setting.create({ data: { key, value, group } });
  }
}
