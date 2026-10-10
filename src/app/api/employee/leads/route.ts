import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';
import { checkRateLimit } from '@/lib/rate-limiter';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);
const CREATE_ROLES = new Set([
  'COUNSELOR', 'SENIOR_COUNSELOR', 'MARKETING', 'MARKETING_MANAGER',
  'FRONT_DESK', 'BRANCH_MANAGER', 'OFFICE_MANAGER',
]);
const TEAM_SCOPE_ROLES = new Set(['BRANCH_MANAGER', 'OFFICE_MANAGER', 'HR_MANAGER']);

function normalizeRole(value: string): string {
  return value.trim().replace(/[\s-]+/g, '_').toUpperCase();
}

function uniqueIds(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function sameOriginForCookieMutation(request: NextRequest): boolean {
  const authorization = request.headers.get('authorization') || '';
  const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const hasBearer = Boolean(bearerToken && bearerToken !== 'null' && bearerToken !== 'undefined');
  if (hasBearer) return true;
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function authorizeEmployee(request: NextRequest): Promise<
  | { auth: AuthContext; roles: Set<string>; employee: { id: string; userId: string; employeeId: string; status: string; branch: string } | null; isAdmin: boolean }
  | NextResponse
> {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult as AuthContext;
  const roles = new Set([auth.userType, ...auth.roles].map(normalizeRole));
  const isAdmin = [...roles].some((role) => ADMIN_ROLES.has(role));
  if (['STUDENT', 'PARTNER'].includes(normalizeRole(auth.userType)) && !isAdmin) {
    return NextResponse.json({ success: false, error: 'Employee access is required.' }, { status: 403 });
  }

  const employee = await db.employee.findUnique({
    where: { userId: auth.userId },
    select: { id: true, userId: true, employeeId: true, status: true, branch: true, role: true },
  });
  if (!isAdmin && (!employee || employee.status.toLowerCase() !== 'active')) {
    return NextResponse.json({ success: false, error: 'An active employee record is required.' }, { status: 403 });
  }
  if (employee?.role) roles.add(normalizeRole(employee.role));
  return { auth, roles, employee, isAdmin };
}

function parseLimit(value: string | null): number | null {
  if (value == null || value === '') return 50;
  if (!/^\d+$/.test(value)) return null;
  const limit = Number(value);
  return Number.isSafeInteger(limit) && limit >= 1 && limit <= 100 ? limit : null;
}

export async function GET(request: NextRequest) {
  try {
    const access = await authorizeEmployee(request);
    if (access instanceof NextResponse) return access;
    const { auth, roles, employee, isAdmin } = access;
    const params = new URL(request.url).searchParams;
    const scope = params.get('scope') || 'assigned';
    if (!['assigned', 'team', 'all'].includes(scope)) {
      return NextResponse.json({ success: false, error: 'Invalid lead scope.' }, { status: 400 });
    }
    if (scope === 'all' && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Organization-wide lead access is not permitted.' }, { status: 403 });
    }
    if (scope === 'team' && !isAdmin && (![...roles].some((role) => TEAM_SCOPE_ROLES.has(role)) || !employee?.branch.trim())) {
      return NextResponse.json({ success: false, error: 'Branch-scoped lead access is not assigned.' }, { status: 403 });
    }

    const limit = parseLimit(params.get('limit'));
    if (limit == null) return NextResponse.json({ success: false, error: 'Limit must be an integer from 1 to 100.' }, { status: 400 });
    const status = params.get('status')?.trim();
    if (status && !/^[A-Za-z _-]{1,32}$/.test(status)) {
      return NextResponse.json({ success: false, error: 'Invalid lead status filter.' }, { status: 400 });
    }
    const search = params.get('search')?.trim();
    if (search && (search.length > 100 || /[\u0000-\u001f]/.test(search))) {
      return NextResponse.json({ success: false, error: 'Search text is invalid or too long.' }, { status: 400 });
    }

    let where: any = {};
    if (scope !== 'all') {
      let assignedIds = uniqueIds([auth.userId, employee?.id, employee?.userId, employee?.employeeId]);
      if (scope === 'team' && !isAdmin && employee) {
        const team = await db.employee.findMany({
          where: { branch: employee.branch, status: { in: ['active', 'ACTIVE'] } },
          select: { id: true, userId: true, employeeId: true },
        });
        assignedIds = uniqueIds(team.flatMap((item) => [item.id, item.userId, item.employeeId]));
      }
      where.counselorId = { in: assignedIds };
    }
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [total, leads] = await Promise.all([
      db.marketingLead.count({ where }),
      db.marketingLead.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
    ]);
    return NextResponse.json({ success: true, total, leads: leads.map((lead) => ({ ...lead, fullName: lead.name })) });
  } catch {
    return NextResponse.json({ success: false, error: 'Employee leads are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!sameOriginForCookieMutation(request)) {
    return NextResponse.json({ success: false, error: 'A same-origin request or explicit bearer authorization is required.' }, { status: 403 });
  }

  try {
    const access = await authorizeEmployee(request);
    if (access instanceof NextResponse) return access;
    const { auth, roles, isAdmin } = access;
    if (!isAdmin && ![...roles].some((role) => CREATE_ROLES.has(role))) {
      return NextResponse.json({ success: false, error: 'Lead creation is not permitted for this employee role.' }, { status: 403 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const rate = checkRateLimit(`${auth.userId}:${ip}`, 'lead_create');
    if (!rate.allowed) {
      return NextResponse.json({ success: false, error: 'Lead creation rate limit exceeded.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))) },
      });
    }

    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'A valid request body is required.' }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const leadName = typeof input.fullName === 'string' ? input.fullName.trim() : typeof input.name === 'string' ? input.name.trim() : '';
    const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const destination = typeof input.destination === 'string' ? input.destination.trim() : typeof input.country === 'string' ? input.country.trim() : '';
    const level = typeof input.level === 'string' ? input.level.trim() : '';
    const intake = typeof input.intake === 'string' ? input.intake.trim() : '';

    if (!leadName || leadName.length > 191 || /[\u0000-\u001f]/.test(leadName)) {
      return NextResponse.json({ success: false, error: 'A valid full name is required.' }, { status: 400 });
    }
    if (!/^\+?[0-9\s().-]{7,30}$/.test(phone)) {
      return NextResponse.json({ success: false, error: 'A valid contact phone number is required.' }, { status: 400 });
    }
    if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ success: false, error: 'Email address is invalid.' }, { status: 400 });
    }
    if (destination.length > 100 || level.length > 100 || intake.length > 100 ||
        [destination, level, intake].some((value) => /[\u0000-\u001f]/.test(value))) {
      return NextResponse.json({ success: false, error: 'Lead details are too long or contain invalid characters.' }, { status: 400 });
    }

    const lead = await db.$transaction(async (tx) => {
      const created = await tx.marketingLead.create({
        data: {
          name: leadName,
          phone,
          email,
          destination,
          level,
          intake,
          source: 'employee_direct_contact',
          counselorId: auth.userId,
          counselorName: auth.name,
          status: 'new',
        },
      });
      await tx.crmAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          actorRole: auth.roles[0] || auth.userType,
          action: 'LEAD_CREATED',
          targetCollection: 'MarketingLead',
          targetId: created.id,
          afterData: JSON.stringify({ assignedCounselorId: auth.userId, source: 'employee_direct_contact' }),
        },
      });
      return created;
    });

    return NextResponse.json({ success: true, message: 'Lead record created.', lead: { ...lead, fullName: lead.name } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Lead creation could not be completed.' }, { status: 503 });
  }
}
