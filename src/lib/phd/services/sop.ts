import { db } from '@/lib/db';
import { PhdAccessError, canAdvise, canAccessProject, type PhdActor } from '../auth';
import { recordPhdAudit, notifyPhdUser } from '../audit';
import {
  EMPTY_PERSONAL_FACTS,
  SOP_EXPORT_FILENAMES,
  SOP_SECTIONS,
  SOP_STATUSES,
  SOP_TRANSITIONS,
  parsePersonalFacts,
  serialisePersonalFacts,
  type SopPersonalFacts,
  type SopStatus,
} from '../sop/constants';
import { generateSopDraft } from '../sop/generator';
import { checkSop, type SopReviewReport } from '../sop/checks';
import { buildDocx } from '../exports/docx';
import { buildPdf } from '../exports/pdf';
import { parseMethods } from './profile';

/**
 * Statement-of-purpose service.
 *
 * Access rules
 * ------------
 *   • only the project owner may create, edit or regenerate a statement;
 *   • a research adviser attached to the project, a data verifier and an
 *     administrator may read it;
 *   • final approval must come from a human other than the author (adviser,
 *     verifier or administrator), and the approval is recorded as an immutable
 *     review row;
 *   • every status change writes the status and the review row together.
 *
 * A statement is never exported as "final" before it is approved, and the export
 * is only marked verified after the file was generated from saved content.
 */

const SECTION_KEYS = SOP_SECTIONS.map((section) => section.key as string);

export interface SopCreateInput {
  projectId: string;
  universityId?: string | null;
  programmeId?: string | null;
  title?: string;
  targetWords?: number;
  wordLimit?: number | null;
  aiDisclosureRequired?: boolean | null;
}

export interface SopUpdateInput {
  title?: string;
  targetWords?: number;
  wordLimit?: number | null;
  aiDisclosureRequired?: boolean | null;
  /** A null means "clear this field", which is how the editor deletes text. */
  personalFacts?: { [K in keyof SopPersonalFacts]?: SopPersonalFacts[K] | null };
  notes?: string | null;
}

export interface SopSectionUpdate {
  sectionKey: string;
  content: string;
}

async function loadProject(actor: PhdActor, projectId: string, mode: 'read' | 'write') {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || !canAccessProject(actor, project, mode)) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  return project;
}

