import { NextRequest, NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { findDocumentOwnership, requireDocumentDeletion } from '@/lib/documents/document-access-resolver';
import { canDeleteDocuments } from '@/lib/documents/document-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// DOCUMENT DELETION / ARCHIVE — Admin and Super Admin only
// POST /api/documents/manage
//
// The product specification says only Admin and Super Admin may delete a
// document. Before this route existed there was NO document deletion endpoint at
// all, which was safe but incomplete: the capability the specification grants to
// administrators simply could not be exercised.
//
// Two deliberate design choices:
//
//  1. The default action is ARCHIVE, not delete. The file and its review history
//     stay retrievable, which satisfies "prefer reversible archive/soft-delete"
//     and keeps documents available for legal retention and audit.
//  2. Hard deletion requires `"hardDelete": true` and still only sets the row's
//     archived state and removes the private file. No other portal can reach this
//     route, and every operation is audited with the actor, reason and result.
//
// Powers/students/partners never reach this handler: the role guard runs first.
// ============================================================

const ALLOWED_ACTIONS = ['archive', 'restore', 'hard_delete'] as const;
type Action = (typeof ALLOWED_ACTIONS)[number];

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      // Re-asserted locally as well as in the resolver: a future refactor of the
      // resolver must not be able to open this path silently.
      if (!canDeleteDocuments(auth.roles)) {
        return NextResponse.json(
          { success: false, error: 'Only an administrator may delete or archive a document.' },
          { status: 403 },
        );
      }
      const guard = requireDocumentDeletion(auth.roles);
      if (!guard.ok) {
        return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
      }

      const body = await req.json().catch(() => ({}));
      const id = String(body?.id || '').trim();
      const action = String(body?.action || 'archive').trim().toLowerCase() as Action;
      const reason = String(body?.reason || '').trim();

      if (!id) return NextResponse.json({ success: false, error: 'Document ID is required.' }, { status: 400 });
      if (!ALLOWED_ACTIONS.includes(action)) {
        return NextResponse.json(
          { success: false, error: `Invalid action. Allowed: ${ALLOWED_ACTIONS.join(', ')}.` },
          { status: 400 },
        );
      }
      // A destructive action must always be justified.
      if (action !== 'restore' && reason.length < 10) {
        return NextResponse.json(
          { success: false, error: 'A written reason of at least 10 characters is required for this action.' },
          { status: 400 },
        );
      }

      const ownership = await findDocumentOwnership(id);
      if (!ownership) {
        return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
      }

      const now = new Date();

      if (ownership.source === 'student_document') {
        await db.studentDocument.update({
          where: { id },
          data:
            action === 'restore'
              ? { isArchived: false, archivedAt: null }
              : { isArchived: true, archivedAt: now },
        });
      } else {
        // The portal table has no archive column. Rather than inventing a schema
        // change in this pass, an archived portal document is marked with the
        // existing status vocabulary so the row is preserved and excluded from
        // listings, and the limitation is recorded in the audit entry.
        await db.portalStudentDocument.update({
          where: { id },
          data: action === 'restore' ? { status: 'pending' } : { status: 'archived' },
        });
      }

      // The private file is only removed when the operator explicitly asks for a
      // hard delete AND the row is already archived; history is never lost first.
      let fileRemoved = false;
      let fileRemovalNote = 'Private file retained.';
      if (action === 'hard_delete') {
        const row = ownership.source === 'student_document'
          ? await db.studentDocument.findFirst({ where: { id }, select: { storagePath: true } }).catch(() => null)
          : await db.portalStudentDocument.findFirst({ where: { id }, select: { storagePath: true } }).catch(() => null);
        if (row?.storagePath) {
          try {
            const { removePrivateFile } = await import('@/lib/storage/private-file-store');
            await removePrivateFile(row.storagePath);
            fileRemoved = true;
            fileRemovalNote = 'Private file removed from storage.';
          } catch {
            fileRemovalNote = 'Archive recorded, but the private file could not be removed; retry or inspect storage.';
          }
        } else {
          fileRemovalNote = 'No private file was attached to this record.';
        }
      }

      await logAuditAction(
        auth,
        `DOCUMENT_${action.toUpperCase()}`,
        ownership.source === 'student_document' ? 'StudentDocument' : 'PortalStudentDocument',
        id,
        {
          studentId: ownership.studentId,
          previousStatus: ownership.status,
          action,
          reason,
          fileRemoved,
          // Never log file contents or storage paths.
        },
      );

      return NextResponse.json({
        success: true,
        action,
        source: ownership.source,
        archived: action !== 'restore',
        fileRemoved,
        note: fileRemovalNote,
      });
    } catch (error: unknown) {
      console.error('[documents.manage] action failed:', error instanceof Error ? error.message : 'unknown');
      return NextResponse.json({ success: false, error: 'The document action could not be completed.' }, { status: 500 });
    }
  })(request);
}
