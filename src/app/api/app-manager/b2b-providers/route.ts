import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
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

const createSchema = z.object({
  name: z.string().trim().min(1).max(191),
  providerType: z.string().trim().min(1).max(191).optional(),
  countryCoverage: z.string().max(10000).optional(),
  universityCoverage: z.string().max(10000).optional(),
  contactPerson: z.string().max(191).optional(),
  email: z.string().max(191).optional(),
  phone: z.string().max(80).optional(),
  portalUrl: z.string().max(2000).optional(),
  loginNote: z.string().max(10000).optional(),
  commissionRule: z.string().max(10000).optional(),
  paymentCondition: z.string().max(10000).optional(),
  claimStage: z.string().max(191).optional(),
  internalNote: z.string().max(10000).optional(),
}).strict();

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (isPartner(auth) || !canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: authorized ALO-side B2B access required.' }, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get('type');
  if (type && type.length > 191) return NextResponse.json({ success: false, error: 'Invalid provider filter.' }, { status: 400 });
  try {
    const providers = await db.b2bProvider.findMany({
      where: type ? { providerType: type } : {},
      include: { _count: { select: { b2bApplications: true } } },
      orderBy: { name: 'asc' },
      take: 200,
    });
    const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);
    const sanitized = providers.map((provider: any) => sanitizeB2BProvider(provider, canViewCommission));
    await db.auditLog.create({
      data: { userId: auth.userId, action: 'VIEW_B2B_PROVIDERS', resource: 'B2bProvider', resourceId: 'list', details: JSON.stringify({ count: sanitized.length }), actorRole: auth.roles[0] || '' },
    });
    return NextResponse.json({ providers: sanitized, success: true, data: sanitized });
  } catch (error) {
    console.error('[app-manager.b2b-providers.list] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'B2B providers are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (isPartner(auth) || !canManageB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: authorized ALO-side B2B management permission required.' }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid B2B provider data.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);
  if (!canViewCommission && [body.commissionRule, body.paymentCondition, body.claimStage].some((value) => Boolean(value?.trim()))) {
    return NextResponse.json({ success: false, error: 'B2B commission policy updates require application.view_b2b_commission permission.' }, { status: 403 });
  }
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
        providerCode: `B2B-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        name: body.name,
        providerType: body.providerType || 'GLOBAL_B2B',
        countryCoverage: body.countryCoverage || '[]',
        universityCoverage: body.universityCoverage || '[]',
        contactPerson: body.contactPerson || '',
        email: body.email || '',
        phone: body.phone || '',
        portalUrl: body.portalUrl || '',
        loginNote: body.loginNote ? encryptToken(body.loginNote) : '',
        agreementFile: '',
        commissionRule: body.commissionRule || '',
        paymentCondition: body.paymentCondition || '',
        claimStage: body.claimStage || 'NOT_CLAIMED',
        status: 'ACTIVE',
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

    const safeProvider = sanitizeB2BProvider(provider as any, canViewB2BCommission(auth.roles, auth.permissions));
    return NextResponse.json({ provider: safeProvider, message: 'B2B provider created.', success: true, data: safeProvider }, { status: 201 });
  } catch (error) {
    console.error('[app-manager.b2b-providers.create] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'B2B provider could not be created.' }, { status: 503 });
  }
}
