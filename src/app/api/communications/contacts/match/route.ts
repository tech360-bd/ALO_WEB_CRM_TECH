import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { getScopeForAuth } from '@/lib/data-scope';
import { normalizePhone } from '@/lib/phone-normalization';
import { canAccessUccConversation } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';
import {
  isPlausiblePhone,
  normalizeEmail,
  phoneVariants,
  resolveContactIdentity,
  type ContactCandidate,
} from '@/lib/communications/contact-identity';

export const dynamic = 'force-dynamic';

const MAX_RESULTS = 50;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type MatchRow = ContactCandidate & {
  branch?: string | null;
  counselorId?: string | null;
  assignedCounselorId?: string | null;
  partnerId?: string | null;
  linkedStudentId?: string | null;
  linkedLeadId?: string | null;
  previewStatus?: string | null;
};

function hasCompanyWideContactAccess(auth: AuthContext): boolean {
  const roles = auth.roles.map((role) => role.toLowerCase());
  return roles.includes('super_admin')
    || (auth.permissions.includes('ad2') && auth.permissions.includes('contacts.view'))
    || auth.permissions.includes('data.view_all');
}

async function visibleRows(rows: MatchRow[], auth: AuthContext): Promise<MatchRow[]> {
  if (hasCompanyWideContactAccess(auth)) return rows;
  const scope = getScopeForAuth(auth);
  if (scope === 'NONE') return [];

  const branchUserIds = new Set<string>();
  if (scope === 'BRANCH' && auth.branch) {
    const employees = await db.employee.findMany({
      where: { branch: auth.branch, status: 'active' },
      select: { userId: true },
      take: 2000,
    });
    employees.forEach((employee) => branchUserIds.add(employee.userId));
    branchUserIds.add(auth.userId);
  }

  const visibleEntityRows = rows.filter((row) => {
    if (row.kind === 'unknown') return false;
    if (row.kind === 'partner_contact') return !!auth.partnerId && row.partnerId === auth.partnerId;
    if (scope === 'ASSIGNED') return row.counselorId === auth.userId;
    if (scope === 'BRANCH') {
      return (!!auth.branch && row.branch === auth.branch)
        || (!!row.counselorId && branchUserIds.has(row.counselorId));
    }
    return false;
  });
  const visibleStudentIds = new Set(visibleEntityRows.filter((row) => row.kind === 'student').map((row) => row.id));
  const visibleLeadIds = new Set(visibleEntityRows.filter((row) => row.kind === 'lead').map((row) => row.id));
  const visibleRegistryRows = rows.filter((row) => row.kind === 'unknown' && (
    row.assignedCounselorId === auth.userId
    || (!!auth.partnerId && row.partnerId === auth.partnerId)
    || (scope === 'BRANCH' && !!auth.branch && row.branch === auth.branch)
    || (scope === 'BRANCH' && !!row.assignedCounselorId && branchUserIds.has(row.assignedCounselorId))
    || (!!row.linkedStudentId && visibleStudentIds.has(row.linkedStudentId))
    || (!!row.linkedLeadId && visibleLeadIds.has(row.linkedLeadId))
  ));
  return [...visibleEntityRows, ...visibleRegistryRows];
}

function publicPreview(candidate: ContactCandidate) {
  return {
    kind: candidate.kind,
    id: candidate.id,
    reference: candidate.reference || null,
    name: candidate.name || null,
    phone: candidate.phone || null,
    email: candidate.email || null,
  };
}

