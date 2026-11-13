import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { PhdAccessError, canAccessProject, type PhdActor } from '../auth';
import { canVerify } from '../auth';
import { buildOutreachEmail, matchSupervisor } from '../supervisors/matching';
import type { SupervisorCreateInput } from '../validation';
import { recordPhdAudit } from '../audit';

function dedupeKeyFor(universityId: string, profileUrl: string): string {
  return createHash('sha256').update(`${universityId}|${profileUrl.trim().toLowerCase()}`).digest('hex').slice(0, 40);
}

export async function createSupervisor(actor: PhdActor, input: SupervisorCreateInput) {
  if (!canVerify(actor)) {
    throw new PhdAccessError('Only a data verifier or administrator can add supervisor records.', 403);
  }
  if (input.availabilityStatus === 'ACCEPTING_STUDENTS' && !input.availabilityEvidence?.trim()) {
    throw new PhdAccessError('“Accepting students” requires explicit evidence from a current official source or a direct reply.', 422);
  }
  if (input.contactEmail && !input.contactSourceUrl) {
    throw new PhdAccessError('An email address may only be stored with the official page on which it is published.', 422);
  }
  const university = await db.phdUniversity.findUnique({ where: { id: input.universityId } });
  if (!university) throw new PhdAccessError('University not found.', 404);

  const dedupeKey = dedupeKeyFor(input.universityId, input.profileUrl);
  const existing = await db.phdSupervisor.findUnique({ where: { dedupeKey } });
  if (existing) return { supervisor: existing, duplicate: true };

  const supervisor = await db.phdSupervisor.create({
    data: {
      universityId: input.universityId,
      schoolId: input.schoolId ?? null,
      fullName: input.fullName,
      roleTitle: input.roleTitle ?? '',
      department: input.department ?? '',
      profileUrl: input.profileUrl,
      researchInterests: input.researchInterests,
      methods: input.methods ?? '',
      facilities: input.facilities ?? '',
      contactEmail: input.contactEmail ?? null,
      contactSourceUrl: input.contactSourceUrl ?? null,
      availabilityStatus: input.availabilityStatus,
      availabilityEvidence: input.availabilityEvidence ?? '',
      verificationStatus: input.verificationStatus,
      lastVerifiedAt: input.lastVerifiedAt ? new Date(input.lastVerifiedAt) : null,
      notes: input.notes ?? '',
      dedupeKey,
      createdById: actor.userId,
      expertise: {
        create: (input.expertise ?? []).map((keyword) => ({ keyword: keyword.slice(0, 100) })),
      },
      publications: {
        create: (input.publications ?? []).map((publication) => ({
          title: publication.title,
          year: publication.year ?? null,
          venue: publication.venue ?? '',
          doi: publication.doi ?? null,
          url: publication.url ?? null,
          verificationStatus: publication.verificationStatus ?? 'NOT_YET_VERIFIED',
        })),
      },
    },
  });
  await recordPhdAudit({ actor, action: 'SUPERVISOR_CREATED', entityType: 'PhdSupervisor', entityId: supervisor.id, details: { universityId: input.universityId } });
  return { supervisor, duplicate: false };
}

