import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { studentId, applicationId, fromEmail, subject, bodyText, rawEmail } = body;
    if (!studentId || !fromEmail || !subject) return NextResponse.json({ success: false, error: 'studentId, fromEmail, subject required' }, { status: 400 });

    // Partner email auto-parse -> internal note + student-facing clean message per spec
    const isPartnerEmail = fromEmail.includes('@') && !fromEmail.includes('alo-education');

    // Create internal comment (full raw for application_team_only)
    const internal = await db.internalComment.create({
      data: {
        studentId,
        applicationId: applicationId || '',
        authorId: auth.userId,
        authorName: `Partner Email: ${fromEmail}`,
        authorRole: 'partner',
        commentType: 'partner_email_update',
        content: `From: ${fromEmail}\nSubject: ${subject}\n\n${bodyText || rawEmail || ''}`,
        visibility: 'application_team_only',
      },
    });

    // Create student-facing clean message (sanitized, no B2B confidential info)
    let cleanMessage = bodyText || '';
    // Strip B2B markers if present
    cleanMessage = cleanMessage.replace(/B2B|commission|payment|provider/gi, '[redacted]').slice(0, 1000);
    if (!cleanMessage) cleanMessage = `Update received regarding your application: ${subject}`;

    const studentVisible = await db.studentVisibleComment.create({
      data: {
        studentId,
        applicationId: applicationId || '',
        authorId: auth.userId,
        authorName: auth.name || 'Application Team',
        authorRole: auth.roles[0] || 'application_team',
        content: cleanMessage,
        isAiGenerated: false,
      },
    });

    // PartnerEmailUpdate model if exists
    try {
      await (db as any).partnerEmailUpdate.create({
        data: {
          studentId,
          applicationId: applicationId || '',
          fromEmail,
          subject,
          bodyText: bodyText || '',
          rawEmail: rawEmail || '',
          internalCommentId: internal.id,
          studentVisibleCommentId: studentVisible.id,
          status: 'processed',
        },
      });
    } catch {}

    await db.timelineEvent.create({
      data: {
        studentId,
        stage: 'PARTNER_EMAIL_UPDATE',
        title: `Partner email: ${subject}`,
        description: `From ${fromEmail}`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, internal, studentVisible });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 });

    const canSee = auth.roles.includes('application_team') || auth.roles.includes('super_admin') || auth.roles.includes('admin') || auth.roles.includes('counselor');
    if (!canSee) return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });

    const updates = await (db as any).partnerEmailUpdate.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' }, take: 50 }).catch(async () => {
      return await db.internalComment.findMany({ where: { studentId, commentType: 'partner_email_update' }, orderBy: { createdAt: 'desc' }, take: 50 });
    });

    return NextResponse.json({ success: true, updates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
