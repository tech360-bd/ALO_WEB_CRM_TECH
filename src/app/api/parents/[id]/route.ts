import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { CHANNELS, normalizeAccessLevel } from '@/lib/parent-guardian';

// ============================================================
// GET   /api/parents/[id]
// PATCH /api/parents/[id]
// Staff-only. Access level changes are audited because they widen or narrow
// what a third party may see about a student (spec s13, s65, s67).
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'];
type RouteContext = { params: Promise<{ id: string }> };


export const GET = withAuth(async (_request: Request, _auth, context: RouteContext) => {
  const { id } = await context.params;
  const parent = await db.parentGuardian.findUnique({
    where: { id },
    include: { consents: { orderBy: { createdAt: 'desc' } }, responsibilities: true },
  });
  if (!parent) {
    return NextResponse.json({ success: false, error: 'Parent/guardian not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, parent });
}, { requireUserTypes: STAFF_TYPES });

export const PATCH = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const existing = await db.parentGuardian.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Parent/guardian not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'A JSON body is required' }, { status: 400 });
  }

  const data: Record<string, unknown> = { updatedBy: auth.actorUserId };
  const changes: string[] = [];

  const stringFields = ['fullName', 'relationship', 'email', 'phone', 'whatsapp', 'country', 'city', 'occupation', 'notes', 'status'] as const;
  for (const field of stringFields) {
    if (typeof body[field] === 'string') {
      data[field] = String(body[field]).slice(0, field === 'notes' ? 4000 : 190);
      changes.push(field);
    }
  }
  const boolFields = ['isPrimaryContact', 'isFinancialSponsor', 'portalEnabled'] as const;
  for (const field of boolFields) {
    if (typeof body[field] === 'boolean') {
      data[field] = body[field];
      changes.push(field);
    }
  }
  if (Array.isArray(body.communicationPrefs)) {
    data.communicationPrefs = JSON.stringify(normalizeChannels(body.communicationPrefs));
    changes.push('communicationPrefs');
  }
  if (Array.isArray(body.notificationPrefs)) {
    data.notificationPrefs = JSON.stringify(normalizeChannels(body.notificationPrefs));
    changes.push('notificationPrefs');
  }
  if (body.accessLevel !== undefined) {
    const nextLevel = normalizeAccessLevel(body.accessLevel);
    if (nextLevel !== normalizeAccessLevel(existing.accessLevel)) {
      data.accessLevel = nextLevel;
      changes.push('accessLevel');
      // Widening access without the portal enabled would be a silent no-op,
      // and enabling the portal at NONE is meaningless — keep them coherent.
      if (nextLevel === 'NONE') data.portalEnabled = false;
    }
  }

  if (changes.length === 0) {
    return NextResponse.json({ success: true, changed: [], parent: existing });
  }

  const updated = await db.parentGuardian.update({ where: { id }, data });
  await logAuditAction(auth, 'PARENT_GUARDIAN_UPDATED', 'ParentGuardian', id, {
    changes,
    previousAccessLevel: existing.accessLevel,
    accessLevel: updated.accessLevel,
  });
  return NextResponse.json({ success: true, changed: changes, parent: updated });
}, { requireUserTypes: STAFF_TYPES });

function normalizeChannels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(CHANNELS as readonly string[]);
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().toUpperCase())
        .filter((item) => allowed.has(item)),
    ),
  );
}
