import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { studentId, messageId, fileName, fileUrl, mimeType, source } = body;
    if (!studentId || !fileUrl) return NextResponse.json({ success: false, error: 'studentId and fileUrl required' }, { status: 400 });

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
