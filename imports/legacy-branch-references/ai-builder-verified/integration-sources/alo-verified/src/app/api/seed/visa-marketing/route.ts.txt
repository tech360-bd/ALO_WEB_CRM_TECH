import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

/**
 * Seeds all 23 SMS/WhatsApp templates required by the Visa Success System
 * and the Marketing Automation System, plus keyword triggers, brand colors,
 * n8n webhook placeholders, WhatsApp AI config, and SLA config.
 */
const SMS_TEMPLATES = [
  { templateId: 'SMS-WELCOME-001', templateName: 'New Student Welcome', triggerEvent: 'student_created', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Welcome to ALO Education, {{student_name}}! Your Student ID is {{student_id}}. Your assigned counselor is {{counselor_name}}. Login at aloeducation.com to start your journey.' },
  { templateId: 'SMS-PROFILE-002', templateName: 'Profile Incomplete Reminder', triggerEvent: 'profile_incomplete', roleVisibility: 'student', channel: 'sms', messageBody: 'Hi {{student_name}}, your ALO profile is {{completion_percent}}% complete. Please complete it to proceed with your application. Login: aloeducation.com' },
  { templateId: 'SMS-DOC-MISSING-003', templateName: 'Document Missing Reminder', triggerEvent: 'document_missing', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Dear {{student_name}}, your {{document_type}} is missing. Please upload it at aloeducation.com/student/documents to avoid delays in your application.' },
  { templateId: 'SMS-DOC-APPROVED-004', templateName: 'Document Approved', triggerEvent: 'document_approved', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Good news {{student_name}}! Your {{document_type}} has been approved by ALO Education. {{approved_count}} of {{total_count}} documents verified.' },
  { templateId: 'SMS-DOC-REJECTED-005', templateName: 'Document Rejected / Request Again', triggerEvent: 'document_rejected', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Hi {{student_name}}, your {{document_type}} needs correction. Reason: {{rejection_reason}}. Please re-upload at aloeducation.com/student/documents' },
  { templateId: 'SMS-COURSE-REC-006', templateName: 'Course Recommendation', triggerEvent: 'course_recommended', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Hi {{student_name}}, we found {{count}} courses matching your profile. Top match: {{course_name}} at {{university_name}}, {{country}}. View all at aloeducation.com/student/course-finder' },
  { templateId: 'SMS-APP-CREATED-007', templateName: 'Application Created', triggerEvent: 'application_created', roleVisibility: 'student', channel: 'sms', messageBody: 'Your application {{application_id}} for {{course_name}} at {{university_name}} has been created. Application Team will review shortly.' },
  { templateId: 'SMS-APP-SUBMITTED-008', templateName: 'Application Submitted', triggerEvent: 'application_submitted', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Application {{application_id}} has been submitted to {{university_name}}. Expected response time: {{tat_days}} days. Track at aloeducation.com/student/applications' },
  { templateId: 'SMS-COND-OFFER-009', templateName: 'Conditional Offer Received', triggerEvent: 'conditional_offer', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Congratulations {{student_name}}! Conditional offer received from {{university_name}} for {{course_name}}. Conditions: {{conditions}}. Next: pay deposit.' },
  { templateId: 'SMS-UNCOND-OFFER-010', templateName: 'Unconditional Offer Received', triggerEvent: 'unconditional_offer', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Excellent {{student_name}}! Unconditional offer from {{university_name}} confirmed. Next step: CAS/I-20/COE processing.' },
  { templateId: 'SMS-DEPOSIT-PENDING-011', templateName: 'Deposit Reminder', triggerEvent: 'deposit_pending', roleVisibility: 'student', channel: 'sms', messageBody: 'Reminder: Tuition deposit of {{currency}} {{amount}} to {{university_name}} is due by {{deadline}}. Pay now to secure your offer.' },
  { templateId: 'SMS-DEPOSIT-PAID-012', templateName: 'Deposit Paid Confirmation', triggerEvent: 'deposit_paid', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Deposit received for {{university_name}}. CAS/I-20/COE processing will begin. Estimated processing time: {{tat_days}} days.' },
  { templateId: 'SMS-CAS-PENDING-013', templateName: 'CAS/I-20/COE Pending', triggerEvent: 'cas_pending', roleVisibility: 'student', channel: 'sms', messageBody: 'Your CAS/I-20/COE from {{university_name}} is being processed. We will notify you as soon as it is received.' },
  { templateId: 'SMS-CAS-RECEIVED-014', templateName: 'CAS/I-20/COE Received', triggerEvent: 'cas_received', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Your {{document_type}} from {{university_name}} has been received. Visa file preparation begins now. Reference: {{reference_number}}' },
  { templateId: 'SMS-VISA-STARTED-015', templateName: 'Visa File Started', triggerEvent: 'visa_file_started', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Visa file preparation started. Assigned Visa Officer: {{visa_officer_name}}. Upload remaining documents at aloeducation.com/student/documents' },
  { templateId: 'SMS-FINANCE-PENDING-016', templateName: 'Financial Proof Reminder', triggerEvent: 'financial_docs_pending', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Action needed: Submit bank statement (28 days), bank solvency, sponsor letter, affidavit, and tax documents for visa file review.' },
  { templateId: 'SMS-INTERVIEW-017', templateName: 'Interview Practice Reminder', triggerEvent: 'interview_pending', roleVisibility: 'student', channel: 'sms', messageBody: 'Complete your mock interview practice before visa submission. Practice at aloeducation.com/student/interview-practice' },
  { templateId: 'SMS-VISA-READY-018', templateName: 'Visa File Ready', triggerEvent: 'visa_file_ready', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Your visa file is ready for submission. Visa Officer: {{visa_officer_name}}. Next: biometrics appointment scheduling.' },
  { templateId: 'SMS-VISA-SUBMITTED-019', templateName: 'Visa Submitted', triggerEvent: 'visa_submitted', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Visa application submitted to {{embassy_name}}. Reference: {{reference_number}}. Biometrics appointment: {{biometrics_date}}' },
  { templateId: 'SMS-BIOMETRICS-020', templateName: 'Biometrics Reminder', triggerEvent: 'biometrics_scheduled', roleVisibility: 'student', channel: 'sms', messageBody: 'Biometrics appointment on {{appointment_date}} at {{location}}. Bring: passport, appointment letter, 2 photos. Arrive 30 min early.' },
  { templateId: 'SMS-DECISION-PENDING-021', templateName: 'Decision Pending Update', triggerEvent: 'visa_decision_pending', roleVisibility: 'student', channel: 'sms', messageBody: 'Your visa decision is pending. Standard processing time: {{processing_days}} days. We will notify you immediately when a decision is made.' },
  { templateId: 'SMS-VISA-APPROVED-022', templateName: 'Visa Approved', triggerEvent: 'visa_approved', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'CONGRATULATIONS {{student_name}}! Your visa is APPROVED. Next: pre-departure briefing. Book your flight and arrange accommodation.' },
  { templateId: 'SMS-VISA-REJECTED-023', templateName: 'Visa Rejected', triggerEvent: 'visa_rejected', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'We regret to inform you that your visa application was not successful. Your counselor will contact you within 24 hours to discuss refusal review and reapplication options.' },
  { templateId: 'SMS-PREDEPART-024', templateName: 'Pre-Departure Checklist', triggerEvent: 'pre_departure_started', roleVisibility: 'student', channel: 'whatsapp', messageBody: 'Time to prepare for departure! Complete your pre-departure checklist at aloeducation.com/student/pre-departure. Join our pre-departure webinar on {{webinar_date}}.' },
];

const KEYWORD_TRIGGERS = [
  { keyword: 'study abroad', autoReplyText: 'Hi! Thanks for your interest in studying abroad. ALO Education helps students apply to UK, Canada, Australia, USA, Ireland, and more. Share your phone/email and our counselor will contact you within 24 hours.', autoDmText: 'Welcome to ALO Education! To help you best, please share: 1) Your target country 2) Your preferred course 3) Your education level. A counselor will reach out shortly.' },
  { keyword: 'ielts', autoReplyText: 'IELTS questions? ALO Education provides free IELTS resources and mock tests. Visit aloeducation.com/student/resources or book a free consultation.', autoDmText: 'IELTS Resources: We offer free IELTS preparation guides, mock tests, and 1-on-1 coaching. What is your target score and test date?' },
  { keyword: 'visa', autoReplyText: 'Visa questions? Our visa officers help with UK, Canada, Australia, USA student visas. Share your situation and we will guide you.', autoDmText: 'Visa Support: Our team handles student visa applications, document checklists, and interview prep. Which country visa are you applying for?' },
  { keyword: 'uk', autoReplyText: 'Study in the UK! ALO Education is partnered with 100+ UK universities. Scholarships available. Share your course interest.', autoDmText: 'UK Study: Top courses include MBA, Computer Science, Engineering, Business. Tuition starts from £10,000/year. What course interests you?' },
  { keyword: 'canada', autoReplyText: 'Study in Canada! Affordable tuition, post-graduation work permit, PR pathway. ALO Education can help you apply.', autoDmText: 'Canada Study: Popular courses include IT, Business, Healthcare, Engineering. PGWP eligible. What is your education background?' },
  { keyword: 'australia', autoReplyText: 'Study in Australia! World-class universities, post-study work rights. ALO Education partners with Group of Eight universities.', autoDmText: 'Australia Study: Top universities include Melbourne, Sydney, ANU, Monash. Tuition ~AUD 20,000-45,000/year. What course?' },
  { keyword: 'scholarship', autoReplyText: 'Scholarship info! ALO Education helps students access scholarships up to 100% tuition. Share your academic profile.', autoDmText: 'Scholarships: Available for merit, need, country-specific, and course-specific. What is your GPA and target course?' },
  { keyword: 'apply', autoReplyText: 'Ready to apply? ALO Education offers free application support. Share your email/phone and we will start your application today.', autoDmText: 'Application Help: Our counselors handle everything from course selection to visa. Please share your phone number to begin.' },
];

const BRAND_COLORS = [
  { name: 'Primary Blue', value: '#0057B8' },
  { name: 'CTA Orange', value: '#E8501A' },
  { name: 'White Background', value: '#FFFFFF' },
  { name: 'Text Dark', value: '#0F172A' },
  { name: 'Success Green', value: '#10B981' },
  { name: 'Warning Amber', value: '#F59E0B' },
  { name: 'Danger Red', value: '#EF4444' },
];

const N8N_WEBHOOKS = [
  { name: 'Lead Auto-Sync', workflowType: 'lead_sync', isActive: false },
  { name: 'Follow-up Sequence', workflowType: 'follow_up', isActive: false },
  { name: 'WhatsApp Auto-Reply', workflowType: 'whatsapp_sequence', isActive: false },
  { name: 'Email Campaign Sequence', workflowType: 'email_sequence', isActive: false },
  { name: 'SMS Campaign Sequence', workflowType: 'sms_sequence', isActive: false },
  { name: 'Weekly Campaign Report', workflowType: 'campaign_report', isActive: false },
  { name: 'Counselor Notification', workflowType: 'counselor_notify', isActive: false },
];

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const force = body.force === true;

    const results = {
      smsTemplates: { created: 0, skipped: 0 },
      keywordTriggers: { created: 0, skipped: 0 },
      brandColors: { created: 0, skipped: 0 },
      webhooks: { created: 0, skipped: 0 },
      whatsappAiConfig: { created: false, existed: false },
      slaConfig: { created: false, existed: false },
    };

    // 1. SMS Templates
    for (const tpl of SMS_TEMPLATES) {
      const existing = await db.smsTemplate.findUnique({ where: { templateId: tpl.templateId } });
      if (existing) {
        results.smsTemplates.skipped++;
        if (!force) continue;
        await db.smsTemplate.update({ where: { templateId: tpl.templateId }, data: tpl });
      } else {
        await db.smsTemplate.create({ data: { ...tpl, status: 'active' } });
        results.smsTemplates.created++;
      }
    }

    // 2. Keyword Triggers
    for (const kw of KEYWORD_TRIGGERS) {
      const existing = await db.keywordTrigger.findUnique({ where: { keyword_platform: { keyword: kw.keyword, platform: 'all' } } }).catch(() => null);
      if (existing) {
        results.keywordTriggers.skipped++;
        continue;
      }
      await db.keywordTrigger.create({
        data: {
          keyword: kw.keyword,
          platform: 'all',
          autoReplyText: kw.autoReplyText,
          autoDmText: kw.autoDmText,
          createLead: true,
          status: 'active',
        },
      }).catch(() => { results.keywordTriggers.skipped++; results.keywordTriggers.created--; });
      results.keywordTriggers.created++;
    }

    // 3. Brand Colors
    for (const color of BRAND_COLORS) {
      const existing = await db.brandAsset.findFirst({ where: { name: color.name, assetType: 'color_palette' } });
      if (existing) {
        results.brandColors.skipped++;
        continue;
      }
      await db.brandAsset.create({
        data: {
          assetType: 'color_palette',
          name: color.name,
          value: color.value,
          isPrimary: color.name === 'Primary Blue',
          status: 'active',
        },
      });
      results.brandColors.created++;
    }

    // 4. n8n Webhooks
    for (const wh of N8N_WEBHOOKS) {
      const existing = await db.n8nWebhook.findFirst({ where: { name: wh.name } });
      if (existing) {
        results.webhooks.skipped++;
        continue;
      }
      await db.n8nWebhook.create({ data: wh });
      results.webhooks.created++;
    }

    // 5. WhatsApp AI Config
    const existingAiConfig = await db.whatsappAiConfig.findFirst({ where: { scope: 'global' } });
    if (existingAiConfig) {
      results.whatsappAiConfig.existed = true;
    } else {
      await db.whatsappAiConfig.create({
        data: {
          scope: 'global',
          aiEnabled: true,
          officeHoursOnly: true,
          businessHoursStart: '10:00',
          businessHoursEnd: '18:00',
          timezone: 'Asia/Dhaka',
          requireOtpForPrivate: true,
          humanHandoffKeywords: 'complaint,refund,refuse,refusal,angry,emergency,payment issue,cheating,fraud,sue',
        },
      });
      results.whatsappAiConfig.created = true;
    }

    // 6. SLA Config
    const existingSla = await db.slaConfig.findFirst({ where: { active: true } });
    if (existingSla) {
      results.slaConfig.existed = true;
    } else {
      await db.slaConfig.create({
        data: {
          name: 'WhatsApp SLA - 40/20/10',
          module: 'message',
          firstReminderMinutes: 40,
          secondReminderMinutes: 20,
          finalReminderMinutes: 10,
          escalationLevel1: 'counselor',
          escalationLevel2: 'branch_manager',
          escalationLevel3: 'ceo',
          businessHoursStart: '10:00',
          businessHoursEnd: '18:00',
          timezone: 'Asia/Dhaka',
          active: true,
        },
      });
      results.slaConfig.created = true;
    }

    return NextResponse.json({
      success: true,
      message: 'Visa Success System & Marketing Automation seed completed',
      results,
      summary: {
        smsTemplates: `${results.smsTemplates.created} created, ${results.smsTemplates.skipped} existing`,
        keywordTriggers: `${results.keywordTriggers.created} created, ${results.keywordTriggers.skipped} existing`,
        brandColors: `${results.brandColors.created} created, ${results.brandColors.skipped} existing`,
        webhooks: `${results.webhooks.created} created, ${results.webhooks.skipped} existing`,
        whatsappAiConfig: results.whatsappAiConfig.created ? 'created' : 'already exists',
        slaConfig: results.slaConfig.created ? 'created' : 'already exists',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Seed visa-marketing error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}

export async function GET() {
  const counts = await Promise.all([
    db.smsTemplate.count(),
    db.keywordTrigger.count(),
    db.brandAsset.count(),
    db.n8nWebhook.count(),
    db.whatsappAiConfig.count(),
    db.slaConfig.count(),
    db.financialProofReview.count(),
    db.preDepartureChecklist.count(),
    db.studentTimeline.count(),
    db.riskFlag.count(),
    db.socialComment.count(),
    db.commentLead.count(),
    db.slaEscalation.count(),
    db.postApproval.count(),
  ]);
  return NextResponse.json({
    smsTemplates: counts[0],
    keywordTriggers: counts[1],
    brandAssets: counts[2],
    n8nWebhooks: counts[3],
    whatsappAiConfigs: counts[4],
    slaConfigs: counts[5],
    financialProofReviews: counts[6],
    preDepartureChecklists: counts[7],
    studentTimelineEntries: counts[8],
    riskFlags: counts[9],
    socialComments: counts[10],
    commentLeads: counts[11],
    slaEscalations: counts[12],
    postApprovals: counts[13],
  });
}
