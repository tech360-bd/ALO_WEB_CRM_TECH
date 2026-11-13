/**
 * VERIFIED CATALOGUE — ingest pipeline
 * ====================================
 * Turns a validated research dataset into CRM rows, with:
 *  • deterministic IDs/keys so re-running is idempotent,
 *  • immutable evidence rows (SHA-256 over the normalised excerpt),
 *  • approval staging: nothing is published here — every new or materially
 *    changed course-month becomes PENDING and lands in the Super Admin queue,
 *  • conflict protection: an already-approved value is never overwritten; the
 *    detected difference is preserved as a revision plus a CONFLICT queue item,
 *  • a batch row and audit log for every applied run.
 */

import type { PrismaClient } from '@prisma/client';

import type {
  CoverageRecord,
  EvidenceRecord,
  IngestCounts,
  VerifiedDataset,
} from './types';
import {
  assertDatasetValid,
  buildCoverageKey,
  buildEvidenceKey,
  buildQueueKey,
  buildTraversalKey,
  evidenceContentHash,
  normalizeExcerpt,
} from './validation';

export interface IngestOptions {
  /** false = dry run (validation + counts, no writes). Default true. */
  apply?: boolean;
  /** Actor recorded in the audit log. */
  actorUserId?: string;
  actorRole?: string;
  now?: Date;
  fileName?: string;
}

export interface IngestResult {
  counts: IngestCounts;
  conflicts: Array<{ courseSlug: string; year: number; month: number; reason: string }>;
  batchId: string | null;
  warnings: string[];
}

const MATERIAL_FIELDS = [
  'status', 'feeAmount', 'feeCurrency', 'academicYear', 'startDate', 'intakeName',
  'applicationOpens', 'applicationCloses', 'internationalDeadline', 'academicRequirement',
  'englishRequirements', 'depositAmount', 'applicationFee', 'internationalEligibility',
] as const;

function universityIdFor(slug: string): string {
  return `ALO-U-${slug}`;
}

function courseIdFor(slug: string): string {
  return `ALO-C-${slug}`;
}

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' }) + ` ${year}`;
}

function englishJson(row: CoverageRecord): string {
  return JSON.stringify(row.englishRequirements ?? {});
}

function coveragePayload(row: CoverageRecord, courseId: string, universityId: string, evidenceId: string | null, now: Date) {
  return {
    coverageKey: buildCoverageKey(row.courseSlug, row.year, row.month),
    universityId,
    courseId,
    year: row.year,
    month: row.month,
    monthLabel: monthLabel(row.year, row.month),
    status: row.status,
    intakeName: row.intakeName ?? '',
    startDate: row.startDate ?? '',
    applicationOpens: row.applicationOpens ?? '',
    applicationCloses: row.applicationCloses ?? '',
    internationalDeadline: row.internationalDeadline ?? '',
    feeAmount: row.feeAmount ?? 0,
    feeCurrency: row.feeCurrency ?? '',
    academicYear: row.academicYear ?? '',
    feePeriod: row.feePeriod ?? '',
    studentCategory: row.studentCategory ?? 'INTERNATIONAL',
    applicationFee: row.applicationFee ?? 0,
    applicationFeeCurrency: row.applicationFeeCurrency ?? '',
    depositAmount: row.depositAmount ?? 0,
    depositCurrency: row.depositCurrency ?? '',
    scholarshipNote: row.scholarshipNote ?? '',
    academicRequirement: row.academicRequirement ?? '',
    bangladeshRequirement: row.bangladeshRequirement ?? '',
    englishRequirements: englishJson(row),
    workExperienceRequirement: row.workExperienceRequirement ?? '',
    portfolioRequirement: row.portfolioRequirement ?? '',
    interviewRequirement: row.interviewRequirement ?? '',
    documentRequirements: JSON.stringify(row.documentRequirements ?? []),
    internationalEligibility: row.internationalEligibility ?? 'not_verified',
    studyMode: row.studyMode ?? '',
    campus: row.campus ?? '',
    qualification: row.qualification ?? '',
    courseSourceUrl: row.courseSourceUrl ?? '',
    feeSourceUrl: row.feeSourceUrl ?? '',
    intakeSourceUrl: row.intakeSourceUrl ?? '',
    requirementSourceUrl: row.requirementSourceUrl ?? '',
    sourcePublishedAt: row.sourcePublishedAt ?? '',
    collectedAt: now,
    lastVerifiedAt: now,
    evidenceId,
    confidence: row.confidence,
    conflictNote: row.conflictNote ?? '',
    notes: row.notes ?? '',
  };
}

