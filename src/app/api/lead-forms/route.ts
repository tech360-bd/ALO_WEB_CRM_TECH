import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createLeadWithReference } from '@/lib/lead-reference';
import { autoAssignCounselor } from '@/lib/crm-automation';
import { normalizePhone } from '@/lib/phone-normalization';
import { isPlausiblePhone, normalizeEmail, phoneVariants, resolveContactIdentity, type ContactCandidate } from '@/lib/communications/contact-identity';
import { publicMutationOriginAllowed } from '@/lib/request-origin';
import { checkRateLimit } from '@/lib/rate-limiter';
import { readRequestTextLimited } from '@/lib/request-body';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 32_000;

type SubmissionBody = Record<string, unknown>;

function field(body: SubmissionBody, key: string, max: number): string {
  const value = body[key];
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function requestIp(req: Request): string {
  return (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown').slice(0, 64);
}

async function createPendingContactReview(input: {
  phone: string;
  normalizedPhone: string;
  name: string;
  email: string;
  candidates: ContactCandidate[];
  confidence: 'exact' | 'possible' | 'none';
  matchedOn: string | null;
}) {
  const existing = await db.contactMatchReview.findFirst({
    where: {
      normalizedPhone: input.normalizedPhone,
      incomingEmail: input.email || null,
      conversationId: '',
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  if (existing) return existing.id;

  const record = await db.contactMatchReview.create({
    data: {
      incomingPhone: input.phone,
      normalizedPhone: input.normalizedPhone,
      incomingName: input.name || null,
      incomingEmail: input.email || null,
      conversationId: '',
      matchedStudentId: input.candidates.find((candidate) => candidate.kind === 'student')?.id || null,
      matchedLeadId: input.candidates.find((candidate) => candidate.kind === 'lead')?.id || null,
      matchedPartnerId: input.candidates.find((candidate) => candidate.kind === 'partner_contact')?.id || null,
      matchConfidence: input.confidence === 'exact' ? 100 : input.confidence === 'possible' ? 60 : 0,
      matchReason: JSON.stringify({
        matchedOn: input.matchedOn,
        candidateIds: input.candidates.map((candidate) => ({ kind: candidate.kind, id: candidate.id })),
        ambiguity: input.candidates.length > 1,
      }).slice(0, 1000),
      status: 'PENDING',
    },
    select: { id: true },
  });
  return record.id;
}

// Public inquiry capture: a form is a service request, not marketing consent.
export async function POST(req: NextRequest) {
  if (!publicMutationOriginAllowed(req)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  }
  const rateLimit = checkRateLimit(requestIp(req), 'lead_create');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Please wait before submitting another inquiry.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))) } },
    );
  }

  const requestBody = await readRequestTextLimited(req, MAX_BODY_BYTES);
  if (!requestBody.ok) return NextResponse.json({ success: false, error: 'Submission is too large.' }, { status: 413 });

  let body: SubmissionBody;
  try {
    const parsed = JSON.parse(requestBody.text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid');
    body = parsed as SubmissionBody;
  } catch {
    return NextResponse.json({ success: false, error: 'A valid JSON submission is required.' }, { status: 400 });
  }

  const name = field(body, 'name', 120);
  const suppliedPhone = field(body, 'phone', 64);
  const phone = normalizePhone(suppliedPhone);
  const email = normalizeEmail(field(body, 'email', 320));
  if (!name || !phone || !isPlausiblePhone(phone)) {
    return NextResponse.json({ success: false, error: 'Name and a valid phone number are required.' }, { status: 400 });
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
  }

  const preferredCountry = field(body, 'preferredCountry', 100);
  const preferredLevel = field(body, 'preferredLevel', 100);
  const preferredSubject = field(body, 'preferredSubject', 160);
  const intake = field(body, 'intake', 100);
  const budget = field(body, 'budget', 120);
  const englishTest = field(body, 'englishTest', 80);
  const englishScore = field(body, 'englishScore', 80);
  const message = field(body, 'message', 2000);
  const sourceSection = field(body, 'sourceSection', 100) || 'lead_form';
  const source = field(body, 'source', 100) || 'public_website';

  try {
    // One contact row per normalized phone; email is a searchable identity, not
    // a unique key because family members may share an email address.
    let registry = await db.whatsAppContact.upsert({
      where: { normalizedPhone: phone },
      create: {
        phone,
        normalizedPhone: phone,
        email,
        normalizedEmail: email,
        displayName: name,
        profileName: name,
        source: 'LEAD_FORM',
        lastContactAt: new Date(),
      },
      update: { lastContactAt: new Date() },
    });
    // Preserve an existing email identity; fill only a missing value.
    if (email && !registry.normalizedEmail) {
      registry = await db.whatsAppContact.update({ where: { id: registry.id }, data: { email, normalizedEmail: email } });
    }

    const variants = phoneVariants(phone);
    const studentConditions: Array<Record<string, unknown>> = [
      ...variants.map((value) => ({ phone: value })),
      ...(email ? [{ email }] : []),
    ];
    const leadConditions: Array<Record<string, unknown>> = [
      ...variants.flatMap((value) => [{ phone: value }, { altPhone: value }]),
      ...(email ? [{ email }] : []),
    ];

    const [students, leads, partners, linkedStudent, linkedLead, partnerContacts] = await Promise.all([
      db.student.findMany({ where: { OR: studentConditions }, select: { id: true, studentId: true, name: true, phone: true, email: true }, take: 50 }),
      db.lead.findMany({ where: { OR: leadConditions }, select: { id: true, leadId: true, fullName: true, phone: true, altPhone: true, email: true, counselorId: true, branch: true }, take: 50 }),
      db.user.findMany({ where: { role: 'PARTNER', OR: [
        ...(variants.length ? [{ phone: { in: variants } }] : []),
        ...(email ? [{ email }] : []),
      ] }, select: { id: true, name: true, phone: true, email: true, partnerId: true }, take: 50 }),
      registry.studentId
        ? db.student.findFirst({ where: { OR: [{ id: registry.studentId }, { studentId: registry.studentId }] }, select: { id: true, studentId: true, name: true, phone: true, email: true } })
        : Promise.resolve(null),
      registry.leadId
        ? db.lead.findFirst({ where: { OR: [{ id: registry.leadId }, { leadId: registry.leadId }] }, select: { id: true, leadId: true, fullName: true, phone: true, altPhone: true, email: true, counselorId: true, branch: true } })
        : Promise.resolve(null),
      db.b2BContact.findMany({
        where: { OR: [
          ...(variants.length ? [{ phone: { in: variants } }] : []),
          ...(email ? [{ email }] : []),
        ] },
        select: { id: true },
        take: 50,
      }).catch(() => []),
    ]);

    const candidatesByKey = new Map<string, ContactCandidate>();
    const add = (candidate: ContactCandidate) => candidatesByKey.set(`${candidate.kind}:${candidate.id}`, candidate);
    for (const student of students) add({ kind: 'student', id: student.id, reference: student.studentId, name: student.name, phone: student.phone, email: student.email });
    for (const lead of leads) add({ kind: 'lead', id: lead.id, reference: lead.leadId, name: lead.fullName, phone: lead.phone, altPhone: lead.altPhone, email: lead.email });
    for (const partner of partners) add({ kind: 'partner_contact', id: partner.id, name: partner.name, phone: partner.phone, email: partner.email });
    if (linkedStudent) add({ kind: 'student', id: linkedStudent.id, reference: linkedStudent.studentId, name: linkedStudent.name, phone: linkedStudent.phone, email: linkedStudent.email, matchedOn: 'student_reference' });
    if (linkedLead) add({ kind: 'lead', id: linkedLead.id, reference: linkedLead.leadId, name: linkedLead.fullName, phone: linkedLead.phone, altPhone: linkedLead.altPhone, email: linkedLead.email, matchedOn: 'lead_reference' });

    const identity = resolveContactIdentity({ phone, email, whatsappNumber: registry.normalizedPhone }, [...candidatesByKey.values()]);
    const exactSingle = identity.confidence === 'exact' && identity.candidates.length === 1;
    let canonicalLeadId = '';
    let canonicalStudentId = '';
    let counselorId = '';
    let reviewId = '';
    let disposition: 'CREATED' | 'LINKED' | 'REVIEW' | 'PARTNER' = 'REVIEW';
    const partnerIdentityFound = partners.length > 0 || partnerContacts.length > 0 || Boolean(registry.partnerId);

    if (exactSingle && identity.candidates[0].kind === 'student') {
      const matchId = identity.candidates[0].id;
      const linked = await db.$transaction(async (tx) => {
        const current = await tx.whatsAppContact.findUnique({ where: { id: registry.id } });
        if (!current || (current.studentId && current.studentId !== matchId) || current.leadId) return false;
        await tx.whatsAppContact.update({ where: { id: current.id }, data: { studentId: matchId, lastContactAt: new Date() } });
        return true;
      });
      if (linked) {
        canonicalStudentId = matchId;
        disposition = 'LINKED';
      }
    } else if (exactSingle && identity.candidates[0].kind === 'lead') {
      const matchId = identity.candidates[0].id;
      const canonicalLead = leads.find((lead) => lead.id === matchId) || linkedLead;
      const linked = await db.$transaction(async (tx) => {
        const current = await tx.whatsAppContact.findUnique({ where: { id: registry.id } });
        if (!current || (current.leadId && current.leadId !== matchId) || current.studentId) return false;
        await tx.whatsAppContact.update({ where: { id: current.id }, data: { leadId: matchId, assignedCounselorId: canonicalLead?.counselorId || '', lastContactAt: new Date() } });
        return true;
      });
      if (linked) {
        canonicalLeadId = matchId;
        counselorId = canonicalLead?.counselorId || '';
        disposition = 'LINKED';
      }
    } else if (identity.confidence === 'none' && !partnerIdentityFound) {
      const lead = await db.$transaction(async (tx) => {
        const current = await tx.whatsAppContact.findUnique({ where: { id: registry.id } });
        if (!current) throw new Error('CONTACT_REGISTRY_MISSING');
        if (current.studentId || current.leadId || current.partnerId) {
          return { id: '', studentId: current.studentId, leadId: current.leadId, partnerId: current.partnerId };
        }
        const claim = await tx.whatsAppContact.updateMany({
          where: { id: current.id, studentId: '', leadId: '', partnerId: '' },
          data: { leadId: `__pending__lead-form-${Date.now()}` },
        });
        if (claim.count !== 1) throw new Error('CONTACT_IDENTITY_CHANGED_RETRY');
        const created = await createLeadWithReference<{ id: string; counselorId: string | null }>(tx, {
          fullName: name,
          email: email || null,
          phone,
          source: 'WEBSITE',
          sourceDetail: `Public lead form (${sourceSection})`,
          preferredCountry: preferredCountry || null,
          preferredCourse: preferredSubject || null,
          preferredLevel: preferredLevel || null,
          preferredIntake: intake || null,
          budget: budget || null,
          englishTest: englishTest || null,
          englishScore: englishScore || null,
          notes: message,
          status: 'NEW',
          welcomeSent: false,
        });
        await autoAssignCounselor(created.id, tx).catch(() => null);
        const assigned = await tx.lead.findUnique({ where: { id: created.id }, select: { id: true, counselorId: true } });
        await tx.whatsAppContact.update({
          where: { id: current.id },
          data: { leadId: created.id, assignedCounselorId: assigned?.counselorId || '', lastContactAt: new Date() },
        });
        await tx.timelineEvent.create({
          data: { studentId: '', leadId: created.id, stage: 'LEAD_CREATED', type: 'LEAD_CREATED', title: 'New public form lead', description: `Inquiry received from ${sourceSection}.` },
        }).catch(() => {});
        return { id: created.id, studentId: '', leadId: created.id, partnerId: '' };
      });
      if (lead.id) {
        canonicalLeadId = lead.id;
        disposition = 'CREATED';
      } else if (lead.studentId) {
        canonicalStudentId = lead.studentId;
        disposition = 'LINKED';
      } else if (lead.leadId && !lead.leadId.startsWith('__pending__')) {
        canonicalLeadId = lead.leadId;
        disposition = 'LINKED';
      } else {
        disposition = 'REVIEW';
      }
    } else if (partnerIdentityFound && identity.candidates.length === 0) {
      disposition = 'PARTNER';
    }

    const needsReview = disposition === 'REVIEW' || identity.candidates.length > 1 || (identity.candidates.length === 1 && !exactSingle) || partnerIdentityFound;
    if (needsReview) {
      reviewId = await createPendingContactReview({
        phone,
        normalizedPhone: phone,
        name,
        email,
        candidates: identity.candidates,
        confidence: identity.confidence,
        matchedOn: identity.matchedOn,
      });
    }

    const leadForm = await db.leadForm.create({
      data: {
        name,
        phone,
        email,
        canonicalLeadId,
        canonicalStudentId,
        preferredCountry,
        preferredLevel,
        preferredSubject,
        intake,
        budget,
        englishTest,
        englishScore,
        message,
        source,
        sourceSection,
        status: needsReview ? 'identity_review' : 'new',
        assignedCounselorId: counselorId,
      },
      select: { id: true },
    });

    await db.auditLog.create({
      data: {
        action: 'PUBLIC_LEAD_FORM_SUBMITTED',
        resource: 'LeadForm',
        resourceId: leadForm.id,
        details: JSON.stringify({ disposition, canonicalLeadId: canonicalLeadId || null, canonicalStudentId: canonicalStudentId || null, identityReviewId: reviewId || null, marketingConsentRecorded: false }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Thank you. Your inquiry has been received for ALO Education to review.',
      submissionId: leadForm.id,
      status: needsReview ? 'identity_review' : 'received',
    }, { status: 201 });
  } catch (error) {
    console.error('[lead-forms] submission failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Your inquiry could not be recorded. Please try again later.' }, { status: 503 });
  }
}