export const POST = withAuth(async (req, auth) => {
  if (!auth.permissions.includes('contacts.view') && !auth.roles.some((role) => role.toLowerCase() === 'super_admin')) {
    return NextResponse.json({ success: false, error: 'Contact-match permission required.' }, { status: 403 });
  }
  if (!mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ success: false, error: 'Cross-origin contact-match request denied.' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const incomingPhone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 64) : '';
    const email = normalizeEmail(typeof body.email === 'string' ? body.email : '');
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim().slice(0, 128) : '';
    if (!incomingPhone && !email) {
      return NextResponse.json({ success: false, error: 'phone or email is required.' }, { status: 400 });
    }
    if (incomingPhone && !isPlausiblePhone(incomingPhone)) {
      return NextResponse.json({ success: false, error: 'A plausible phone number is required.' }, { status: 400 });
    }
    if (email && (email.length > 320 || !EMAIL_PATTERN.test(email))) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
    }
    if (conversationId) {
      const conversation = await db.uccConversation.findUnique({
        where: { id: conversationId },
        select: { id: true, channel: true, participantPhone: true, participantEmail: true, assignedToUserId: true, studentId: true },
      });
      if (!conversation || conversation.channel.toLowerCase() !== 'whatsapp') {
        return NextResponse.json({ success: false, error: 'WhatsApp conversation not found.' }, { status: 404 });
      }
      if (incomingPhone && normalizePhone(conversation.participantPhone || '') !== normalizePhone(incomingPhone)) {
        return NextResponse.json({ success: false, error: 'The identity phone does not match this conversation.' }, { status: 403 });
      }
      if (email && String(conversation.participantEmail || '').trim().toLowerCase() !== email && !incomingPhone) {
        return NextResponse.json({ success: false, error: 'The identity email does not match this conversation.' }, { status: 403 });
      }
      if (!canAccessUccConversation(auth, conversation) || !await canViewUccConversationB2B(auth, conversation)) {
        return NextResponse.json({ success: false, error: 'Conversation is outside your authorized scope.' }, { status: 403 });
      }
    }

    const variants = phoneVariants(incomingPhone);
    const normalizedPhone = variants[0] || '';
    const hasIdentity = variants.length > 0 || !!email;
    const [students, leads, partners, contacts] = await Promise.all([
      hasIdentity
        ? db.student.findMany({
            where: { OR: [
              ...(variants.length ? [{ phone: { in: variants } }] : []),
              ...(email ? [{ email }] : []),
            ] },

            select: { id: true, studentId: true, name: true, phone: true, email: true, counselorId: true, status: true },
            take: MAX_RESULTS,
          })
        : Promise.resolve([]),
      hasIdentity
        ? db.lead.findMany({
            where: { OR: [
              ...(variants.length ? [{ phone: { in: variants } }, { altPhone: { in: variants } }] : []),
              ...(email ? [{ email }] : []),
            ] },
            select: { id: true, leadId: true, fullName: true, phone: true, altPhone: true, email: true, counselorId: true, branch: true, status: true },
            take: MAX_RESULTS,
          })
        : Promise.resolve([]),
      (variants.length || email)
        ? db.user.findMany({
            where: { role: 'PARTNER', OR: [
              ...(variants.length ? [{ phone: { in: variants } }] : []),
              ...(email ? [{ email }] : []),
            ] },
            select: { id: true, name: true, phone: true, email: true, partnerId: true },
            take: MAX_RESULTS,
          })
        : Promise.resolve([]),
      variants.length || email
        ? db.whatsAppContact.findMany({
            where: { OR: [
              ...(variants.length ? [{ normalizedPhone: { in: variants } }, { phone: { in: variants } }] : []),
              ...(email ? [{ normalizedEmail: email }, { email }] : []),
            ] },
            select: { id: true, phone: true, normalizedPhone: true, email: true, normalizedEmail: true, externalContactId: true, displayName: true, studentId: true, leadId: true, partnerId: true, assignedCounselorId: true, branch: true },
            take: MAX_RESULTS,
          })
        : Promise.resolve([]),
    ]);

    const rawRows: MatchRow[] = [
      ...students.map((student) => ({
        kind: 'student' as const,
        id: student.id,
        reference: student.studentId,
        name: student.name,
        phone: student.phone,
        email: student.email,
        counselorId: student.counselorId,
        previewStatus: student.status,
      })),
      ...leads.map((lead) => ({
        kind: 'lead' as const,
        id: lead.id,
        reference: lead.leadId,
        name: lead.fullName,
        phone: lead.phone,
        altPhone: lead.altPhone,
        email: lead.email,
        counselorId: lead.counselorId,
        branch: lead.branch,
        previewStatus: lead.status,
      })),
      ...partners.map((partner) => ({
        kind: 'partner_contact' as const,
        id: partner.id,
        reference: null,
        name: partner.name,
        phone: partner.phone,
        email: partner.email,
        partnerId: partner.partnerId,
      })),
      ...contacts.filter((contact) => !contact.studentId && !contact.leadId && !contact.partnerId).map((contact) => ({
        kind: 'unknown' as const,
        id: contact.id,
        reference: null,
        name: contact.displayName,
        phone: contact.phone,
        email: contact.email || contact.normalizedEmail || null,
        whatsappNumber: contact.externalContactId || null,
        linkedStudentId: contact.studentId || null,
        linkedLeadId: contact.leadId || null,
        partnerId: contact.partnerId || null,
        assignedCounselorId: contact.assignedCounselorId || null,
        branch: contact.branch || null,
      })),
    ];

    // Repeated rows for the same CRM record can arise from matching its phone,
    // alternate phone, and email. Keep one candidate per record, but never pick
    // one record over a different person without a review.
    const deduplicatedRows = [...new Map(rawRows.map((row) => [`${row.kind}:${row.id}`, row])).values()];
    const scopedRows = await visibleRows(deduplicatedRows, auth);
    const candidates = scopedRows.map(({ branch: _branch, counselorId: _counselorId, assignedCounselorId: _assignedCounselorId, partnerId: _partnerId, linkedStudentId: _linkedStudentId, linkedLeadId: _linkedLeadId, previewStatus: _previewStatus, ...candidate }) => candidate);
    const resolution = resolveContactIdentity({ phone: incomingPhone, email }, candidates);
    const uniqueExactMatch = resolution.confidence === 'exact'
      && resolution.candidates.length === 1
      && resolution.candidates[0].kind !== 'unknown';
    // Even a single exact candidate is presented to a human before linking the
    // inbound conversation to that CRM record.
    const needsReview = true;

    // An incoming interaction never creates consent. This review only records
    // identity candidates; consent remains a separate purpose/channel workflow.
    let review: { id: string; status: string } | null = null;
    let reviewCreated = false;
    if (needsReview) {
      const existingReview = await db.contactMatchReview.findFirst({
        where: { normalizedPhone, incomingEmail: email || null, conversationId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true },
      });
      if (existingReview) {
        review = existingReview;
      } else {
        review = await db.contactMatchReview.create({
          data: {
            incomingPhone,
            normalizedPhone,
            incomingName: name || null,
            incomingEmail: email || null,
            conversationId,
            matchedStudentId: resolution.candidates.length === 1 && resolution.candidates[0].kind === 'student' ? resolution.candidates[0].id : null,
            matchedLeadId: resolution.candidates.length === 1 && resolution.candidates[0].kind === 'lead' ? resolution.candidates[0].id : null,
            matchedPartnerId: resolution.candidates.length === 1 && resolution.candidates[0].kind === 'partner_contact' ? resolution.candidates[0].id : null,
            matchConfidence: resolution.confidence === 'exact' ? 100 : resolution.confidence === 'possible' ? 60 : 0,
            matchReason: JSON.stringify({
              matchedOn: resolution.matchedOn,
              candidateIds: resolution.candidates.map((candidate) => ({ kind: candidate.kind, id: candidate.id })),
              ambiguity: resolution.candidates.length > 1,
            }).slice(0, 1000),
            status: 'PENDING',
          },
          select: { id: true, status: true },
        });
        reviewCreated = true;
      }

      if (reviewCreated && review) {
        await db.portalAuditLog.create({
          data: {
            actorUserId: auth.actorUserId,
            action: 'CONTACT_MATCH_REVIEW_OPENED',
            entityType: 'ContactMatchReview',
            entityId: review.id,
            metadata: JSON.stringify({
              actorRole: auth.roles[0] || auth.userType,
              candidateCount: resolution.candidates.length,
              confidence: resolution.confidence,
              ambiguous: resolution.candidates.length > 1,
            }),
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 64) || '',
            userAgent: req.headers.get('user-agent')?.slice(0, 255) || '',
          },
        }).catch(() => undefined);
      }
    }

    const safeCandidates = resolution.candidates.map(publicPreview);
    return NextResponse.json({
      success: true,
      matched: uniqueExactMatch,
      matchType: uniqueExactMatch ? resolution.candidates[0].kind.toUpperCase() : 'REVIEW',
      matchedId: uniqueExactMatch ? resolution.candidates[0].id : null,
      confidence: resolution.confidence === 'exact' ? 100 : resolution.confidence === 'possible' ? 60 : 0,
      matchReason: resolution.matchedOn,
      existingRecord: uniqueExactMatch ? publicPreview(resolution.candidates[0]) : null,
      candidates: safeCandidates,
      ambiguous: resolution.candidates.length > 1,
      review,
      reviewId: review?.id || null,
      notice: needsReview
        ? 'Possible existing contact: review the candidates before linking, merging, or creating a new record.'
        : null,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Contact match could not be completed.' }, { status: 500 });
  }
}, { requirePermissions: ['contacts.view'] });
