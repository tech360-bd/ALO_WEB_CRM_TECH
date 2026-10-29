/**
 * VERIFIED CATALOGUE — approval + publication
 * ==========================================
 * Publication is a separate, privileged step:
 *   1. the actor must be a Super Admin resolved from the database (not a claim
 *      supplied by the caller),
 *   2. only rows in the approval queue can move,
 *   3. approved rows are copied into the CRM course/intake/requirement tables
 *      that the website, Course Finder and portals already read, so all
 *      surfaces share one source of truth,
 *   4. every decision is written to the append-only revision log and audit log.
 */

import type { PrismaClient } from '@prisma/client';
import type { PublishCounts } from './types';

export interface DecisionOptions {
  actorUserId: string;
  coverageKeys?: string[];
  /** Approve every PENDING course-month when coverageKeys is omitted. */
  approveAllPending?: boolean;
  note?: string;
}

export interface DecisionResult {
  counts: PublishCounts;
  actorRole: string;
  approvedKeys: string[];
  rejectedKeys: string[];
  skippedKeys: string[];
}

export class AuthorizationError extends Error {
  status = 403;
}

/** Resolve the actor's role from the database. Callers cannot assert their own role. */
export async function resolveActorRole(prisma: PrismaClient, actorUserId: string): Promise<string> {
  if (!actorUserId) throw new AuthorizationError('An authenticated actor is required');
  const user = await prisma.portalUser.findUnique({
    where: { id: actorUserId },
    include: { roles: { include: { role: true } } },
  });
  if (!user) throw new AuthorizationError('Actor does not exist');
  const roleNames = user.roles.map((entry) => entry.role.name.toUpperCase());
  if (roleNames.includes('SUPER_ADMIN') || String(user.userType).toUpperCase() === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  if (roleNames.includes('ADMIN')) return 'ADMIN';
  return roleNames[0] ?? String(user.userType ?? 'UNKNOWN').toUpperCase();
}

export async function assertSuperAdmin(prisma: PrismaClient, actorUserId: string): Promise<string> {
  const role = await resolveActorRole(prisma, actorUserId);
  if (role !== 'SUPER_ADMIN') {
    throw new AuthorizationError('Only a Super Admin can approve or reject verified catalogue data');
  }
  return role;
}

function numeric(value: string | undefined): number {
  if (!value) return 0;
  const match = String(value).match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function parseEnglish(json: string): Record<string, string> {
  try {
    const parsed = JSON.parse(json || '{}');
    return parsed && typeof parsed === 'object' ? parsed as Record<string, string> : {};
  } catch {
    return {};
  }
}

interface CoverageRowLike {
  id: string;
  coverageKey: string;
  courseId: string;
  universityId: string;
  year: number;
  month: number;
  status: string;
  approvalStatus: string;
  published: boolean;
  feeAmount: number;
  feeCurrency: string;
  feePeriod: string;
  academicYear: string;
  applicationFee: number;
  applicationFeeCurrency: string;
  depositAmount: number;
  depositCurrency: string;
  applicationCloses: string;
  internationalDeadline: string;
  feeSourceUrl: string;
  intakeSourceUrl: string;
  courseSourceUrl: string;
  requirementSourceUrl: string;
  academicRequirement: string;
  bangladeshRequirement: string;
  englishRequirements: string;
  workExperienceRequirement: string;
  portfolioRequirement: string;
  interviewRequirement: string;
  documentRequirements: string;
  campus: string;
  studyMode: string;
  qualification: string;
  intakeName: string;
  startDate: string;
  notes: string;
  evidenceId: string | null;
}

async function applyToCrm(
  prisma: PrismaClient,
  row: CoverageRowLike,
  actorUserId: string,
  now: Date,
): Promise<void> {
  const english = parseEnglish(row.englishRequirements);
  const existingFee = await prisma.crmCourseIntakeFee.findFirst({
    where: { courseId: row.courseId, intakeYear: row.year, intakeMonth: String(row.month).padStart(2, '0') },
  });
  const feeData = {
    universityId: row.universityId,
    courseId: row.courseId,
    intakeYear: row.year,
    intakeMonth: String(row.month).padStart(2, '0'),
    intakeName: row.intakeName || `${row.month}/${row.year}`,
    applicationDeadline: row.internationalDeadline || row.applicationCloses,
    appFeeCurrency: row.applicationFeeCurrency,
    appFeeAmount: row.applicationFee,
    tuitionCurrency: row.feeCurrency,
    yearlyTuition: row.feeAmount,
    totalTuition: 0,
    tuitionPeriod: row.feePeriod,
    depositCurrency: row.depositCurrency,
    depositAmount: row.depositAmount,
    feeSourceUrl: row.feeSourceUrl,
    intakeSourceUrl: row.intakeSourceUrl || row.courseSourceUrl,
    lastCheckedAt: now.toISOString(),
    verificationStatus: row.status === 'VERIFIED_AVAILABLE' ? 'VERIFIED' : 'VERIFIED_NOT_OFFERED',
    status: row.status === 'VERIFIED_AVAILABLE' ? 'active' : 'not_offered',
  };
  if (existingFee) {
    await prisma.crmCourseIntakeFee.update({ where: { id: existingFee.id }, data: feeData });
  } else {
    await prisma.crmCourseIntakeFee.create({ data: feeData });
  }

  if (row.status !== 'VERIFIED_AVAILABLE') return;

  const existingRequirement = await prisma.crmCourseRequirement.findFirst({ where: { courseId: row.courseId } });
  const requirementData = {
    universityId: row.universityId,
    courseId: row.courseId,
    academicReq: row.academicRequirement,
    acceptedQualifications: '',
    gradingSystem: '',
    minScore: '',
    englishTest: [english.ielts ? `IELTS ${english.ielts}` : '', english.pte ? `PTE ${english.pte}` : '',
      english.toefl ? `TOEFL ${english.toefl}` : '', english.duolingo ? `Duolingo ${english.duolingo}` : '',
      english.other ?? ''].filter(Boolean).join('; '),
    componentScores: JSON.stringify(english),
    ieltsOverall: numeric(english.ielts),
    ieltsMinBand: numeric(english.ieltsComponents),
    pteOverall: numeric(english.pte),
    pteMinBand: 0,
    toeflOverall: numeric(english.toefl),
    detOverall: numeric(english.duolingo),
    workExperience: row.workExperienceRequirement,
    moiAccepted: false,
    ownEnglishTest: false,
    portfolioRequired: row.portfolioRequirement.trim().length > 0,
    interviewRequired: row.interviewRequirement.trim().length > 0,
    prerequisiteSubjects: '',
    countrySpecificRequirement: row.bangladeshRequirement,
    officialRequirementUrl: row.requirementSourceUrl || row.courseSourceUrl,
    lastCheckedAt: now.toISOString(),
    verificationStatus: 'VERIFIED',
  };
  if (existingRequirement) {
    await prisma.crmCourseRequirement.update({ where: { id: existingRequirement.id }, data: requirementData });
  } else {
    await prisma.crmCourseRequirement.create({ data: requirementData });
  }

  await prisma.crmCourse.update({
    where: { courseId: row.courseId },
    data: {
      publicationStatus: 'published',
      verificationStatus: 'VERIFIED',
      lastApprovedUpdateAt: now.toISOString(),
      updatedBy: actorUserId,
      status: 'published_verified',
    },
  });

  const universityId = row.universityId;
  const university = await prisma.crmUniversity.findUnique({ where: { universityId } });
  if (university && university.publicationStatus !== 'published') {
    await prisma.crmUniversity.update({
      where: { universityId },
      data: { publicationStatus: 'published', lastApprovedUpdateAt: now.toISOString(), updatedBy: actorUserId },
    });
  }
}

export async function approveCoverage(
  prisma: PrismaClient,
  options: DecisionOptions,
): Promise<DecisionResult> {
  const actorRole = await assertSuperAdmin(prisma, options.actorUserId);
  const now = new Date();
  const rows = await prisma.crmCourseMonthlyCoverage.findMany({
    where: options.coverageKeys?.length
      ? { coverageKey: { in: options.coverageKeys } }
      : { approvalStatus: 'PENDING' },
  });

  const approvedKeys: string[] = [];
  const skippedKeys: string[] = [];
  const rejectedKeys: string[] = [];

  for (const row of rows) {
    if (row.approvalStatus === 'APPROVED' && row.published) {
      skippedKeys.push(row.coverageKey);
      continue;
    }
    const updated = await prisma.crmCourseMonthlyCoverage.update({
      where: { id: row.id },
      data: {
        approvalStatus: 'APPROVED',
        published: true,
        reviewedBy: options.actorUserId,
        reviewedAt: now,
        lastVerifiedAt: now,
      },
    });
    await prisma.crmCoverageRevision.create({
      data: {
        coverageKey: row.coverageKey,
        courseId: row.courseId,
        year: row.year,
        month: row.month,
        revision: (await prisma.crmCoverageRevision.count({ where: { coverageKey: row.coverageKey } })) + 1,
        changeType: 'APPROVED',
        status: row.status,
        previousValueJson: JSON.stringify({ approvalStatus: row.approvalStatus, published: row.published }),
        newValueJson: JSON.stringify({ approvalStatus: 'APPROVED', published: true }),
        evidenceId: row.evidenceId,
        actorUserId: options.actorUserId,
        reason: options.note ?? 'Super Admin approval',
      },
    });
    await prisma.approvalQueueItem.updateMany({
      where: { changeId: `catalogue:${row.coverageKey}`, status: { in: ['PENDING', 'RECHECK_REQUESTED'] } },
      data: { status: 'APPROVED', resolvedAt: now },
    });
    await applyToCrm(prisma, updated as unknown as CoverageRowLike, options.actorUserId, now);
    approvedKeys.push(row.coverageKey);
  }

  const courseCount = new Set(rows.map((row) => row.courseId)).size;
  await prisma.crmAuditLog.create({
    data: {
      actorUserId: options.actorUserId,
      actorRole,
      action: 'VERIFIED_CATALOGUE_APPROVE',
      targetCollection: 'CrmCourseMonthlyCoverage',
      targetId: approvedKeys.join(',').slice(0, 500),
      afterData: JSON.stringify({ approved: approvedKeys.length, skipped: skippedKeys.length, note: options.note ?? '' }),
    },
  });

  return {
    actorRole,
    approvedKeys,
    rejectedKeys,
    skippedKeys,
    counts: {
      approved: approvedKeys.length,
      rejected: rejectedKeys.length,
      skipped: skippedKeys.length,
      coursesPublished: courseCount,
      universitiesPublished: new Set(rows.map((row) => row.universityId)).size,
    },
  };
}

export async function rejectCoverage(
  prisma: PrismaClient,
  options: DecisionOptions & { reason: string },
): Promise<DecisionResult> {
  const actorRole = await assertSuperAdmin(prisma, options.actorUserId);
  const now = new Date();
  const rows = await prisma.crmCourseMonthlyCoverage.findMany({
    where: options.coverageKeys?.length
      ? { coverageKey: { in: options.coverageKeys } }
      : { approvalStatus: 'PENDING' },
  });

  const rejectedKeys: string[] = [];
  const skippedKeys: string[] = [];
  for (const row of rows) {
    if (row.published) {
      skippedKeys.push(row.coverageKey);
      continue;
    }
    await prisma.crmCourseMonthlyCoverage.update({
      where: { id: row.id },
      data: { approvalStatus: 'REJECTED', published: false, reviewedBy: options.actorUserId, reviewedAt: now },
    });
    await prisma.crmCoverageRevision.create({
      data: {
        coverageKey: row.coverageKey, courseId: row.courseId, year: row.year, month: row.month,
        revision: (await prisma.crmCoverageRevision.count({ where: { coverageKey: row.coverageKey } })) + 1,
        changeType: 'REJECTED', status: row.status,
        previousValueJson: JSON.stringify({ approvalStatus: row.approvalStatus }),
        newValueJson: JSON.stringify({ approvalStatus: 'REJECTED' }),
        evidenceId: row.evidenceId, actorUserId: options.actorUserId, reason: options.reason,
      },
    });
    await prisma.approvalQueueItem.updateMany({
      where: { changeId: `catalogue:${row.coverageKey}`, status: { in: ['PENDING', 'RECHECK_REQUESTED'] } },
      data: { status: 'REJECTED', resolvedAt: now },
    });
    rejectedKeys.push(row.coverageKey);
  }

  await prisma.crmAuditLog.create({
    data: {
      actorUserId: options.actorUserId, actorRole, action: 'VERIFIED_CATALOGUE_REJECT',
      targetCollection: 'CrmCourseMonthlyCoverage', targetId: rejectedKeys.join(',').slice(0, 500),
      afterData: JSON.stringify({ rejected: rejectedKeys.length, skipped: skippedKeys.length, reason: options.reason }),
    },
  });

  return {
    actorRole, approvedKeys: [], rejectedKeys, skippedKeys,
    counts: { approved: 0, rejected: rejectedKeys.length, skipped: skippedKeys.length, coursesPublished: 0, universitiesPublished: 0 },
  };
}
