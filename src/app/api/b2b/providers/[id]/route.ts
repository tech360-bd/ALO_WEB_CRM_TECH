import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { canViewB2B, canManageB2B } from '@/lib/application-manager/service';

export const GET = withAuth(async (req, auth, { params }: any) => {
  if (!canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B provider access requires application.view_b2b permission' }, { status: 403 });
  }

  const provider = await db.b2bProvider.findUnique({
    where: { id: params.id },
    include: { b2bApplications: { include: { application: true }, orderBy: { createdAt: 'desc' }, take: 20 } },
  });
  if (!provider) return NextResponse.json({ success: false, error: 'B2B provider not found' }, { status: 404 });

  const canManage = canManageB2B(auth.roles, auth.permissions);
  if (!canManage) {
    const { loginNote, commissionRule, paymentCondition, internalNote, email, phone, portalUrl, ...safe } = provider as any;
    return NextResponse.json({ success: true, data: safe, provider: safe });
  }

  await logAuditAction(auth, 'VIEW_B2B_PROVIDER', 'B2bProvider', params.id);
  return NextResponse.json({ success: true, data: provider, provider });
});

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  if (!canManageB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B provider update requires application.manage_b2b_providers permission' }, { status: 403 });
  }

  const body = await req.json();
  const existing = await db.b2bProvider.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'B2B provider not found' }, { status: 404 });

  const record = await db.b2bProvider.update({
    where: { id: params.id },
    data: {
      name: body.name ?? existing.name,
      providerType: body.providerType ?? existing.providerType,
      countryCoverage: body.countryCoverage ?? existing.countryCoverage,
      universityCoverage: body.universityCoverage ?? existing.universityCoverage,
      contactPerson: body.contactPerson ?? existing.contactPerson,
      email: body.email ?? existing.email,
      phone: body.phone ?? existing.phone,
      portalUrl: body.portalUrl ?? existing.portalUrl,
      loginNote: body.loginNote ?? existing.loginNote,
      agreementFile: body.agreementFile ?? existing.agreementFile,
      commissionRule: body.commissionRule ?? existing.commissionRule,
      paymentCondition: body.paymentCondition ?? existing.paymentCondition,
      claimStage: body.claimStage ?? existing.claimStage,
      status: body.status ?? existing.status,
      internalNote: body.internalNote ?? existing.internalNote,
      lastReviewedAt: new Date(),
    },
  });

  await logAuditAction(auth, 'UPDATE_B2B_PROVIDER', 'B2bProvider', params.id);
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'UPDATE_B2B_PROVIDER',
      resource: 'B2bProvider',
      resourceId: params.id,
      details: JSON.stringify({ updatedFields: Object.keys(body) }),
      actorRole: auth.roles[0] || '',
      beforeValue: JSON.stringify(existing),
      afterValue: JSON.stringify(record),
    },
  });

  return NextResponse.json({ success: true, data: record, provider: record });
});

export const DELETE = withAuth(async (req, auth, { params }: any) => {
  if (!canManageB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const existing = await db.b2bProvider.findUnique({ where: { id: params.id }, include: { _count: { select: { b2bApplications: true } } } });
  if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  if (existing._count.b2bApplications > 0) {
    return NextResponse.json({ success: false, error: 'Cannot delete provider with existing B2B applications. Archive instead.' }, { status: 400 });
  }

  await db.b2bProvider.delete({ where: { id: params.id } });
  await logAuditAction(auth, 'DELETE_B2B_PROVIDER', 'B2bProvider', params.id);
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'DELETE_B2B_PROVIDER',
      resource: 'B2bProvider',
      resourceId: params.id,
      details: JSON.stringify({ name: existing.name }),
      actorRole: auth.roles[0] || '',
    },
  });

  return NextResponse.json({ success: true, message: 'B2B provider deleted' });
});
