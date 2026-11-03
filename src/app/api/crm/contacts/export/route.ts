/**
 * Contact Hub — permission-controlled, minimum-necessary CSV export.
 *
 * Phone and email are omitted by default. They are added only for a Super
 * Admin (or an explicit `contacts.export_pii` grant) that asks for them, and
 * every export is written to the audit trail with the actor and field list.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { contactScopeWhere } from '@/lib/contacts/access-scope';
import { contactHubPermissionDenied } from '@/lib/contacts/hub-access';
import { projectContactForExport, toRegistryContact } from '@/lib/contacts/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function csvCell(value: string | boolean): string {
  const text = String(value ?? '').replace(/"/g, '""');
  // Spreadsheet formula injection guard.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe}"`;
}

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = contactHubPermissionDenied(auth, 'contacts.export', ['BRANCH_MANAGER', 'MARKETING_MANAGER']);
  if (denied) return denied;
  const params = new URL(req.url).searchParams;
  const roles = new Set([auth.userType, ...auth.roles].map((role) => String(role).toUpperCase()));
  const mayExportPii = roles.has('SUPER_ADMIN') || auth.permissions.includes('contacts.export_pii');
  const includePhone = mayExportPii && params.get('includePhone') === 'true';
  const includeEmail = mayExportPii && params.get('includeEmail') === 'true';
  try {
    const scope = await contactScopeWhere(auth);
    const rows = await db.whatsAppContact.findMany({ where: scope as never, orderBy: { createdAt: 'desc' }, take: 500 });
    const contacts = rows.map((row) => toRegistryContact(row as never));
    const exported = contacts.map((contact) => projectContactForExport(contact, { includePhone, includeEmail }));
    const columns = Object.keys(exported[0] || projectContactForExport(toRegistryContact({ id: 'x' }), {}));
    const csv = [columns.map(csvCell).join(','), ...exported.map((row) => columns.map((column) => csvCell(row[column] ?? '')).join(','))].join('\n');
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: 'CONTACT_REGISTRY_EXPORTED',
        entityType: 'WhatsAppContact',
        entityId: '',
        metadata: JSON.stringify({ rowCount: exported.length, columns, includePhone, includeEmail }),
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 64) || '',
        userAgent: req.headers.get('user-agent')?.slice(0, 255) || '',
      },
    }).catch(() => null);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="alo-contacts-minimal.csv"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Export is temporarily unavailable.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.view'] });