function materialDiff(existing: Record<string, unknown>, next: Record<string, unknown>): string[] {
  const changed: string[] = [];
  for (const field of MATERIAL_FIELDS) {
    const a = existing[field];
    const b = next[field];
    if (typeof a === 'number' || typeof b === 'number') {
      if (Number(a ?? 0) !== Number(b ?? 0)) changed.push(field);
      continue;
    }
    if (String(a ?? '') !== String(b ?? '')) changed.push(field);
  }
  return changed;
}

export async function ingestVerifiedDataset(
  prisma: PrismaClient,
  dataset: VerifiedDataset,
  options: IngestOptions = {},
): Promise<IngestResult> {
  assertDatasetValid(dataset);
  const apply = options.apply !== false;
  const now = options.now ?? new Date();
  const actorUserId = options.actorUserId ?? 'system:verified-catalogue-ingest';
  const actorRole = options.actorRole ?? 'SYSTEM';
  const warnings: string[] = [...(dataset.notes ? [] : ['Dataset has no notes'])];

  const counts: IngestCounts = {
    evidenceCreated: 0, evidenceUpdated: 0, universitiesUpserted: 0, coursesUpserted: 0,
    coverageCreated: 0, coverageUpdated: 0, coverageUnchanged: 0, traversalsUpserted: 0,
    queueUpserted: 0, approvalItemsCreated: 0, applied: apply,
  };
  const conflicts: IngestResult['conflicts'] = [];

  // ── 1. Evidence ────────────────────────────────────────────────────────────
  const evidenceIdByDatasetId = new Map<string, string>();
  for (const evidence of dataset.evidence) {
    const evidenceKey = buildEvidenceKey(evidence);
    const contentHash = evidenceContentHash(evidence.excerpt);
    const payload = {
      evidenceKey,
      sourceUrl: evidence.sourceUrl,
      finalUrl: evidence.finalUrl ?? '',
      sourceType: evidence.sourceType,
      publisherName: evidence.publisherName,
      pageTitle: evidence.pageTitle,
      retrievedAt: new Date(evidence.retrievedAt),
      publishedAt: evidence.publishedAt ?? '',
      httpStatus: evidence.httpStatus ?? 200,
      contentHash,
      excerpt: normalizeExcerpt(evidence.excerpt),
      entityType: evidence.entityType,
      universitySlug: evidence.universitySlug,
      courseSlug: evidence.courseSlug ?? '',
      fieldScope: JSON.stringify(evidence.fieldScope),
      language: evidence.language ?? 'en',
      confidence: evidence.confidence,
      collectedBy: 'alo-research-agent',
    };

    if (!apply) {
      evidenceIdByDatasetId.set(evidence.id, `dry:${evidenceKey}`);
      continue;
    }

    // A previously stored value is never destroyed: a different excerpt for the
    // same page/entity/scope produces a NEW evidence row (new hash → new key).
    const existing = await prisma.crmOfficialEvidence.findUnique({ where: { evidenceKey } });
    if (existing) {
      const updated = await prisma.crmOfficialEvidence.update({
        where: { evidenceKey },
        data: {
          retrievedAt: payload.retrievedAt,
          verificationStatus: existing.verificationStatus === 'REJECTED' ? 'REJECTED' : 'VERIFIED',
          updatedAt: now,
        },
      });
      counts.evidenceUpdated += 1;
      evidenceIdByDatasetId.set(evidence.id, updated.id);
    } else {
      const created = await prisma.crmOfficialEvidence.create({
        data: { ...payload, verificationStatus: 'VERIFIED' },
      });
      counts.evidenceCreated += 1;
      evidenceIdByDatasetId.set(evidence.id, created.id);
    }
  }

  // ── 2. Universities ───────────────────────────────────────────────────────
  for (const university of dataset.universities) {
    const universityId = universityIdFor(university.slug);
    if (apply) {
      const existing = await prisma.crmUniversity.findUnique({ where: { universityId } });
      if (existing) {
        await prisma.crmUniversity.update({
          where: { universityId },
          data: {
            name: existing.name || university.name,
            country: existing.country || university.country,
            city: existing.city || university.city || '',
            slug: existing.slug || university.slug,
            website: existing.website || university.officialWebsite,
            officialUrl: existing.officialUrl || university.officialWebsite,
            officialCourseSearchUrl: existing.officialCourseSearchUrl || university.catalogueUrl || '',
            verificationStatus: university.verificationStatus === 'VERIFIED' && existing.verificationStatus === 'VERIFIED'
              ? 'VERIFIED' : 'PARTIALLY_VERIFIED',
            lastVerifiedAt: university.lastVerifiedAt,
            updatedBy: actorUserId,
          },
        });
      } else {
        await prisma.crmUniversity.create({
          data: {
            universityId,
            name: university.name,
            slug: university.slug,
            country: university.country,
            city: university.city ?? '',
            website: university.officialWebsite,
            officialUrl: university.officialWebsite,
            officialCourseSearchUrl: university.catalogueUrl ?? '',
            internationalStudentUrl: university.catalogueUrl ?? '',
            sourceUrl: university.catalogueUrl ?? university.officialWebsite,
            sourceUrls: JSON.stringify([university.catalogueUrl ?? university.officialWebsite]),
            verificationStatus: university.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PARTIALLY_VERIFIED',
            publicationStatus: 'draft',
            visibility: 'public',
            lastVerifiedAt: university.lastVerifiedAt,
            createdBy: actorUserId,
            updatedBy: actorUserId,
            status: 'verified_pending_approval',
          },
        });
      }
      counts.universitiesUpserted += 1;
    }
  }

  // ── 3. Courses ────────────────────────────────────────────────────────────
  for (const course of dataset.courses) {
    const universityId = universityIdFor(course.universitySlug);
    const courseId = courseIdFor(course.slug);
    if (apply) {
      const existing = await prisma.crmCourse.findUnique({ where: { courseId } });
      if (existing) {
        await prisma.crmCourse.update({
          where: { courseId },
          data: {
            courseTitle: existing.courseTitle || course.title,
            name: existing.name || course.title,
            slug: existing.slug || course.slug,
            qualification: existing.qualification || course.qualification,
            studyLevel: existing.studyLevel || course.studyLevel,
            subjectArea: existing.subjectArea || course.subjectArea || '',
            durationMonths: existing.durationMonths || course.durationMonths || 0,
            deliveryMode: existing.deliveryMode || course.studyMode || '',
            campus: existing.campus || course.campus || '',
            officialUrl: existing.officialUrl || course.officialCourseUrl,
            officialApplicationUrl: existing.officialApplicationUrl || course.applicationUrl || '',
            sourceUrl: existing.sourceUrl || course.officialCourseUrl,
            verificationStatus: 'VERIFIED',
            lastVerifiedAt: course.lastVerifiedAt,
            updatedBy: actorUserId,
          },
        });
      } else {
        await prisma.crmCourse.create({
          data: {
            courseId,
            universityId,
            courseTitle: course.title,
            name: course.title,
            slug: course.slug,
            qualification: course.qualification,
            studyLevel: course.studyLevel,
            subjectArea: course.subjectArea ?? '',
            durationMonths: course.durationMonths ?? 0,
            deliveryMode: course.studyMode ?? '',
            campus: course.campus ?? '',
            country: dataset.universities.find((u) => u.slug === course.universitySlug)?.country ?? '',
            officialUrl: course.officialCourseUrl,
            officialApplicationUrl: course.applicationUrl ?? '',
            sourceUrl: course.officialCourseUrl,
            verificationStatus: 'VERIFIED',
            publicationStatus: 'draft',
            visibility: 'public',
            lastVerifiedAt: course.lastVerifiedAt,
            createdBy: actorUserId,
            updatedBy: actorUserId,
            status: 'verified_pending_approval',
          },
        });
      }
      counts.coursesUpserted += 1;
    }
  }

  // ── 4. Course-month coverage ──────────────────────────────────────────────
  for (const row of dataset.coverage) {
    const courseId = courseIdFor(row.courseSlug);
    const course = dataset.courses.find((c) => c.slug === row.courseSlug);
    if (!course) continue;
    const universityId = universityIdFor(course.universitySlug);
    const primaryEvidenceDatasetId = row.evidenceIds[0];
    const evidenceId = primaryEvidenceDatasetId ? evidenceIdByDatasetId.get(primaryEvidenceDatasetId) ?? null : null;
    const payload = coveragePayload(row, courseId, universityId, evidenceId, now);

    if (!apply) {
      counts.coverageCreated += 1;
      continue;
    }

    const existing = await prisma.crmCourseMonthlyCoverage.findUnique({ where: { coverageKey: payload.coverageKey } });
    if (!existing) {
      await prisma.crmCourseMonthlyCoverage.create({
        data: { ...payload, approvalStatus: 'PENDING', published: false },
      });
      await prisma.crmCoverageRevision.create({
        data: {
          coverageKey: payload.coverageKey, courseId, year: row.year, month: row.month, revision: 1,
          changeType: 'CREATED', status: payload.status,
          newValueJson: JSON.stringify(payload), evidenceId, actorUserId,
          reason: `Imported from dataset ${dataset.datasetId}`,
        },
      });
      await prisma.approvalQueueItem.upsert({
        where: { changeId: `catalogue:${payload.coverageKey}` },
        update: { status: 'PENDING', resolvedAt: null, priority: 10 },
        create: {
          changeId: `catalogue:${payload.coverageKey}`,
          queueType: row.status === 'CONFLICT_REQUIRES_REVIEW' ? 'CONFLICT' : 'STANDARD',
          priority: row.status === 'VERIFIED_AVAILABLE' ? 20 : 10,
          status: 'PENDING',
          assignedTo: null,
          requestedBy: actorUserId,
        },
      });
      counts.coverageCreated += 1;
      counts.approvalItemsCreated += 1;
      continue;
    }

    const changed = materialDiff(existing as unknown as Record<string, unknown>, payload as Record<string, unknown>);
    if (changed.length === 0) {
      await prisma.crmCourseMonthlyCoverage.update({
        where: { coverageKey: payload.coverageKey },
        data: { lastVerifiedAt: now, collectedAt: now, evidenceId: evidenceId ?? existing.evidenceId },
      });
      counts.coverageUnchanged += 1;
      continue;
    }

    if (existing.approvalStatus === 'APPROVED' || existing.published) {
      // Never overwrite an approved, published value. Preserve the proposal.
      const conflictKey = `catalogue:${payload.coverageKey}:conflict:${evidenceContentHash(JSON.stringify(payload)).slice(0, 12)}`;
      await prisma.crmCoverageRevision.create({
        data: {
          coverageKey: payload.coverageKey, courseId, year: row.year, month: row.month,
          revision: (await prisma.crmCoverageRevision.count({ where: { coverageKey: payload.coverageKey } })) + 1,
          changeType: 'CONFLICT_DETECTED', status: payload.status,
          previousValueJson: JSON.stringify(existing), newValueJson: JSON.stringify(payload),
          evidenceId, actorUserId,
          reason: `Material change (${changed.join(', ')}) detected against an approved value; held for Super Admin review`,
        },
      });
      await prisma.approvalQueueItem.upsert({
        where: { changeId: conflictKey },
        update: { status: 'PENDING', resolvedAt: null },
        create: {
          changeId: conflictKey, queueType: 'CONFLICT', priority: 30, status: 'PENDING',
          requestedBy: actorUserId,
        },
      });
      counts.approvalItemsCreated += 1;
      conflicts.push({
        courseSlug: row.courseSlug, year: row.year, month: row.month,
        reason: `Approved value differs in: ${changed.join(', ')}`,
      });
      continue;
    }

    await prisma.crmCourseMonthlyCoverage.update({
      where: { coverageKey: payload.coverageKey },
      data: { ...payload, approvalStatus: 'PENDING', published: false, reviewedBy: '', reviewedAt: null },
    });
    await prisma.crmCoverageRevision.create({
      data: {
        coverageKey: payload.coverageKey, courseId, year: row.year, month: row.month,
        revision: (await prisma.crmCoverageRevision.count({ where: { coverageKey: payload.coverageKey } })) + 1,
        changeType: 'UPDATED', status: payload.status,
        previousValueJson: JSON.stringify(existing), newValueJson: JSON.stringify(payload),
        evidenceId, actorUserId, reason: `Material change (${changed.join(', ')}) re-staged for approval`,
      },
    });
    await prisma.approvalQueueItem.upsert({
      where: { changeId: `catalogue:${payload.coverageKey}` },
      update: { status: 'PENDING', resolvedAt: null },
      create: {
        changeId: `catalogue:${payload.coverageKey}`, queueType: 'STANDARD', priority: 15, status: 'PENDING',
        requestedBy: actorUserId,
      },
    });
    counts.coverageUpdated += 1;
  }

  // ── 5. Catalogue traversals ───────────────────────────────────────────────
  for (const traversal of dataset.traversals) {
    if (!apply) continue;
    const traversalKey = buildTraversalKey(traversal.universitySlug, traversal.catalogueUrl, traversal.facultyOrDepartment ?? '');
    await prisma.crmCatalogueTraversal.upsert({
      where: { traversalKey },
      update: {
        httpStatus: traversal.httpStatus ?? 0,
        pageTitle: traversal.pageTitle ?? '',
        programmeLinksObserved: traversal.programmeLinksObserved ?? 0,
        coursesDiscovered: traversal.coursesDiscovered ?? 0,
        coursesVerified: traversal.coursesVerified ?? 0,
        paginationComplete: traversal.paginationComplete ?? false,
        nextPageUrl: traversal.nextPageUrl ?? '',
        completeness: traversal.completeness,
        notes: traversal.notes ?? '',
        lastTraversedAt: new Date(traversal.lastTraversedAt),
      },
      create: {
        traversalKey,
        universityId: universityIdFor(traversal.universitySlug),
        universitySlug: traversal.universitySlug,
        countrySlug: traversal.countrySlug,
        catalogueUrl: traversal.catalogueUrl,
        catalogueType: traversal.catalogueType ?? 'PROGRAMME_LIST',
        facultyOrDepartment: traversal.facultyOrDepartment ?? '',
        httpStatus: traversal.httpStatus ?? 0,
        pageTitle: traversal.pageTitle ?? '',
        programmeLinksObserved: traversal.programmeLinksObserved ?? 0,
        coursesDiscovered: traversal.coursesDiscovered ?? 0,
        coursesVerified: traversal.coursesVerified ?? 0,
        paginationComplete: traversal.paginationComplete ?? false,
        nextPageUrl: traversal.nextPageUrl ?? '',
        completeness: traversal.completeness,
        notes: traversal.notes ?? '',
        lastTraversedAt: new Date(traversal.lastTraversedAt),
      },
    });
    counts.traversalsUpserted += 1;
  }

  // ── 6. Research queue ─────────────────────────────────────────────────────
  for (const item of dataset.researchQueue) {
    if (!apply) continue;
    const queueKey = buildQueueKey(item.countrySlug, item.universityName);
    await prisma.crmResearchQueueItem.upsert({
      where: { queueKey },
      update: {
        universitySlug: item.universitySlug ?? '',
        officialWebsite: item.officialWebsite ?? '',
        catalogueUrl: item.catalogueUrl ?? '',
        priority: item.priority ?? 0,
        status: item.status ?? 'QUEUED',
        reason: item.reason,
        nextAction: item.nextAction ?? '',
      },
      create: {
        queueKey,
        countrySlug: item.countrySlug,
        universityName: item.universityName,
        universitySlug: item.universitySlug ?? '',
        officialWebsite: item.officialWebsite ?? '',
        catalogueUrl: item.catalogueUrl ?? '',
        priority: item.priority ?? 0,
        status: item.status ?? 'QUEUED',
        reason: item.reason,
        discoveredVia: item.discoveredVia ?? '',
        nextAction: item.nextAction ?? '',
      },
    });
    counts.queueUpserted += 1;
  }

  // ── 7. Batch + audit ──────────────────────────────────────────────────────
  let batchId: string | null = null;
  if (apply) {
    const batch = await prisma.crmImportBatch.create({
      data: {
        importType: 'verified_catalogue_dataset',
        fileName: options.fileName ?? `${dataset.datasetId}.json`,
        uploadedBy: actorUserId,
        rowsReceived: dataset.coverage.length,
        rowsImported: counts.coverageCreated,
        rowsDuplicate: counts.coverageUnchanged,
        rowsWarning: conflicts.length,
        rowsFailed: 0,
        status: 'completed',
        rollbackAvailable: true,
      },
    });
    batchId = batch.id;
    await prisma.crmAuditLog.create({
      data: {
        actorUserId,
        actorRole,
        action: 'VERIFIED_CATALOGUE_INGEST',
        targetCollection: 'CrmCourseMonthlyCoverage',
        targetId: dataset.datasetId,
        batchId: batch.id,
        afterData: JSON.stringify({ ...counts, conflicts: conflicts.length }),
      },
    });
  }

  return { counts, conflicts, batchId, warnings };
}
