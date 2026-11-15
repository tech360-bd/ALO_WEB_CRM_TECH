/**
 * LIVE CONTACT / STUDENT IDENTIFICATION — database reads.
 * ======================================================
 * `identifyByPhone()` loads exactly what the card needs, in bounded queries, and
 * hands the decision to `buildIdentificationCard` in `./identification-card.ts`.
 * The decision rules stay db-free and unit-tested; this file only reads.
 *
 * Nothing here creates a record. An unknown number returns `UNKNOWN` and the
 * allowed next actions — a Student and a Student ID require registration approval.
 */

import { db } from '@/lib/db';
import {
  phoneVariants,
  resolveContactIdentity,
  shouldAutoCreateStudent,
  type ContactCandidate,
} from '@/lib/communications/contact-identity';
import { normalizePhone } from '@/lib/phone-normalization';
import {
  buildIdentificationCard,
  dedupeCandidates,
  NAME_ONLY_REFUSAL,
  normalizeIdentificationInput,
  type FollowUpItem,
  type GuardianLink,
  type IdentificationCard,
  type IdentificationPhone,
  type PrimaryIdentity,
} from './identification-card';

export type {
  FollowUpItem,
  GuardianLink,
  IdentificationCard,
  IdentificationPhone,
  IdentificationState,
  PossibleMatch,
  PrimaryIdentity,
} from './identification-card';
export {
  buildIdentificationCard,
  normalizeIdentificationInput,
  rejectNameOnlyIdentification,
  profileHrefFor,
} from './identification-card';

const MAX_CANDIDATES = 6;

/**
 * Resolve a number to a card.
 *
 * Every query is bounded and selects only the fields the card shows: a call-sheet
 * that pulls whole student rows over a phone number is a data-minimisation failure
 * as well as a slow one (§22).
 */
/** Open follow-ups for a record, from both engines the CRM uses. */
async function loadOpenFollowUps(kind: 'student' | 'lead', recordId: string): Promise<FollowUpItem[]> {
  const [tasks, schedules] = await Promise.all([
    kind === 'student'
      ? db.task.findMany({
          where: { studentId: recordId, status: 'PENDING' },
          orderBy: { dueDate: 'asc' },
          take: 10,
          select: { id: true, title: true, type: true, priority: true, status: true, dueDate: true, assigneeId: true },
        })
      : Promise.resolve([]),
    db.whatsAppFollowUpSchedule.findMany({
      where: kind === 'student'
        ? { OR: [{ studentId: recordId }, { leadId: recordId }], status: { in: ['scheduled', 'failed'] }, isPaused: false }
        : { leadId: recordId, status: { in: ['scheduled', 'failed'] }, isPaused: false },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
      select: { id: true, scheduledDay: true, scheduledAt: true, status: true, contactPhone: true },
    }).catch(() => []),
  ]);

  const items: FollowUpItem[] = tasks.map(toFollowUp);
  for (const schedule of schedules) {
    items.push({
      id: schedule.id,
      title: `WhatsApp follow-up · day ${schedule.scheduledDay}`,
      type: 'WHATSAPP_FOLLOW_UP',
      priority: schedule.status === 'failed' ? 'HIGH' : 'NORMAL',
      status: schedule.status,
      dueDate: schedule.scheduledAt.toISOString(),
      assigneeId: '',
      overdue: schedule.scheduledAt.getTime() < Date.now(),
    });
  }
  return items.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')).slice(0, 10);
}

