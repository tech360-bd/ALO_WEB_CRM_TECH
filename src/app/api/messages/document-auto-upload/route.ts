import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { authorizeStaffDocumentRead } from '@/lib/documents/document-access-resolver';
import { canReadDocumentsByRole } from '@/lib/documents/document-access';

/**
 * SECURITY HARDENING
 *
 * This route accepted an arbitrary `studentId` and an arbitrary `fileUrl` from
 * ANY authenticated account (partner or student included), then wrote both a
 * StudentDocument and a PortalStudentDocument for that student. Nothing tied the
 * caller to the student, and nothing constrained the URL — so it was an
 * unauthenticated-by-ownership write path into another tenant's records, and a
 * way to attach a `javascript:`/`data:` link that the document views would render.
 *
 * It now requires a document-read role, authorises the caller against the student
 * with the same policy as every other document route, and only accepts a relative
 * storage path or an https URL.
 */
function isSafeFileUrl(value: string): boolean {
  if (!value || value.length > 500) return false;
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const POST = withAuth(async (req, auth) => {
  try {
    if (!canReadDocumentsByRole(auth.roles)) {
      return NextResponse.json({ success: false, error: 'Your role cannot attach documents to a student.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { studentId, messageId, fileName, fileUrl, mimeType, source } = body || {};
    if (!studentId || !fileUrl) return NextResponse.json({ success: false, error: 'studentId and fileUrl required' }, { status: 400 });

    if (typeof studentId !== 'string' || studentId.length > 191) {
      return NextResponse.json({ success: false, error: 'Invalid student reference.' }, { status: 400 });
    }
    if (typeof fileUrl !== 'string' || !isSafeFileUrl(fileUrl)) {
      return NextResponse.json({ success: false, error: 'fileUrl must be a relative storage path or an https URL.' }, { status: 400 });
    }
    if (fileName !== undefined && (typeof fileName !== 'string' || fileName.length > 191)) {
      return NextResponse.json({ success: false, error: 'Invalid file name.' }, { status: 400 });
    }

    // Same policy as every other document route: admin oversight, reviewer
    // pipeline access, assigned counselor only, and no access to a partner student
    // who has not submitted an application through ALO.
    const guard = await authorizeStaffDocumentRead({ userId: auth.userId, roles: auth.roles }, studentId);
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    }

    // Classify document type by mime and filename
    let category = 'other';
    if (mimeType?.includes('pdf') || fileName?.toLowerCase().includes('passport')) category = 'passport';
    else if (fileName?.toLowerCase().includes('transcript') || fileName?.toLowerCase().includes('certificate')) category = 'academic';
    else if (mimeType?.includes('image')) category = 'image_doc';

    const doc = await db.studentDocument.create({
      data: {
        studentId,
        category,
        fileName: fileName || 'auto-upload',
        fileUrl,
        status: 'pending_review', // Never auto-approved per spec
      },
    });

    // Link to message if exists
    if (messageId) {
      try {
        await db.communicationMessage.update({ where: { id: messageId }, data: { fileUrl } });
      } catch {}
    }

    // Audit - no delete allowed per spec
    await db.documentAudit.create({
      data: {
        documentId: doc.id,
        studentId,
        actorId: auth.userId,
        actorName: auth.name || source || 'whatsapp-auto',
        actorRole: auth.roles[0] || 'system',
        action: 'auto_upload_from_message',
        newStatus: 'pending_review',
        note: `Auto-uploaded from ${source || 'whatsapp'} message ${messageId || ''}`,
      },
    }).catch(() => {});

    // Portal doc if profile exists
    try {
      const profile = await db.portalStudentProfile.findFirst({ where: { studentId } });
      if (profile) {
        await db.portalStudentDocument.create({
          data: {
            studentProfileId: profile.id,
            name: fileName || 'auto-upload',
            category,
            fileName: fileName || 'auto-upload',
            fileSize: 0,
            status: 'pending',
          },
        });
      }
    } catch {}

    await db.timelineEvent.create({
      data: {
        studentId,
        stage: 'DOCUMENT_AUTO_UPLOADED',
        title: `Document auto-uploaded from ${source || 'message'}`,
        description: `${fileName} classified as ${category} pending_review`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: doc, message: 'Document auto-ingested pending_review no delete' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
