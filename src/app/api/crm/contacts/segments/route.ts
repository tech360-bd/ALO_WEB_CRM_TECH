/** Contact Hub — real segment counts from scoped live rows (no sample data). */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { contactScopeWhere } from '@/lib/contacts/access-scope';
import { CONTACT_CATEGORIES, summarizeSegments, toRegistryContact } from '@/lib/contacts/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req: Request, auth: AuthContext) => {
  try {
    const scope = await contactScopeWhere(auth);
    const rows = await db.whatsAppContact.findMany({ where: scope as never, take: 1000, orderBy: { createdAt: 'desc' } });
    const contacts = rows.map((row) => toRegistryContact(row as never));
    const segments = summarizeSegments(contacts);
    return NextResponse.json({
      success: true,
      categories: CONTACT_CATEGORIES,
      segments,
      sampledRows: contacts.length,
      note: 'Counts are computed from the authorized rows returned by the live database query; they are not fabricated KPIs.',
      integrationState: 'LIVE_DB',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Segments are temporarily unavailable.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.view'] });