export async function listSupervisors(options: {
  search?: string; universityId?: string; availability?: string; page?: number; pageSize?: number;
}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 25));
  const where = {
    ...(options.universityId ? { universityId: options.universityId } : {}),
    ...(options.availability ? { availabilityStatus: options.availability } : {}),
    ...(options.search
      ? {
          OR: [
            { fullName: { contains: options.search } },
            { researchInterests: { contains: options.search } },
            { department: { contains: options.search } },
          ],
        }
      : {}),
  };
  const [total, supervisors] = await Promise.all([
    db.phdSupervisor.count({ where }),
    db.phdSupervisor.findMany({
      where,
      include: { university: { select: { name: true, slug: true } }, publications: true },
      orderBy: [{ verificationStatus: 'asc' }, { fullName: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { supervisors, total, page, pageSize };
}

export async function runSupervisorMatching(actor: PhdActor, projectId: string, topicId?: string | null) {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || (project.userId !== actor.userId && actor.role !== 'ADMINISTRATOR' && project.adviserId !== actor.userId)) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  const topic = await db.phdTopicCandidate.findFirst({
    where: { projectId, ...(topicId ? { id: topicId } : { isSelected: true }) },
    include: { area: true, methodologies: true },
  });
  if (!topic) throw new PhdAccessError('Select a topic before running supervisor matching.', 422);

  const supervisors = await db.phdSupervisor.findMany({
    include: { university: true, publications: true, expertise: true },
    take: 500,
  });
  if (!supervisors.length) {
    return {
      matches: [],
      note: 'No supervisor records exist yet. The directory is intentionally empty rather than populated with invented people. Verified profiles must be added by a data verifier.',
    };
  }

  const results: Array<Record<string, unknown> & {
    id: string;
    supervisorName: string;
    universityName: string;
    fitScore: number;
  }> = [];
  for (const supervisor of supervisors) {
    const match = matchSupervisor({
      supervisor: {
        id: supervisor.id,
        fullName: supervisor.fullName,
        roleTitle: supervisor.roleTitle,
        department: supervisor.department,
        universityName: supervisor.university.name,
        researchInterests: supervisor.researchInterests,
        methods: supervisor.methods,
        expertise: supervisor.expertise.map((item) => item.keyword),
        publications: supervisor.publications.map((publication) => ({
          title: publication.title,
          venue: publication.venue,
          year: publication.year,
          verificationStatus: publication.verificationStatus,
        })),
        availabilityStatus: supervisor.availabilityStatus,
        verificationStatus: supervisor.verificationStatus,
        profileUrl: supervisor.profileUrl,
        contactEmail: supervisor.contactEmail,
        lastVerifiedAt: supervisor.lastVerifiedAt,
      },
      topic: {
        title: topic.workingTitle,
        mainQuestion: topic.mainQuestion,
        keywords: topic.area.keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean),
        methodology: topic.methodologies?.[0]?.methods ?? '',
        theoryFramework: topic.theoryFramework,
      },
    });

    const saved = await db.phdSupervisorMatch.upsert({
      where: { projectId_supervisorId: { projectId, supervisorId: supervisor.id } },
      create: {
        projectId,
        supervisorId: supervisor.id,
        topicId: topic.id,
        fitScore: match.fitScore,
        fitLabel: match.fitLabel,
        keywordAlignment: match.keywordAlignment,
        methodAlignment: match.methodAlignment,
        publicationAlignment: match.publicationAlignment,
        disciplineAlignment: match.disciplineAlignment,
        rationale: match.rationale,
        mismatches: match.mismatches.join('\n'),
        missingEvidence: match.missingEvidence.join('\n'),
        availabilityAtMatch: match.availabilityAtMatch,
      },
      update: {
        topicId: topic.id,
        fitScore: match.fitScore,
        fitLabel: match.fitLabel,
        keywordAlignment: match.keywordAlignment,
        methodAlignment: match.methodAlignment,
        publicationAlignment: match.publicationAlignment,
        disciplineAlignment: match.disciplineAlignment,
        rationale: match.rationale,
        mismatches: match.mismatches.join('\n'),
        missingEvidence: match.missingEvidence.join('\n'),
        availabilityAtMatch: match.availabilityAtMatch,
      },
    });
    results.push({ ...match, id: saved.id, supervisorName: supervisor.fullName, universityName: supervisor.university.name });
  }

  await recordPhdAudit({
    actor,
    action: 'SUPERVISOR_MATCHING_RUN',
    entityType: 'PhdProject',
    entityId: projectId,
    projectId,
    details: { topicId: topic.id, supervisorsEvaluated: supervisors.length },
  });

  return {
    matches: results.sort((a, b) => b.fitScore - a.fitScore),
    note: 'Fit scores use recorded evidence only. A score is not an offer, an availability confirmation or a ranking of people.',
  };
}

/**
 * Saved matches for a project, newest scoring run first. Read-only so that opening
 * the workspace never re-runs scoring or writes a new audit event.
 */
export async function listSupervisorMatches(actor: PhdActor, projectId: string) {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || !canAccessProject(actor, project, 'read')) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  const rows = await db.phdSupervisorMatch.findMany({
    where: { projectId },
    include: { supervisor: { include: { university: { select: { name: true } } } } },
    orderBy: [{ fitScore: 'desc' }, { updatedAt: 'desc' }],
    take: 50,
  });
  return {
    matches: rows.map((row) => ({
      id: row.id,
      supervisorId: row.supervisorId,
      supervisorName: row.supervisor.fullName,
      universityName: row.supervisor.university.name,
      profileUrl: row.supervisor.profileUrl,
      verificationStatus: row.supervisor.verificationStatus,
      fitScore: row.fitScore,
      fitLabel: row.fitLabel,
      keywordAlignment: row.keywordAlignment,
      methodAlignment: row.methodAlignment,
      publicationAlignment: row.publicationAlignment,
      disciplineAlignment: row.disciplineAlignment,
      rationale: row.rationale,
      mismatches: row.mismatches ? row.mismatches.split('\n').filter(Boolean) : [],
      missingEvidence: row.missingEvidence ? row.missingEvidence.split('\n').filter(Boolean) : [],
      availabilityAtMatch: row.availabilityAtMatch,
      updatedAt: row.updatedAt,
    })),
    note: rows.length
      ? 'Saved fit assessments from your last matching run. Re-run matching after changing your topic.'
      : 'Run matching once a topic is selected. A fit score is not an offer, an availability confirmation or a ranking of people.',
  };
}

/** Outreach history for a project. Drafts are per student and never shared. */
export async function listOutreach(actor: PhdActor, projectId: string) {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== actor.userId) throw new PhdAccessError('Project not found or access denied.', 404);
  const contacts = await db.phdSupervisorContact.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
    include: { supervisor: { select: { id: true, fullName: true, university: { select: { name: true } } } } },
  });
  return contacts.map((contact) => ({
    id: contact.id,
    supervisorId: contact.supervisorId,
    supervisorName: contact.supervisor?.fullName ?? '',
    universityName: contact.supervisor?.university?.name ?? '',
    subject: contact.subject,
    body: contact.body,
    status: contact.status,
    notes: contact.notes,
    responseSummary: contact.responseSummary,
    nextFollowUpAt: contact.nextFollowUpAt,
    updatedAt: contact.updatedAt,
  }));
}

