import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

function isSuperAdmin(auth: AuthContext): boolean {
  return auth.roles.some((role) => role.toLowerCase() === 'super_admin');
}

export const GET = withAuth(async (_request: Request, auth: AuthContext) => {
  if (!isSuperAdmin(auth)) return NextResponse.json({ success: false, error: 'Super Admin access required.' }, { status: 403 });
  try {
    const rows = await db.crmAuditLog.findMany({
      where: { action: 'IMPORT_FIELD_MAPPING_SAVED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { afterData: true, createdAt: true, actorUserId: true },
    });
    const templates = rows.map((row) => {
      try { return JSON.parse(row.afterData || '{}'); } catch { return null; }
    }).filter(Boolean);
    return NextResponse.json({ success: true, templates });
  } catch {
    return NextResponse.json({ success: false, error: 'Import field mappings could not be loaded.' }, { status: 503 });
  }
});

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  if (!isSuperAdmin(auth)) return NextResponse.json({ success: false, error: 'Super Admin access required.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.length > 191
    || !body.mappings || typeof body.mappings !== 'object' || Array.isArray(body.mappings)
    || JSON.stringify(body.mappings).length > 20_000) {
    return NextResponse.json({ success: false, error: 'A mapping name and mapping object under 20 KB are required.' }, { status: 400 });
  }
  try {
    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles.join(','),
        action: 'IMPORT_FIELD_MAPPING_SAVED',
        afterData: JSON.stringify({
          name: body.name.trim(),
          sourceCrmName: typeof body.sourceCrmName === 'string' ? body.sourceCrmName.trim().slice(0, 191) : 'Old CRM',
          mappings: body.mappings,
          at: new Date().toISOString(),
          by: auth.userId,
        }),
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Import field mapping could not be saved.' }, { status: 503 });
  }
});
