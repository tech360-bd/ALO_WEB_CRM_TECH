/**
 * VERIFIED CATALOGUE — deterministic validation
 * =============================================
 * Pure functions only (no DB, no network) so the rules that protect the public
 * catalogue are unit-testable and identical in the ingest CLI, the monitoring
 * agent and the API layer.
 *
 * The validator is deliberately strict: an ingest of 0 rows is preferable to
 * publishing a fee or a deadline that no official page supports.
 */

import { createHash } from 'node:crypto';
import {
  COVERAGE_STATUSES,
  COVERAGE_WINDOW,
  SOURCE_TYPES,
  TRAVERSAL_COMPLETENESS,
  type CoverageRecord,
  type EvidenceRecord,
  type ValidationIssue,
  type ValidationResult,
  type VerifiedDataset,
} from './types';

export const MIN_EXCERPT_LENGTH = 20;
export const MAX_EXCERPT_LENGTH = 4000;

/** Collapse whitespace so that markdown/HTML extraction noise cannot change the hash. */
export function normalizeExcerpt(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function evidenceContentHash(excerpt: string): string {
  return sha256Hex(normalizeExcerpt(excerpt));
}

/**
 * Deterministic evidence identity: the same page, same entity, same field scope
 * and same excerpt map to the same row — re-running an ingest never duplicates
 * evidence, and a changed excerpt creates a new version instead of overwriting
 * the historical value.
 */
export function buildEvidenceKey(evidence: Pick<EvidenceRecord,
  'sourceUrl' | 'entityType' | 'universitySlug' | 'courseSlug' | 'fieldScope' | 'excerpt'>): string {
  const scope = [...evidence.fieldScope].map((f) => f.trim().toLowerCase()).sort().join(',');
  return sha256Hex([
    evidence.sourceUrl.trim(),
    evidence.entityType,
    evidence.universitySlug.trim().toLowerCase(),
    (evidence.courseSlug ?? '').trim().toLowerCase(),
    scope,
    evidenceContentHash(evidence.excerpt),
  ].join('|'));
}

export function buildCoverageKey(courseSlug: string, year: number, month: number): string {
  return `${courseSlug.trim().toLowerCase()}:${year}-${String(month).padStart(2, '0')}`;
}

export function buildTraversalKey(universitySlug: string, catalogueUrl: string, faculty = ''): string {
  return sha256Hex([universitySlug.trim().toLowerCase(), catalogueUrl.trim(), faculty.trim()].join('|'));
}

export function buildQueueKey(countrySlug: string, universityName: string): string {
  return `${countrySlug.trim().toLowerCase()}:${universityName.trim().toLowerCase().replace(/\s+/g, '-')}`;
}

/** All 13 course-months of the ALO window, oldest first. */
export function windowMonths(): Array<{ year: number; month: number }> {
  const months: Array<{ year: number; month: number }> = [];
  for (let year: number = COVERAGE_WINDOW.start.year; year <= COVERAGE_WINDOW.end.year; year += 1) {
    const first = year === COVERAGE_WINDOW.start.year ? COVERAGE_WINDOW.start.month : 1;
    const last = year === COVERAGE_WINDOW.end.year ? COVERAGE_WINDOW.end.month : 12;
    for (let month = first; month <= last; month += 1) months.push({ year, month });
  }
  return months;
}

export function isInWindow(year: number, month: number): boolean {
  return windowMonths().some((entry) => entry.year === year && entry.month === month);
}

/** Registrable-domain comparison: `www.cam.ac.uk` and `cam.ac.uk` match; `cam.ac.uk` and `evil.com` do not. */
export function sameOfficialDomain(url: string, officialWebsite: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const officialHost = new URL(officialWebsite).hostname.toLowerCase().replace(/^www\./, '');
    if (!host || !officialHost) return false;
    if (host === officialHost) return true;
    return host.endsWith(`.${officialHost}`) || officialHost.endsWith(`.${host}`);
  } catch {
    return false;
  }
}

export function isHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname.length > 3;
  } catch {
    return false;
  }
}