async function loadSop(actor: PhdActor, sopId: string) {
  const sop = await db.phdStatementOfPurpose.findUnique({
    where: { id: sopId },
    include: {
      project: true,
      university: true,
      programme: true,
      sections: { orderBy: { sortOrder: 'asc' } },
      versions: { orderBy: { version: 'desc' }, take: 20 },
      reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!sop || !canAccessProject(actor, sop.project, 'read')) {
    throw new PhdAccessError('Statement not found or access denied.', 404);
  }
  return sop;
}

function normaliseFacts(input: { [K in keyof SopPersonalFacts]?: SopPersonalFacts[K] | null }): SopPersonalFacts {
  const text = (value: unknown): string => (typeof value === 'string' ? value : '');
  return {
    motivation: text(input.motivation),
    whyProgramme: text(input.whyProgramme),
    whyUniversity: text(input.whyUniversity),
    achievements: Array.isArray(input.achievements) ? input.achievements.map(String).filter(Boolean) : [],
    careerPlan: text(input.careerPlan),
    professionalContext: text(input.professionalContext),
    aiUse: text(input.aiUse),
    reviewerNotes: text(input.reviewerNotes),
  };
}

function assertOwner(sop: { project: { userId: string } }, actor: PhdActor, action: string): void {
  if (sop.project.userId !== actor.userId && actor.role !== 'ADMINISTRATOR') {
    throw new PhdAccessError(`Only the student who owns this statement can ${action}.`, 403);
  }
}

export async function listSops(actor: PhdActor, projectId: string) {
  const project = await loadProject(actor, projectId, 'read');
  const sops = await db.phdStatementOfPurpose.findMany({
    where: { projectId: project.id },
    include: {
      university: { select: { name: true } },
      programme: { select: { name: true } },
      sections: { select: { sectionKey: true, content: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return sops.map((sop) => ({
    id: sop.id,
    title: sop.title,
    status: sop.status,
    version: sop.version,
    targetWords: sop.targetWords,
    wordLimit: sop.wordLimit,
    aiDisclosureRequired: sop.aiDisclosureRequired,
    universityName: sop.university?.name ?? null,
    programmeName: sop.programme?.name ?? null,
    wordCount: sop.sections.reduce((total, section) => total + (section.content.trim() ? section.content.trim().split(/\s+/).length : 0), 0),
    filledSections: sop.sections.filter((section) => section.content.trim().length > 0).length,
    updatedAt: sop.updatedAt,
    universityId: sop.universityId,
    programmeId: sop.programmeId,
  }));
}

export async function createSop(actor: PhdActor, input: SopCreateInput) {
  const project = await loadProject(actor, input.projectId, 'write');
  if (project.userId !== actor.userId && actor.role !== 'ADMINISTRATOR') {
    throw new PhdAccessError('Only the student who owns this project can create a statement.', 403);
  }

  let universityName: string | null = null;
  let programmeName: string | null = null;
  let programmeAward = '';
  let programmeDiscipline = '';

  if (input.programmeId) {
    const programme = await db.phdProgramme.findUnique({ where: { id: input.programmeId }, include: { university: true } });
    if (!programme) throw new PhdAccessError('Programme not found.', 404);
    programmeName = programme.name;
    programmeAward = programme.award;
    programmeDiscipline = programme.discipline;
    if (input.universityId && programme.universityId !== input.universityId) {
      throw new PhdAccessError('The programme does not belong to the selected university.', 422);
    }
    input.universityId = programme.universityId;
    universityName = programme.university.name;
  }
  if (input.universityId && !universityName) {
    const university = await db.phdUniversity.findUnique({ where: { id: input.universityId } });
    if (!university) throw new PhdAccessError('University not found.', 404);
    universityName = university.name;
  }

  const existing = await db.phdStatementOfPurpose.findFirst({
    where: {
      projectId: project.id,
      universityId: input.universityId ?? null,
      programmeId: input.programmeId ?? null,
    },
  });
  if (existing) throw new PhdAccessError('A statement already exists for this programme. Open it to continue.', 409);

  const wordLimit = input.wordLimit ?? null;
  const sop = await db.phdStatementOfPurpose.create({
    data: {
      projectId: project.id,
      universityId: input.universityId ?? null,
      programmeId: input.programmeId ?? null,
      title: (input.title ?? `Statement of purpose${universityName ? ` — ${universityName}` : ''}`).slice(0, 200),
      status: 'DRAFT',
      targetWords: Math.min(5000, Math.max(300, input.targetWords ?? 1000)),
      wordLimit,
      aiDisclosureRequired: input.aiDisclosureRequired ?? null,
      personalFacts: serialisePersonalFacts(EMPTY_PERSONAL_FACTS),
      notes: '',
      createdById: actor.userId,
      sections: {
        create: SOP_SECTIONS.map((section, index) => ({
          sectionKey: section.key,
          title: section.title,
          sortOrder: index,
          content: '',
        })),
      },
    },
  });

  await db.phdSopVersion.create({
    data: {
      sopId: sop.id,
      version: 1,
      snapshot: JSON.stringify({ sections: SOP_SECTIONS.map((section) => ({ sectionKey: section.key, content: '' })) }),
      changeSummary: 'Statement created',
      createdById: actor.userId,
    },
  });

  await recordPhdAudit({
    actor,
    action: 'SOP_CREATED',
    entityType: 'PhdStatementOfPurpose',
    entityId: sop.id,
    projectId: project.id,
    details: { universityId: input.universityId ?? null, programmeId: input.programmeId ?? null, award: programmeAward, discipline: programmeDiscipline },
  });

  return sop;
}

export async function getSop(actor: PhdActor, sopId: string) {
  const sop = await loadSop(actor, sopId);
  return {
    ...sop,
    personalFacts: parsePersonalFacts(sop.personalFacts),
  };
}

export async function updateSop(actor: PhdActor, sopId: string, input: SopUpdateInput) {
  const sop = await loadSop(actor, sopId);
  assertOwner(sop, actor, 'edit');

  const facts = input.personalFacts
    ? serialisePersonalFacts(normaliseFacts({ ...parsePersonalFacts(sop.personalFacts), ...input.personalFacts }))
    : undefined;

  const touchedContent = Object.keys(input.personalFacts ?? {}).length > 0;

  const updated = await db.phdStatementOfPurpose.update({
    where: { id: sop.id },
    data: {
      ...(input.title ? { title: input.title.slice(0, 200) } : {}),
      ...(typeof input.targetWords === 'number' ? { targetWords: Math.min(5000, Math.max(300, input.targetWords)) } : {}),
      ...(input.wordLimit !== undefined ? { wordLimit: input.wordLimit } : {}),
      ...(input.aiDisclosureRequired !== undefined ? { aiDisclosureRequired: input.aiDisclosureRequired } : {}),
      ...(facts ? { personalFacts: facts } : {}),
      ...(input.notes !== undefined ? { notes: (input.notes ?? '').slice(0, 4000) } : {}),
      ...(touchedContent && sop.status !== 'DRAFT' ? resetToDraft(sop.status) : {}),
    },
  });

  if (touchedContent && sop.status !== 'DRAFT') {
    await db.phdSopReview.create({
      data: {
        sopId: sop.id,
        reviewerId: actor.userId,
        reviewerRole: actor.role,
        decision: 'CHANGES_REQUESTED',
        comments: 'Personal facts were changed after review, so the statement returned to draft.',
      },
    });
  }

  await recordPhdAudit({
    actor,
    action: 'SOP_UPDATED',
    entityType: 'PhdStatementOfPurpose',
    entityId: sop.id,
    projectId: sop.projectId,
    details: { personalFactsChanged: touchedContent, fields: Object.keys(input).filter((key) => key !== 'personalFacts').join(',').slice(0, 200) },
  });

  return updated;
}

function resetToDraft(status: string): { status: string; studentReviewedAt: null; approvedAt: null; approvedById: null; requirementsVerifiedAt: null; exportVerifiedAt: null } {
  // A change after review invalidates the approvals that followed it. Keeping the
  // timestamps would let an edited statement be exported as if it were approved.
  void status;
  return {
    status: 'DRAFT',
    studentReviewedAt: null,
    approvedAt: null,
    approvedById: null,
    requirementsVerifiedAt: null,
    exportVerifiedAt: null,
  };
}

export async function generateForSop(actor: PhdActor, sopId: string, options: { overwrite?: boolean } = {}) {
  const sop = await loadSop(actor, sopId);
  assertOwner(sop, actor, 'generate a draft');

  const profile = await db.phdProfile.findUnique({ where: { userId: sop.project.userId } });
  if (!profile) throw new PhdAccessError('Complete your academic profile before generating a draft.', 422);

  const topic = sop.project.selectedTopicId
    ? await db.phdTopicCandidate.findUnique({
        where: { id: sop.project.selectedTopicId },
        include: { methodologies: true },
      })
    : null;

  const literature = topic
    ? await db.phdLiteratureSource.findMany({
        where: { projectId: sop.projectId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { title: true, authors: true, year: true, verificationStatus: true },
      })
    : [];

  const facts = parsePersonalFacts(sop.personalFacts);
  const result = generateSopDraft({
    university: sop.university ? { name: sop.university.name, officialDomain: sop.university.officialDomain } : null,
    programme: sop.programme
      ? {
          name: sop.programme.name,
          award: sop.programme.award,
          discipline: sop.programme.discipline,
          verificationStatus: sop.programme.verificationStatus,
        }
      : null,
    profile: {
      highestQualification: profile.highestQualification,
      degreeSubject: profile.degreeSubject,
      awardingInstitution: profile.awardingInstitution,
      classification: profile.classification,
      dissertationTitle: profile.dissertationTitle,
      relevantModules: profile.relevantModules,
      researchExperience: profile.researchExperience,
      publications: profile.publications,
      preferredMethods: parseMethods(profile.preferredMethods),
      researchSetting: profile.researchSetting,
    },
    topic: topic
      ? {
          workingTitle: topic.workingTitle,
          mainQuestion: topic.mainQuestion,
          provisionalGap: topic.provisionalGap,
          methodology: topic.methodologies?.[0]?.methods ?? '',
        }
      : null,
    literature,
    facts,
    aiDisclosureRequired: sop.aiDisclosureRequired,
  });

  const existingByKey = new Map(sop.sections.map((section) => [section.sectionKey, section]));
  let written = 0;
  let preserved = 0;
  for (const generated of result.sections) {
    const existing = existingByKey.get(generated.sectionKey);
    // Existing student-written text is never overwritten unless explicitly asked.
    if (existing && existing.content.trim() && !options.overwrite) {
      preserved++;
      continue;
    }
    await db.phdSopSection.update({
      where: { sopId_sectionKey: { sopId: sop.id, sectionKey: generated.sectionKey } },
      data: { content: generated.content, aiAssisted: generated.content.length > 0 },
    });
    if (generated.content) written++;
  }

  await createVersionSnapshot(actor, sop.id, options.overwrite ? 'Draft regenerated (existing text replaced)' : 'Draft generated (existing text preserved)');

  await db.phdStatementOfPurpose.update({ where: { id: sop.id }, data: { status: 'DRAFT' } });

  await recordPhdAudit({
    actor,
    action: 'SOP_DRAFT_GENERATED',
    entityType: 'PhdStatementOfPurpose',
    entityId: sop.id,
    projectId: sop.projectId,
    details: { sectionsWritten: written, sectionsPreserved: preserved, overwrite: Boolean(options.overwrite) },
  });

  return {
    generated: result,
    sectionsWritten: written,
    sectionsPreserved: preserved,
    notes: [
      ...result.notes,
      'The draft is built only from facts you supplied or records in your workspace. Empty sections are left empty on purpose.',
    ],
  };
}

async function createVersionSnapshot(actor: PhdActor, sopId: string, changeSummary: string) {
  const sop = await db.phdStatementOfPurpose.findUnique({
    where: { id: sopId },
    include: { sections: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!sop) throw new PhdAccessError('Statement not found.', 404);
  const nextVersion = sop.version + 1;
  await db.phdSopVersion.create({
    data: {
      sopId,
      version: nextVersion,
      snapshot: JSON.stringify({
        sections: sop.sections.map((section) => ({ sectionKey: section.sectionKey, content: section.content })),
      }),
      changeSummary: changeSummary.slice(0, 300),
      createdById: actor.userId,
    },
  });
  await db.phdStatementOfPurpose.update({ where: { id: sopId }, data: { version: nextVersion } });
  return nextVersion;
}

export async function updateSections(actor: PhdActor, sopId: string, sections: SopSectionUpdate[], changeSummary?: string | null) {
  const sop = await loadSop(actor, sopId);
  assertOwner(sop, actor, 'edit');

  for (const section of sections) {
    if (!SECTION_KEYS.includes(section.sectionKey)) {
      throw new PhdAccessError(`Unknown statement section: ${section.sectionKey}`, 422);
    }
    if (section.content.length > 20_000) {
      throw new PhdAccessError('A section cannot exceed 20,000 characters.', 422);
    }
  }

  for (const section of sections) {
    await db.phdSopSection.update({
      where: { sopId_sectionKey: { sopId: sop.id, sectionKey: section.sectionKey } },
      data: { content: section.content, aiAssisted: false },
    });
  }

  const revision = await createVersionSnapshot(actor, sop.id, changeSummary ?? 'Sections edited');

  const reset = sop.status !== 'DRAFT' ? resetToDraft(sop.status) : null;
  await db.phdStatementOfPurpose.update({ where: { id: sop.id }, data: reset ?? {} });
  if (sop.status !== 'DRAFT') {
    await db.phdSopReview.create({
      data: {
        sopId: sop.id,
        reviewerId: actor.userId,
        reviewerRole: actor.role,
        decision: 'CHANGES_REQUESTED',
        comments: 'Content edited after review, so the statement returned to draft.',
      },
    });
  }

  await recordPhdAudit({
    actor,
    action: 'SOP_SECTIONS_EDITED',
    entityType: 'PhdStatementOfPurpose',
    entityId: sop.id,
    projectId: sop.projectId,
    details: { sections: sections.map((section) => section.sectionKey).join(',').slice(0, 300), version: revision },
  });

  return { version: revision, status: reset?.status ?? sop.status };
}

export async function restoreVersion(actor: PhdActor, sopId: string, versionId: string) {
  const sop = await loadSop(actor, sopId);
  assertOwner(sop, actor, 'restore a version');
  const version = await db.phdSopVersion.findFirst({ where: { id: versionId, sopId: sop.id } });
  if (!version) throw new PhdAccessError('Version not found.', 404);

  let snapshot: { sections?: Array<{ sectionKey: string; content: string }> };
  try {
    snapshot = JSON.parse(version.snapshot) as typeof snapshot;
  } catch {
    throw new PhdAccessError('This version snapshot is unreadable and cannot be restored.', 422);
  }

  for (const section of snapshot.sections ?? []) {
    if (!SECTION_KEYS.includes(section.sectionKey)) continue;
    await db.phdSopSection.update({
      where: { sopId_sectionKey: { sopId: sop.id, sectionKey: section.sectionKey } },
      data: { content: section.content },
    });
  }
  const revision = await createVersionSnapshot(actor, sop.id, `Restored version ${version.version}`);
  await db.phdStatementOfPurpose.update({ where: { id: sop.id }, data: resetToDraft(sop.status) });

  await recordPhdAudit({
    actor,
    action: 'SOP_VERSION_RESTORED',
    entityType: 'PhdStatementOfPurpose',
    entityId: sop.id,
    projectId: sop.projectId,
    details: { restoredVersion: version.version, newVersion: revision },
  });

  return { version: revision };
}

export async function reviewSop(actor: PhdActor, sopId: string) {
  const sop = await loadSop(actor, sopId);
  const facts = parsePersonalFacts(sop.personalFacts);
  const topic = sop.project.selectedTopicId
    ? await db.phdTopicCandidate.findUnique({ where: { id: sop.project.selectedTopicId }, select: { workingTitle: true } })
    : null;
  const proposal = await db.phdProposal.findFirst({
    where: { projectId: sop.projectId, ...(sop.programmeId ? { programmeId: sop.programmeId } : {}) },
    orderBy: { updatedAt: 'desc' },
    select: { title: true },
  });

  const profile = await db.phdProfile.findUnique({ where: { userId: sop.project.userId } });
  const evidenceCorpus = [
    facts.motivation,
    facts.whyProgramme,
    facts.whyUniversity,
    facts.professionalContext,
    facts.careerPlan,
    facts.aiUse,
    ...facts.achievements,
    profile?.dissertationTitle ?? '',
    profile?.researchExperience ?? '',
    profile?.publications ?? '',
    profile?.relevantModules ?? '',
    topic?.workingTitle ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const personalFactsKeys: Array<keyof SopPersonalFacts> = ['motivation', 'whyProgramme', 'whyUniversity', 'careerPlan', 'professionalContext'];
  const supplied = personalFactsKeys.filter((key) => String(facts[key] ?? '').trim().length > 0).length + (facts.achievements.length ? 1 : 0);
  const personalisationScore = Math.round((supplied / 6) * 100);

  const report: SopReviewReport = checkSop({
    universityName: sop.university?.name ?? null,
    programmeName: sop.programme?.name ?? null,
    topicTitle: topic?.workingTitle ?? null,
    proposalTopicTitle: proposal?.title ?? null,
    wordLimit: sop.wordLimit,
    targetWords: sop.targetWords,
    aiDisclosureRequired: sop.aiDisclosureRequired,
    personalisationScore,
    evidenceCorpus,
    sections: sop.sections.map((section) => ({ sectionKey: section.sectionKey, title: section.title, content: section.content })),
  });

  return {
    report,
    meta: {
      sopId: sop.id,
      status: sop.status,
      version: sop.version,
      universityName: sop.university?.name ?? null,
      programmeName: sop.programme?.name ?? null,
      aiDisclosureRequired: sop.aiDisclosureRequired,
      approvedAt: sop.approvedAt,
      requirementsVerifiedAt: sop.requirementsVerifiedAt,
      exportVerifiedAt: sop.exportVerifiedAt,
      reviews: sop.reviews.map((row) => ({ decision: row.decision, role: row.reviewerRole, at: row.createdAt })),
    },
  };
}

export async function transitionSop(
  actor: PhdActor,
  sopId: string,
  target: SopStatus,
  comments: string | null = '',
) {
  const sop = await loadSop(actor, sopId);
  const current = sop.status as SopStatus;
  if (!SOP_STATUSES.includes(target)) throw new PhdAccessError('Unknown status.', 422);
  const allowed = SOP_TRANSITIONS[current] ?? [];
  if (!allowed.includes(target)) {
    throw new PhdAccessError(`A statement cannot move from ${current} to ${target}.`, 422);
  }

  const isOwner = sop.project.userId === actor.userId;

  if (target === 'STUDENT_REVIEWED') {
    if (!isOwner) throw new PhdAccessError('Only the student can confirm their own review.', 403);
    const review = await reviewSop(actor, sopId);
    if (review.report.errorCount > 0) {
      throw new PhdAccessError(
        `Fix the ${review.report.errorCount} blocking issue(s) in the review report before confirming your review.`,
        422,
      );
    }
    await db.phdStatementOfPurpose.update({ where: { id: sop.id }, data: { status: 'STUDENT_REVIEWED', studentReviewedAt: new Date() } });
  } else if (target === 'FINAL_APPROVED') {
    // Reviewers must be able to read the project, so this is the project adviser
    // or an administrator — a data verifier cannot open a student's statement.
    if (!canAdvise(actor)) {
      throw new PhdAccessError('Only the project adviser or an administrator can approve a final statement.', 403);
    }
    if (isOwner && actor.role !== 'ADMINISTRATOR') {
      throw new PhdAccessError('A final version needs approval from a reviewer, not the author.', 403);
    }
    const review = await reviewSop(actor, sopId);
    if (review.report.errorCount > 0) {
      throw new PhdAccessError('The statement still has blocking issues and cannot be approved.', 422);
    }
    await db.phdStatementOfPurpose.update({
      where: { id: sop.id },
      data: { status: 'FINAL_APPROVED', approvedAt: new Date(), approvedById: actor.userId },
    });
  } else if (target === 'REQUIREMENTS_VERIFIED') {
    if (!canAdvise(actor)) {
      throw new PhdAccessError('Only the project adviser or an administrator can confirm institutional requirements.', 403);
    }
    if (!sop.universityId || !sop.programmeId) {
      throw new PhdAccessError('A university and programme must be attached before requirements can be verified.', 422);
    }
    await db.phdStatementOfPurpose.update({
      where: { id: sop.id },
      data: { status: 'REQUIREMENTS_VERIFIED', requirementsVerifiedAt: new Date() },
    });
  } else if (target === 'EXPORT_VERIFIED') {
    throw new PhdAccessError('An export is marked verified only when the export endpoint generates the file.', 422);
  } else {
    await db.phdStatementOfPurpose.update({ where: { id: sop.id }, data: resetToDraft(current) });
  }

  await db.phdSopReview.create({
    data: {
      sopId: sop.id,
      reviewerId: actor.userId,
      reviewerRole: actor.role,
      decision: target === 'DRAFT' ? 'CHANGES_REQUESTED' : target,
      comments: (comments ?? '').slice(0, 2000),
    },
  });

  await recordPhdAudit({
    actor,
    action: 'SOP_STATUS_CHANGED',
    entityType: 'PhdStatementOfPurpose',
    entityId: sop.id,
    projectId: sop.projectId,
    details: { from: current, to: target },
  });

  if (target === 'FINAL_APPROVED') {
    await notifyPhdUser({
      userId: sop.project.userId,
      projectId: sop.projectId,
      type: 'SYSTEM',
      title: 'Your statement has been approved',
      body: 'A reviewer approved the final version of your statement of purpose. Review the exported file before you submit it yourself.',
      entityType: 'PhdStatementOfPurpose',
      entityId: sop.id,
    });
  }

  return db.phdStatementOfPurpose.findUnique({ where: { id: sop.id } });
}

function buildSopDocument(sop: Awaited<ReturnType<typeof loadSop>>) {
  const sections = sop.sections
    .filter((section) => section.content.trim().length > 0)
    .map((section) => ({
      heading: section.title,
      paragraphs: section.content.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean),
    }));

  const metadata = [
    { label: 'Applicant statement', value: sop.title },
    ...(sop.university ? [{ label: 'University', value: sop.university.name }] : []),
    ...(sop.programme ? [{ label: 'Programme', value: sop.programme.name }] : []),
    { label: 'Status', value: sop.status.replace(/_/g, ' ').toLowerCase() },
    { label: 'Version', value: String(sop.version) },
  ];

  return {
    title: 'Statement of Purpose',
    subtitle: sop.university ? `${sop.university.name}${sop.programme ? ` — ${sop.programme.name}` : ''}` : sop.title,
    draftLabel:
      sop.status === 'FINAL_APPROVED' || sop.status === 'REQUIREMENTS_VERIFIED' || sop.status === 'EXPORT_VERIFIED'
        ? `Approved ${sop.approvedAt ? sop.approvedAt.toISOString().slice(0, 10) : ''}`.trim()
        : 'Draft — not approved. Do not submit this version.',
    metadata,
    sections,
    footerNote:
      'Generated from saved content. Check the official programme instructions for formatting, word limit and disclosure requirements before you submit.',
  };
}

export async function exportSop(actor: PhdActor, sopId: string, format: 'docx' | 'pdf' | 'report') {
  const sop = await loadSop(actor, sopId);
  const review = await reviewSop(actor, sopId);

  const approved = ['FINAL_APPROVED', 'REQUIREMENTS_VERIFIED', 'EXPORT_VERIFIED'].includes(sop.status);
  if (format !== 'report' && !approved) {
    throw new PhdAccessError(
      'A statement can only be exported as a final document after a reviewer approved it. Export the review report instead.',
      409,
    );
  }

  if (format === 'report') {
    const checks = review.report.checks.map((check) => ({
      heading: `${check.severity} — ${check.code}`,
      paragraphs: [`${check.message}${check.sectionKey ? ` (section: ${check.sectionKey})` : ''}`],
    }));
    const document = buildPdf({
      title: 'SOP Review Report',
      subtitle: sop.university ? `${sop.university.name}${sop.programme ? ` — ${sop.programme.name}` : ''}` : sop.title,
      draftLabel: 'Internal review record',
      metadata: [
        { label: 'Status', value: sop.status.replace(/_/g, ' ').toLowerCase() },
        { label: 'Version', value: String(sop.version) },
        { label: 'Words', value: String(review.report.wordCount) },
        { label: 'Word limit', value: review.report.wordLimit.limit ? String(review.report.wordLimit.limit) : 'not published' },
        { label: 'Blocking issues', value: String(review.report.errorCount) },
        { label: 'Warnings', value: String(review.report.warningCount) },
        { label: 'Personalisation', value: `${review.report.personalisationScore}%` },
        { label: 'AI disclosure', value: review.report.aiDisclosure.status.replace(/_/g, ' ').toLowerCase() },
      ],
      sections: [
        {
          heading: 'Readiness',
          paragraphs: [
            `Readiness: ${review.report.readiness.replace(/_/g, ' ').toLowerCase()}. ${review.report.errorCount} blocking issue(s), ${review.report.warningCount} warning(s).`,
            review.report.detectorStatement,
          ],
        },
        { heading: 'Checks', paragraphs: checks.flatMap((check) => [check.heading, ...check.paragraphs]) },
        ...(review.report.unsupportedClaims.length
          ? [
              {
                heading: 'Claims that need a source',
                bullets: review.report.unsupportedClaims.map((claim) => `${claim.sectionKey}: ${claim.sentence}`),
              },
            ]
          : []),
        ...(review.report.genericPhrases.length
          ? [{ heading: 'Interchangeable wording', bullets: review.report.genericPhrases.map((phrase) => phrase) }]
          : []),
        ...(review.report.universityMismatches.length
          ? [{ heading: 'Wrong university mentioned', bullets: review.report.universityMismatches }]
          : []),
        {
          heading: 'Review trail',
          bullets: review.meta.reviews.length
            ? review.meta.reviews.map((row) => `${row.at.toISOString().slice(0, 10)} — ${row.decision} (${row.role})`)
            : ['No review recorded yet.'],
        },
      ],
      footerNote:
        'This report describes content quality. It does not measure, predict or guarantee any AI-detector score, and it is not a plagiarism or similarity report.',
    });

    await recordPhdAudit({
      actor,
      action: 'SOP_REPORT_EXPORTED',
      entityType: 'PhdStatementOfPurpose',
      entityId: sop.id,
      projectId: sop.projectId,
      details: { format: 'report', errorCount: review.report.errorCount },
    });

    return { buffer: document.buffer, filename: SOP_EXPORT_FILENAMES.report, mimeType: 'application/pdf', report: review.report };
  }

  const source = buildSopDocument(sop);
  if (format === 'docx') {
    const buffer = buildDocx(source);
    await markExportVerified(actor, sop, review.report);
    return { buffer, filename: SOP_EXPORT_FILENAMES.docx, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  }

  const pdf = buildPdf(source);
  await markExportVerified(actor, sop, review.report);
  return { buffer: pdf.buffer, filename: SOP_EXPORT_FILENAMES.pdf, mimeType: 'application/pdf' };
}

async function markExportVerified(actor: PhdActor, sop: Awaited<ReturnType<typeof loadSop>>, report: SopReviewReport) {
  if (sop.status !== 'REQUIREMENTS_VERIFIED' && sop.status !== 'EXPORT_VERIFIED') return;
  if (report.errorCount > 0) return;
  await db.phdStatementOfPurpose.update({
    where: { id: sop.id },
    data: { status: 'EXPORT_VERIFIED', exportVerifiedAt: new Date() },
  });
  await db.phdSopReview.create({
    data: {
      sopId: sop.id,
      reviewerId: actor.userId,
      reviewerRole: actor.role,
      decision: 'EXPORT_VERIFIED',
      comments: 'Export generated from saved content with no blocking issues.',
    },
  });
  await recordPhdAudit({
    actor,
    action: 'SOP_EXPORT_VERIFIED',
    entityType: 'PhdStatementOfPurpose',
    entityId: sop.id,
    projectId: sop.projectId,
    details: { wordCount: report.wordCount },
  });
}

export async function listVersions(actor: PhdActor, sopId: string) {
  const sop = await loadSop(actor, sopId);
  return db.phdSopVersion.findMany({
    where: { sopId: sop.id },
    orderBy: { version: 'desc' },
    select: { id: true, version: true, changeSummary: true, createdAt: true, createdById: true },
  });
}
