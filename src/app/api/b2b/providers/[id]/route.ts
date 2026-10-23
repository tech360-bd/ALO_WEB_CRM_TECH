import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import {
  canViewB2B,
  canManageB2B,
  canViewB2BCommission,
  sanitizeB2BProvider,
} from '@/lib/application-manager/service';
import { encryptToken } from '@/lib/token-encryption';

function isPartner(auth: { partnerId?: string; userType: string; roles: string[] }): boolean {
  return Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || auth.roles.some((role) => role.toLowerCase().startsWith('partner')));
}

const providerPatchSchema = z.object({
  providerCode: z.string().trim().max(191).optional(),
  name: z.string().trim().min(1).max(191).optional(),
  providerType: z.string().trim().min(1).max(191).optional(),
  countryCoverage: z.union([z.string().max(10000), z.array(z.string().trim().max(191)).max(500)]).optional(),
  universityCoverage: z.union([z.string().max(10000), z.array(z.string().trim().max(191)).max(500)]).optional(),
  contactPerson: z.string().max(191).optional(),
  email: z.string().max(191).optional(),
  phone: z.string().max(80).optional(),
  portalUrl: z.string().max(2000).optional(),
  loginNote: z.string().max(10000).optional(),
  clearLoginNote: z.boolean().optional(),
  agreementFile: z.string().max(0).optional(),
  commissionRule: z.string().max(10000).optional(),
  paymentCondition: z.string().max(10000).optional(),
  claimStage: z.string().max(191).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'APPROVED']).optional(),
  internalNote: z.string().max(10000).optional(),
}).strict();

function coverageValue(value: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'string') return value;
  return fallback;
}

export const GET = withAuth(async (_req, auth, { params }: any) => {
  if (isPartner(auth) || !canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B provider access requires an authorized ALO-side B2B permission.' }, { status: 403 });
  }

  try {
    const provider = await db.b2bProvider.findUnique({
      where: { id: params.id },
      include: {
        b2bApplications: {
          include: {
            application: {
              select: { id: true, applicationCode: true, studentId: true, universityName: true, courseName: true, country: true, intake: true, stage: true, safeStatus: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!provider) return NextResponse.json({ success: false, error: 'B2B provider not found.' }, { status: 404 });

    await logAuditAction(auth, 'VIEW_B2B_PROVIDER', 'B2bProvider', params.id);
    const safeProvider = sanitizeB2BProvider(provider as any, canViewB2BCommission(auth.roles, auth.permissions));
    return NextResponse.json({ success: true, data: safeProvider, provider: safeProvider });
  } catch (error) {
    console.error('[b2b.providers.get] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'B2B provider is temporarily unavailable.' }, { status: 503 });
  }
});

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  if (isPartner(auth) || !canManageB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B provider update requires an authorized ALO-side permission.' }, { status: 403 });
  }

  const parsed = providerPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid B2B provider update.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);
  if (!canViewCommission && [body.commissionRule, body.paymentCondition, body.claimStage].some((value) => Boolean(value?.trim()))) {
    return NextResponse.json({ success: false, error: 'B2B commission policy updates require application.view_b2b_commission permission.' }, { status: 403 });
  }
  if (body.agreementFile) return NextResponse.json({ success: false, error: 'Agreement paths or external URLs are not accepted; use an authorized private document workflow.' }, { status: 400 });
  if (body.portalUrl) {
    try {
      if (new URL(body.portalUrl).protocol !== 'https:') throw new Error('https required');
    } catch {
      return NextResponse.json({ success: false, error: 'portalUrl must be a valid HTTPS URL.' }, { status: 400 });
    }
  }
  if (body.clearLoginNote && body.loginNote) {
    return NextResponse.json({ success: false, error: 'Do not submit a replacement credential and clearLoginNote together.' }, { status: 400 });
  }

  try {
    const existing = await db.b2bProvider.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ success: false, error: 'B2B provider not found.' }, { status: 404 });

    const data: Record<string, unknown> = {};
    for (const field of ['providerCode', 'name', 'providerType', 'contactPerson', 'email', 'phone', 'portalUrl', 'status', 'internalNote'] as const) {
      if (body[field] !== undefined) data[field] = body[field];
    }
    if (canViewCommission) {
      for (const field of ['commissionRule', 'paymentCondition', 'claimStage'] as const) {
        if (body[field] !== undefined) data[field] = body[field];
      }
    }
    if (body.countryCoverage !== undefined) data.countryCoverage = coverageValue(body.countryCoverage, existing.countryCoverage);
    if (body.universityCoverage !== undefined) data.universityCoverage = coverageValue(body.universityCoverage, existing.universityCoverage);
    if (body.clearLoginNote) data.loginNote = '';
    else if (body.loginNote) data.loginNote = encryptToken(body.loginNote);
    data.lastReviewedAt = new Date();

    const provider = await db.b2bProvider.update({ where: { id: params.id }, data });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UPDATE_B2B_PROVIDER',
        resource: 'B2bProvider',
        resourceId: params.id,
        details: JSON.stringify({ updatedFields: Object.keys(data).filter((field) => field !== 'loginNote'), credentialChanged: Boolean(body.loginNote || body.clearLoginNote) }),
        actorRole: auth.roles[0] || '',
      },
    });
    await logAuditAction(auth, 'UPDATE_B2B_PROVIDER', 'B2bProvider', params.id, { updatedFields: Object.keys(data).filter((field) => field !== 'loginNote'), credentialChanged: Boolean(body.loginNote || body.clearLoginNote) });

    const safeProvider = sanitizeB2BProvider(provider as any, canViewB2BCommission(auth.roles, auth.permissions));
    return NextResponse.json({ success: true, data: safeProvider, provider: safeProvider, message: 'B2B provider updated.' });
  } catch (error) {
    console.error('[b2b.providers.update] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'B2B provider could not be updated.' }, { status: 503 });
  }
});

export const DELETE = withAuth(async (_req, auth, { params }: any) => {
  if (isPartner(auth) || !canManageB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B provider management permission required.' }, { status: 403 });
  }

  try {
    const existing = await db.b2bProvider.findUnique({ where: { id: params.id }, include: { _count: { select: { b2bApplications: true } } } });
    if (!existing) return NextResponse.json({ success: false, error: 'B2B provider not found.' }, { status: 404 });
    if (existing._count.b2bApplications > 0) {
      return NextResponse.json({ success: false, error: 'Cannot delete a provider with linked applications. Deactivate it instead.' }, { status: 409 });
    }

    await db.b2bProvider.delete({ where: { id: params.id } });
    await logAuditAction(auth, 'DELETE_B2B_PROVIDER', 'B2bProvider', params.id, { providerCode: existing.providerCode });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'DELETE_B2B_PROVIDER',
        resource: 'B2bProvider',
        resourceId: params.id,
        details: JSON.stringify({ providerCode: existing.providerCode }),
        actorRole: auth.roles[0] || '',
      },
    });
    return NextResponse.json({ success: true, message: 'B2B provider deleted.' });
  } catch (error) {
    console.error('[b2b.providers.delete] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'B2B provider could not be deleted.' }, { status: 503 });
  }
});
