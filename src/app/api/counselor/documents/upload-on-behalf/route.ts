import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth) => {
  try {
    const canUpload = auth.roles.includes('counselor') || auth.roles.includes('application_team') || auth.roles.includes('super_admin') || auth.roles.includes('admin');
    if (!canUpload) return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });

    const body = await req.json();
    const { studentId, documentType, fileName, fileUrl, fileSize } = body;
    if (!studentId || !documentType || !fileUrl) return NextResponse.json({ success: false, error: 'studentId, documentType, fileUrl required' }, { status: 400 });

    const doc = await db.studentDocument.create({
      data: {
        studentId,
        category: documentType,
        fileName: fileName || documentType,
        fileUrl,
        status: 'pending_review',
      },
    });

    // Also create portal doc
    try {
      const profile = await db.portalStudentProfile.findFirst({ where: { studentId } });
      if (profile) {
        await db.portalStudentDocument.create({
          data: {
            studentProfileId: profile.id,
            name: fileName || documentType,
            category: documentType,
            fileName: fileName || documentType,
            fileSize: fileSize || 0,
            status: 'pending',
          },
        });
      }
    } catch {}

    await db.documentAudit.create({
      data: {
        documentId: doc.id,
        studentId,
        actorId: auth.userId,
        actorName: auth.name || '',
        actorRole: auth.roles[0] || '',
        action: 'upload_on_behalf',
        newStatus: 'pending_review',
        note: `Uploaded on behalf by ${auth.name}`,
      },
    }).catch(() => {});

    await db.timelineEvent.create({
      data: {
        studentId,
        stage: 'DOCUMENT_UPLOADED',
        title: `Document uploaded on behalf: ${documentType}`,
        description: `By ${auth.name} (${auth.roles[0]})`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
