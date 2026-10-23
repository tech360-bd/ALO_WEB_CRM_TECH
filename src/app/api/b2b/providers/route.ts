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

const coverageSchema = z.union([
  z.string().max(10000),
  z.array(z.string().trim().max(191)).max(500),
]);

const providerCreateSchema = z.object({
  providerCode: z.string().trim().max(191).optional(),
  name: z.string().trim().min(1).max(191),
  providerType: z.string().trim().min(1).max(191).optional(),
  countryCoverage: coverageSchema.optional(),
  countryCoverageArray: z.array(z.string().trim().max(191)).max(500).optional(),
  universityCoverage: coverageSchema.optional(),
  universityCoverageArray: z.array(z.string().trim().max(191)).max(500).optional(),
  contactPerson: z.string().max(191).optional(),
  email: z.string().max(191).optional(),
  phone: z.string().max(80).optional(),
  portalUrl: z.string().max(2000).optional(),
  loginNote: z.string().max(10000).optional(),
  agreementFile: z.string().max(0).optional(),
  commissionRule: z.string().max(10000).optional(),
  paymentCondition: z.string().max(10000).optional(),
  claimStage: z.string().max(191).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'APPROVED']).optional(),
  internalNote: z.string().max(10000).optional(),
}).strict();

function coverageValue(value: string | string[] | undefined, fallback: string | undefined): string {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'string') return value;
  return fallback ?? '[]';
}

export const GET = withAuth(async (req, auth) => {
  if (isPartner(auth) || !canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B provider access requires an authorized ALO-side B2B permission.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const country = searchParams.get('country');
  if ([type, status, country].some((value) => value && value.length > 191)) {
    return NextResponse.json({ success: false, error: 'Invalid provider filter.' }, { status: 400 });
  }

  const where: Record<string, unknown> = {};
  if (type) where.providerType = type;
  if (status) where.status = status;
  if (country) where.countryCoverage = { contains: country };

  try {
    const records = await db.b2bProvider.findMany({
      where,
      include: { _count: { select: { b2bApplications: true } } },
      orderBy: { name: 'asc' },
      take: 200,
    });
    const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);
    const sanitized = records.map((provider: any) => sanitizeB2BProvider(provider, canViewCommission));
    await logAuditAction(auth, 'VIEW_B2B_PROVIDERS', 'B2bProvider', 'list', { count: sanitized.length });
    return NextResponse.json({ success: true, data: sanitized, providers: sanitized });
  } catch (error) {
    console.error('[b2b.providers.list] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'B2B providers are temporarily unavailable.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req, auth) => {
  if (isPartner(auth) || !canManageB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B provider management requires an authorized ALO-side permission.' }, { status: 403 });
  }

  const parsed = providerCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid B2B provider data.', details: parsed.error.flatten() }, { status: 400 });
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

  try {
    const provider = await db.b2bProvider.create({
      data: {
        providerCode: body.providerCode || `B2B-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        name: body.name,
        providerType: body.providerType || 'GLOBAL_B2B',
        countryCoverage: coverageValue(body.countryCoverage, body.countryCoverageArray ? JSON.stringify(body.countryCoverageArray) : undefined),
        universityCoverage: coverageValue(body.universityCoverage, body.universityCoverageArray ? JSON.stringify(body.universityCoverageArray) : undefined),
        contactPerson: body.contactPerson || '',
        email: body.email || '',
        phone: body.phone || '',
        portalUrl: body.portalUrl || '',
        // Credential text is encrypted before persistence and is never returned.
        loginNote: body.loginNote ? encryptToken(body.loginNote) : '',
        agreementFile: '',
        commissionRule: body.commissionRule || '',
        paymentCondition: body.paymentCondition || '',
        claimStage: body.claimStage || 'NOT_CLAIMED',
        status: body.status || 'ACTIVE',
        createdBy: auth.userId,
        lastReviewedAt: new Date(),
        internalNote: body.internalNote || '',
      },
    });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'CREATE_B2B_PROVIDER',
        resource: 'B2bProvider',
        resourceId: provider.id,
        details: JSON.stringify({ providerCode: provider.providerCode, providerType: provider.providerType, credentialProvided: Boolean(body.loginNote) }),
        actorRole: auth.roles[0] || '',
      },
    });
    await logAuditAction(auth, 'CREATE_B2B_PROVIDER', 'B2bProvider', provider.id, { credentialProvided: Boolean(body.loginNote) });

    const safeProvider = sanitizeB2BProvider(provider as any, canViewB2BCommission(auth.roles, auth.permissions));
    return NextResponse.json({ success: true, data: safeProvider, provider: safeProvider, message: 'B2B provider created.' }, { status: 201 });
  } catch (error) {
    console.error('[b2b.providers.create] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'B2B provider could not be created.' }, { status: 503 });
  }
});