export async function identifyByPhone(phone: string): Promise<IdentificationCard> {
  const startedAt = performance.now();
  const normalizedInput = normalizeIdentificationInput(phone);
  if (!normalizedInput) {
    return {
      state: 'UNKNOWN',
      queriedPhone: '',
      matchedOn: null,
      primary: null,
      possible: [],
      guardians: [],
      registryContactId: null,
      unknown: null,
      requiresConfirmation: false,
      restricted: false,
      notice: NAME_ONLY_REFUSAL,
      meta: {
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
        resolvedAt: new Date().toISOString(),
        realTimeVerified: false,
        realTimeNote: 'No resolution was attempted: the input was not a usable phone number.',
      },
    };
  }

  const { variants } = normalizedInput;

  const [registryRowsRaw, studentsRaw, leadsRaw, guardianRowsRaw] = await Promise.all([
    db.whatsAppContact.findMany({
      where: { OR: [{ normalizedPhone: { in: variants } }, { phone: { in: variants } }] },
      select: { id: true, displayName: true, phone: true, normalizedPhone: true, email: true, studentId: true, leadId: true, assignedCounselorId: true, branch: true },
      take: MAX_CANDIDATES,
    }),
    db.student.findMany({
      where: { OR: [{ phone: { in: variants } }, { phone: { in: variants.map((variant) => `+${variant}`) } }] },
      select: { id: true, studentId: true, name: true, email: true, phone: true, status: true, journeyStage: true, counselorId: true, counselorName: true },
      take: MAX_CANDIDATES,
    }),
    db.lead.findMany({
      where: { OR: [{ phone: { in: variants } }, { altPhone: { in: variants } }] },
      select: { id: true, fullName: true, phone: true, altPhone: true, email: true, status: true, counselorId: true, studentId: true },
      take: MAX_CANDIDATES,
    }),
    db.parentGuardian.findMany({
      where: { OR: [{ phone: { in: variants } }, { whatsapp: { in: variants } }] },
      select: { id: true, studentId: true, fullName: true, relationship: true, phone: true, whatsapp: true, isPrimaryContact: true, isFinancialSponsor: true, status: true },
      take: MAX_CANDIDATES,
    }),
  ]);

  // Row types are declared here rather than inferred: the checked-in Prisma client
  // in this environment is a stub (`PrismaClient: any`), so inference degrades to
  // `{}` and the compiler cannot check these rows. The `select` clause above is the
  // contract; these aliases make it explicit and keep the file error-free.
  type RegistryRow = { id: string; displayName: string; phone: string; normalizedPhone: string; email: string; studentId: string; leadId: string; assignedCounselorId: string | null; branch: string };
  type StudentRow = { id: string; studentId: string; name: string; email: string; phone: string; status: string; journeyStage: string; counselorId: string | null; counselorName: string };
  type LeadRow = { id: string; fullName: string; phone: string; altPhone: string | null; email: string; status: string; counselorId: string | null; studentId: string | null };
  type GuardianRow = { id: string; studentId: string; fullName: string; relationship: string; phone: string; whatsapp: string; isPrimaryContact: boolean; isFinancialSponsor: boolean; status: string };

  const registryRows = registryRowsRaw as unknown as RegistryRow[];
  const students = studentsRaw as unknown as StudentRow[];
  const leads = leadsRaw as unknown as LeadRow[];
  const guardianRows = guardianRowsRaw as unknown as GuardianRow[];

  // Optional, and kept out of the Promise.all on purpose: partner contacts share the
  // registry but are not required for identification, so a failure here degrades the
  // card instead of failing the request.
  type PartnerRow = { id: string; name: string; organization: string; phone: string | null; email: string | null };
  const partnerRows: PartnerRow[] = await db.b2BContact
    .findMany({
      where: { phone: { in: variants } },
      select: { id: true, name: true, organization: true, phone: true, email: true },
      take: MAX_CANDIDATES,
    })
    .catch(() => [] as PartnerRow[]) as unknown as PartnerRow[];

  // Guardians belong to students; load just the names/IDs needed for the card.
  const guardianStudentIds = [...new Set(guardianRows.map((row) => row.studentId))];
  // `in: []` simply returns nothing, so no branch (and no untyped union) is needed.
  const guardianStudents = (await db.student.findMany({
    where: { id: { in: guardianStudentIds } },
    select: { id: true, studentId: true, name: true },
  })) as unknown as { id: string; studentId: string; name: string }[];
  const guardianStudentById = new Map(guardianStudents.map((student) => [student.id, student]));

  const guardians: GuardianLink[] = guardianRows.map((row) => {
    const student = guardianStudentById.get(row.studentId);
    return {
      studentRecordId: row.studentId,
      studentPublicId: student?.studentId || '',
      studentName: student?.name || '(student record)',
      guardianName: row.fullName,
      relationship: row.relationship,
      guardianId: row.id,
      isPrimaryContact: row.isPrimaryContact,
      isFinancialSponsor: row.isFinancialSponsor,
      status: row.status,
      profileHref: `/crm/students/${row.studentId}`,
    };
  });

  const candidates: ContactCandidate[] = [
    ...students.map<ContactCandidate>((student) => ({
      kind: 'student',
      id: student.id,
      reference: student.studentId,
      name: student.name,
      phone: student.phone,
      email: student.email,
      matchedOn: 'phone',
    })),
    ...leads.map<ContactCandidate>((lead) => ({
      kind: 'lead',
      id: lead.id,
      reference: lead.id,
      name: lead.fullName,
      phone: lead.phone,
      altPhone: lead.altPhone,
      email: lead.email,
      matchedOn: normalizePhone(lead.phone) && variants.includes(normalizePhone(lead.phone)) ? 'phone' : 'alt_phone',
    })),
    ...partnerRows.map<ContactCandidate>((row) => ({
      kind: 'partner_contact',
      id: row.id,
      reference: row.organization || row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      matchedOn: 'phone',
    })),
  ];

  // The same digits are offered as both the primary and the alternate phone: a lead
  // found through `altPhone` must resolve as a *possible* match (confirm before
  // acting), not vanish from the matcher and be reported as an unknown number.
  const match = resolveContactIdentity(
    { phone: normalizedInput.normalized, altPhone: normalizedInput.normalized },
    candidates,
  );

  // Load the full profile only for what the decision actually needs.
  const profiles = new Map<string, PrimaryIdentity>();
  const primaryCandidate = match.confidence === 'exact' && dedupeCandidates(match.candidates).length === 1
    ? dedupeCandidates(match.candidates)[0]
    : null;

  if (primaryCandidate) {
    const profile = await loadProfile(primaryCandidate, {
      students,
      leads,
      registryRows,
    });
    if (profile) profiles.set(`${primaryCandidate.kind}:${primaryCandidate.id}`, profile);
  } else {
    // For a possible-match list, cheap facts (stage/counsellor) help the operator
    // choose, so profiles are loaded for every candidate but bounded.
    for (const candidate of dedupeCandidates(match.candidates).slice(0, MAX_CANDIDATES)) {
      const profile = await loadProfile(candidate, { students, leads, registryRows });
      if (profile) profiles.set(`${candidate.kind}:${candidate.id}`, profile);
    }
  }

  const registryContactId = registryRows[0]?.id ?? null;

  const card = buildIdentificationCard({
    phone: normalizedInput.normalized,
    match,
    guardians,
    profiles,
    registryContactId,
    startedAt,
  });

  // Nothing is created for an unknown number, ever (§12). Stated in the payload so
  // the UI cannot imply otherwise.
  if (card.state === 'UNKNOWN' && shouldAutoCreateStudent() !== false) {
    throw new Error('Identity invariant violated: student auto-creation must always be false.');
  }

  return card;
}

