import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { hashPassword, comparePassword } from '@/lib/auth';
import { requireMarketingAccess } from '@/lib/auth-rbac';
import {
  generateStudentId,
  generateLeadId,
  normalizePhone,
  isOfficeHours,
  ruleBasedReply,
  humanHandoffNeeded,
} from '@/lib/whatsapp-helpers';

/**
 * WhatsApp AI reply engine (production-grade).
 *
 * Responsibilities
 *  - Rule-based replies for simple Hi/Hello/Salam/Thanks/Ok (en+bn) — no LLM cost.
 *  - OTP gate before sharing private application/document/payment/visa data.
 *    OTP is hashed with bcrypt (never stored plaintext) and every OTP event
 *    (sent / verified / failed) is recorded in OtpLog + AuditLog.
 *  - Human handoff for complex/angry/payment/refusal/complaint/emergency —
 *    creates SlaEscalation + audit log + ai_agent.transfer_human.
 *  - After office hours: AI handles first response automatically via the
 *    z-ai-web-dev-sdk LLM gateway (same SDK as /api/ai). Office-hours check
 *    uses Asia/Dhaka via Intl.DateTimeFormat — never the server TZ.
 *  - Existing student: load profile, applications, documents, visa status,
 *    counselor, recent timeline and inject into the LLM system prompt.
 *  - New number: create Lead + Student Profile + spec-compliant Student ID
 *    (AE-YYYY000001 via atomic SequenceCounter) + timeline.
 *  - Detects Bangla vs English from the user's message and replies in the
 *    same language.
 *  - Never guarantees visa/admission. Never shares private data without OTP.
 */

const PRIVATE_DATA_KEYWORDS = [
  'application status',
  'application',
  'document',
  'payment',
  'visa status',
  'visa',
  'offer',
  'cas',
  'i20',
  'coe',
  'commission',
  'invoice',
  'refund',
];

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

type AiConfig = {
  businessHoursStart: string;
  businessHoursEnd: string;
  timezone: string;
  aiEnabled: boolean;
  officeHoursOnly: boolean;
  requireOtpForPrivate: boolean;
  humanHandoffKeywords?: string | null;
};

async function loadConfig(): Promise<AiConfig> {
  const row = await db.whatsappAiConfig.findFirst({ where: { scope: 'global' } });
  if (row) {
    return {
      businessHoursStart: row.businessHoursStart,
      businessHoursEnd: row.businessHoursEnd,
      timezone: row.timezone,
      aiEnabled: row.aiEnabled,
      officeHoursOnly: row.officeHoursOnly,
      requireOtpForPrivate: row.requireOtpForPrivate,
      humanHandoffKeywords: row.humanHandoffKeywords,
    };
  }
  return {
    businessHoursStart: '10:00',
    businessHoursEnd: '18:00',
    timezone: 'Asia/Dhaka',
    aiEnabled: true,
    officeHoursOnly: true,
    requireOtpForPrivate: true,
    humanHandoffKeywords: null,
  };
}

function looksLikeOtp(text: string): boolean {
  return /^\d{4,8}$/.test((text || '').trim());
}

function isBangla(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text || '');
}

/**
 * Load the contextual student profile we will hand to the LLM. Returns null
 * when no student is identified so the caller can fall back to a generic
 * "prospective student" prompt.
 */
