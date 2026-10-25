import { db } from '@/lib/db';
import { PhdAccessError, canAccessProject, type PhdActor } from '../auth';
import { PROPOSAL_SECTIONS } from '../constants';
import { buildDefaultSections, createSnapshot, totalWordCount } from '../proposals/sections';
import { validateCitation } from '../proposals/citations';
import { evaluateProposal, type ProposalRequirements, type QualityReport } from '../proposals/quality';
import { buildProposalDocuments } from '../exports/proposal';
import { recordPhdAudit } from '../audit';
import type { Prisma } from '@prisma/client';
import type { ProposalUpdateInput } from '../validation';

async function loadWritableProject(actor: PhdActor, projectId: string) {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || !canAccessProject(actor, project, 'write')) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  return project;
}

export async function createProposal(actor: PhdActor, input: {
  projectId: string;
  programmeId?: string | null;
  topicId?: string | null;
  title: string;
}) {
  await loadWritableProject(actor, input.projectId);

  const topic = await db.phdTopicCandidate.findFirst({
    where: { projectId: input.projectId, ...(input.topicId ? { id: input.topicId } : { isSelected: true }) },
    include: {
      questions: { orderBy: { order: 'asc' } },
      objectives: { orderBy: { order: 'asc' } },
      methodologies: { where: { isSelected: true }, take: 1 },
    },
  });
  if (!topic) throw new PhdAccessError('A selected topic is required to create a proposal. Generate and select a topic first.', 422);

  let programme: Prisma.PhdProgrammeGetPayload<{ include: { university: true } }> | null = null;
  let universityName: string | undefined;
  if (input.programmeId) {
    programme = await db.phdProgramme.findUnique({
      where: { id: input.programmeId },
      include: { university: true },
    });
    if (!programme) throw new PhdAccessError('Programme not found.', 404);
    universityName = programme.university.name;
  }

  const requirementsVerified = Boolean(
    programme && ['VERIFIED_OFFICIAL', 'VERIFIED_MAY_BE_OUTDATED'].includes(programme.verificationStatus),
  );
  const requirementsVerificationStatus = programme
    ? requirementsVerified ? programme.verificationStatus : 'NOT_YET_VERIFIED'
    : 'NOT_YET_VERIFIED';

  const sections = buildDefaultSections({
    title: input.title,
    plainLanguage: topic.plainLanguage,
    problemStatement: topic.problemStatement,
    provisionalGap: topic.provisionalGap,
    mainQuestion: topic.mainQuestion,
    supportingQuestions: topic.questions.filter((question) => question.kind === 'SUPPORTING').map((question) => question.text),
    aim: topic.aim,
    objectives: topic.objectives.map((objective) => ({ text: objective.text, measure: objective.measure })),
    theoryFramework: topic.theoryFramework,
    methodology: {
      design: topic.methodology,
      methods: topic.methodologies[0]?.methods ?? '',
      rationale: topic.methodologies[0]?.rationale ?? '',
      resources: topic.methodologies[0]?.resources ?? '',
      risks: topic.methodologies[0]?.risks ?? '',
      paradigm: topic.methodologies[0]?.paradigm ?? '',
    },
    dataNeeds: topic.dataNeeds,
    ethics: topic.ethics,
    feasibilityRisks: topic.feasibilityRisks,
    scholarlyContribution: topic.scholarlyContribution,
    practicalContribution: topic.practicalContribution,
    preliminaryReading: topic.preliminaryReading,
    universityName,
    programmeName: programme?.name,
  });

  const wordCount = totalWordCount(sections);
  const requiredHeadings = requirementsVerified && programme?.requiredHeadings
    ? programme.requiredHeadings.split(/\r?\n|;/).map((heading) => heading.trim()).filter(Boolean)
    : null;

  const proposal = await db.phdProposal.create({
    data: {
      projectId: input.projectId,
      universityId: programme?.universityId ?? null,
      programmeId: programme?.id ?? null,
      topicId: topic.id,
      title: input.title,
      status: 'DRAFT',
      isGeneralDraft: !requirementsVerified,
      wordLimit: requirementsVerified ? programme?.proposalWordLimit ?? null : null,
      requiredHeadings: requiredHeadings?.join('\n') ?? '',
      referencingStyle: requirementsVerified && programme?.referencingStyle ? programme.referencingStyle : 'NOT_SPECIFIED',
      abstractRequired: requirementsVerified ? (programme?.abstractRequired ?? true) : true,
      ethicsRequired: true,
      fileFormat: requirementsVerified ? programme?.submissionFormat ?? '' : '',
      requirementsVerificationStatus,
      requirementsSourceUrl: programme?.officialUrl ?? null,
      requirementsCheckedAt: requirementsVerified ? new Date() : null,
      createdById: actor.userId,
      sections: {
        create: sections.map((section) => ({
          sectionKey: section.sectionKey,
          title: section.title,
          guidance: section.guidance,
          content: section.content,
          sortOrder: section.sortOrder,
          required: section.required,
        })),
      },
    },
    include: { sections: true },
  });

  const snapshot = createSnapshot({
    title: proposal.title,
    sections: proposal.sections.map((section) => ({
      sectionKey: section.sectionKey,
      title: section.title,
      content: section.content,
      sortOrder: section.sortOrder,
      required: section.required,
    })),
    requirements: {
      programmeId: proposal.programmeId,
      universityName,
      programmeName: programme?.name,
      wordLimit: proposal.wordLimit,
      referencingStyle: proposal.referencingStyle,
      requiredHeadings: proposal.requiredHeadings || null,
      abstractRequired: proposal.abstractRequired,
      verificationStatus: proposal.requirementsVerificationStatus,
      sourceUrl: proposal.requirementsSourceUrl,
    },
  });

  await db.phdProposalVersion.create({
    data: {
      proposalId: proposal.id,
      version: 1,
      title: proposal.title,
      wordCount,
      changeSummary: 'Initial version created from the selected topic canvas.',
      snapshot: JSON.stringify(snapshot),
      createdById: actor.userId,
    },
  });

  await recordPhdAudit({
    actor,
    action: 'PROPOSAL_CREATED',
    entityType: 'PhdProposal',
    entityId: proposal.id,
    projectId: input.projectId,
    details: { programmeId: proposal.programmeId ?? '', requirementsVerified },
  });

  return { proposal, wordCount, requirementsVerified, snapshot };
}

