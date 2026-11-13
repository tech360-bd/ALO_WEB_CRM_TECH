import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { isMarketingManager } from '@/lib/marketing/access';

const MAX_LIMITED_USERS = 3;
const LEGACY_PERMISSION_MAP: Record<string, string[]> = {
  social_inbox: ['marketing.inbox.assigned.read', 'marketing.inbox.assigned.reply'],
  campaign_posts: ['marketing.posts.draft', 'marketing.posts.submit'],
};
const ALLOWED_PERMISSIONS = new Set([
  'marketing.inbox.assigned.read',
  'marketing.inbox.assigned.reply',
  'marketing.posts.draft',
  'marketing.posts.submit',
]);

async function authorizeManager(req: Request) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isMarketingManager(auth)) {
    return NextResponse.json({ success: false, error: 'Marketing Manager or Super Admin access required.' }, { status: 403 });
  }
  return auth;
}

function normalizePermissions(input: unknown): string[] | null {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input) || input.some((value) => typeof value !== 'string')) return null;
  const output = new Set<string>();
  for (const value of input as string[]) {
    const normalized = value.trim().toLowerCase();
    const mapped = LEGACY_PERMISSION_MAP[normalized] ?? [normalized];
    for (const permission of mapped) {
      if (!ALLOWED_PERMISSIONS.has(permission)) return null;
      output.add(permission);
    }
  }
  return [...output];
}

// GET — list access for the Marketing Manager/Super Admin only.
export async function GET(req: NextRequest) {
  const auth = await authorizeManager(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const access = await db.marketingUserAccess.findMany({
      include: { user: { select: { id: true, name: true, email: true, role: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const activeLimited = access.filter((item) => item.accessLevel === 'LIMITED' && item.status === 'ACTIVE');
    return NextResponse.json({
      access,
      managerCount: 0,
      approvedUserCount: activeLimited.length,
      maxApprovedUsers: MAX_LIMITED_USERS,
    });
  } catch (error) {
    console.error('[marketing.user-access] list failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to load marketing access.' }, { status: 500 });
  }
}

// POST — approve one of exactly three bounded, limited marketing accounts.
export async function POST(req: NextRequest) {
  const auth = await authorizeManager(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null) as { userId?: unknown; accessLevel?: unknown; permissions?: unknown } | null;
  const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
  if (!userId || userId.length > 191) {
    return NextResponse.json({ success: false, error: 'A canonical User ID is required.' }, { status: 400 });
  }
  if (body?.accessLevel !== 'LIMITED') {
    return NextResponse.json({ success: false, error: 'Only LIMITED access can be approved here. Manager privileges must come from the server-managed Marketing Manager role.' }, { status: 403 });
  }
  const permissions = normalizePermissions(body.permissions);
  if (permissions === null) {
    return NextResponse.json({ success: false, error: 'Unsupported permission. Limited users may only work with assigned inbox items and draft/submit content for approval.' }, { status: 400 });
  }

  try {
    const target = await db.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
    if (!target || target.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'The selected account does not exist or is not active.' }, { status: 404 });
    }
    const employee = await db.employee.findUnique({ where: { userId }, select: { department: true, designation: true, role: true, status: true } }).catch(() => null);
    const marketingEmployee = employee && employee.status.toLowerCase() === 'active' && /marketing/i.test(`${employee.department} ${employee.designation} ${employee.role}`);
    if (!marketingEmployee) {
      return NextResponse.json({ success: false, error: 'Only an active employee in the Marketing function can receive a limited marketing approval.' }, { status: 400 });
    }

    const access = await db.$transaction(async (tx) => {
      const current = await tx.marketingUserAccess.findUnique({ where: { userId } });
      const count = await tx.marketingUserAccess.count({
        where: { accessLevel: 'LIMITED', status: 'ACTIVE', userId: { not: userId } },
      });
      if (!current || current.status !== 'ACTIVE' || current.accessLevel !== 'LIMITED') {
        if (count >= MAX_LIMITED_USERS) throw new Error('MARKETING_LIMIT_REACHED');
      }
      return tx.marketingUserAccess.upsert({
        where: { userId },
        update: { accessLevel: 'LIMITED', status: 'ACTIVE', permissions: JSON.stringify(permissions), approvedBy: auth.userId, approvedAt: new Date() },
        create: { userId, accessLevel: 'LIMITED', status: 'ACTIVE', permissions: JSON.stringify(permissions), approvedBy: auth.userId, approvedAt: new Date() },
      });
    }, { isolationLevel: 'Serializable' });

    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'PERMISSION_CHANGE',
        resource: 'MarketingUserAccess',
        resourceId: access.id,
        details: JSON.stringify({ targetUserId: userId, accessLevel: 'LIMITED', permissions, approvedBy: auth.userId }),
      },
    });
    return NextResponse.json({ success: true, access, message: 'Limited marketing access granted.' });
  } catch (error) {
    if (error instanceof Error && error.message === 'MARKETING_LIMIT_REACHED') {
      return NextResponse.json({ success: false, error: 'Maximum of three active limited marketing users reached. Revoke an existing approval first.' }, { status: 409 });
    }
    console.error('[marketing.user-access] approval failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to approve marketing access.' }, { status: 500 });
  }
}

// PATCH — managers may revoke or restore a bounded limited approval; they may not promote it to FULL.
export async function PATCH(req: NextRequest) {
  const auth = await authorizeManager(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => null) as { id?: unknown; status?: unknown } | null;
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  const status = body?.status;
  if (!id || !['ACTIVE', 'REVOKED', 'SUSPENDED'].includes(String(status))) {
    return NextResponse.json({ success: false, error: 'id and a valid status are required.' }, { status: 400 });
  }
  try {
    const existing = await db.marketingUserAccess.findUnique({ where: { id } });
    if (!existing || existing.accessLevel !== 'LIMITED') {
      return NextResponse.json({ success: false, error: 'Limited marketing approval not found.' }, { status: 404 });
    }
    if (status === 'ACTIVE' && existing.status !== 'ACTIVE') {
      const activeCount = await db.marketingUserAccess.count({ where: { accessLevel: 'LIMITED', status: 'ACTIVE', userId: { not: existing.userId } } });
      if (activeCount >= MAX_LIMITED_USERS) {
        return NextResponse.json({ success: false, error: 'Maximum of three active limited marketing users reached.' }, { status: 409 });
      }
    }
    const access = await db.marketingUserAccess.update({ where: { id }, data: { status: String(status) } });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'PERMISSION_CHANGE',
        resource: 'MarketingUserAccess',
        resourceId: access.id,
        details: JSON.stringify({ targetUserId: access.userId, status, changedBy: auth.userId }),
      },
    });
    return NextResponse.json({ success: true, access, message: `Access ${status === 'ACTIVE' ? 'restored' : 'revoked'}.` });
  } catch (error) {
    console.error('[marketing.user-access] status change failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update marketing access.' }, { status: 500 });
  }
}