/** Parse an ISO date (YYYY-MM-DD, optionally with time). Returns null when invalid. */
export function parseIsoDate(value: string | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return null;
  const parsed = new Date(trimmed.length === 10 ? `${trimmed}T00:00:00Z` : trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Academic-year alignment for a fee.
 *  "2027/28" → UK/Canadian style year running Sep 2027 – Aug 2028.
 *  "2027"    → calendar-year fee (Australia / NZ / Japan style).
 * A fee may only be shown for a course-month it actually covers.
 */
export function feeCoversMonth(academicYear: string, year: number, month: number): boolean {
  const range = academicYear.match(/^(\d{4})\s*[/–-]\s*(\d{2}|\d{4})$/);
  if (range) {
    const startYear = Number(range[1]);
    const endSuffix = range[2];
    const endYear = endSuffix.length === 2 ? startYear + 1 : Number(endSuffix);
    if (endYear !== startYear + 1) return false;
    // Annual academic year starts in September.
    const expectedStart = month >= 9 ? year : year - 1;
    return expectedStart === startYear;
  }
  const single = academicYear.match(/^(\d{4})$/);
  if (single) return Number(single[1]) === year;
  return false;
}

function issue(severity: 'error' | 'warning', code: string, path: string, message: string): ValidationIssue {
  return { code, path, message, severity };
}

/**
 * Validate a complete dataset. Returns every problem found rather than the
 * first one so the research team can fix a batch in a single pass.
 */
export function validateDataset(dataset: VerifiedDataset): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const add = (severity: 'error' | 'warning', code: string, path: string, message: string) =>
    (severity === 'error' ? errors : warnings).push(issue(severity, code, path, message));

  if (!dataset || typeof dataset !== 'object') {
    return { ok: false, errors: [issue('error', 'DATASET_MISSING', '', 'Dataset is not an object')], warnings };
  }
  if (!dataset.schemaVersion) add('error', 'SCHEMA_VERSION', 'schemaVersion', 'schemaVersion is required');
  if (!datasetId(dataset)) add('error', 'DATASET_ID', 'datasetId', 'datasetId is required');

  const { startYear, startMonth, endYear, endMonth } = {
    startYear: COVERAGE_WINDOW.start.year,
    startMonth: COVERAGE_WINDOW.start.month,
    endYear: COVERAGE_WINDOW.end.year,
    endMonth: COVERAGE_WINDOW.end.month,
  };
  if (dataset.window && (dataset.window.startYear !== startYear || dataset.window.startMonth !== startMonth
    || dataset.window.endYear !== endYear || dataset.window.endMonth !== endMonth)) {
    add('error', 'WINDOW_MISMATCH', 'window', 'Dataset window must be January 2027 through January 2028');
  }

  const evidenceIds = new Set<string>();
  const evidenceById = new Map<string, EvidenceRecord>();
  (dataset.evidence ?? []).forEach((evidence, index) => {
    const path = `evidence[${index}]`;
    if (!evidence.id) add('error', 'EVIDENCE_ID', path, 'Evidence id is required');
    if (evidenceIds.has(evidence.id)) add('error', 'EVIDENCE_DUPLICATE', path, `Duplicate evidence id ${evidence.id}`);
    evidenceIds.add(evidence.id);
    evidenceById.set(evidence.id, evidence);

    if (!isHttpsUrl(evidence.sourceUrl)) add('error', 'EVIDENCE_URL', path, `Evidence sourceUrl must be an HTTPS URL (${evidence.sourceUrl})`);
    if (!(SOURCE_TYPES as readonly string[]).includes(evidence.sourceType)) {
      add('error', 'EVIDENCE_SOURCE_TYPE', path, `Unsupported sourceType ${evidence.sourceType}`);
    }
    if (!evidence.pageTitle || evidence.pageTitle.trim().length < 3) add('error', 'EVIDENCE_TITLE', path, 'Evidence pageTitle is required');
    if (!evidence.publisherName || evidence.publisherName.trim().length < 2) add('error', 'EVIDENCE_PUBLISHER', path, 'Evidence publisherName is required');
    if (!parseIsoDate(evidence.retrievedAt)) add('error', 'EVIDENCE_RETRIEVED_AT', path, 'retrievedAt must be an ISO date');
    if (evidence.publishedAt && !parseIsoDate(evidence.publishedAt)) add('warning', 'EVIDENCE_PUBLISHED_AT', path, 'publishedAt is not an ISO date');

    const excerpt = normalizeExcerpt(evidence.excerpt ?? '');
    if (excerpt.length < MIN_EXCERPT_LENGTH) add('error', 'EVIDENCE_EXCERPT_SHORT', path, 'Evidence excerpt is too short to support a fact');
    if (excerpt.length > MAX_EXCERPT_LENGTH) add('error', 'EVIDENCE_EXCERPT_LONG', path, 'Evidence excerpt exceeds 4000 characters; store a focused quote instead');
    if (!Array.isArray(evidence.fieldScope) || evidence.fieldScope.length === 0) {
      add('error', 'EVIDENCE_SCOPE', path, 'Evidence fieldScope must list the supported fields');
    }
    if (typeof evidence.confidence !== 'number' || evidence.confidence < 0 || evidence.confidence > 1) {
      add('error', 'EVIDENCE_CONFIDENCE', path, 'Evidence confidence must be between 0 and 1');
    }
  });

  const universitySlugs = new Set<string>();
  (dataset.universities ?? []).forEach((university, index) => {
    const path = `universities[${index}]`;
    if (!university.slug) add('error', 'UNIVERSITY_SLUG', path, 'University slug is required');
    if (universitySlugs.has(university.slug)) add('error', 'UNIVERSITY_DUPLICATE', path, `Duplicate university slug ${university.slug}`);
    universitySlugs.add(university.slug);
    if (!isHttpsUrl(university.officialWebsite)) add('error', 'UNIVERSITY_WEBSITE', path, 'officialWebsite must be an HTTPS URL');
    if (university.catalogueUrl && !isHttpsUrl(university.catalogueUrl)) add('error', 'UNIVERSITY_CATALOGUE', path, 'catalogueUrl must be an HTTPS URL');
    if (!parseIsoDate(university.lastVerifiedAt)) add('error', 'UNIVERSITY_VERIFIED_AT', path, 'lastVerifiedAt must be an ISO date');
    if (university.catalogueUrl && university.officialWebsite && !sameOfficialDomain(university.catalogueUrl, university.officialWebsite)) {
      add('error', 'UNIVERSITY_CATALOGUE_DOMAIN', path, 'catalogueUrl is not on the official university domain');
    }
  });

  const courseSlugs = new Set<string>();
  const courseBySlug = new Map<string, VerifiedDataset['courses'][number]>();
  const courseTitles = new Set<string>();
  (dataset.courses ?? []).forEach((course, index) => {
    const path = `courses[${index}]`;
    if (!course.slug) add('error', 'COURSE_SLUG', path, 'Course slug is required');
    if (courseSlugs.has(course.slug)) add('error', 'COURSE_DUPLICATE', path, `Duplicate course slug ${course.slug}`);
    courseSlugs.add(course.slug);
    courseBySlug.set(course.slug, course);
    const titleKey = `${course.universitySlug}::${course.title.trim().toLowerCase()}`;
    if (courseTitles.has(titleKey)) add('error', 'COURSE_TITLE_DUPLICATE', path, 'Duplicate course title for this university');
    courseTitles.add(titleKey);

    if (!universitySlugs.has(course.universitySlug)) add('error', 'COURSE_UNIVERSITY', path, `Unknown university ${course.universitySlug}`);
    const university = (dataset.universities ?? []).find((u) => u.slug === course.universitySlug);
    if (!isHttpsUrl(course.officialCourseUrl)) add('error', 'COURSE_URL', path, 'officialCourseUrl must be an HTTPS URL');
    if (university && isHttpsUrl(course.officialCourseUrl) && !sameOfficialDomain(course.officialCourseUrl, university.officialWebsite)) {
      add('error', 'COURSE_URL_DOMAIN', path, 'officialCourseUrl is not on the official university domain');
    }
    if (!parseIsoDate(course.lastVerifiedAt)) add('error', 'COURSE_VERIFIED_AT', path, 'lastVerifiedAt must be an ISO date');
    if (!course.qualification) add('error', 'COURSE_QUALIFICATION', path, 'qualification is required');
  });

  const coverageKeys = new Set<string>();
  (dataset.coverage ?? []).forEach((row, index) => {
    const path = `coverage[${index}]`;
    validateCoverageRow(row, path, { courseBySlug, evidenceById, add, coverageKeys });
  });

  // Every verified course must have a complete 13-month matrix (missing months are
  // recorded as VERIFICATION_PENDING rather than silently omitted).
  for (const course of dataset.courses ?? []) {
    for (const { year, month } of windowMonths()) {
      const key = buildCoverageKey(course.slug, year, month);
      if (!coverageKeys.has(key)) {
        add('warning', 'COVERAGE_GAP', `coverage.${course.slug}`, `Missing course-month ${key}; add it with an explicit status`);
      }
    }
  }

  (dataset.traversals ?? []).forEach((traversal, index) => {
    const path = `traversals[${index}]`;
    if (!universitySlugs.has(traversal.universitySlug)) add('error', 'TRAVERSAL_UNIVERSITY', path, `Unknown university ${traversal.universitySlug}`);
    if (!isHttpsUrl(traversal.catalogueUrl)) add('error', 'TRAVERSAL_URL', path, 'catalogueUrl must be an HTTPS URL');
    if (!(TRAVERSAL_COMPLETENESS as readonly string[]).includes(traversal.completeness)) {
      add('error', 'TRAVERSAL_COMPLETENESS', path, `Unsupported completeness ${traversal.completeness}`);
    }
    if (!parseIsoDate(traversal.lastTraversedAt)) add('error', 'TRAVERSAL_DATE', path, 'lastTraversedAt must be an ISO date');
  });

  (dataset.researchQueue ?? []).forEach((item, index) => {
    const path = `researchQueue[${index}]`;
    if (!item.universityName) add('error', 'QUEUE_NAME', path, 'universityName is required');
    if (!item.reason) add('error', 'QUEUE_REASON', path, 'reason is required');
    if (item.officialWebsite && !isHttpsUrl(item.officialWebsite)) add('error', 'QUEUE_WEBSITE', path, 'officialWebsite must be an HTTPS URL when provided');
  });

  return { ok: errors.length === 0, errors, warnings };
}

function datasetId(dataset: VerifiedDataset): string {
  return typeof dataset.datasetId === 'string' ? dataset.datasetId.trim() : '';
}

interface CoverageValidationContext {
  courseBySlug: Map<string, VerifiedDataset['courses'][number]>;
  evidenceById: Map<string, EvidenceRecord>;
  coverageKeys: Set<string>;
  add: (severity: 'error' | 'warning', code: string, path: string, message: string) => void;
}

function validateCoverageRow(row: CoverageRecord, path: string, ctx: CoverageValidationContext): void {
  const { add } = ctx;
  if (!ctx.courseBySlug.has(row.courseSlug)) add('error', 'COVERAGE_COURSE', path, `Unknown course ${row.courseSlug}`);
  if (!isInWindow(row.year, row.month)) add('error', 'COVERAGE_WINDOW', path, 'Course-month is outside January 2027 – January 2028');
  if (!(COVERAGE_STATUSES as readonly string[]).includes(row.status)) add('error', 'COVERAGE_STATUS', path, `Unsupported status ${row.status}`);

  const key = buildCoverageKey(row.courseSlug, row.year, row.month);
  if (ctx.coverageKeys.has(key)) add('error', 'COVERAGE_DUPLICATE', path, `Duplicate course-month ${key}`);
  ctx.coverageKeys.add(key);

  if (typeof row.confidence !== 'number' || row.confidence < 0 || row.confidence > 1) {
    add('error', 'COVERAGE_CONFIDENCE', path, 'confidence must be between 0 and 1');
  }

  const evidenceIds = Array.isArray(row.evidenceIds) ? row.evidenceIds : [];
  for (const id of evidenceIds) {
    if (!ctx.evidenceById.has(id)) add('error', 'COVERAGE_EVIDENCE', path, `Unknown evidence id ${id}`);
  }
  if (row.status !== 'VERIFICATION_PENDING' && evidenceIds.length === 0) {
    add('error', 'COVERAGE_EVIDENCE_REQUIRED', path, `Status ${row.status} requires at least one evidence record`);
  }

  if (row.status === 'VERIFIED_AVAILABLE') {
    if (!row.startDate && !row.intakeName) add('error', 'COVERAGE_AVAILABLE_DETAIL', path, 'VERIFIED_AVAILABLE needs a startDate or intakeName');
    if (!row.intakeSourceUrl && !row.courseSourceUrl) add('error', 'COVERAGE_AVAILABLE_SOURCE', path, 'VERIFIED_AVAILABLE needs an intake or course source URL');
    if (row.startDate && !parseIsoDate(row.startDate)) add('error', 'COVERAGE_START_DATE', path, 'startDate must be an ISO date');
    if (row.startDate) {
      const start = parseIsoDate(row.startDate);
      const expectedPrefix = `${row.year}-${String(row.month).padStart(2, '0')}`;
      if (start && row.startDate.slice(0, 7) !== expectedPrefix) {
        add('warning', 'COVERAGE_START_MONTH', path, `startDate ${row.startDate} is not in the covered month ${expectedPrefix}`);
      }
    }
  }

  if (row.status === 'VERIFIED_NOT_OFFERED' && !row.conflictNote) {
    add('warning', 'COVERAGE_NOT_OFFERED_BASIS', path, 'VERIFIED_NOT_OFFERED should state the enumeration basis in conflictNote');
  }

  if (row.applicationOpens && row.applicationCloses) {
    const opens = parseIsoDate(row.applicationOpens);
    const closes = parseIsoDate(row.applicationCloses);
    if (!opens) add('error', 'COVERAGE_OPENS_DATE', path, 'applicationOpens must be an ISO date');
    if (!closes) add('error', 'COVERAGE_CLOSES_DATE', path, 'applicationCloses must be an ISO date');
    if (opens && closes && closes < opens) add('error', 'COVERAGE_DEADLINE_ORDER', path, 'applicationCloses is before applicationOpens');
  } else if (row.applicationOpens) {
    add('error', 'COVERAGE_OPENS_DATE', path, 'applicationOpens requires applicationCloses');
  } else if (row.applicationCloses) {
    add('error', 'COVERAGE_CLOSES_DATE', path, 'applicationCloses requires applicationOpens');
  }
  if (row.internationalDeadline && !parseIsoDate(row.internationalDeadline)) {
    add('error', 'COVERAGE_INTL_DEADLINE', path, 'internationalDeadline must be an ISO date');
  }

  if (typeof row.feeAmount === 'number' && row.feeAmount > 0) {
    // The single most important rule of this delivery: never recycle an older
    // fee into 2027/28 without an official source that covers the month.
    if (!row.feeCurrency) add('error', 'COVERAGE_FEE_CURRENCY', path, 'A published fee requires a currency');
    if (!row.feeSourceUrl) add('error', 'COVERAGE_FEE_SOURCE', path, 'A published fee requires a fee source URL');
    if (!row.academicYear) {
      add('error', 'COVERAGE_FEE_ACADEMIC_YEAR', path, 'A published fee requires the academic year it applies to');
    } else if (!feeCoversMonth(row.academicYear, row.year, row.month)) {
      add('error', 'COVERAGE_FEE_CARRY_FORWARD', path,
        `Fee academic year ${row.academicYear} does not cover ${row.year}-${String(row.month).padStart(2, '0')}; an earlier year's fee may not be reused without official evidence for this intake`);
    }
    if (row.feeSourceUrl && !isHttpsUrl(row.feeSourceUrl)) add('error', 'COVERAGE_FEE_URL', path, 'feeSourceUrl must be an HTTPS URL');
  } else if (row.feeAmount && row.feeAmount < 0) {
    add('error', 'COVERAGE_FEE_NEGATIVE', path, 'feeAmount cannot be negative');
  }

  for (const [field, value] of Object.entries({
    courseSourceUrl: row.courseSourceUrl,
    feeSourceUrl: row.feeSourceUrl,
    intakeSourceUrl: row.intakeSourceUrl,
    requirementSourceUrl: row.requirementSourceUrl,
  })) {
    if (value && !isHttpsUrl(value)) add('error', 'COVERAGE_SOURCE_URL', `${path}.${field}`, `${field} must be an HTTPS URL`);
  }

  if (row.status === 'CONFLICT_REQUIRES_REVIEW' && !row.conflictNote) {
    add('error', 'COVERAGE_CONFLICT_NOTE', path, 'CONFLICT_REQUIRES_REVIEW requires a conflictNote describing the disagreement');
  }
}

/** Throw a compact, actionable error list when a dataset is invalid. */
export function assertDatasetValid(dataset: VerifiedDataset): void {
  const result = validateDataset(dataset);
  if (!result.ok) {
    const detail = result.errors.slice(0, 25).map((e) => `• [${e.code}] ${e.path}: ${e.message}`).join('\n');
    const more = result.errors.length > 25 ? `\n…and ${result.errors.length - 25} more error(s)` : '';
    throw new Error(`Dataset failed validation with ${result.errors.length} error(s):\n${detail}${more}`);
  }
}
