import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { getScopeForAuth } from '@/lib/data-scope';
import { normalizePhone } from '@/lib/phone-normalization';
import { phoneVariants } from '@/lib/communications/contact-identity';
import { canAccessUccConversation } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';

export const dynamic = 'force-dynamic';

const DECISIONS = ['OPEN_EXISTING', 'MERGE_REQUEST', 'CREATE_NEW'] as const;
type Decision = typeof DECISIONS[number];

function hasCompanyWideContactAccess(auth: AuthContext): boolean {
  const roles = auth.roles.map((role) => role.toLowerCase());
  return roles.includes('super_admin')
    || (auth.permissions.includes('ad2') && auth.permissions.includes('contacts.view'))
    || auth.permissions.includes('data.view_all');
}

async function canAccessIdentity(
  auth: AuthContext,
  record: { kind: 'student' | 'lead'; counselorId: string | null; branch?: string | null },
): Promise<boolean> {
  if (hasCompanyWideContactAccess(auth)) return true;
  const scope = getScopeForAuth(auth);
  if (scope === 'ASSIGNED') return record.counselorId === auth.userId;
  if (scope === 'BRANCH') {
    if (!!auth.branch && record.branch === auth.branch) return true;
    if (!record.counselorId || !auth.branch) return false;
    const employee = await db.employee.findFirst({
      where: { userId: record.counselorId, branch: auth.branch, status: 'active' },
      select: { id: true },
    });
    return !!employee;
  }
  return false;
}

