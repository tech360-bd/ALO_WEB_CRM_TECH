import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth) => {
  try {
    const canUpload = auth.roles.includes('counselor') || auth.roles.includes('application_team') || auth.roles.includes('super_admin') || auth.roles.includes('admin');
    if (!canUpload) return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });

    const body = await req.json();
    let { studentId, documentType, fileName, fileUrl, fileSize, email, name, phone, autoCreateStudent, fullApplication, universityName, courseName, country, intake } = body;
    // Auto-create Student ID if studentId missing but email+name provided (ported from /api/documents/auto-upload)
    if (!studentId && email && name) {
      const { createCanonicalStudent } = await import('@/lib/student/canonical-student');
      const res = await createCanonicalStudent({ name, email: email.toLowerCase().trim(), phone, userId: undefined });
      if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      studentId = res.studentDbId;
      autoCreateStudent = res.mode;
      // Ensure portal profile exists
      const existing = await db.portalStudentProfile.findFirst({ where: { studentId } }).catch(()=>null);
      if (!existing) {
        await db.portalStudentProfile.create({ data: { userId: studentId, studentId, fullName: name, email: email.toLowerCase().trim(), phone: phone||'', profileCompletion: 10, journeyStage: 'Lead Created', source: 'COUNSELOR_AUTO_CREATE' } as any }).catch(()=>{});
      }
    }
    if (!studentId || !documentType || !fileUrl) return NextResponse.json({ success: false, error: 'studentId (or email+name for auto-create), documentType, fileUrl required' }, { status: 400 });

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
        description: `By ${auth.name} (${auth.roles[0]})${autoCreateStudent ? ` — student auto-created ${autoCreateStudent}` : ''}`,
      },
    }).catch(() => {});

    // Optional fullapp auto-create (same as /api/documents/auto-upload)
    let application: any = null;
    if (fullApplication === true || fullApplication === 'true' || fullApplication === 1 || fullApplication === '1') {
      try {
        application = await db.application.create({
          data: {
            studentId,
            universityName: universityName || 'TBD',
            courseName: courseName || 'TBD',
            country: country || 'United Kingdom',
            intake: intake || '2026-09',
            applicationSource: 'DIRECT_ALO_APPLICATION',
            stage: 'APPLICATION_DRAFT',
            safeStatus: 'DRAFT',
            counselorId: auth.userId,
          } as any,
        });
        await db.timelineEvent.create({ data: { studentId, stage: 'APPLICATION_CREATED', title: `Application created: ${application.universityName} — ${application.courseName}`, description: `Via counselor auto-upload fullapp` } as any }).catch(()=>{});
      } catch (e: any) { console.warn('[upload-on-behalf] app create failed', e.message); }
    }

    return NextResponse.json({ success: true, data: doc, autoCreatedStudentId: autoCreateStudent ? studentId : undefined, application });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
