import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { PhdAccessError, canVerify, canAccessProject, type PhdActor } from '../auth';
import { assessFunding } from '../funding';
import { assessDeadline } from '../deadlines';
import { recordPhdAudit } from '../audit';
import type { z } from 'zod';
import type { fundingCreateSchema, deadlineCreateSchema } from '../validation';

export async function listFunding(options: { universityId?: string; includeExpired?: boolean }) {
  const opportunities = await db.phdFundingOpportunity.findMany({
    where: options.universityId ? { universityId: options.universityId } : {},
    include: { university: { select: { name: true, slug: true } }, eligibilityCriteria: true },
    orderBy: [{ closingDate: 'asc' }, { name: 'asc' }],
    take: 200,
  });
  return opportunities
    .map((opportunity) => ({
      ...opportunity,
      assessment: assessFunding({
        name: opportunity.name,
        fundingType: opportunity.fundingType,
        eligibility: opportunity.eligibility,
        nationalityRestrictions: opportunity.nationalityRestrictions,
        subjectRestrictions: opportunity.subjectRestrictions,
        tuitionCoverage: opportunity.tuitionCoverage,
        stipendAmountMinor: opportunity.stipendAmountMinor,
        currency: opportunity.currency,
        closingDate: opportunity.closingDate,
        closingTimezone: opportunity.closingTimezone,
        verificationStatus: opportunity.verificationStatus,
        sourceUrl: opportunity.officialUrl,
        supervisorContactRequired: opportunity.supervisorContactRequired,
        separateAdmissionRequired: opportunity.separateAdmissionRequired,
      }),
    }))
    .filter((opportunity) => options.includeExpired || !opportunity.assessment.isExpired);
}

export async function createFundingOpportunity(actor: PhdActor, input: z.infer<typeof fundingCreateSchema>) {
  if (!canVerify(actor)) throw new PhdAccessError('Only a data verifier or administrator can add funding records.', 403);
  const dedupeKey = createHash('sha256')
    .update(`${input.name.trim().toLowerCase()}|${input.officialUrl.trim().toLowerCase()}`)
    .digest('hex')
    .slice(0, 40);
  const existing = await db.phdFundingOpportunity.findUnique({ where: { dedupeKey } });
  if (existing) return { opportunity: existing, duplicate: true };
  const opportunity = await db.phdFundingOpportunity.create({
    data: {
      universityId: input.universityId ?? null,
      name: input.name,
      department: input.department ?? '',
      officialUrl: input.officialUrl,
      fundingType: input.fundingType,
      eligibility: input.eligibility ?? '',
      nationalityRestrictions: input.nationalityRestrictions ?? '',
      subjectRestrictions: input.subjectRestrictions ?? '',
      tuitionCoverage: input.tuitionCoverage ?? 'UNKNOWN',
      stipendAmountMinor: input.stipendAmountMinor ?? null,
      currency: input.currency ?? '',
      duration: input.duration ?? '',
      applicationRequirements: input.applicationRequirements ?? '',
      closingDate: input.closingDate ? new Date(input.closingDate) : null,
      closingTimezone: input.closingTimezone ?? '',
      separateAdmissionRequired: input.separateAdmissionRequired ?? null,
      supervisorContactRequired: input.supervisorContactRequired ?? null,
      verificationStatus: input.verificationStatus ?? 'NOT_YET_VERIFIED',
      lastVerifiedAt: input.verificationStatus === 'VERIFIED_OFFICIAL' ? new Date() : null,
      notes: input.notes ?? '',
      createdById: actor.userId,
      dedupeKey,
    },
  });
  if (input.closingDate) {
    await db.phdDeadline.create({
      data: {
        universityId: input.universityId ?? null,
        fundingOpportunityId: opportunity.id,
        title: `Funding deadline: ${opportunity.name}`,
        kind: 'FUNDING',
        dueDate: new Date(input.closingDate),
        timezone: input.closingTimezone ?? '',
        status: 'NEEDS_VERIFICATION',
        sourceUrl: input.officialUrl,
        verificationStatus: input.verificationStatus ?? 'NOT_YET_VERIFIED',
        notes: '',
      },
    });
  }
  await recordPhdAudit({ actor, action: 'FUNDING_CREATED', entityType: 'PhdFundingOpportunity', entityId: opportunity.id, details: { verificationStatus: opportunity.verificationStatus } });
  return { opportunity, duplicate: false };
}

export async function listFees(options: { universityId?: string; academicYear?: string }) {
  return db.phdTuitionFee.findMany({
    where: {
      ...(options.universityId ? { universityId: options.universityId } : {}),
      ...(options.academicYear ? { academicYear: options.academicYear } : {}),
    },
    include: { university: { select: { name: true, slug: true } }, programme: { select: { name: true } } },
    orderBy: [{ academicYear: 'desc' }, { universityId: 'asc' }],
    take: 300,
  });
}

export async function listDeadlines(actor: PhdActor, projectId: string) {
  const project = await db.phdProject.findUnique({ where: { id: projectId } });
  if (!project || !canAccessProject(actor, project, 'read')) {
    throw new PhdAccessError('Project not found or access denied.', 404);
  }
  const deadlines = await db.phdDeadline.findMany({
    where: { OR: [{ projectId }, { projectId: null }] },
    include: {
      university: { select: { name: true } },
      programme: { select: { name: true } },
      fundingOpportunity: { select: { name: true, verificationStatus: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    take: 250,
  });
  return deadlines.map((deadline) => ({
    ...deadline,
    assessment: assessDeadline({
      dueDate: deadline.dueDate,
      kind: deadline.kind,
      verificationStatus: deadline.verificationStatus,
      sourceUrl: deadline.sourceUrl,
      reminderDays: deadline.reminderDays,
    }),
  }));
}

export async function createDeadline(actor: PhdActor, input: z.infer<typeof deadlineCreateSchema>) {
  const isPersonal = input.kind === 'PERSONAL' || input.kind === 'DOCUMENT';
  if (input.projectId) {
    const project = await db.phdProject.findUnique({ where: { id: input.projectId } });
    if (!project || !canAccessProject(actor, project, 'write')) throw new PhdAccessError('Project not found or access denied.', 404);
  } else if (!isPersonal && !canVerify(actor)) {
    throw new PhdAccessError('Institutional deadlines can only be created by a data verifier.', 403);
  }
  if (!isPersonal && input.dueDate && !input.sourceUrl) {
    throw new PhdAccessError('An institutional deadline requires its official source URL.', 422);
  }
  const deadline = await db.phdDeadline.create({
    data: {
      projectId: input.projectId ?? null,
      title: input.title,
      kind: input.kind ?? 'PERSONAL',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      timezone: input.timezone ?? '',
      status: input.status ?? (input.dueDate ? 'NEEDS_VERIFICATION' : 'DATE_NOT_PUBLISHED'),
      sourceUrl: input.sourceUrl ?? null,
      verificationStatus: isPersonal ? 'VERIFIED_OFFICIAL' : input.verificationStatus ?? 'NOT_YET_VERIFIED',
      reminderDays: input.reminderDays ?? 14,
      notes: input.notes ?? '',
    },
  });
  await recordPhdAudit({ actor, action: 'DEADLINE_CREATED', entityType: 'PhdDeadline', entityId: deadline.id, projectId: input.projectId ?? undefined, details: { kind: deadline.kind } });
  return deadline;
}