export const POST = withAuth(async (req, auth, context) => {
  if (!auth.permissions.includes('contacts.view') && !auth.roles.some((role) => role.toLowerCase() === 'super_admin')) {
    return NextResponse.json({ success: false, error: 'Contact-match permission required.' }, { status: 403 });
  }
  if (!mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ success: false, error: 'Cross-origin contact-match decision denied.' }, { status: 403 });
  }

  try {
    const { id } = await (context?.params || Promise.resolve({ id: '' }));
    if (typeof id !== 'string' || !id || id.length > 128) {
      return NextResponse.json({ success: false, error: 'Invalid review id.' }, { status: 400 });
    }
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const decision = body?.decision;
    if (typeof decision !== 'string' || !DECISIONS.includes(decision as Decision)) {
      return NextResponse.json({ success: false, error: 'decision must be OPEN_EXISTING, MERGE_REQUEST, or CREATE_NEW.' }, { status: 400 });
    }

    const normalizedRoles = auth.roles.map((role) => role.toLowerCase());
    const authorizedCreator = normalizedRoles.some((role) => ['super_admin', 'admin', 'branch_manager'].includes(role));
    if (decision === 'MERGE_REQUEST' && !auth.permissions.includes('contacts.merge_review') && !normalizedRoles.includes('super_admin')) {
      return NextResponse.json({ success: false, error: 'Contact merge-review permission required.' }, { status: 403 });
    }
    if (decision === 'CREATE_NEW' && (!authorizedCreator || !auth.permissions.includes('contacts.manage'))) {
      return NextResponse.json({ success: false, error: 'Creating a new contact requires an authorized contact manager.' }, { status: 403 });
    }

    const existing = await db.contactMatchReview.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Contact match review not found.' }, { status: 404 });
    if (existing.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'Contact match review has already been resolved.' }, { status: 409 });
    }

    const phone = normalizePhone(existing.normalizedPhone || existing.incomingPhone);
    if (!phone) return NextResponse.json({ success: false, error: 'Review does not contain a valid phone identity.' }, { status: 422 });

    const conversation = existing.conversationId
      ? await db.uccConversation.findUnique({
          where: { id: existing.conversationId },
          select: { id: true, channel: true, participantPhone: true, assignedToUserId: true, studentId: true, leadId: true },
        })
      : null;
    if (existing.conversationId && (!conversation || conversation.channel.toLowerCase() !== 'whatsapp')) {
      return NextResponse.json({ success: false, error: 'The related WhatsApp conversation no longer exists.' }, { status: 404 });
    }
    if (conversation && (
      normalizePhone(conversation.participantPhone || '') !== phone
      || !canAccessUccConversation(auth, conversation)
    )) {
      return NextResponse.json({ success: false, error: 'The related conversation is outside your authorized scope.' }, { status: 403 });
    }

    const identityLink: { studentId?: string; leadId?: string; partnerId?: string } = {};
    let selectedCandidateKind: string | null = null;
    let selectedCandidateId: string | null = null;
    if (decision === 'OPEN_EXISTING') {
      const requestedCandidate = body?.candidate && typeof body.candidate === 'object'
        ? body.candidate as Record<string, unknown>
        : null;
      const requestedKind = typeof requestedCandidate?.kind === 'string' ? requestedCandidate.kind : '';
      const requestedId = typeof requestedCandidate?.id === 'string' ? requestedCandidate.id : '';
      let candidateIds: Array<{ kind: string; id: string }> = [];
      try {
        const reason = JSON.parse(existing.matchReason || '{}');
        candidateIds = Array.isArray(reason?.candidateIds) ? reason.candidateIds : [];
      } catch {
        candidateIds = [];
      }

      let targetKind = '';
      let targetId = '';
      if (requestedKind && requestedId) {
        const wasCandidate = candidateIds.some((candidate) => candidate?.kind === requestedKind && candidate?.id === requestedId);
        if (!wasCandidate) {
          return NextResponse.json({ success: false, error: 'Selected record is not a candidate in this review.' }, { status: 409 });
        }
        targetKind = requestedKind;
        targetId = requestedId;
      } else {
        const savedCandidates = [
          existing.matchedStudentId ? { kind: 'student', id: existing.matchedStudentId } : null,
          existing.matchedLeadId ? { kind: 'lead', id: existing.matchedLeadId } : null,
          existing.matchedPartnerId ? { kind: 'partner_contact', id: existing.matchedPartnerId } : null,
        ].filter((item): item is { kind: string; id: string } => !!item);
        if (savedCandidates.length !== 1) {
          return NextResponse.json({ success: false, error: 'Select one verified CRM candidate. No identity link or merge was made.' }, { status: 409 });
        }
        targetKind = savedCandidates[0].kind;
        targetId = savedCandidates[0].id;
      }
      selectedCandidateKind = targetKind;
      selectedCandidateId = targetId;

      const incomingEmail = String(existing.incomingEmail || '').trim().toLowerCase();
      const incomingPhoneVariants = new Set(phoneVariants(phone));
      const identityMatches = (candidatePhones: Array<string | null | undefined>, candidateEmail?: string | null) => {
        const phoneMatch = candidatePhones.some((candidatePhone) =>
          phoneVariants(candidatePhone).some((variant) => incomingPhoneVariants.has(variant))
        );
        const emailMatch = !!incomingEmail && !!candidateEmail && candidateEmail.trim().toLowerCase() === incomingEmail;
        return phoneMatch || emailMatch;
      };

      if (targetKind === 'student') {
        const student = await db.student.findUnique({
          where: { id: targetId },
          select: { id: true, phone: true, email: true, counselorId: true },
        });
        if (!student || !identityMatches([student.phone], student.email)) {
          return NextResponse.json({ success: false, error: 'Candidate no longer matches this identity. Keep the review pending.' }, { status: 409 });
        }
        if (!await canAccessIdentity(auth, { kind: 'student', counselorId: student.counselorId })) {
          return NextResponse.json({ success: false, error: 'Candidate not found or outside your authorized scope.' }, { status: 404 });
        }
        identityLink.studentId = student.id;
      } else if (targetKind === 'lead') {
        const lead = await db.lead.findUnique({
          where: { id: targetId },
          select: { id: true, phone: true, altPhone: true, email: true, counselorId: true, branch: true },
        });
        if (!lead || !identityMatches([lead.phone, lead.altPhone], lead.email)) {
          return NextResponse.json({ success: false, error: 'Candidate no longer matches this identity. Keep the review pending.' }, { status: 409 });
        }
        if (!await canAccessIdentity(auth, { kind: 'lead', counselorId: lead.counselorId, branch: lead.branch })) {
          return NextResponse.json({ success: false, error: 'Candidate not found or outside your authorized scope.' }, { status: 404 });
        }
        identityLink.leadId = lead.id;
      } else if (targetKind === 'partner_contact') {
        const partner = await db.user.findUnique({
          where: { id: targetId },
          select: { id: true, phone: true, email: true, partnerId: true },
        });
        if (!partner || !partner.partnerId || !identityMatches([partner.phone], partner.email)) {
          return NextResponse.json({ success: false, error: 'Candidate no longer matches this identity. Keep the review pending.' }, { status: 409 });
        }
        if (!hasCompanyWideContactAccess(auth) && (!auth.partnerId || partner.partnerId !== auth.partnerId)) {
          return NextResponse.json({ success: false, error: 'Candidate not found or outside your authorized scope.' }, { status: 404 });
        }
        identityLink.partnerId = partner.partnerId;
      } else {
        return NextResponse.json({ success: false, error: 'This registry-only candidate cannot be linked to a student record.' }, { status: 409 });
      }
    }

    if (conversation && identityLink.studentId && !await canViewUccConversationB2B(auth, { studentId: identityLink.studentId })) {
      return NextResponse.json({ success: false, error: 'The selected student record is outside your B2B visibility scope.' }, { status: 403 });
    }

    const statusMap: Record<Decision, string> = {
      // These are reviewed decisions, not claims that a student was merged or a
      // new student was provisioned. CREATE_NEW below creates only a registry
      // contact, never a Student row.
      OPEN_EXISTING: 'RESOLVED_EXISTING_CONFIRMED',
      MERGE_REQUEST: 'MERGE_REQUESTED',
      CREATE_NEW: 'NEW_CONTACT_AUTHORIZED',
    };

    const transactionResult = await db.$transaction(async (tx) => {
      const claim = await tx.contactMatchReview.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          decision,
          decidedBy: auth.userId,
          decidedAt: new Date(),
          status: statusMap[decision as Decision],
          matchedStudentId: identityLink.studentId,
          matchedLeadId: identityLink.leadId,
          matchedPartnerId: selectedCandidateKind === 'partner_contact' ? selectedCandidateId : undefined,
        },
      });
      if (claim.count !== 1) return { conflict: true as const, contactId: null as string | null };

      let contactId: string | null = null;
      if (decision === 'CREATE_NEW' || decision === 'OPEN_EXISTING') {
        const phoneIdentityVariants = phoneVariants(phone);
        const seedContactData = {
          phone,
          normalizedPhone: phone,
          displayName: existing.incomingName?.trim().slice(0, 120) || phone,
          source: 'CONTACT_MATCH_REVIEW',
          studentId: identityLink.studentId || '',
          leadId: identityLink.leadId || '',
          partnerId: identityLink.partnerId || '',
          assignedCounselorId: auth.userId,
          branch: auth.branch || '',
        };
        const existingContact = await tx.whatsAppContact.findFirst({
          where: { OR: [
            { normalizedPhone: { in: phoneIdentityVariants } },
            { phone: { in: phoneIdentityVariants } },
          ] },
          select: { id: true },
        });
        const contact = existingContact
          ? await tx.whatsAppContact.update({ where: { id: existingContact.id }, data: { lastContactAt: new Date() }, select: { id: true } })
          : await tx.whatsAppContact.upsert({
              where: { normalizedPhone: phone },
              update: { lastContactAt: new Date() },
              create: seedContactData,
              select: { id: true },
            });
        contactId = contact.id;

        if (decision === 'OPEN_EXISTING') {
          const current = await tx.whatsAppContact.findUnique({
            where: { id: contact.id },
            select: { studentId: true, leadId: true, partnerId: true, assignedCounselorId: true, branch: true },
          });
          if (!current) throw new Error('CONTACT_IDENTITY_LINK_CONFLICT');
          for (const field of ['studentId', 'leadId', 'partnerId'] as const) {
            const expected = identityLink[field] || '';
            if (current[field] && current[field] !== expected) throw new Error('CONTACT_IDENTITY_LINK_CONFLICT');
          }
          const linked = await tx.whatsAppContact.updateMany({
            where: {
              id: contact.id,
              studentId: current.studentId,
              leadId: current.leadId,
              partnerId: current.partnerId,
              assignedCounselorId: current.assignedCounselorId,
              branch: current.branch,
            },
            data: {
              ...identityLink,
              assignedCounselorId: current.assignedCounselorId || auth.userId,
              branch: current.branch || auth.branch || '',
              displayName: existing.incomingName?.trim().slice(0, 120) || undefined,
              lastContactAt: new Date(),
            },
          });
          if (linked.count !== 1) throw new Error('CONTACT_IDENTITY_LINK_CONFLICT');
        }
      }

      if (decision === 'OPEN_EXISTING' && conversation) {
        const currentStudentId = conversation.studentId ?? null;
        const currentLeadId = conversation.leadId ?? null;
        if ((currentStudentId && identityLink.studentId && currentStudentId !== identityLink.studentId)
          || (currentLeadId && identityLink.leadId && currentLeadId !== identityLink.leadId)
          || (currentStudentId && identityLink.leadId)
          || (currentLeadId && identityLink.studentId)) {
          throw new Error('CONTACT_IDENTITY_LINK_CONFLICT');
        }
        const attached = await tx.uccConversation.updateMany({
          where: { id: conversation.id, studentId: currentStudentId, leadId: currentLeadId },
          data: {
            studentId: identityLink.studentId || currentStudentId,
            leadId: identityLink.leadId || currentLeadId,
          },
        });
        if (attached.count !== 1) throw new Error('CONTACT_IDENTITY_LINK_CONFLICT');
      }

      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId,
          action: `CONTACT_MATCH_${decision}`,
          entityType: 'ContactMatchReview',
          entityId: id,
          metadata: JSON.stringify({
            decision,
            status: statusMap[decision as Decision],
            contactId,
            actorRole: auth.roles[0] || auth.userType,
            linkedStudentId: identityLink.studentId || null,
            linkedLeadId: identityLink.leadId || null,
            linkedPartnerId: identityLink.partnerId || null,
          }),
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 64) || '',
          userAgent: req.headers.get('user-agent')?.slice(0, 255) || '',
        },
      });
      return { conflict: false as const, contactId };
    });

    if (transactionResult.conflict) {
      return NextResponse.json({ success: false, error: 'Another reviewer already resolved this contact match.' }, { status: 409 });
    }
    return NextResponse.json({
      success: true,
      decision,
      status: statusMap[decision as Decision],
      contactId: transactionResult.contactId,
      merged: false,
      studentCreated: false,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'CONTACT_IDENTITY_LINK_CONFLICT') {
      return NextResponse.json({ success: false, error: 'An existing contact is linked to a different CRM record. No link or merge was made; request a separate human review.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Contact-match decision could not be recorded.' }, { status: 500 });
  }
}, { requirePermissions: ['contacts.view'] });
