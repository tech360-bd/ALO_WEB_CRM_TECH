import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { generateSecureToken, MAIN_NUMBER } from '@/lib/whatsapp-number-pool';
import { sendWhatsAppMessage } from '@/lib/whatsapp-cloud-api';
import { mutationOriginAllowed } from '@/lib/request-origin';

export const POST = withAuth(async (req, auth) => {
  if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  try {
    const body = await req.json();
    const requestedStudentId = typeof body?.studentId === 'string' ? body.studentId.trim() : '';
    const language = typeof body?.language === 'string' ? body.language : 'mixed';
    if (!requestedStudentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 });

    const roles = new Set([auth.userType, ...auth.roles].map((role) => String(role).toUpperCase()));
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].some((role) => roles.has(role));
    if (!isAdmin && !roles.has('COUNSELOR')) {
      return NextResponse.json({ success: false, error: 'Only administrators or counselors may create student portal invitations.' }, { status: 403 });
    }
    const student = await db.student.findFirst({
      where: { OR: [{ id: requestedStudentId }, { studentId: requestedStudentId }] },
      select: { id: true, studentId: true, phone: true, email: true, counselorId: true },
    });
    if (!student) return NextResponse.json({ success: false, error: 'Student not found.' }, { status: 404 });
    if (!isAdmin && student.counselorId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Student is not assigned to this counselor.' }, { status: 403 });
    }
    const studentId = student.id;
    const phone = student.phone;
    const email = student.email;

    // Generate secure token
    const { raw, hash } = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Idempotency: check existing valid invitation
    const existing = await (db as any).studentPortalInvitation.findFirst({
      where: { studentId, isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    let invitation: any;
    let rawToken = raw;

    if (existing) {
      invitation = existing;
      rawToken = 'existing-token-not-exposed'; // Don't expose existing raw token
    } else {
      invitation = await (db as any).studentPortalInvitation.create({
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
      english: `Welcome to ALO Education. Activate your student portal: ${portalLink}. For account help, contact your assigned counselor through the portal.`,
      bangla: `ALO Education এ স্বাগতম। আপনার student portal চালু করুন: ${portalLink}. অ্যাকাউন্ট সহায়তার জন্য পোর্টালের মাধ্যমে আপনার নির্ধারিত কাউন্সেলরের সঙ্গে যোগাযোগ করুন।`,
      mixed: `Welcome to ALO Education. Portal activate korun: ${portalLink}. Account help er jonno portal diye assigned counselor er shathe contact korun.`,
    };

    const welcomeText = welcomeMessages[lang] || welcomeMessages['mixed'];

    let sendResult: any = null;
    if (!existing) {
      // Only send if new invitation
      sendResult = await sendWhatsAppMessage({
        to: phone,
        text: welcomeText,
        purpose: 'TRANSACTIONAL',
        actorId: auth.userId,
        employeeSenderId: auth.userId,
        studentId,
        senderNumber: MAIN_NUMBER,
      });

      if (sendResult?.success && sendResult.messageId) {
        await (db as any).studentPortalInvitation.update({
          where: { id: invitation.id },
          data: { invitationSent: true, sentAt: new Date() },
        });
      }
    }

    await (db as any).aloAuditLog.create({
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

    const invitations = await (db as any).studentPortalInvitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, invitations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