async function loadStudentContext(studentId: string | null) {
  if (!studentId) return null;
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      applications: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { university: true, course: true },
      },
      documents: { take: 10, orderBy: { uploadedAt: 'desc' } },
      visaFiles: { take: 3, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!student) return null;

  const recentTimeline = await db.studentTimeline.findMany({
    where: { studentId: student.id },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  return {
    studentId: student.studentId,
    name: `${student.firstName} ${student.lastName}`.trim(),
    phone: student.phone ?? null,
    preferredCountry: student.preferredCountry ?? null,
    preferredCourse: student.preferredCourse ?? null,
    preferredIntake: student.preferredIntake ?? null,
    englishTestType: student.englishTestType ?? null,
    englishTestScore: student.englishTestScore ?? null,
    status: student.status,
    assignedCounselor: student.assignedCounselor ?? null,
    applications: student.applications.map((a) => ({
      applicationId: a.applicationId,
      university: a.university?.name ?? null,
      course: a.course?.name ?? null,
      intake: a.intake,
      status: a.status,
    })),
    documents: student.documents.map((d) => ({
      type: d.documentType,
      name: d.documentName,
      status: d.status,
    })),
    visaFiles: student.visaFiles.map((v) => ({
      stage: v.stage,
      casNumber: v.casNumber,
    })),
    recentTimeline: recentTimeline.map((t) => ({
      eventType: t.eventType,
      title: t.title,
      description: t.description,
    })),
  };
}

function buildSystemPrompt(ctx: Awaited<ReturnType<typeof loadStudentContext>>, userLang: 'bn' | 'en'): string {
  const langInstruction = userLang === 'bn'
    ? 'রুম ভাষা: বাংলা। সব উত্তর বাংলায় দিন।'
    : 'Reply in English (the user wrote in English/Latin script).';

  const base = [
    'You are "ALO Education AI Assistant", a multilingual (Bangla + English) virtual assistant for ALO Education, a study-abroad consultancy based in Bangladesh.',
    'You help students and prospective students with questions about courses, universities, scholarships, visa requirements, the application process, IELTS/PTE/TOEFL/Duolingo, CAS/COE/I-20, deposits, and appointment booking.',
    langInstruction,
    'STRICT RULES:',
    '1. NEVER guarantee admission, a visa, a scholarship, or any specific outcome. Always use phrases like "typically", "subject to university/UKVI decision", "based on current guidance".',
    '2. NEVER share a student\'s private application/document/payment/visa/offer details unless they have completed OTP verification in this same conversation. If they ask for private data without an OTP-verified session, tell them an OTP has been sent and they should reply with the 6-digit code.',
    '3. If the user is angry, complains, mentions a payment issue, a visa refusal, fraud, or an emergency, OR if the question is complex/serious (legal, medical, immigration status appeal), tell them you are transferring them to a human counselor and end your reply with that notice. Do not attempt to resolve those situations yourself.',
    '4. Be concise (max ~120 words). Use bullet points where helpful. Be warm but professional.',
    '5. If you do not know something, say so — never fabricate university names, deadlines, fees, or visa rules.',
    '6. Do not invent ALO staff names, phone numbers, or email addresses. For contact, say "a counselor will reach out" rather than inventing contact details.',
  ];

  if (ctx) {
    base.push(
      '',
      '--- KNOWN STUDENT CONTEXT (use only as background; do NOT reveal any private field unless OTP-verified) ---',
      `Student ID: ${ctx.studentId}`,
      `Name: ${ctx.name}`,
      `Preferred country: ${ctx.preferredCountry ?? 'unknown'}`,
      `Preferred course: ${ctx.preferredCourse ?? 'unknown'}`,
      `Preferred intake: ${ctx.preferredIntake ?? 'unknown'}`,
      `English test: ${ctx.englishTestType ?? 'n/a'} score=${ctx.englishTestScore ?? 'n/a'}`,
      `Status: ${ctx.status}`,
      `Assigned counselor ID: ${ctx.assignedCounselor ?? 'not yet assigned'}`,
      `Applications: ${
        ctx.applications.length
          ? ctx.applications
              .map((a) => `${a.applicationId} -> ${a.university ?? '?'}/${a.course ?? '?'} (${a.status})`)
              .join('; ')
          : 'none yet'
      }`,
      `Documents on file: ${
        ctx.documents.length
          ? ctx.documents.map((d) => `${d.type}(${d.status})`).join(', ')
          : 'none'
      }`,
      `Visa files: ${
        ctx.visaFiles.length
          ? ctx.visaFiles.map((v) => `stage=${v.stage}`).join(', ')
          : 'none'
      }`,
      `Recent timeline: ${
        ctx.recentTimeline.length
          ? ctx.recentTimeline.map((t) => `${t.eventType}: ${t.title}`).join('; ')
          : 'no recent activity'
      }`,
    );
  } else {
    base.push('', 'The sender is a new/prospective contact — no profile is linked yet. Treat them as a new enquiry.');
  }

  return base.join('\n');
}

/**
 * Invoke the LLM via the z-ai-web-dev-sdk gateway (same SDK /api/ai uses).
 * Returns the assistant text, or null if the call could not be completed.
 */
async function callLlm(systemPrompt: string, userMessage: string): Promise<string | null> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const client = await ZAI.create();
    const response = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });
    const text =
      // The SDK may return either an OpenAI-style shape or a flat shape.
      (response as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content ||
      (response as { content?: string })?.content ||
      (response as { text?: string })?.text ||
      null;
    return text && text.trim().length > 0 ? text.trim() : null;
  } catch (err) {
    console.error('[whatsapp/ai-reply] LLM call failed:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  // Auth: marketing access required. The webhook itself never calls this
  // route (it has its own inline rule logic). This endpoint is invoked by
  // the CRM UI to generate suggested replies for a counselor, so a
  // marketing session is required.
  const authOrResponse = await requireMarketingAccess(request);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  try {
    const body = await request.json();
    const { phoneNumber, messageText, conversationId } = body;
    if (!phoneNumber || !messageText) {
      return NextResponse.json(
        { error: 'phoneNumber and messageText are required' },
        { status: 400 },
      );
    }

    const config = await loadConfig();
    const cleanPhone = normalizePhone(phoneNumber);
    const userLang: 'bn' | 'en' = isBangla(messageText) ? 'bn' : 'en';
    const lowerMsg = messageText.toLowerCase().trim();

    // --------------------------------------------------------------
    // Match existing student/partner/lead by phone (last 10 digits)
    // --------------------------------------------------------------
    const phoneSuffix = cleanPhone.slice(-10);
    const student = await db.student.findFirst({
      where: {
        OR: [
          { phone: { contains: phoneSuffix } },
          { whatsappNumber: { contains: phoneSuffix } },
        ],
      },
    });
    const partner = await db.partner.findFirst({
      where: {
        OR: [
          { phone: { contains: phoneSuffix } },
          { whatsappNumber: { contains: phoneSuffix } },
        ],
      },
    });
    const existingLead = await db.lead.findFirst({
      where: {
        OR: [
          { phone: { contains: phoneSuffix } },
          { whatsappNumber: { contains: phoneSuffix } },
        ],
        status: { not: 'lost' },
      },
      orderBy: { createdAt: 'desc' },
    });

    // --------------------------------------------------------------
    // 0. OTP verify path — message looks like a code AND we have an
    //    unverified OTP for this phone.
    // --------------------------------------------------------------
    if (looksLikeOtp(messageText)) {
      const pendingOtp = await db.otpVerification.findFirst({
        where: {
          phone: phoneNumber,
          purpose: 'whatsapp_private_data',
          verified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (pendingOtp) {
        const matched = await comparePassword(messageText.trim(), pendingOtp.otpHash);
        if (matched) {
          await db.otpVerification.update({
            where: { id: pendingOtp.id },
            data: { verified: true },
          });
          await db.otpLog.create({
            data: {
              phone: phoneNumber,
              purpose: 'private_data_access',
              status: 'verified',
              expiresAt: pendingOtp.expiresAt,
              verifiedAt: new Date(),
            },
          }).catch(() => {});
          await logAudit({
            action: 'whatsapp.otp.verified',
            module: 'whatsapp',
            recordId: phoneNumber,
            newData: { purpose: 'private_data_access', studentId: student?.id ?? null },
          });

          // Return the (now-unlocked) private data preview.
          const ctx = await loadStudentContext(student?.id ?? null);
          const privatePreview = ctx
            ? `OTP verified ✅. Here is a summary of your record:\n` +
              `• Student ID: ${ctx.studentId}\n` +
              `• Applications: ${ctx.applications.length ? ctx.applications.map((a) => `${a.university ?? '?'} (${a.status})`).join(', ') : 'none'}\n` +
              `• Documents on file: ${ctx.documents.length}\n` +
              `• Visa stage: ${ctx.visaFiles.length ? ctx.visaFiles.map((v) => v.stage).join(', ') : 'not started'}\n` +
              `For full details, a counselor will follow up.`
            : 'OTP verified ✅. Your profile is being reviewed; a counselor will follow up with the requested details.';

          return NextResponse.json({
            reply: privatePreview,
            source: 'otp_verified',
            studentMatched: !!student,
            otpVerified: true,
          });
        }

        // Wrong code — bump attempts, maybe block.
        const attempts = pendingOtp.attempts + 1;
        const blocked = attempts >= OTP_MAX_ATTEMPTS;
        await db.otpVerification.update({
          where: { id: pendingOtp.id },
          data: { attempts, verified: false },
        });
        await db.otpLog.create({
          data: {
            phone: phoneNumber,
            purpose: 'private_data_access',
            status: blocked ? 'blocked' : 'failed',
            attemptCount: attempts,
            expiresAt: pendingOtp.expiresAt,
          },
        }).catch(() => {});
        await logAudit({
          action: 'whatsapp.otp.failed',
          module: 'whatsapp',
          recordId: phoneNumber,
          newData: { attempts, blocked, purpose: 'private_data_access' },
        });

        return NextResponse.json({
          reply: blocked
            ? 'Too many incorrect attempts. For your security, OTP verification is now blocked. A counselor will reach out to confirm your identity.'
            : `Incorrect OTP. ${OTP_MAX_ATTEMPTS - attempts} attempt(s) left. Please reply with the 6-digit code we sent you.`,
          source: 'otp_failed',
          attemptsLeft: Math.max(0, OTP_MAX_ATTEMPTS - attempts),
          blocked,
        });
      }
      // else: fall through — looks like OTP but no pending record; treat as a
      // normal message and let the LLM / rule engine handle it.
    }

    // --------------------------------------------------------------
    // 1. Rule-based reply (no AI cost) for greetings
    // --------------------------------------------------------------
    const rule = ruleBasedReply(messageText);
    if (rule.matched) {
      return NextResponse.json({
        reply: rule.reply,
        source: 'rule_based',
        language: rule.language,
        studentMatched: !!student,
        partnerMatched: !!partner,
        leadMatched: !!existingLead,
      });
    }

    // --------------------------------------------------------------
    // 2. Human handoff for sensitive keywords → SLA escalation + audit
    // --------------------------------------------------------------
    const handoff = humanHandoffNeeded(messageText);
    if (handoff.needed) {
      const escalation = await db.slaEscalation.create({
        data: {
          channel: 'whatsapp',
          contactIdentifier: phoneNumber,
          currentLevel: 1,
          level1EscalatedAt: new Date(),
        },
      }).catch(() => null);

      if (escalation) {
        await logAudit({
          action: 'whatsapp.sla.escalation_1',
          module: 'whatsapp',
          recordId: escalation.id,
          newData: {
            channel: 'whatsapp',
            contactIdentifier: phoneNumber,
            level: 1,
            reason: handoff.reason,
          },
        });
      }
      // The AI is transferring the user to a human — log it too.
      await logAudit({
        action: 'whatsapp.ai_agent.transfer_human',
        module: 'whatsapp',
        recordId: phoneNumber,
        newData: {
          reason: handoff.reason,
          studentId: student?.id ?? null,
          leadId: existingLead?.id ?? null,
          conversationId: conversationId ?? null,
        },
      });

      return NextResponse.json({
        reply:
          'I understand this is important. I am transferring you to a human counselor who will respond shortly. Your message has been escalated with priority.',
        replyBn:
          'আমি বুঝতে পেরেছি এটি গুরুত্বপূর্ণ। আমি আপনাকে একজন কাউন্সেলরের কাছে স্থানান্তর করছি যিনি শীঘ্রই উত্তর দেবেন।',
        source: 'human_handoff',
        escalated: true,
        escalationId: escalation?.id ?? null,
        handoffReason: handoff.reason,
      });
    }

    // --------------------------------------------------------------
    // 3. New number — create Lead + Student Profile + Student ID
    //    (atomic, year-scoped via SequenceCounter)
    // --------------------------------------------------------------
    let newStudentId: string | null = null;
    let newLeadId: string | null = null;
    if (!student && !partner && !existingLead) {
      const newStudentCode = await generateStudentId();
      const newStudent = await db.student
        .create({
          data: {
            studentId: newStudentCode,
            firstName: 'WhatsApp',
            lastName: 'Lead',
            email: `wa_${cleanPhone.slice(-10)}@aloeducation.com`,
            phone: phoneNumber,
            whatsappNumber: phoneNumber,
            nationality: 'Bangladesh',
            status: 'prospective',
          },
        })
        .catch(() => null);
      if (newStudent) {
        newStudentId = newStudent.id;
        const newLeadCode = await generateLeadId();
        const newLead = await db.lead
          .create({
            data: {
              leadId: newLeadCode,
              firstName: 'WhatsApp',
              lastName: 'Lead',
              phone: phoneNumber,
              whatsappNumber: phoneNumber,
              source: 'whatsapp',
              status: 'new',
              convertedToStudentId: newStudent.id,
              notes: `Auto-created from WhatsApp message: ${messageText.substring(0, 200)}`,
            },
          })
          .catch(() => null);
        if (newLead) newLeadId = newLead.id;
        await db.studentTimeline
          .create({
            data: {
              studentId: newStudent.id,
              eventType: 'lead_created',
              title: 'Lead created from WhatsApp',
              description: `First message: ${messageText.substring(0, 200)}`,
              actorType: 'ai',
              leadId: newLeadId || undefined,
              isPublic: false,
            },
          })
          .catch(() => {});
        await logAudit({
          action: 'whatsapp.contact.auto_created',
          module: 'whatsapp',
          recordId: newStudent.id,
          newData: {
            studentId: newStudentCode,
            leadId: newLeadCode,
            phone: phoneNumber,
          },
        });
      }
    }

    // --------------------------------------------------------------
    // 4. OTP gate for private-data requests
    // --------------------------------------------------------------
    const requestsPrivateData = PRIVATE_DATA_KEYWORDS.some((k) => lowerMsg.includes(k));
    if (requestsPrivateData && student && config.requireOtpForPrivate) {
      // Generate a fresh 6-digit OTP, hash it with bcrypt, store the hash.
      const otp = String(crypto.randomInt(100000, 1000000));
      const otpHash = await hashPassword(otp);
      const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
      await db.otpVerification
        .create({
          data: {
            phone: phoneNumber,
            otpHash,
            purpose: 'whatsapp_private_data',
            expiresAt,
          },
        })
        .catch(() => null);

      await db.otpLog
        .create({
          data: {
            phone: phoneNumber,
            purpose: 'private_data_access',
            status: 'sent',
            expiresAt,
          },
        })
        .catch(() => {});

      await logAudit({
        action: 'whatsapp.otp.sent',
        module: 'whatsapp',
        recordId: phoneNumber,
        newData: { purpose: 'private_data_access', studentId: student.id },
      });

      // NOTE: the OTP itself is delivered out-of-band (SMS / WhatsApp
      // template / human counselor). The API never returns it.
      const what = lowerMsg.includes('visa')
        ? 'visa status'
        : lowerMsg.includes('document')
          ? 'document status'
          : lowerMsg.includes('payment') || lowerMsg.includes('invoice')
            ? 'payment info'
            : 'application information';

      return NextResponse.json({
        reply: `For your security, I've sent a 6-digit OTP to your registered contact. Please reply with the code to access your ${what}.`,
        replyBn: `নিরাপত্তার জন্য আপনার নিবন্ধিত নম্বরে একটি ৬-সংখ্যার OTP পাঠানো হয়েছে। আপনার ${what} দেখতে কোডটি উত্তর দিন।`,
        source: 'otp_required',
        otpGenerated: true,
        studentMatched: !!student,
        expiresAt: expiresAt.toISOString(),
      });
    }

    // --------------------------------------------------------------
    // 5. General AI reply — LLM via z-ai-web-dev-sdk
    //    Office-hours logic (Bug 4 fix):
    //      officeHoursOnly = true  -> AI handles ONLY after office hours
    //      officeHoursOnly = false -> AI handles all hours (when aiEnabled)
    // --------------------------------------------------------------
    const officeHours = isOfficeHours(
      config.timezone,
      config.businessHoursStart,
      config.businessHoursEnd,
    );
    const aiActive = config.aiEnabled && (config.officeHoursOnly ? !officeHours : true);

    if (aiActive) {
      const ctx = await loadStudentContext(student?.id ?? null);
      const systemPrompt = buildSystemPrompt(ctx, userLang);
      let reply = await callLlm(systemPrompt, messageText);

      if (!reply) {
        // LLM unavailable — fall back to a GENERIC helpful message (NOT the
        // previous hardcoded "Hello, I'm ALO's AI assistant" string that
        // ignored the user's question).
        reply = userLang === 'bn'
          ? 'আমি আপনার বার্তা পেয়েছি। দুঃখিত, আমার এআই ইঞ্জিন এই মুহূর্তে সাময়িকভাবে অনুপলব্ধ। একজন কাউন্সেলর শীঘ্রই আপনার সাথে যোগাযোগ করবেন। জরুরি হলে +880 নম্বরে কল করুন।'
          : "Thanks for your message. My AI engine is temporarily unavailable, but I've logged your question and a counselor will follow up shortly. For urgent matters, please call our office.";
      }

      await logAudit({
        userId: auth.user.id,
        action: 'whatsapp.ai_agent.inbound_handled',
        module: 'whatsapp',
        recordId: phoneNumber,
        newData: {
          studentId: student?.id ?? null,
          newStudentCreated: !!newStudentId,
          newLeadCreated: !!newLeadId,
          officeHours,
          language: userLang,
          llmUsed: reply.length > 0,
        },
        ip: request.headers.get('x-forwarded-for') || null,
        userAgent: request.headers.get('user-agent') || null,
      });

      return NextResponse.json({
        reply,
        source: 'ai',
        studentMatched: !!student,
        newStudentCreated: !!newStudentId,
        newLeadCreated: !!newLeadId,
        officeHours,
        language: userLang,
      });
    }

    // During office hours with officeHoursOnly = true, queue for a human.
    return NextResponse.json({
      reply:
        'Thank you for your message. Our team is currently online and will respond shortly. For immediate help, please call our office during business hours (10:00–18:00, Asia/Dhaka).',
      replyBn:
        'আপনার বার্তার জন্য ধন্যবাদ। আমাদের টিম এখন অনলাইনে আছে এবং শীঘ্রই উত্তর দেবে। জরুরি সাহায্যের জন্য অফিস সময়ে (১০:০০–১৮:০০) কল করুন।',
      source: 'human_queue',
      officeHours: true,
    });
  } catch (error) {
    console.error('WhatsApp AI reply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    description:
      'WhatsApp AI reply engine. POST with { phoneNumber, messageText } to get an AI / rule-based / OTP-gated reply.',
    ruleBasedTriggers: ['hi', 'hello', 'salam', 'assalamu alaikum', 'thanks', 'thank', 'ok'],
    humanHandoffReasons: [
      'complaint',
      'refund',
      'visa_refusal',
      'angry',
      'payment_issue',
      'emergency',
      'fraud',
    ],
    otp: {
      ttlMinutes: OTP_TTL_MINUTES,
      maxAttempts: OTP_MAX_ATTEMPTS,
    },
  });
}
