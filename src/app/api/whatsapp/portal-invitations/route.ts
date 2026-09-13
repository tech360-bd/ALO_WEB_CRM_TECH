import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { generateSecureToken, MAIN_NUMBER } from '@/lib/whatsapp-number-pool';
import { sendWhatsAppMessage } from '@/lib/whatsapp-cloud-api';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { studentId, phone, email, language } = body;

    if (!studentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 });

    // Generate secure token
    const { raw, hash } = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Idempotency: check existing valid invitation
    const existing = await db.studentPortalInvitation.findFirst({
      where: { studentId, isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    let invitation;
    let rawToken = raw;

    if (existing) {
      invitation = existing;
      rawToken = 'existing-token-not-exposed'; // Don't expose existing raw token
    } else {
      invitation = await db.studentPortalInvitation.create({
        data: {
          studentId,
          phone: phone || '',
          email: email || '',
          tokenHash: hash,
          expiresAt,
          createdBy: auth.userId,
        },
      });
    }

    // Generate portal link
    const portalLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://aloeducation.com'}/student/activate?token=${rawToken}&studentId=${studentId}`;

    // Send welcome message from MAIN_NUMBER
    const lang = language || 'mixed';
    const welcomeMessages: Record<string, string> = {
      english: `Welcome to ALO Education! Your Student ID: ${studentId}. Activate your portal: ${portalLink}. Your counselor will contact you soon. For support: ${MAIN_NUMBER}`,
      bangla: `ALO Education এ স্বাগতম! আপনার Student ID: ${studentId}. পোর্টাল একটিভ করুন: ${portalLink}. কাউন্সেলর শীঘ্রই যোগাযোগ করবে। সাপোর্ট: ${MAIN_NUMBER}`,
      mixed: `Welcome to ALO Education! Student ID: ${studentId}. Portal activate korun: ${portalLink}. Counselor contact korbe. Support: ${MAIN_NUMBER}`,
    };

    const welcomeText = welcomeMessages[lang] || welcomeMessages['mixed'];

    let sendResult = null;
    if (!existing) {
      // Only send if new invitation
      sendResult = await sendWhatsAppMessage({
        to: phone,
        text: welcomeText,
      });

      await db.studentPortalInvitation.update({
        where: { id: invitation.id },
        data: { invitationSent: true, sentAt: new Date() },
      }).catch(() => {});
    }

    await db.aloAuditLog.create({
      data: {
        studentId,
        actorType: auth.roles[0] || 'system',
        actorName: auth.name || auth.userId,
        action: 'PORTAL_INVITATION_CREATED',
        resource: 'StudentPortalInvitation',
        resourceId: invitation.id,
        details: JSON.stringify({ studentId, phone, email, expiresAt, isNew: !existing }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        studentId,
        expiresAt,
        isNew: !existing,
        portalLink: existing ? 'existing invitation still valid' : portalLink,
      },
      welcomeSent: !!sendResult?.success,
      sendResult,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    const where: any = {};
    if (studentId) where.studentId = studentId;

    const invitations = await db.studentPortalInvitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, invitations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
