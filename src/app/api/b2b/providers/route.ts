import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { canViewB2B, canManageB2B } from '@/lib/application-manager/service';

export const GET = withAuth(async (req, auth) => {
  if (!canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B provider access requires application.view_b2b permission' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const country = searchParams.get('country');

  const where: any = {};
  if (type) where.providerType = type;
  if (status) where.status = status;
  if (country) where.countryCoverage = { contains: country };

  const records = await db.b2bProvider.findMany({
    where,
    include: { _count: { select: { b2bApplications: true } } },
    orderBy: { name: 'asc' },
  });

  // Strip sensitive fields for non-managers
  const canManage = canManageB2B(auth.roles, auth.permissions);
  const sanitized = records.map((p: any) => {
    if (canManage) return p;
    const { loginNote, commissionRule, paymentCondition, internalNote, email, phone, portalUrl, ...safe } = p;
    return safe;
  });

  await logAuditAction(auth, 'VIEW_B2B_PROVIDERS', 'B2bProvider', 'list');
  return NextResponse.json({ success: true, data: sanitized, providers: sanitized });
});

export const POST = withAuth(async (req, auth) => {
  if (!canManageB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B provider creation requires application.manage_b2b_providers permission' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name) return NextResponse.json({ success: false, error: 'Provider name required' }, { status: 400 });

  const providerCode = body.providerCode || `B2B-${body.providerType?.substring(0,3) || 'GEN'}-${Math.floor(Math.random()*90000)+10000}`;

  const record = await db.b2bProvider.create({
    data: {
      providerCode,
      name: body.name,
      providerType: body.providerType || 'GLOBAL_B2B',
      countryCoverage: body.countryCoverage || JSON.stringify(body.countryCoverageArray || []),
      universityCoverage: body.universityCoverage || JSON.stringify(body.universityCoverageArray || []),
      contactPerson: body.contactPerson || '',
      email: body.email || '',
      phone: body.phone || '',
      portalUrl: body.portalUrl || '',
      loginNote: body.loginNote || '', // Encrypted storage in production — never return in normal response
      agreementFile: body.agreementFile || '',
      commissionRule: body.commissionRule || '',
      paymentCondition: body.paymentCondition || '',
      claimStage: body.claimStage || 'NOT_CLAIMED',
      status: body.status || 'ACTIVE',
      createdBy: auth.userId,
      lastReviewedAt: new Date(),
      internalNote: body.internalNote || '',
    },
  });

  await logAuditAction(auth, 'CREATE_B2B_PROVIDER', 'B2bProvider', record.id);
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'CREATE_B2B_PROVIDER',
      resource: 'B2bProvider',
      resourceId: record.id,
      details: JSON.stringify({ name: body.name, providerType: body.providerType }),
      actorRole: auth.roles[0] || '',
    },
  });

  return NextResponse.json({ success: true, data: record, provider: record, message: 'B2B provider created' });
});
