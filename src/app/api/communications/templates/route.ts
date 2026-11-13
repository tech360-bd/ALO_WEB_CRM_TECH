import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { staffGuardDenied, STAFF_POLICIES } from '@/lib/api/staff-endpoint-guard';

/** Communication templates: staff-only reads; manager/admin writes. */
export const dynamic = 'force-dynamic';

function guard(auth: AuthContext, write: boolean, request: Request) {
  return staffGuardDenied(auth, STAFF_POLICIES.communicationTemplates, { write, request });
}

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = guard(auth, false, req);
  if (denied) return denied;
  const where: Record<string, string> = {};
  const params = new URL(req.url).searchParams;
  for (const key of ['channel', 'category', 'status', 'language']) {
    const value = params.get(key);
    if (value) where[key] = value.slice(0, 64);
  }
  try {
    const templates = await db.communicationTemplate.findMany({ where, orderBy: { updatedAt: 'desc' }, take: 200 });
    return NextResponse.json({ templates }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Templates could not be loaded.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = guard(auth, true, req);
  if (denied) return denied;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }
  const str = (key: string, max = 512) => (typeof body[key] === 'string' ? String(body[key]).trim().slice(0, max) : '');
  if (!str('templateId') || !str('name') || !str('category') || !str('channel') || !str('body', 8000)) {
    return NextResponse.json({ error: 'templateId, name, category, channel, body are required' }, { status: 400 });
  }
  try {
    const existing = await db.communicationTemplate.findFirst({ where: { templateCode: str('templateId') } });
    if (existing) return NextResponse.json({ error: 'templateId already exists' }, { status: 409 });
    const template = await db.communicationTemplate.create({
      data: {
        templateCode: str('templateId'),
        templateName: str('name'),
        category: str('category', 64),
        channel: str('channel', 64),
        language: str('language', 32) || 'en',
        body: str('body', 8000),
        variables: typeof body.variables === 'string' ? body.variables.slice(0, 2000) : JSON.stringify(body.variables || []),
        status: 'DRAFT',
        isLocked: false,
        createdBy: auth.userId,
      },
    });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'COMMUNICATION_TEMPLATE_CREATED',
        resource: 'CommunicationTemplate',
        resourceId: template.id,
        actorRole: auth.roles.join(','),
        details: JSON.stringify({ templateCode: template.templateCode, channel: template.channel }),
      },
    }).catch(() => null);
    return NextResponse.json({ template }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Template could not be saved.' }, { status: 503 });
  }
});
