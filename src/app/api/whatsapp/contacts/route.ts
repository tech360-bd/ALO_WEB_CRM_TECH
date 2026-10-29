import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { getScopeForAuth } from '@/lib/data-scope';
import { isPlausiblePhone, phoneVariants } from '@/lib/communications/contact-identity';

export const dynamic = 'force-dynamic';
const MAX_PAGE_SIZE = 100;

function hasCompanyWideContactAccess(auth: { roles: string[]; permissions: string[] }): boolean {
  const roles = auth.roles.map((role) => role.toLowerCase());
  return roles.includes('super_admin')
    || (auth.permissions.includes('ad2') && auth.permissions.includes('contacts.view'))
    || auth.permissions.includes('data.view_all');
}

async function contactScopeWhere(auth: AuthContext): Promise<Record<string, unknown>> {
  if (hasCompanyWideContactAccess(auth)) return {};
  if (auth.partnerId && auth.roles.some((role) => role.toLowerCase().includes('partner'))) {
    return { partnerId: auth.partnerId };
  }

  const scope = getScopeForAuth(auth);
  if (scope === 'ASSIGNED') {
    const [students, leads] = await Promise.all([
      db.student.findMany({ where: { counselorId: auth.userId }, select: { id: true }, take: 5000 }),
      db.lead.findMany({ where: { counselorId: auth.userId }, select: { id: true }, take: 5000 }),
    ]);
    const linked: Record<string, unknown>[] = [{ assignedCounselorId: auth.userId }];
    if (students.length) linked.push({ studentId: { in: students.map((row) => row.id) } });
    if (leads.length) linked.push({ leadId: { in: leads.map((row) => row.id) } });
    return { OR: linked };
  }

  if (scope === 'BRANCH' && auth.branch) {
    const employees = await db.employee.findMany({
      where: { branch: auth.branch, status: 'active' },
      select: { userId: true },
      take: 2000,
    });
    const counselorIds = [...new Set([auth.userId, ...employees.map((employee) => employee.userId)])];
    const [students, leads] = await Promise.all([
      db.student.findMany({ where: { counselorId: { in: counselorIds } }, select: { id: true }, take: 5000 }),
      db.lead.findMany({ where: { OR: [
        { branch: auth.branch },
        { counselorId: { in: counselorIds } },
      ] }, select: { id: true }, take: 5000 }),
    ]);
    const linked: Record<string, unknown>[] = [
      { branch: auth.branch },
      { assignedCounselorId: { in: counselorIds } },
    ];
    if (students.length) linked.push({ studentId: { in: students.map((row) => row.id) } });
    if (leads.length) linked.push({ leadId: { in: leads.map((row) => row.id) } });
    return { OR: linked };
  }

  return { id: '__NO_CONTACT_SCOPE__' };
}

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const rawSearch = (searchParams.get('search') || '').trim().slice(0, 120);
    const studentId = (searchParams.get('studentId') || '').trim().slice(0, 128);
    const optedOutParam = searchParams.get('isOptedOut');
    const requestedLimit = Number(searchParams.get('limit') || MAX_PAGE_SIZE);
    const take = Number.isInteger(requestedLimit) ? Math.max(1, Math.min(requestedLimit, MAX_PAGE_SIZE)) : MAX_PAGE_SIZE;
    const scopeWhere = await contactScopeWhere(auth);
    const where: Record<string, unknown> = { ...scopeWhere };
    if (studentId) where.studentId = studentId;
    if (optedOutParam === 'true' || optedOutParam === 'false') where.isOptedOut = optedOutParam === 'true';
    if (rawSearch) {
      where.OR = [
        { phone: { contains: rawSearch } },
        { normalizedPhone: { contains: rawSearch } },
        { displayName: { contains: rawSearch } },
      ];
      // Keep the scope guard outside the search OR so a broad search never
      // bypasses branch/assignment/partner restrictions.
      if ('OR' in scopeWhere) {
        where.AND = [scopeWhere, { OR: where.OR }];
        delete where.OR;
      }
    }

    const contacts = await db.whatsAppContact.findMany({
      where: where as any,
      orderBy: { lastContactAt: 'desc' },
      take,
    });
    return NextResponse.json({ success: true, contacts, count: contacts.length });
  } catch {
    return NextResponse.json({ success: false, error: 'Contacts could not be loaded.' }, { status: 500 });
  }
}, { requirePermissions: ['contacts.view'] });

export const POST = withAuth(async (req, auth) => {
  if (!auth.permissions.includes('contacts.manage') && !auth.roles.some((role) => role.toLowerCase() === 'super_admin')) {
    return NextResponse.json({ success: false, error: 'Contact-management permission required.' }, { status: 403 });
  }
  if (!mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ success: false, error: 'Cross-origin contact update denied.' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }
    if (body.studentId || body.leadId || body.partnerId) {
      return NextResponse.json({
        success: false,
        error: 'A contact cannot be linked by client-supplied IDs. Use the authenticated contact-match review workflow.',
      }, { status: 400 });
    }

    const inputPhone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 64) : '';
    if (!inputPhone || !isPlausiblePhone(inputPhone)) {
      return NextResponse.json({ success: false, error: 'A plausible phone number is required.' }, { status: 400 });
    }
    const variants = phoneVariants(inputPhone);
    const normalized = variants[0] || '';
    if (!normalized) return NextResponse.json({ success: false, error: 'Phone number could not be normalized.' }, { status: 400 });
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 120) : '';
    // This endpoint is an authenticated manual creation path. Webhook/import
    // provenance is assigned by those server-controlled workflows, not clients.
    const source = 'MANUAL';

    const [existingRegistry, existingStudent, existingLead] = await Promise.all([
      db.whatsAppContact.findFirst({
        where: { OR: [{ normalizedPhone: { in: variants } }, { phone: { in: variants } }] },
        select: { id: true, normalizedPhone: true },
      }),
      db.student.findFirst({ where: { phone: { in: variants } }, select: { id: true } }),
      db.lead.findFirst({ where: { OR: [{ phone: { in: variants } }, { altPhone: { in: variants } }] }, select: { id: true } }),
    ]);
    if (existingStudent || existingLead) {
      return NextResponse.json({
        success: false,
        code: 'IDENTITY_REVIEW_REQUIRED',
        error: 'A student or lead may already use this phone. Review the existing identity before creating a contact.',
      }, { status: 409 });
    }
    if (existingRegistry) {
      return NextResponse.json({ success: false, code: 'CONTACT_ALREADY_EXISTS', error: 'This phone is already in the contact registry.' }, { status: 409 });
    }

    const contact = await db.$transaction(async (tx) => {
      const created = await tx.whatsAppContact.create({
        data: {
          phone: normalized,
          normalizedPhone: normalized,
          displayName: displayName || normalized,
          source,
          studentId: '',
          leadId: '',
          assignedCounselorId: auth.userId,
          branch: auth.branch || '',
        },
      });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId,
          action: 'CONTACT_REGISTRY_CREATED',
          entityType: 'WhatsAppContact',
          entityId: created.id,
          metadata: JSON.stringify({ source, linked: false, consentCreated: false, actorRole: auth.roles[0] || auth.userType }),
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 64) || '',
          userAgent: req.headers.get('user-agent')?.slice(0, 255) || '',
        },
      });
      return created;
    });
    return NextResponse.json({ success: true, data: contact, isNew: true, consentCreated: false }, { status: 201 });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ success: false, code: 'CONTACT_ALREADY_EXISTS', error: 'This phone is already in the contact registry.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Contact could not be created.' }, { status: 500 });
  }
}, { requirePermissions: ['contacts.manage'] });
