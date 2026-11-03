import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { staffGuardDenied, STAFF_POLICIES } from '@/lib/api/staff-endpoint-guard';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Template edit/archive. Locking, approval and archival are consequential
 * actions: they are bound to the authenticated actor, not to `actionById` or
 * `approvedById` supplied by the browser.
 */
async function guard(auth: AuthContext, req: Request) {
  return staffGuardDenied(auth, STAFF_POLICIES.communicationTemplates, { write: true, request: req });
}

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context: RouteContext) => {
  const denied = await guard(auth, req);
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
    }
    const {
      name, category, channel, language, body: tplBody, variables, status, isLocked,
    } = body;

    const existing = await db.communicationTemplate.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    // Only APPROVED templates may be locked. The actor is the session user.
    if (typeof isLocked === 'boolean' && isLocked !== existing.isLocked && isLocked && existing.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Template must be APPROVED before it can be locked' }, { status: 400 });
    }
    if (existing.isLocked && typeof tplBody === 'string' && tplBody !== existing.body) {
      return NextResponse.json({ error: 'Template is LOCKED. Unlock it before editing body content.' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : undefined);
    const assign = (key: string, value: unknown, max: number) => {
      const normalized = text(value, max);
      if (normalized !== undefined) data[key] = normalized;
    };
    assign('templateName', name, 256);
    assign('category', category, 64);
    assign('channel', channel, 64);
    assign('language', language, 32);
    assign('body', tplBody, 8000);
    // The old handler had a dangling `if (subject !== undefined)` that silently
    // swallowed the following `if`, so body edits were only applied when a
    // `subject` field (which does not exist on the model) was present. Removed.
    if (variables !== undefined) {
      data.variables = typeof variables === 'string' ? variables.slice(0, 2000) : JSON.stringify(variables || []);
    }
    assign('status', status, 32);
    if (typeof isLocked === 'boolean') {
      data.isLocked = isLocked;
      if (isLocked) {
        data.status = 'LOCKED';
        data.approvedBy = auth.userId;
      }
    }

    const template = await db.communicationTemplate.update({ where: { id }, data });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'COMMUNICATION_TEMPLATE_UPDATED',
        resource: 'CommunicationTemplate',
        resourceId: id,
        actorRole: auth.roles.join(','),
        details: JSON.stringify({ fields: Object.keys(data) }),
      },
    }).catch(() => null);
    return NextResponse.json({ template });
  } catch {
    return NextResponse.json({ error: 'Failed to update template' }, { status: 503 });
  }
});

export const DELETE = withAuth(async (req: Request, auth: AuthContext, context: RouteContext) => {
  const denied = await guard(auth, req);
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const existing = await db.communicationTemplate.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    // Soft delete only — CRM communication history is never hard-deleted.
    const template = await db.communicationTemplate.update({
      where: { id },
      data: { status: 'ARCHIVED', isLocked: false },
    });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'COMMUNICATION_TEMPLATE_ARCHIVED',
        resource: 'CommunicationTemplate',
        resourceId: id,
        actorRole: auth.roles.join(','),
        details: JSON.stringify({ previousStatus: existing.status }),
      },
    }).catch(() => null);
    return NextResponse.json({ template, archived: true });
  } catch {
    return NextResponse.json({ error: 'Failed to archive template' }, { status: 503 });
  }
});