/**
 * Records the outcome of an outreach step. The applicant is the only person who
 * may change their own outreach record; sending is always a manual action taken
 * outside the platform, so this only records what the user reports.
 */
export async function updateOutreach(
  actor: PhdActor,
  projectId: string,
  contactId: string,
  input: { status: string; notes?: string | null; responseSummary?: string | null; nextFollowUpAt?: string | null },
) {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== actor.userId) throw new PhdAccessError('Project not found or access denied.', 404);
  const contact = await db.phdSupervisorContact.findUnique({ where: { id: contactId } });
  if (!contact || contact.projectId !== projectId) throw new PhdAccessError('Outreach record not found.', 404);
  const updated = await db.phdSupervisorContact.update({
    where: { id: contactId },
    data: {
      status: input.status,
      ...(input.notes !== undefined ? { notes: (input.notes ?? '').slice(0, 2000) } : {}),
      ...(input.responseSummary !== undefined ? { responseSummary: (input.responseSummary ?? '').slice(0, 2000) } : {}),
      ...(input.nextFollowUpAt !== undefined ? { nextFollowUpAt: input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null } : {}),
    },
  });
  await recordPhdAudit({ actor, action: 'OUTREACH_STATUS_UPDATED', entityType: 'PhdSupervisorContact', entityId: contactId, projectId, details: { status: input.status } });
  return updated;
}

export async function draftOutreach(actor: PhdActor, projectId: string, supervisorId: string, attachments?: string[]) {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== actor.userId) throw new PhdAccessError('Project not found or access denied.', 404);
  const [supervisor, profile, application] = await Promise.all([
    db.phdSupervisor.findUnique({
      where: { id: supervisorId },
      include: { university: true, publications: true },
    }),
    db.phdProfile.findUnique({ where: { userId: actor.userId } }),
    db.phdApplication.findFirst({ where: { projectId, supervisorId }, include: { programme: true, proposal: true } }),
  ]);
  if (!supervisor) throw new PhdAccessError('Supervisor not found.', 404);

  const topic = await db.phdTopicCandidate.findFirst({
    where: { projectId, isSelected: true },
    include: { methodologies: true },
  });
  if (!topic) throw new PhdAccessError('Select a topic before drafting supervisor outreach.', 422);

  const verifiedSupervisorPublications = supervisor.publications
    .filter((publication) => publication.verificationStatus === 'VERIFIED_OFFICIAL')
    .map((publication) => ({ title: publication.title, year: publication.year }));

  const draft = buildOutreachEmail({
    applicantName: actor.name,
    applicantBackground: profile
      ? `${profile.highestQualification || '[qualification]'} in ${profile.degreeSubject || '[subject]'}${profile.classification ? ` (${profile.classification})` : ''}${profile.researchExperience ? `. Research experience: ${profile.researchExperience.slice(0, 300)}` : ''}`
      : '[add your background]',
    universityName: supervisor.university.name,
    programmeName: application?.programme.name,
    supervisorName: supervisor.fullName,
    topicTitle: topic.workingTitle,
    mainQuestion: topic.mainQuestion,
    methodologyLabel: topic.methodologies[0]?.methods ?? 'the proposed methodology',
    verifiedPublications: verifiedSupervisorPublications,
    attachments,
    applicantEmail: actor.email,
  });

  const contact = await db.phdSupervisorContact.create({
    data: {
      projectId,
      supervisorId,
      userId: actor.userId,
      subject: draft.subject,
      body: draft.body,
      attachments: JSON.stringify(draft.attachments),
      status: 'DRAFTED',
      notes: draft.warnings.join('\n'),
      responseSummary: '',
    },
  });
  await recordPhdAudit({ actor, action: 'OUTREACH_DRAFTED', entityType: 'PhdSupervisorContact', entityId: contact.id, projectId, details: { supervisorId } });
  return { contact, draft };
}
