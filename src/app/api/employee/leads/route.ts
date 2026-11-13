import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';
import { checkRateLimit } from '@/lib/rate-limiter';
import { leadAccess } from '@/lib/crm/lead-access';
import { mutationOriginAllowed } from '@/lib/request-origin';

async function authorizeEmployee(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  const roles = [auth.userType, ...auth.roles].map((role) => role.trim().toUpperCase());
  if (auth.identityDomain !== 'user' || roles.some((role) => ['STUDENT', 'PARTNER'].includes(role))) return NextResponse.json({ success: false, error: 'Employee lead access is required.' }, { status: 403 });
  const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { id: true, userId: true, employeeId: true, status: true } }).catch(() => null);
  if (!employee || employee.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
  const access = leadAccess(auth);
  if (!access) return NextResponse.json({ success: false, error: 'Verified User lead access is required.' }, { status: 403 });
  return { auth, access, employee };
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
    const { auth, access: leadScope } = access;
    const params = new URL(request.url).searchParams;
    const scope = params.get('scope') || 'created';
    if (['assigned', 'team'].includes(scope)) {
      return NextResponse.json({ success: false, code: 'ASSIGNMENT_MAPPING_UNVERIFIED', error: 'Assignment/team identity mapping is unverified. Use the created-leads view.' }, { status: 409 });
    }
    if (!['created', 'all'].includes(scope)) return NextResponse.json({ success: false, error: 'Invalid lead scope.' }, { status: 400 });
    if (scope === 'all' && !leadScope.admin) return NextResponse.json({ success: false, error: 'Organization-wide lead access is not permitted.' }, { status: 403 });

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

    const where: any = scope === 'all' ? {} : { createdById: auth.userId };
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
      db.marketingLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, name: true, phone: true, email: true, destination: true, level: true, intake: true, source: true, status: true, createdAt: true },
      }),
    ]);
    await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId || auth.userId, action: 'EMPLOYEE_LEADS_VIEWED', entityType: 'MarketingLead', entityId: `scope:${scope}`, metadata: JSON.stringify({ effectiveUserId: auth.userId, scope, total }) } });
    return NextResponse.json({ success: true, scopeApplied: scope, total, leads: leads.map((lead) => ({ ...lead, fullName: lead.name })) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Employee leads are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await authorizeEmployee(request);
    if (access instanceof NextResponse) return access;
    const { auth, access: leadScope } = access;
    if (!mutationOriginAllowed(request, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
    if (!leadScope.writable) return NextResponse.json({ success: false, error: 'Lead creation permission required.' }, { status: 403 });

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
    const allowed = ['fullName', 'name', 'phone', 'email', 'destination', 'country', 'level', 'intake'];
    if (Object.keys(input).some(key => !allowed.includes(key))) return NextResponse.json({ success: false, error: 'Unsupported lead fields; ownership and assignment cannot be submitted.' }, { status: 400 });
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
          createdById: auth.userId,
          consent: false,
          status: 'new',
        },
        select: { id: true, name: true, phone: true, email: true, destination: true, level: true, intake: true, source: true, status: true, createdAt: true },
      });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: 'LEAD_CREATED',
          entityType: 'MarketingLead',
          entityId: created.id,
          metadata: JSON.stringify({ identityDomain: auth.identityDomain, effectiveUserId: auth.userId, source: 'employee_direct_contact' }),
        },
      });
      return created;
    });

    return NextResponse.json({ success: true, message: 'Lead record created.', lead: { ...lead, fullName: lead.name } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Lead creation could not be completed.' }, { status: 503 });
  }
}
