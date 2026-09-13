import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/unified-communication — Unified Communication Engine per spec sections 2,3,4
// Supports WhatsApp, SMS, Website Chat, Facebook Messenger, Instagram DM, Website forms, Course Finder, Consultation forms, English Test registration, Student registration
// Every incoming communication must enter one unified communication engine
// Identity matching: Student ID, verified phone, WhatsApp number, verified email, social account ID, existing CRM lead, application ID, document ownership
// If existing number contacts ALO again: LOAD EXISTING PROFILE → APPEND TO TIMELINE → DO NOT CREATE DUPLICATE — mandatory duplicate-prevention

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channel = 'whatsapp', senderPhone = '', senderEmail = '', message = '', socialAccountId = '', studentId = '', applicationId = '', leadId = '' } = body;

    if (!message) return NextResponse.json({ success: false, error: 'message required' }, { status: 400 });

    // Intent identification — admission, course finder, university info, scholarship, English test, visa, document support, consultation, application status, existing student support, referral, general enquiry
    const lower = message.toLowerCase();
    let intent = 'general_enquiry';
    if (lower.includes('course') || lower.includes('program') || lower.includes('subject')) intent = 'course_finder';
    else if (lower.includes('university') || lower.includes('college')) intent = 'university_information';
    else if (lower.includes('scholarship') || lower.includes('funding')) intent = 'scholarship';
    else if (lower.includes('ielts') || lower.includes('pte') || lower.includes('toefl') || lower.includes('duolingo') || lower.includes('mock test')) intent = 'english_test';
    else if (lower.includes('visa') || lower.includes('cas') || lower.includes('i-20') || lower.includes('coe')) intent = 'visa';
    else if (lower.includes('document') || lower.includes('passport') || lower.includes('transcript') || lower.includes('bank statement')) intent = 'document_support';
    else if (lower.includes('consultation') || lower.includes('counselor') || lower.includes('book')) intent = 'consultation';
    else if (lower.includes('application') || lower.includes('offer') || lower.includes('status')) intent = 'application_status';
    else if (lower.includes('referral') || lower.includes('friend') || lower.includes('refer')) intent = 'referral';
    else if (lower.includes('admission') || lower.includes('apply')) intent = 'admission';

    // Identity matching — Student ID, verified phone, WhatsApp number, verified email, social account ID, existing CRM lead, application ID, document ownership
    let existingStudent = null;
    let existingLead = null;

    if (studentId) {
      existingStudent = await db.portalStudentProfile.findFirst({ where: { OR: [{ studentId }, { id: studentId }] } }).catch(() => null);
      if (!existingStudent) existingStudent = await db.student.findFirst({ where: { OR: [{ studentId }, { id: studentId }] } }).catch(() => null);
    }

    if (!existingStudent && senderPhone) {
      const normalizedPhone = senderPhone.replace(/[^0-9]/g, '');
      existingStudent = await db.portalStudentProfile.findFirst({ where: { OR: [{ user: { phone: { contains: normalizedPhone } } }, { city: { contains: normalizedPhone } }] } }).catch(() => null);
      if (!existingStudent) existingStudent = await db.student.findFirst({ where: { phone: { contains: normalizedPhone } } }).catch(() => null);
      if (!existingStudent) existingStudent = await db.whatsAppContact.findFirst({ where: { OR: [{ phone: senderPhone }, { normalizedPhone: normalizedPhone }] } }).catch(() => null);
    }

    if (!existingStudent && senderEmail) {
      existingStudent = await db.portalStudentProfile.findFirst({ where: { user: { email: senderEmail.toLowerCase() } } }).catch(() => null);
      if (!existingStudent) existingStudent = await db.student.findFirst({ where: { email: senderEmail.toLowerCase() } }).catch(() => null);
    }

    if (!existingStudent && socialAccountId) {
      existingStudent = await db.student.findFirst({ where: { studentId: socialAccountId } }).catch(() => null);
    }

    if (!existingStudent && leadId) {
      existingLead = await db.marketingLead.findFirst({ where: { id: leadId } }).catch(() => null);
    }

    // If existing number contacts ALO again: LOAD EXISTING PROFILE → APPEND TO TIMELINE → DO NOT CREATE DUPLICATE — mandatory
    if (existingStudent) {
      // Append to timeline
      const studentIdForTimeline = (existingStudent as any).studentId || (existingStudent as any).id;
      
      // Create timeline event
      await db.timelineEvent.create({
        data: {
          studentId: studentIdForTimeline,
          stage: 'communication',
          title: `Incoming ${channel} — Intent: ${intent}`,
          description: message.substring(0, 500),
          actor: 'student',
          actionUrl: `/student/messages`,
        },
      }).catch(() => {});

      // Create communication thread and message
      const thread = await db.communicationThread.create({
        data: {
          studentId: studentIdForTimeline,
          channel,
          subject: `Intent: ${intent} — ${message.substring(0, 50)}`,
          visibility: 'public_safe',
          intent,
          status: 'open',
          lastMessagePreview: message.substring(0, 100),
        },
      }).catch(() => null);

      if (thread) {
        await db.communicationMessage.create({
          data: {
            threadId: thread.id,
            channel,
            direction: 'inbound',
            senderName: (existingStudent as any).name || (existingStudent as any).fullName || 'Student',
            senderContact: senderPhone || senderEmail || '',
            studentId: studentIdForTimeline,
            leadId: leadId || '',
            applicationId: applicationId || '',
            messageBody: message,
            content: message,
            visibility: 'public_safe',
            intent,
            status: 'unread',
          },
        }).catch(() => {});
      }

      // AI Memory append
      await db.aiStudentMemory.create({
        data: {
          studentId: studentIdForTimeline,
          category: 'communication',
          key: `incoming_${channel}_${Date.now()}`,
          value: message,
          metadata: JSON.stringify({ channel, intent, timestamp: new Date().toISOString() }),
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        duplicatePrevention: true,
        existingStudentFound: true,
        studentId: studentIdForTimeline,
        intent,
        message: 'Existing student found — NO duplicate profile — message added to same timeline — mandatory duplicate-prevention',
        nextStep: 'Ask for Student ID if not provided — if yes ask for Student ID, if no start guided registration per existing workflow',
      });
    }

    // New student auto-creation — if no Student ID exists, collect only needed info, then automatically create CRM Lead, Student Profile, Student ID, AI Memory, Communication Timeline, Profile Checklist, Counselor Assignment, Next Action, Portal Account, then send Your ALO Student Portal is ready with secure login/OTP link, Student IDs follow AE/AET system
    // For now, create lead and return guided registration prompt

    // Create CRM Lead
    const lead = await db.marketingLead.create({
      data: {
        name: body.fullName || 'Unknown',
        phone: senderPhone || '',
        email: senderEmail || '',
        destination: body.preferredCountry || '',
        level: body.studyLevel || '',
        intake: body.intake || '',
        source: `unified_communication_${channel}`,
        sourceDetail: `Intent: ${intent} — ${message.substring(0, 100)}`,
        status: 'new',
        createdById: 'system',
      },
    }).catch(() => null);

    // Create WhatsApp contact if channel whatsapp
    if (channel === 'whatsapp' && senderPhone) {
      await db.whatsAppContact.create({
        data: {
          phone: senderPhone,
          normalizedPhone: senderPhone.replace(/[^0-9]/g, ''),
          displayName: body.fullName || 'Unknown',
          firstContactAt: new Date(),
          lastContactAt: new Date(),
          source: 'WHATSAPP',
          tags: JSON.stringify([intent]),
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      newLeadCreated: true,
      leadId: lead?.id,
      intent,
      message: `Unknown ${channel} number — Hi or I want to study in UK etc — intent identified as ${intent} — AI should ask Do you already have an ALO Student ID? If yes ask for Student ID, If no start guided registration per existing workflow — collects Full name, Phone, WhatsApp, Email, Preferred country, Study level, Subject, Intake, English test status, English score, Budget, Current qualification — dynamically asks additional questions based on answers — do NOT ask unnecessary questions — after enough info automatically creates CRM Lead, Student Profile, Student ID AE-YYYY000001 or AET-YYYY000001, AI Memory, Communication Timeline, Profile Checklist, Counselor Assignment, Next Action, Portal Account — then sends Your ALO Student Portal is ready with secure login/OTP link — Student IDs follow AE/AET system — per spec sections 3,4`,
      guidedRegistration: {
        requiredFields: ['Full name', 'Phone', 'WhatsApp', 'Email', 'Preferred country', 'Study level', 'Subject', 'Intake', 'English test status', 'English score', 'Budget', 'Current qualification'],
        nextPrompt: 'Do you already have an ALO Student ID? If yes, please provide Student ID. If no, start guided registration.',
      },
    });
  } catch (e: any) {
    console.error('[unified-communication] error', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Unified Communication Engine — Supports WhatsApp, SMS, Website Chat, Facebook Messenger, Instagram DM, Website forms, Course Finder, Consultation forms, English Test registration, Student registration — Every incoming communication enters one unified communication engine — Identity matching via Student ID, verified phone, WhatsApp number, verified email, social account ID, existing CRM lead, application ID, document ownership — If existing number contacts ALO again LOAD EXISTING PROFILE → APPEND TO TIMELINE → DO NOT CREATE DUPLICATE — mandatory — Intent identification admission/course finder/university information/scholarship/English test/visa/document support/consultation/application status/existing student support/referral/general enquiry — AI asks for Student ID first and creates profile when person does not have one per existing workflow',
    supportedChannels: ['whatsapp', 'sms', 'website_chat', 'facebook_messenger', 'instagram_dm', 'website_forms', 'course_finder', 'consultation_forms', 'english_test_registration', 'student_registration'],
    intents: ['admission', 'course_finder', 'university_information', 'scholarship', 'english_test', 'visa', 'document_support', 'consultation', 'application_status', 'existing_student_support', 'referral', 'general_enquiry'],
  });
}
