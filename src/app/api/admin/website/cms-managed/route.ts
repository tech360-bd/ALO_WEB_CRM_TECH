// ============================================================
// /api/admin/website/cms-managed — Virtual Editor API for
// site-wide & CRM managed content (§15): navigation, footer,
// seo-meta, announcements, banners, crm-labels, crm-templates,
// crm-widgets.
//
// Draft-first lifecycle: every created item starts as a draft and
// nothing is public until it is published. Every mutation is
// revision-snapshotted (CmsRevision) and audit-logged. Inputs are
// sanitized against XSS (scripts, event handlers, javascript:
// URLs). RBAC: SUPER_ADMIN / ADMIN only.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import {
  MANAGED_CONTENT_TYPES,
  createManagedContent,
  updateManagedContent,
  publishManagedContent,
  unpublishManagedContent,
  deleteManagedContent,
  rollbackManagedContent,
  listManagedContent,
  listManagedRevisions,
  getManagedRevision,
  type ManagedContentType,
} from '@/lib/cms-managed-content';

/** SUPER_ADMIN/ADMIN gate shared by every action. */
async function requireCmsAdmin(auth: any): Promise<NextResponse | null> {
  const ok =
    ['SUPER_ADMIN', 'ADMIN'].includes(auth.userType) ||
    (Array.isArray(auth.roles) && (auth.roles.includes('super_admin') || auth.roles.includes('admin')));
  if (!ok) {
    return NextResponse.json({ success: false, error: 'Forbidden — SUPER_ADMIN or ADMIN only' }, { status: 403 });
  }
  return null;
}

function actorOf(auth: any): string {
  return auth?.userId || auth?.user?.id || 'unknown';
}

// ── GET: list / revisions / single revision ──────────────────
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  const denied = await requireCmsAdmin(auth);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'revisions') {
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    return NextResponse.json({ success: true, revisions: await listManagedRevisions(id) });
  }
  if (action === 'revision') {
    const revisionId = searchParams.get('revisionId');
    if (!revisionId) return NextResponse.json({ success: false, error: 'revisionId required' }, { status: 400 });
    const revision = await getManagedRevision(revisionId);
    if (!revision) return NextResponse.json({ success: false, error: 'Revision not found' }, { status: 404 });
    return NextResponse.json({ success: true, revision });
  }

  const contentType = searchParams.get('type') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const items = await listManagedContent({ contentType, status });
  return NextResponse.json({
    success: true,
    availableTypes: MANAGED_CONTENT_TYPES,
    items,
  });
}

// ── POST: create / update / publish / unpublish / delete / rollback ──
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  const denied = await requireCmsAdmin(auth);
  if (denied) return denied;

  const actor = actorOf(auth);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }
  const action = String(body.action ?? 'create');

  try {
    let result: unknown;
    switch (action) {
      case 'create': {
        result = await createManagedContent(
          {
            contentType: body.contentType as ManagedContentType,
            key: body.key as string | undefined,
            section: body.section as string | undefined,
            label: body.label as string | undefined,
            data: (body.data ?? {}) as Record<string, unknown>,
            sortOrder: Number(body.sortOrder ?? 0),
          },
          actor
        );
        await logAuditAction(auth, 'CMS_MANAGED_CREATE', String(body.contentType ?? ''), String(body.key ?? ''), { actor }).catch(() => {});
        break;
      }
      case 'update': {
        if (!body.id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
        result = await updateManagedContent(
          String(body.id),
          {
            key: body.key as string | undefined,
            section: body.section as string | undefined,
            label: body.label as string | undefined,
            data: body.data as Record<string, unknown> | undefined,
            sortOrder: body.sortOrder as number | undefined,
          },
          actor
        );
        await logAuditAction(auth, 'CMS_MANAGED_UPDATE', 'cmsManagedContent', String(body.id), { actor }).catch(() => {});
        break;
      }
      case 'publish': {
        if (!body.id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
        result = await publishManagedContent(String(body.id), actor);
        await logAuditAction(auth, 'CMS_MANAGED_PUBLISH', 'cmsManagedContent', String(body.id), { actor }).catch(() => {});
        break;
      }
      case 'unpublish': {
        if (!body.id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
        result = await unpublishManagedContent(String(body.id), actor);
        await logAuditAction(auth, 'CMS_MANAGED_UNPUBLISH', 'cmsManagedContent', String(body.id), { actor }).catch(() => {});
        break;
      }
      case 'delete': {
        if (!body.id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
        result = await deleteManagedContent(String(body.id), actor);
        await logAuditAction(auth, 'CMS_MANAGED_DELETE', 'cmsManagedContent', String(body.id), { actor, snapshotRetained: true }).catch(() => {});
        break;
      }
      case 'rollback': {
        if (!body.revisionId) return NextResponse.json({ success: false, error: 'revisionId required' }, { status: 400 });
        result = await rollbackManagedContent(String(body.revisionId), actor);
        await logAuditAction(auth, 'CMS_MANAGED_ROLLBACK', 'cmsManagedContent', String(body.id ?? ''), { revisionId: String(body.revisionId), actor }).catch(() => {});
        break;
      }
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Operation failed';
    // validation/lib errors are safe to surface; never leak stack traces
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
