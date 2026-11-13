import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { isPlausiblePhone, phoneVariants } from '@/lib/communications/contact-identity';
// Shared scope helper — the Company Contact Hub and this API must never drift.
import { contactScopeWhere, combineContactScopeAndSearch } from '@/lib/contacts/access-scope';

export const dynamic = 'force-dynamic';
const MAX_PAGE_SIZE = 100;

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const rawSearch = (searchParams.get('search') || '').trim().slice(0, 120);
    const studentId = (searchParams.get('studentId') || '').trim().slice(0, 128);
    const optedOutParam = searchParams.get('isOptedOut');
    const requestedLimit = Number(searchParams.get('limit') || MAX_PAGE_SIZE);
    const take = Number.isInteger(requestedLimit) ? Math.max(1, Math.min(requestedLimit, MAX_PAGE_SIZE)) : MAX_PAGE_SIZE;
    const scopeWhere = await contactScopeWhere(auth);
    const where: Record<string, unknown> = {};
    if (studentId) where.studentId = studentId;
    if (optedOutParam === 'true' || optedOutParam === 'false') where.isOptedOut = optedOutParam === 'true';
    if (rawSearch) {
      // Keep the scope guard outside the search OR so a broad search never
      // bypasses branch/assignment/partner restrictions.
      Object.assign(where, combineContactScopeAndSearch(scopeWhere, [
        { phone: { contains: rawSearch } },
        { normalizedPhone: { contains: rawSearch } },
        { displayName: { contains: rawSearch } },
      ]));
    } else {
      Object.assign(where, scopeWhere);
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