async function loadProfile(
  candidate: ContactCandidate,
  preloaded: {
    students: { id: string; studentId: string; name: string; email: string; phone: string; status: string; journeyStage: string; counselorId: string | null; counselorName: string }[];
    leads: { id: string; fullName: string; phone: string; altPhone: string | null; email: string; status: string; counselorId: string | null; studentId: string | null }[];
    registryRows: { id: string; displayName: string; phone: string; normalizedPhone: string; email: string; assignedCounselorId: string | null; branch: string }[];
  },
): Promise<PrimaryIdentity | null> {
  if (candidate.kind === 'student') {
    const student = preloaded.students.find((row) => row.id === candidate.id);
    if (!student) return null;

    const [application, guardianRows, openFollowUps, lastMessage, historyCount] = await Promise.all([
      db.application.findFirst({
        where: { studentId: student.id },
        orderBy: { updatedAt: 'desc' },
        select: { universityName: true, courseName: true, stage: true, status: true },
      }),
      db.parentGuardian.findMany({
        where: { studentId: student.id },
        select: { id: true, studentId: true, fullName: true, relationship: true, isPrimaryContact: true, isFinancialSponsor: true, status: true },
        take: 8,
      }),
      loadOpenFollowUps('student', student.id),
      db.uccConversation.findFirst({
        where: { OR: [{ studentId: student.id }, { participantPhone: { in: phoneVariants(student.phone) } }] },
        orderBy: { lastMessageAt: 'desc' },
        select: { channel: true, lastMessageAt: true, lastMessageText: true, participantPhone: true },
      }),
      db.communicationMessage.count({ where: { studentId: student.id } }),
    ]);

    const guardianLinks: GuardianLink[] = guardianRows.map((row) => ({
      studentRecordId: student.id,
      studentPublicId: student.studentId,
      studentName: student.name,
      guardianName: row.fullName,
      relationship: row.relationship,
      guardianId: row.id,
      isPrimaryContact: row.isPrimaryContact,
      isFinancialSponsor: row.isFinancialSponsor,
      status: row.status,
      profileHref: `/crm/students/${student.id}`,
    }));

    return {
      kind: 'student',
      recordId: student.id,
      publicId: student.studentId,
      name: student.name || '(no name on record)',
      lifecycleStage: student.journeyStage,
      status: student.status,
      // The student's own number only. Guardian numbers are listed in
      // `parentGuardian` so the two can never be conflated (§6).
      phones: collectPhones([{ value: student.phone, source: 'student.phone' }]),
      email: student.email,
      photoUrl: null,
      photoReason:
        'The schema has no student photo column, and uploaded documents are stored privately with no public URL by design. Adding a photo requires a new field plus an access-controlled route — not fabricated here.',
      parentGuardian: guardianLinks,
      counselor: student.counselorId || student.counselorName
        ? { id: student.counselorId || '', name: student.counselorName || student.counselorId || '' }
        : null,
      application: application
        ? {
            university: application.universityName,
            course: application.courseName,
            stage: application.stage,
            status: application.status,
          }
        : null,
      lastConversation: lastMessage
        ? {
            channel: lastMessage.channel,
            at: lastMessage.lastMessageAt.toISOString(),
            preview: (lastMessage.lastMessageText || '').slice(0, 200),
            direction: 'n/a',
          }
        : null,
      openFollowUps,
      historyCount,
      profileHref: `/crm/students/${student.id}`,
      scopeNotice: null,
    };
  }

  if (candidate.kind === 'lead') {
    const lead = preloaded.leads.find((row) => row.id === candidate.id);
    if (!lead) return null;
    const [openFollowUps, lastMessage] = await Promise.all([
      loadOpenFollowUps('lead', lead.id),
      db.uccConversation.findFirst({
        where: { OR: [{ leadId: lead.id }, { participantPhone: { in: phoneVariants(lead.phone) } }] },
        orderBy: { lastMessageAt: 'desc' },
        select: { channel: true, lastMessageAt: true, lastMessageText: true },
      }),
    ]);
    return {
      kind: 'lead',
      recordId: lead.id,
      publicId: lead.id,
      name: lead.fullName || '(no name on record)',
      lifecycleStage: lead.status,
      status: lead.status,
      phones: collectPhones([
        { value: lead.phone, source: 'lead.phone' },
        { value: lead.altPhone || '', source: 'lead.altPhone' },
      ]),
      email: lead.email,
      photoUrl: null,
      photoReason: 'No photo field on lead records.',
      parentGuardian: [],
      counselor: lead.counselorId ? { id: lead.counselorId, name: lead.counselorId } : null,
      application: null,
      lastConversation: lastMessage
        ? {
            channel: lastMessage.channel,
            at: lastMessage.lastMessageAt.toISOString(),
            preview: (lastMessage.lastMessageText || '').slice(0, 200),
            direction: 'n/a',
          }
        : null,
      openFollowUps,
      historyCount: 0,
      profileHref: `/crm/leads/${lead.id}`,
      scopeNotice: 'This number matches a lead, not a registered student. No Student ID exists until registration is approved.',
    };
  }

  // Partner / B2B contact
  const registry = preloaded.registryRows.find((row) => row.id === candidate.id)
    || preloaded.registryRows.find((row) => row.id === candidate.reference);
  return {
    kind: 'partner_contact',
    recordId: candidate.id,
    publicId: candidate.reference || candidate.id,
    name: candidate.name || registry?.displayName || '(no name on record)',
    lifecycleStage: 'PARTNER',
    status: 'ACTIVE',
    phones: collectPhones([{ value: candidate.phone || registry?.phone || '', source: 'registry' }]),
    email: candidate.email || registry?.email || '',
    photoUrl: null,
    photoReason: 'No photo field on partner contact records.',
    parentGuardian: [],
    counselor: registry?.assignedCounselorId ? { id: registry.assignedCounselorId, name: registry.assignedCounselorId } : null,
    application: null,
    lastConversation: null,
    openFollowUps: [],
    historyCount: 0,
    profileHref: `/crm/contacts/${candidate.id}`,
    scopeNotice: null,
  };
}

function toFollowUp(row: { id: string; title: string; type: string; priority: string; status: string; dueDate: string | null; assigneeId: string }): FollowUpItem {
  const due = row.dueDate || '';
  const dueTime = due ? Date.parse(due) : Number.NaN;
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    priority: row.priority,
    status: row.status,
    dueDate: due,
    assigneeId: row.assigneeId,
    overdue: Number.isFinite(dueTime) ? dueTime < Date.now() : false,
  };
}

/** Deduplicate numbers for display, keeping the provenance of the first sighting. */
function collectPhones(
  entries: { value: string; source: IdentificationPhone['source'] }[],
): IdentificationPhone[] {
  const seen = new Set<string>();
  const phones: IdentificationPhone[] = [];
  for (const entry of entries) {
    if (!entry.value) continue;
    const normalized = normalizePhone(entry.value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    phones.push({ value: entry.value, normalized, source: entry.source });
  }
  return phones;
}
