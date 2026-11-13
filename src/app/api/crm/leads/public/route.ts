import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createLeadWithReference } from '@/lib/lead-reference';
import {
  captureAttributionFromRequest,
  describeAttribution,
  newLeadAttribution,
  toLeadFormColumns,
} from '@/lib/attribution/lead-attribution';
import { normalizePhone } from '@/lib/phone-normalization';
import {
  isPlausiblePhone,
  normalizeEmail,
  phoneVariants,
  resolveContactIdentity,
  type ContactCandidate,
} from '@/lib/communications/contact-identity';
import { publicMutationOriginAllowed } from '@/lib/request-origin';
import { checkRateLimit } from '@/lib/rate-limiter';
import { readRequestTextLimited } from '@/lib/request-body';

const MAX_BODY_BYTES = 32_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type PublicBody = Record<string, unknown>;

function text(body: PublicBody, key: string, max = 500): string {
  const value = body[key];
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function requestIp(req: Request): string {
  return (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown').slice(0, 64);
}

async function createPendingIdentityReview(input: {
  phone: string;
  name: string;
  email: string;
  confidence: 'exact' | 'possible' | 'none';
  matchedOn: string | null;
  candidates: ContactCandidate[];
  registryPartnerId: string;
  hasUnmappedPartner: boolean;
}) {
  const existing = await db.contactMatchReview.findFirst({
    where: {
      normalizedPhone: input.phone,
      incomingEmail: input.email || null,
      conversationId: '',
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  if (existing) return existing.id;

  const review = await db.contactMatchReview.create({
    data: {
      incomingPhone: input.phone,
      normalizedPhone: input.phone,
      incomingName: input.name || null,
      incomingEmail: input.email || null,
      conversationId: '',
      matchedStudentId: input.candidates.find((candidate) => candidate.kind === 'student')?.id || null,
      matchedLeadId: input.candidates.find((candidate) => candidate.kind === 'lead')?.id || null,
      matchedPartnerId: input.candidates.find((candidate) => candidate.kind === 'partner_contact')?.id || input.registryPartnerId || null,
      matchConfidence: input.confidence === 'exact' ? 100 : input.confidence === 'possible' ? 60 : 0,
      matchReason: JSON.stringify({
        matchedOn: input.matchedOn,
        candidateIds: input.candidates.map((candidate) => ({ kind: candidate.kind, id: candidate.id })),
        unmappedPartnerContact: input.hasUnmappedPartner,
        ambiguity: input.candidates.length > 1,
      }).slice(0, 1000),
      status: 'PENDING',
    },
    select: { id: true },
  });
  return review.id;
}

export async function POST(request: NextRequest) {
  if (!publicMutationOriginAllowed(request)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  }

  const limit = checkRateLimit(requestIp(request), 'lead_create');
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Please wait before submitting another inquiry.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))) } },
    );
  }

  const requestBody = await readRequestTextLimited(request, MAX_BODY_BYTES);
  if (!requestBody.ok) return NextResponse.json({ success: false, error: 'Submission is too large.' }, { status: 413 });

  let body: PublicBody;
  try {
    const parsed = JSON.parse(requestBody.text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid');
    body = parsed as PublicBody;
  } catch {
    return NextResponse.json({ success: false, error: 'A valid JSON submission is required.' }, { status: 400 });
  }

  const name = text(body, 'name', 120) || text(body, 'fullName', 120);
  const suppliedPhone = text(body, 'phone', 64);
  const phone = normalizePhone(suppliedPhone);
  const email = normalizeEmail(text(body, 'email', 320));
  if (!name || !phone || !isPlausiblePhone(phone)) {
    return NextResponse.json({ success: false, error: 'Name and a valid phone number are required.' }, { status: 400 });
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
  }

  const preferredCountry = text(body, 'preferredCountry', 100)
    || text(body, 'countryOfInterest', 100)
    || text(body, 'destination', 100);
  const preferredLevel = text(body, 'preferredLevel', 100) || text(body, 'studyLevel', 100);
  const preferredSubject = text(body, 'preferredSubject', 160);
  const intake = text(body, 'intake', 100) || text(body, 'preferredIntake', 100);
  const budget = text(body, 'budget', 120);
  const englishTest = text(body, 'englishTest', 80);
  const englishScore = text(body, 'englishScore', 80) || text(body, 'targetScore', 80);
  const service = text(body, 'service', 100);
  const message = text(body, 'message', 2000) || text(body, 'notes', 2000);
  const source = text(body, 'source', 100) || 'public_website';
  const sourceSection = text(body, 'sourceSection', 100) || source;

  try {
    const attribution = captureAttributionFromRequest(request, {
      body,
      landingPage: text(body, 'landingPage', 500) || null,
      visitorId: text(body, 'visitorId', 191) || null,
    });
    const variants = phoneVariants(phone);
    const registry = await db.whatsAppContact.upsert({
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
    if (email && !registry.normalizedEmail) {
      await db.whatsAppContact.update({ where: { id: registry.id }, data: { email, normalizedEmail: email } });
    }

    const studentConditions = [
      ...variants.map((value) => ({ phone: value })),
      ...(email ? [{ email }] : []),
    ];
    const leadConditions = [
      ...variants.flatMap((value) => [{ phone: value }, { altPhone: value }]),
      ...(email ? [{ email }] : []),
    ];
    const partnerConditions = [
      ...(variants.length ? [{ phone: { in: variants } }] : []),
      ...(email ? [{ email }] : []),
    ];
    const partnerContactConditions = [
      ...(variants.length ? [{ phone: { in: variants } }] : []),
      ...(email ? [{ email }] : []),
    ];

    const [students, leads, partners, partnerContacts, linkedStudent, linkedLead] = await Promise.all([
      db.student.findMany({
        where: { OR: studentConditions },
        select: { id: true, studentId: true, name: true, phone: true, email: true },
        take: 50,
      }),
      db.lead.findMany({
        where: { OR: leadConditions },
        select: { id: true, leadId: true, fullName: true, phone: true, altPhone: true, email: true, counselorId: true, branch: true },
        take: 50,
      }),
      db.user.findMany({
        where: { role: 'PARTNER', OR: partnerConditions },
        select: { id: true, name: true, phone: true, email: true, partnerId: true },
        take: 50,
      }),
      db.b2BContact.findMany({ where: { OR: partnerContactConditions }, select: { id: true }, take: 50 }).catch(() => []),
      registry.studentId
        ? db.student.findFirst({ where: { OR: [{ id: registry.studentId }, { studentId: registry.studentId }] }, select: { id: true, studentId: true, name: true, phone: true, email: true } })
        : Promise.resolve(null),
      registry.leadId
        ? db.lead.findFirst({ where: { OR: [{ id: registry.leadId }, { leadId: registry.leadId }] }, select: { id: true, leadId: true, fullName: true, phone: true, altPhone: true, email: true, counselorId: true, branch: true } })
        : Promise.resolve(null),
    ]);

    const candidateMap = new Map<string, ContactCandidate>();
    const addCandidate = (candidate: ContactCandidate) => candidateMap.set(`${candidate.kind}:${candidate.id}`, candidate);
    for (const student of students) addCandidate({ kind: 'student', id: student.id, reference: student.studentId, name: student.name, phone: student.phone, email: student.email });
    for (const lead of leads) addCandidate({ kind: 'lead', id: lead.id, reference: lead.leadId, name: lead.fullName, phone: lead.phone, altPhone: lead.altPhone, email: lead.email });
    for (const partner of partners) addCandidate({ kind: 'partner_contact', id: partner.id, name: partner.name, phone: partner.phone, email: partner.email });
    if (linkedStudent) addCandidate({ kind: 'student', id: linkedStudent.id, reference: linkedStudent.studentId, name: linkedStudent.name, phone: linkedStudent.phone, email: linkedStudent.email, matchedOn: 'student_reference' });
    if (linkedLead) addCandidate({ kind: 'lead', id: linkedLead.id, reference: linkedLead.leadId, name: linkedLead.fullName, phone: linkedLead.phone, altPhone: linkedLead.altPhone, email: linkedLead.email, matchedOn: 'lead_reference' });

    const candidates = [...candidateMap.values()];
    const identity = resolveContactIdentity({ phone, email, whatsappNumber: registry.normalizedPhone }, candidates);
    const exactSingle = identity.confidence === 'exact' && identity.candidates.length === 1;
    const partnerIdentityFound = partners.length > 0 || partnerContacts.length > 0 || Boolean(registry.partnerId);
    let canonicalLeadId = '';
    let canonicalStudentId = '';
    let counselorId = '';
    let crmLeadId: string | null = null;
    let reviewId = '';
    let disposition: 'CREATED' | 'LINKED' | 'REVIEW' = 'REVIEW';
    let shouldCreateCanonicalLead = identity.confidence === 'none' && !partnerIdentityFound;

    if (exactSingle && identity.candidates[0].kind === 'student') {
      const matchId = identity.candidates[0].id;
      const linked = await db.$transaction(async (tx) => {
        const current = await tx.whatsAppContact.findUnique({ where: { id: registry.id } });
        if (!current || (current.studentId && current.studentId !== matchId) || current.leadId) return false;
        await tx.whatsAppContact.update({ where: { id: registry.id }, data: { studentId: matchId, lastContactAt: new Date() } });
        return true;
      });
      if (linked) {
        canonicalStudentId = matchId;
        disposition = 'LINKED';
      } else {
        shouldCreateCanonicalLead = false;
      }
    } else if (exactSingle && identity.candidates[0].kind === 'lead') {
      const match = identity.candidates[0];
      const canonicalLead = leads.find((lead) => lead.id === match.id) || linkedLead;
      const linked = await db.$transaction(async (tx) => {
        const current = await tx.whatsAppContact.findUnique({ where: { id: registry.id } });
        if (!current || (current.leadId && current.leadId !== match.id) || current.studentId) return false;
        await tx.whatsAppContact.update({ where: { id: registry.id }, data: { leadId: match.id, assignedCounselorId: canonicalLead?.counselorId || '', lastContactAt: new Date() } });
        return true;
      });
      if (linked) {
        canonicalLeadId = match.id;
        crmLeadId = match.id;
        counselorId = canonicalLead?.counselorId || '';
        disposition = 'LINKED';
      } else {
        shouldCreateCanonicalLead = false;
      }
    } else {
      shouldCreateCanonicalLead = identity.confidence === 'none' && !partnerIdentityFound;
    }

    let needsReview = !shouldCreateCanonicalLead && (
      disposition === 'REVIEW'
      || identity.candidates.length > 1
      || (identity.candidates.length === 1 && !exactSingle)
      || partnerIdentityFound
    );

    const leadFormRecord = await db.leadForm.create({
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
        message: message || (service ? `Service requested: ${service}` : ''),
        source,
        sourceSection,
        status: needsReview ? 'identity_review' : shouldCreateCanonicalLead ? 'processing' : 'new',
        assignedCounselorId: counselorId,
        ...toLeadFormColumns(attribution),
      },
    }).catch(() => null);

    if (needsReview) {
      reviewId = await createPendingIdentityReview({
        phone,
        name,
        email,
        confidence: identity.confidence,
        matchedOn: identity.matchedOn,
        candidates: identity.candidates,
        registryPartnerId: registry.partnerId,
        hasUnmappedPartner: partnerContacts.length > 0,
      });
    }

    let createdLeadId = '';
    if (shouldCreateCanonicalLead) {
      const pendingLinkId = `__pending__lead-form-${randomUUID()}`;
      const outcome = await db.$transaction(async (tx) => {
        const current = await tx.whatsAppContact.findUnique({ where: { id: registry.id } });
        if (!current) throw new Error('CONTACT_REGISTRY_MISSING');
        if (current.studentId || current.leadId || current.partnerId) {
          return { kind: 'linked' as const, studentId: current.studentId, leadId: current.leadId, partnerId: current.partnerId };
        }
        const claim = await tx.whatsAppContact.updateMany({
          where: { id: current.id, studentId: '', leadId: '', partnerId: '' },
          data: { leadId: pendingLinkId },
        });
        if (claim.count !== 1) throw new Error('CONTACT_IDENTITY_CHANGED_RETRY');

        const created = await createLeadWithReference<{ id: string; source: string }>(tx, {
          fullName: name,
          email,
          phone,
          source: source || 'WEBSITE',
          sourceDetail: `Public inquiry form (${sourceSection})${service ? ` — service: ${service}` : ''}`,
          preferredCountry,
          preferredLevel,
          preferredIntake: intake,
          budget,
          englishTest,
          englishScore,
          notes: message || '',
          rawSubmission: JSON.stringify({ source, sourceSection, visitorId: attribution.visitorId || '' }).slice(0, 4000),
          status: 'NEW',
          welcomeSent: false,
          ...newLeadAttribution(attribution),
        });
        await tx.whatsAppContact.update({
          where: { id: current.id },
          data: { leadId: created.id, assignedCounselorId: '', lastContactAt: new Date() },
        });
        await tx.timelineEvent.create({
          data: {
            studentId: '',
            leadId: created.id,
            stage: 'lead',
            type: 'LEAD_CREATED',
            title: 'New lead created',
            description: `Lead came via public inquiry form (${created.source})`,
          },
        }).catch(() => null);
        return { kind: 'created' as const, studentId: '', leadId: created.id, partnerId: '' };
      });

      if (outcome.kind === 'created') {
        createdLeadId = outcome.leadId;
        canonicalLeadId = outcome.leadId;
        crmLeadId = outcome.leadId;
        disposition = 'CREATED';
      } else if (outcome.studentId) {
        canonicalStudentId = outcome.studentId;
        disposition = 'LINKED';
      } else if (outcome.leadId && !outcome.leadId.startsWith('__pending__')) {
        canonicalLeadId = outcome.leadId;
        crmLeadId = outcome.leadId;
        disposition = 'LINKED';
      } else {
        disposition = 'REVIEW';
      }
      needsReview = disposition === 'REVIEW';
      if (needsReview) {
        reviewId = await createPendingIdentityReview({
          phone,
          name,
          email,
          confidence: identity.confidence,
          matchedOn: identity.matchedOn,
          candidates: identity.candidates,
          registryPartnerId: registry.partnerId,
          hasUnmappedPartner: partnerContacts.length > 0,
        });
      }
    }

    let counselorAssigned = false;
    let assignmentReason = '';
    const {
      scoreLead,
      autoAssignCounselor,
      createFollowUpTask,
    } = await import('@/lib/crm-automation');

    if (crmLeadId) {
      const existingLead = await db.lead.findUnique({ where: { id: crmLeadId }, select: { counselorId: true } });
      if (createdLeadId) {
        const assignment = await autoAssignCounselor(createdLeadId);
        counselorAssigned = !!assignment.counselorId;
        assignmentReason = assignment.reason;
        await createFollowUpTask(createdLeadId, 1).catch(() => {});
        counselorId = assignment.counselorId || '';
        await db.whatsAppContact.update({ where: { id: registry.id }, data: { assignedCounselorId: counselorId } }).catch(() => null);
        if (!assignment.counselorId) {
          console.error('[public-lead->crm] counselor auto-assignment failed', { leadId: createdLeadId, reason: assignment.reason });
        }
      } else if (existingLead && !existingLead.counselorId) {
        const assignment = await autoAssignCounselor(crmLeadId);
        counselorAssigned = !!assignment.counselorId;
        assignmentReason = assignment.reason;
        counselorId = assignment.counselorId || '';
        await db.whatsAppContact.update({ where: { id: registry.id }, data: { assignedCounselorId: counselorId } }).catch(() => null);
      } else {
        counselorAssigned = Boolean(existingLead?.counselorId);
        counselorId = existingLead?.counselorId || '';
      }
    }

    const parsedEnglishScore = Number.parseFloat(englishScore);
    const marketingLeadRecord = await db.marketingLead.create({
      data: {
        name,
        phone,
        email,
        canonicalLeadId,
        canonicalStudentId,
        destination: preferredCountry,
        level: preferredLevel,
        intake,
        budget,
        ...(Number.isFinite(parsedEnglishScore) ? { ieltsScore: parsedEnglishScore } : {}),
        source: source || 'website_inquiry',
        sourceDetail: `[Subject: ${preferredSubject || 'not supplied'}] [Test: ${englishTest || 'not supplied'}] ${message}`.slice(0, 2000),
        status: needsReview ? 'identity_review' : disposition === 'CREATED' ? 'new' : 'linked',
        consent: false, // No explicit purpose/channel-specific opt-in was supplied.
        counselorId: counselorId || null,
      },
    }).catch(() => null);

    if (leadFormRecord) {
      await db.leadForm.update({
        where: { id: leadFormRecord.id },
        data: {
          canonicalLeadId,
          canonicalStudentId,
          status: needsReview ? 'identity_review' : 'new',
          assignedCounselorId: counselorId,
        },
      }).catch(() => null);
    }
    if (marketingLeadRecord?.id && createdLeadId) {
      const scored = await scoreLead(createdLeadId).catch(() => null);
      if (scored) {
        await db.marketingLead.update({ where: { id: marketingLeadRecord.id }, data: { score: scored.score, hotLead: scored.tier === 'HOT' || scored.tier === 'URGENT' } }).catch(() => null);
      }
    }

    await db.crmAuditLog.create({
      data: {
        actorUserId: 'public_visitor',
        actorRole: 'GUEST',
        action: 'PUBLIC_LEAD_SUBMITTED',
        targetCollection: 'LeadForm',
        targetId: leadFormRecord?.id || marketingLeadRecord?.id || 'public_lead_form',
        afterData: JSON.stringify({
          disposition,
          canonicalLeadId: canonicalLeadId || null,
          canonicalStudentId: canonicalStudentId || null,
          identityReviewId: reviewId || null,
          counselorAssigned,
          assignmentReason,
          marketingConsentRecorded: false,
          attribution: describeAttribution(attribution),
        }),
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: 'Thank you. Your consultation request has been received for ALO Education to review.',
      leadId: leadFormRecord?.id || marketingLeadRecord?.id || null,
      crmLeadId,
      status: needsReview ? 'identity_review' : 'received',
    }, { status: 201 });
  } catch (error) {
    console.error('[public-lead->crm] submission failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json(
      { success: false, error: 'Your inquiry could not be recorded. Please try again later.' },
      { status: 503 },
    );
  }
}