export async function listProposals(actor: PhdActor, projectId?: string) {
  const where: Prisma.PhdProposalWhereInput = projectId
    ? { projectId }
    : actor.role === 'ADMINISTRATOR'
      ? {}
      : { project: { OR: [{ userId: actor.userId }, ...(actor.role === 'RESEARCH_ADVISER' ? [{ adviserId: actor.userId }] : [])] } };
  const proposals = await db.phdProposal.findMany({
    where,
    include: {
      project: { select: { id: true, title: true, userId: true } },
      university: { select: { name: true } },
      programme: { select: { name: true } },
      _count: { select: { sections: true, versions: true, citations: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
  return proposals.map((proposal) => {
    const requirements = parseRequirements(proposal);
    const report = evaluateProposal({
      proposalTitle: proposal.title,
      sections: [],
      requirements,
      sources: [],
      citations: [],
    });
    return {
      ...proposal,
      requirements,
      readiness: report.readiness,
      wordLimitVerified: report.checks.find((check) => check.id === 'word-limit')?.passed ?? null,
    };
  });
}

export async function loadProposal(actor: PhdActor, proposalId: string) {
  const proposal = await db.phdProposal.findUnique({
    where: { id: proposalId },
    include: {
      project: true,
      university: true,
      programme: true,
      sections: { orderBy: { sortOrder: 'asc' } },
      citations: { include: { source: true }, orderBy: { createdAt: 'asc' } },
      versions: { orderBy: { version: 'desc' }, select: { id: true, version: true, wordCount: true, changeSummary: true, createdAt: true, createdById: true } },
    },
  });
  if (!proposal || !canAccessProject(actor, proposal.project, 'read')) {
    throw new PhdAccessError('Proposal not found or access denied.', 404);
  }
  return proposal;
}

export async function updateProposal(actor: PhdActor, proposalId: string, input: ProposalUpdateInput) {
  const proposal = await loadProposal(actor, proposalId);
  if (!canAccessProject(actor, proposal.project, 'write')) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }

  const validKeys = new Set<string>(PROPOSAL_SECTIONS.map((section) => section.key));
  if (input.sections) {
    for (const section of input.sections) {
      if (!validKeys.has(section.sectionKey)) {
        throw new PhdAccessError(`Unknown proposal section “${section.sectionKey}”.`, 422);
      }
    }
  }

  const updated = await db.$transaction(async (tx) => {
    if (input.sections?.length) {
      for (const section of input.sections) {
        await tx.phdProposalSection.upsert({
          where: { proposalId_sectionKey: { proposalId, sectionKey: section.sectionKey } },
          create: {
            proposalId,
            sectionKey: section.sectionKey,
            title: section.title ?? section.sectionKey,
            content: section.content,
            guidance: '',
            sortOrder: section.sortOrder ?? 0,
            required: section.required ?? true,
          },
          update: {
            ...(section.title !== undefined ? { title: section.title } : {}),
            ...(section.content !== undefined ? { content: section.content } : {}),
            ...(section.sortOrder !== undefined ? { sortOrder: section.sortOrder } : {}),
            ...(section.required !== undefined ? { required: section.required } : {}),
          },
        });
      }
    }
    return tx.phdProposal.update({
      where: { id: proposalId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: { sections: { orderBy: { sortOrder: 'asc' } } },
    });
  });

  let version: { version: number; wordCount: number } | null = null;
  if (input.createVersion) {
    const nextVersion = proposal.currentVersion + 1;
    version = { version: nextVersion, wordCount: totalWordCount(updated.sections) };
    await db.$transaction(async (tx) => {
      await tx.phdProposalVersion.create({
        data: {
          proposalId,
          version: nextVersion,
          title: updated.title,
          wordCount: version!.wordCount,
          changeSummary: input.changeSummary ?? 'Manual save.',
          snapshot: JSON.stringify(
            createSnapshot({
              title: updated.title,
              sections: updated.sections.map((section) => ({
                sectionKey: section.sectionKey,
                title: section.title,
                content: section.content,
                sortOrder: section.sortOrder,
                required: section.required,
              })),
              requirements: {
                programmeId: proposal.programmeId,
                universityName: proposal.university?.name,
                programmeName: proposal.programme?.name,
                wordLimit: proposal.wordLimit,
                referencingStyle: proposal.referencingStyle,
                requiredHeadings: proposal.requiredHeadings || null,
                abstractRequired: proposal.abstractRequired,
                verificationStatus: proposal.requirementsVerificationStatus,
                sourceUrl: proposal.requirementsSourceUrl,
              },
            }),
          ),
          createdById: actor.userId,
        },
      });
      await tx.phdProposal.update({ where: { id: proposalId }, data: { currentVersion: nextVersion } });
    });
  }

  await recordPhdAudit({
    actor,
    action: input.createVersion ? 'PROPOSAL_SAVED' : 'PROPOSAL_UPDATED',
    entityType: 'PhdProposal',
    entityId: proposalId,
    projectId: proposal.projectId,
    details: { version: version?.version ?? proposal.currentVersion, sections: input.sections?.length ?? 0 },
  });

  return { proposal: await loadProposal(actor, proposalId), version };
}

export async function restoreProposalVersion(actor: PhdActor, proposalId: string, versionId: string) {
  const proposal = await loadProposal(actor, proposalId);
  if (proposal.project.userId !== actor.userId && actor.role !== 'ADMINISTRATOR') {
    throw new PhdAccessError('Only the project owner or an administrator can restore a version.', 403);
  }
  const version = await db.phdProposalVersion.findFirst({ where: { id: versionId, proposalId } });
  if (!version) throw new PhdAccessError('Version not found.', 404);
  let snapshot: { title: string; sections: Array<{ sectionKey: string; title: string; content: string; sortOrder: number; required: boolean }> };
  try {
    snapshot = JSON.parse(version.snapshot);
  } catch {
    throw new PhdAccessError('The stored version snapshot is invalid and cannot be restored.', 422);
  }
  if (!Array.isArray(snapshot.sections) || !snapshot.sections.length) {
    throw new PhdAccessError('The stored version has no sections to restore.', 422);
  }
  const nextVersion = proposal.currentVersion + 1;
  await db.$transaction(async (tx) => {
    for (const section of snapshot.sections) {
      const existing = await tx.phdProposalSection.findUnique({
        where: { proposalId_sectionKey: { proposalId, sectionKey: section.sectionKey } },
      });
      if (existing) {
        await tx.phdProposalSection.update({
          where: { proposalId_sectionKey: { proposalId, sectionKey: section.sectionKey } },
          data: { content: section.content, title: section.title, sortOrder: section.sortOrder, required: section.required },
        });
      } else {
        await tx.phdProposalSection.create({
          data: {
            proposalId,
            sectionKey: section.sectionKey,
            title: section.title,
            content: section.content,
            sortOrder: section.sortOrder,
            required: section.required,
            guidance: '',
          },
        });
      }
    }
    const sections = await tx.phdProposalSection.findMany({ where: { proposalId }, orderBy: { sortOrder: 'asc' } });
    await tx.phdProposal.update({ where: { id: proposalId }, data: { title: snapshot.title, currentVersion: nextVersion } });
    await tx.phdProposalVersion.create({
      data: {
        proposalId,
        version: nextVersion,
        title: snapshot.title,
        wordCount: totalWordCount(sections),
        changeSummary: `Restored from version ${version.version}.`,
        snapshot: JSON.stringify({
          title: snapshot.title,
          sections,
          wordCount: totalWordCount(sections),
          capturedAt: new Date().toISOString(),
          requirements: {},
        }),
        createdById: actor.userId,
      },
    });
  });
  await recordPhdAudit({ actor, action: 'PROPOSAL_VERSION_RESTORED', entityType: 'PhdProposal', entityId: proposalId, projectId: proposal.projectId, details: { restoredVersion: version.version, newVersion: nextVersion } });
  return loadProposal(actor, proposalId);
}

export async function attachCitation(actor: PhdActor, proposalId: string, input: {
  sourceId?: string | null;
  sectionKey: string;
  rawText: string;
  claimText?: string;
}) {
  const proposal = await loadProposal(actor, proposalId);
  if (!canAccessProject(actor, proposal.project, 'write')) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  const section = proposal.sections.find((entry) => entry.sectionKey === input.sectionKey);
  if (!section) throw new PhdAccessError('Unknown proposal section.', 422);

  let source: Awaited<ReturnType<typeof db.phdLiteratureSource.findUnique>> = null;
  if (input.sourceId) {
    source = await db.phdLiteratureSource.findUnique({ where: { id: input.sourceId } });
    if (!source || source.projectId !== proposal.projectId) {
      throw new PhdAccessError('The source does not belong to this project.', 422);
    }
  }

  const validation = source
    ? validateCitation({
        title: source.title,
        authors: source.authors,
        year: source.year,
        venue: source.venue,
        publisher: source.publisher,
        doi: source.doi,
        url: source.url,
        sourceType: source.sourceType,
        verificationStatus: source.verificationStatus,
      })
    : { valid: false, warnings: ['No evidence-library source is linked to this citation.'], errors: [] as string[] };
  const note = [...validation.errors, ...validation.warnings].join(' ');

  const citation = await db.phdProposalCitation.create({
    data: {
      proposalId,
      sourceId: source?.id ?? null,
      sectionKey: input.sectionKey,
      rawText: input.rawText,
      claimText: input.claimText ?? '',
      isValid: validation.valid,
      validationNote: note.slice(0, 1000),
      verificationStatus: source?.verificationStatus ?? 'NOT_YET_VERIFIED',
    },
  });
  await recordPhdAudit({ actor, action: 'CITATION_ATTACHED', entityType: 'PhdProposalCitation', entityId: citation.id, projectId: proposal.projectId, details: { valid: validation.valid } });
  return { citation, validation };
}

export async function removeCitation(actor: PhdActor, proposalId: string, citationId: string) {
  const proposal = await loadProposal(actor, proposalId);
  if (!canAccessProject(actor, proposal.project, 'write')) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  const citation = proposal.citations.find((entry) => entry.id === citationId);
  if (!citation) throw new PhdAccessError('Citation not found.', 404);
  await db.phdProposalCitation.delete({ where: { id: citationId } });
  await recordPhdAudit({ actor, action: 'CITATION_REMOVED', entityType: 'PhdProposalCitation', entityId: citationId, projectId: proposal.projectId });
  return { removed: true };
}

export async function qualityReportForProposal(actor: PhdActor, proposalId: string): Promise<{
  proposal: Awaited<ReturnType<typeof loadProposal>>;
  report: QualityReport;
  requirements: ProposalRequirements;
}> {
  const proposal = await loadProposal(actor, proposalId);
  const sources = await db.phdLiteratureSource.findMany({ where: { projectId: proposal.projectId } });
  const requirements: ProposalRequirements = {
    wordLimit: proposal.wordLimit,
    requiredHeadings: proposal.requiredHeadings ? proposal.requiredHeadings.split('\n').filter(Boolean) : null,
    referencingStyle: proposal.referencingStyle,
    abstractRequired: proposal.abstractRequired,
    ethicsRequired: proposal.ethicsRequired,
    fileFormat: proposal.fileFormat,
    verificationStatus: proposal.requirementsVerificationStatus,
    sourceUrl: proposal.requirementsSourceUrl,
    universityName: proposal.university?.name,
    programmeName: proposal.programme?.name,
  };
  const report = evaluateProposal({
    sections: proposal.sections.map((section) => ({
      sectionKey: section.sectionKey,
      title: section.title,
      content: section.content,
      sortOrder: section.sortOrder,
    })),
    requirements,
    proposalTitle: proposal.title,
    sources: sources.map((source) => ({
      id: source.id,
      title: source.title,
      authors: source.authors,
      year: source.year,
      venue: source.venue,
      publisher: source.publisher,
      doi: source.doi,
      url: source.url,
      verificationStatus: source.verificationStatus,
      sourceType: source.sourceType,
    })),
    citations: proposal.citations.map((citation) => ({
      id: citation.id,
      sectionKey: citation.sectionKey,
      rawText: citation.rawText,
      claimText: citation.claimText,
      isValid: citation.isValid,
      sourceId: citation.sourceId,
      source: citation.source
        ? {
            id: citation.source.id,
            title: citation.source.title,
            authors: citation.source.authors,
            year: citation.source.year,
            venue: citation.source.venue,
            publisher: citation.source.publisher,
            doi: citation.source.doi,
            url: citation.source.url,
            verificationStatus: citation.source.verificationStatus,
            sourceType: citation.source.sourceType,
          }
        : null,
    })),
  });
  return { proposal, report, requirements };
}

export async function exportProposal(actor: PhdActor, proposalId: string, format: 'docx' | 'pdf') {
  const { proposal, report, requirements } = await qualityReportForProposal(actor, proposalId);
  const documents = buildProposalDocuments({
    title: proposal.title,
    universityName: proposal.university?.name,
    programmeName: proposal.programme?.name,
    draftLabel: report.draftLabel,
    requirements,
    sections: proposal.sections.map((section) => ({ sectionKey: section.sectionKey, title: section.title, content: section.content })),
    sources: proposal.citations.length
      ? proposal.citations.filter((citation) => citation.source).map((citation) => {
          const source = citation.source!;
          return {
            title: source.title,
            authors: source.authors,
            year: source.year,
            venue: source.venue,
            publisher: source.publisher,
            doi: source.doi,
            url: source.url,
            verificationStatus: source.verificationStatus,
          };
        })
      : [],
    citations: proposal.citations.map((citation) => ({
      rawText: citation.rawText,
      sectionKey: citation.sectionKey,
      sourceTitle: citation.source?.title ?? null,
      isValid: citation.isValid,
      validationNote: citation.validationNote,
    })),
    wordCount: report.wordCount,
    qualitySummary: `${report.errorCount} error(s), ${report.warningCount} warning(s), readiness ${report.readiness}.`,
  });

  const buffer = format === 'docx' ? documents.docx : documents.pdf.buffer;
  const filenameBase = proposal.title.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '-').slice(0, 70) || 'research-proposal';
  if (format === 'docx') {
    const { readZip } = await import('../exports/zip');
    const check = readZip(buffer);
    if (!check.valid) throw new PhdAccessError('The DOCX package could not be verified after generation.', 500);
  }
  await recordPhdAudit({ actor, action: 'PROPOSAL_EXPORTED', entityType: 'PhdProposal', entityId: proposalId, projectId: proposal.projectId, details: { format, bytes: buffer.length, errors: report.errorCount } });
  return {
    buffer,
    filename: `${filenameBase}.${format}`,
    contentType: format === 'docx'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf',
    report,
    warnings: format === 'pdf' ? documents.pdf.warnings : [],
  };
}

function parseRequirements(proposal: {
  wordLimit: number | null;
  requiredHeadings: string;
  referencingStyle: string;
  abstractRequired: boolean;
  ethicsRequired: boolean;
  fileFormat: string;
  requirementsVerificationStatus: string;
  requirementsSourceUrl: string | null;
  university?: { name: string } | null;
  programme?: { name: string } | null;
}): ProposalRequirements {
  return {
    wordLimit: proposal.wordLimit,
    requiredHeadings: proposal.requiredHeadings ? proposal.requiredHeadings.split('\n').filter(Boolean) : null,
    referencingStyle: proposal.referencingStyle,
    abstractRequired: proposal.abstractRequired,
    ethicsRequired: proposal.ethicsRequired,
    fileFormat: proposal.fileFormat,
    verificationStatus: proposal.requirementsVerificationStatus,
    sourceUrl: proposal.requirementsSourceUrl,
    universityName: proposal.university?.name,
    programmeName: proposal.programme?.name,
  };
}
