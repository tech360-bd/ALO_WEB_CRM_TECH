/**
 * Company Contact Hub — list/search.
 *
 * POST is deliberately NOT reimplemented: it re-exports the existing audited,
 * identity-checked manual contact creation handler at /api/whatsapp/contacts
 * so there is exactly one creation path in the CRM.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { contactScopeWhere, combineContactScopeAndSearch } from '@/lib/contacts/access-scope';
import {
  CONTACT_CATEGORIES,
  summarizeSegments,
  toRegistryContact,
  type ContactCategory,
} from '@/lib/contacts/registry';

export { POST } from '../../whatsapp/contacts/route';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PAGE_SIZE = 100;

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  const params = new URL(req.url).searchParams;
  const search = (params.get('search') || '').trim().slice(0, 120);
  const category = (params.get('category') || '').trim().toUpperCase();
  if (category && !CONTACT_CATEGORIES.includes(category as ContactCategory)) {
    return NextResponse.json({ success: false, error: 'Unsupported contact category.' }, { status: 400 });
  }
  const requestedLimit = Number(params.get('limit') || MAX_PAGE_SIZE);
  const take = Number.isInteger(requestedLimit) ? Math.max(1, Math.min(requestedLimit, MAX_PAGE_SIZE)) : MAX_PAGE_SIZE;
  try {
    const scope = await contactScopeWhere(auth);
    const filters: Record<string, unknown> = {};
    if (params.get('optedOut') === 'true') filters.isOptedOut = true;
    if (params.get('optedOut') === 'false') filters.isOptedOut = false;
    const where = search
      ? { ...filters, ...combineContactScopeAndSearch(scope, [
          { displayName: { contains: search } },
          { phone: { contains: search } },
          { normalizedPhone: { contains: search } },
          { email: { contains: search } },
          { normalizedEmail: { contains: search } },
        ]) }
      : { ...filters, ...scope };

    // Category is derived from tags/links, so it is filtered after the scoped
    // database read. This keeps the branch/assignment guard in the query.
    const rows = await db.whatsAppContact.findMany({
      where: where as never,
      orderBy: { lastContactAt: 'desc' },
      take: MAX_PAGE_SIZE,
    });
    const contacts = rows
      .map((row) => toRegistryContact(row as never))
      .filter((contact) => !category || contact.category === category)
      .slice(0, take);

    return NextResponse.json({
      success: true,
      contacts,
      count: contacts.length,
      segments: summarizeSegments(contacts),
      // Honest state: values are live database rows, not sample data.
      dataSource: 'WhatsAppContact (existing CRM registry)',
      integrationState: 'LIVE_DB',
      scope: 'branch/assignment/partner filtered server-side',
      capabilities: {
        import: '/crm/contacts/import',
        duplicates: '/crm/contacts/duplicates',
        consent: '/crm/contacts/consent',
        segments: '/crm/contacts/segments',
        audit: '/crm/contacts/audit',
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Contact registry is temporarily unavailable.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.view'] });
