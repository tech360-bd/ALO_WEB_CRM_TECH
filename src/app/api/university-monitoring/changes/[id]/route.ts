import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mutationOriginAllowed } from "@/lib/request-origin";
import { requireMonitoringAdmin, requireMonitoringViewer } from "@/lib/university-monitoring-auth";
import { syncApprovedChange } from "@/lib/university-monitoring-sync";
import { isOfficialMonitoringSourceType, normalizeOfficialSourceUrl } from "@/lib/university-monitoring-source-policy";
import { INTERNATIONAL_ELIGIBILITY_REVIEW_VALUES } from "@/lib/university-intake-window";

// GET /api/university-monitoring/changes/[id]
// Returns full detail for a single change record (for the compare dialog).
// Staff-only: the record may contain an unapproved, unverified detected value.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMonitoringViewer(req);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const change = await db.dataChange.findUnique({
    where: { id },
    include: {
      source: true,
      snapshot: true,
      values: true,
      approvals: { orderBy: { performedAt: "desc" } },
    },
  });
  if (!change) return NextResponse.json({ error: "Change not found" }, { status: 404 });

  // Also fetch the previous snapshot for this source (for compare view)
  const previousSnapshots = await db.sourceSnapshot.findMany({
    where: { sourceId: change.sourceId },
    orderBy: { capturedAt: "desc" },
    take: 3,
    select: { id: true, capturedAt: true, contentHash: true, aiSummary: true, aiKeyFacts: true, httpStatus: true, title: true },
  });

  // History of this field for this entity (all changes ever recorded)
  const history = await db.dataChange.findMany({
    where: {
      entityType: change.entityType,
      universitySlug: change.universitySlug,
      courseSlug: change.courseSlug,
      fieldName: change.fieldName,
    },
    orderBy: { detectedAt: "desc" },
    take: 20,
    select: {
      id: true, detectedAt: true, oldValue: true, newValue: true,
      status: true, impactLevel: true, sourceUrl: true,
      reviewedBy: true, reviewedAt: true, appliedAt: true,
    },
  });

  return NextResponse.json({ change, previousSnapshots, history });
}

// PATCH /api/university-monitoring/changes/[id]
// Super Admin action: APPROVE | REJECT. Rechecks use POST /recheck.
// Body: { action, notes? }
//
// SECURITY: the acting user is taken from the authenticated session, NOT from
// the request body. Previously this route was unauthenticated and trusted a
// client-supplied `performedBy`, so any anonymous caller could approve a change
// into the production database and have it audit-logged as the Super Admin.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireMonitoringAdmin(req);
  if (!guard.ok) return guard.response;
  if (!mutationOriginAllowed(req, guard.actor.auth)) {
    return NextResponse.json({ success: false, error: 'Cross-origin monitoring decisions are not allowed' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action = typeof body?.action === 'string' ? body.action.trim().toUpperCase() : '';
  const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 1_000) : '';
  const actions = ['APPROVE', 'REJECT'];
  if (!actions.includes(action)) {
    return NextResponse.json({ success: false, error: `action must be one of ${actions.join(', ')}. Use POST /api/university-monitoring/recheck for a source recheck.` }, { status: 400 });
  }

  const userId = guard.actor.userId;
  try {
    const result = await db.$transaction(async (tx) => {
      const current = await tx.dataChange.findUnique({
        where: { id },
        include: { source: true, values: true },
      });
      if (!current) throw Object.assign(new Error('Change not found'), { httpStatus: 404 });
      if (['APPROVED', 'REJECTED', 'SUPERSEDED'].includes(current.status)) {
        throw Object.assign(new Error(`Change is already ${current.status} and cannot be decided again.`), { httpStatus: 409 });
      }
      if (!['PENDING', 'NEEDS_REVIEW'].includes(current.status)) {
        throw Object.assign(new Error(`Change status ${current.status} is not ready for a decision; finish or cancel the recheck first.`), { httpStatus: 409 });
      }

      const approving = action === 'APPROVE';
      let snapshot: any = null;
      let approvedSource: any = current.source;
      let oldProductionValue: string | null = null;
      if (approving) {
        const evidence = await validateApprovalEvidence(tx, current);
        snapshot = evidence.snapshot;
        approvedSource = evidence.source;
        if (!isSupportedProductionChange(current, snapshot, approvedSource)) {
          throw Object.assign(new Error('This change type or field has no safe production mapping yet. Keep it in manual review or update the CRM record through its reviewed catalogue workflow.'), { httpStatus: 409 });
        }
        const productionValue = await captureCurrentProductionValue(tx, current);
        if (productionValue.updatedAt && productionValue.updatedAt > current.detectedAt) {
          throw Object.assign(new Error('Approval refused: the production record changed after this candidate was detected. Recheck the official source against the current record before deciding.'), { httpStatus: 409 });
        }
        if (!previousValueMatches(current.fieldName, current.oldValue, productionValue.value)) {
          throw Object.assign(new Error('Approval refused: the detected old value does not match the current production value. Resolve the data conflict or request a fresh source review before applying this change.'), { httpStatus: 409 });
        }
        oldProductionValue = productionValue.value;
      }

      const approval = await tx.approvalAction.create({
        data: {
          changeId: id,
          action,
          performedBy: userId,
          performedAt: new Date(),
          notes: notes || null,
          metadata: JSON.stringify({
            source: 'super-admin-ui',
            timestamp: new Date().toISOString(),
            actorEmail: guard.actor.email,
            actorUserType: guard.actor.userType,
            snapshotId: snapshot?.id || null,
          }),
        },
      });

      const newStatus = approving ? 'APPROVED' : 'REJECTED';
      const decidedAt = new Date();
      const updated = await tx.dataChange.update({
        where: { id },
        data: {
          status: newStatus,
          reviewedBy: userId,
          reviewedAt: decidedAt,
          reviewNotes: notes || null,
          appliedAt: approving ? decidedAt : null,
          appliedBy: approving ? userId : null,
        },
      });
      await tx.approvalQueueItem.updateMany({
        where: { changeId: id },
        data: { status: newStatus, resolvedAt: decidedAt, requestedBy: null },
      });

      if (approving) {
        // Store the previous value before mutation; every supported write is
        // performed in this transaction and rolled back if any target/mapping
        // cannot be applied safely.
        await recordHistory(tx, updated, userId, approval.id, oldProductionValue);
        await applyChangeToProduction(tx, updated, approvedSource, snapshot, userId);
      }

      const event = approving ? 'MONITORING_CHANGE_APPROVED' : 'MONITORING_CHANGE_REJECTED';
      await tx.auditLog.create({
        data: {
          userId,
          action: event,
          resource: 'DataChange',
          resourceId: id,
          details: JSON.stringify({
            changeType: current.changeType,
            fieldName: current.fieldName,
            oldValue: current.oldValue,
            newValue: current.newValue,
            sourceUrl: current.sourceUrl,
            snapshotId: snapshot?.id || null,
            approvalId: approval.id,
            notes: notes || null,
          }),
        },
      });
      await tx.monitoringLog.create({
        data: {
          level: 'AUDIT',
          message: `Super Admin ${userId} ${approving ? 'approved' : 'rejected'} monitoring change ${id} (${current.fieldName}).`,
          entityType: current.entityType,
          entitySlug: current.universitySlug || current.courseSlug || current.countrySlug,
          sourceUrl: current.sourceUrl,
          metadata: JSON.stringify({ changeId: id, action, approvalId: approval.id, snapshotId: snapshot?.id || null }),
        },
      });
      return { updated, approval, source: current.source };
    }, { isolationLevel: 'Serializable' });

    let sync: Awaited<ReturnType<typeof syncApprovedChange>> | null = null;
    if (action === 'APPROVE') {
      sync = await syncApprovedChange(result.updated);
    }
    return NextResponse.json({
      success: true,
      change: result.updated,
      approval: result.approval,
      sync,
      message: action === 'REJECT' ? 'Change rejected; no production data was modified.' : 'Change approved and applied to the mapped public and CRM catalogue records.',
    });
  } catch (error) {
    const httpStatus = error && typeof error === 'object' && 'httpStatus' in error ? Number((error as { httpStatus: unknown }).httpStatus) : 500;
    if (httpStatus >= 400 && httpStatus < 500) {
      return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Monitoring change could not be decided' }, { status: httpStatus });
    }
    throw error;
  }
}

// Capture the CURRENT (pre-change) production value into the append-only
// history tables before the approved change overwrites it. The timestamp and
// old-value checks immediately before approval prevent a stale candidate from
// overwriting production data that changed after detection. Combined with
// DataChange (which keeps oldValue/newValue/source/detectedAt) this gives the
// searchable, permanent audit trail the spec requires:
//   OLD = 36,000 / NEW = 38,000 / SOURCE = official URL / DETECTED / APPROVED_BY / APPROVED_AT
async function captureCurrentProductionValue(tx: any, change: any): Promise<{ value: string | null; updatedAt: Date | null }> {
  const dates: Date[] = [];
  const rememberDate = (value: unknown) => { if (value instanceof Date) dates.push(value); };

  if (change.entityType === 'UNIVERSITY') {
    const [page, crm] = await Promise.all([
      tx.universityPage.findUnique({ where: { slug: change.universitySlug } }),
      tx.crmUniversity.findFirst({ where: { slug: change.universitySlug } }),
    ]);
    if (!page && !crm) throw Object.assign(new Error('Approval refused: the referenced university record no longer exists.'), { httpStatus: 409 });
    rememberDate(page?.updatedAt);
    rememberDate(crm?.updatedAt);
    const raw = change.fieldName === 'university_name' ? page?.name ?? crm?.name
      : change.fieldName === 'city' ? page?.city ?? crm?.city
        : change.fieldName === 'university_status' ? (page?.approvalStatus === 'PUBLISHED' || crm?.status === 'active' ? 'open' : crm?.status ?? page?.approvalStatus)
          : null;
    return { value: toStoredValue(raw), updatedAt: latestDate(dates) };
  }

  if (change.entityType !== 'COURSE' || !change.courseSlug) return { value: null, updatedAt: null };
  const [page, crm] = await Promise.all([
    tx.coursePage.findUnique({ where: { slug: change.courseSlug } }),
    tx.crmCourse.findFirst({ where: { slug: change.courseSlug } }),
  ]);
  if (!page && !crm) throw Object.assign(new Error('Approval refused: the referenced course record no longer exists.'), { httpStatus: 409 });
  rememberDate(page?.updatedAt);
  rememberDate(crm?.updatedAt);
  const field = String(change.fieldName);
  let raw: unknown;
  switch (field) {
    case 'course_title': raw = page?.name ?? crm?.courseTitle ?? crm?.name; break;
    case 'course_code': raw = crm?.courseCode; break;
    case 'degree_level': raw = page?.level ?? crm?.studyLevel ?? crm?.programLevel; break;
    case 'qualification': raw = crm?.qualification; break;
    case 'subject_area': raw = page?.subject ?? crm?.subjectArea ?? crm?.disciplineArea; break;
    case 'study_mode': raw = crm?.deliveryMode ?? crm?.attendanceMode; break;
    case 'campus': raw = crm?.campus; break;
    case 'location': raw = page?.city ?? crm?.city; break;
    case 'course_duration': raw = page?.duration || (Number(crm?.durationMonths) > 0 ? `${crm.durationMonths} months` : null); break;
    case 'international_eligibility': raw = page?.internationalEligibility ?? crm?.internationalEligibility; break;
    case 'course_status':
    case 'course_availability':
      raw = crm?.status === 'closed' || crm?.status === 'inactive' ? 'closed'
        : crm?.status === 'active' || page?.approvalStatus === 'PUBLISHED' ? 'open' : null;
      break;
    case 'tuition_international':
      raw = page?.tuition || (Number(crm?.tuitionFee) > 0
        ? `${crm?.currency || ''} ${Number(crm?.tuitionFee).toLocaleString('en-US')} ${crm?.tuitionPeriod || ''}`.trim()
        : null);
      break;
    case 'application_deadline':
    case 'international_deadline': raw = page?.deadline || crm?.deadline; break;
    case 'application_url': raw = crm?.officialApplicationUrl; break;
    case 'official_course_url': raw = crm?.officialUrl; break;
    case 'modules':
    case 'course_structure': raw = page?.modules; break;
    case 'career_outcomes': raw = page?.careerOutcomes ?? crm?.careerOutcomes; break;
    case 'academic_requirement':
    case 'english_ielts':
    case 'english_pte':
    case 'english_toefl':
    case 'english_duolingo':
    case 'english_other':
    case 'country_specific_requirement':
    case 'bangladesh_specific_requirement':
    case 'work_experience_requirement':
    case 'portfolio_requirement':
    case 'interview_requirement': {
      if (!crm) throw Object.assign(new Error('Approval refused: a CRM course record is required for structured requirement changes.'), { httpStatus: 409 });
      const requirements = await tx.crmCourseRequirement.findMany({
        where: { courseId: crm?.courseId || '' },
        orderBy: { updatedAt: 'desc' },
        take: 2,
      });
      if (requirements.length > 1) throw Object.assign(new Error('Approval refused: duplicate CRM requirement records must be resolved before applying this change.'), { httpStatus: 409 });
      const requirement = requirements[0];
      rememberDate(requirement?.updatedAt);
      if (field === 'academic_requirement') raw = requirement?.academicReq;
      else if (field === 'country_specific_requirement' || field === 'bangladesh_specific_requirement') raw = requirement?.countrySpecificRequirement;
      else if (field === 'work_experience_requirement') raw = requirement?.workExperience;
      else if (field === 'portfolio_requirement') raw = requirement ? (requirement.portfolioRequired ? 'required' : 'not required') : null;
      else if (field === 'interview_requirement') raw = requirement ? (requirement.interviewRequired ? 'required' : 'not required') : null;
      else raw = page?.englishRequirement ?? requirement?.englishTest;
      break;
    }
    default:
      if (field.startsWith('intake_')) {
        const intakeCandidate = parseIntakeCandidate(field, String(change.newValue || '')) || parseIntakeCandidate(field, String(change.oldValue || ''));
        if (!intakeCandidate || !crm) return { value: null, updatedAt: latestDate(dates) };
        const intakes = await tx.crmCourseIntakeFee.findMany({
          where: { courseId: crm.courseId, intakeYear: intakeCandidate.year, intakeMonth: intakeCandidate.month },
          orderBy: { updatedAt: 'desc' },
          take: 2,
        });
        if (intakes.length > 1) throw Object.assign(new Error('Approval refused: duplicate CRM intake records must be resolved before applying this change.'), { httpStatus: 409 });
        const intake = intakes[0];
        rememberDate(intake?.updatedAt);
        raw = intake ? `${intake.intakeName || intakeCandidate.month} ${intake.intakeYear} ${intake.status === 'active' ? 'open' : 'closed'}` : null;
      }
  }
  return { value: toStoredValue(raw), updatedAt: latestDate(dates) };
}

function toStoredValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try { return JSON.stringify(value); } catch { return String(value); }
}

function latestDate(values: Date[]): Date | null {
  return values.length ? new Date(Math.max(...values.map((value) => value.getTime()))) : null;
}

function previousValueMatches(field: string, previousValue: unknown, currentValue: string | null): boolean {
  const previous = typeof previousValue === 'string' ? previousValue.trim() : '';
  const current = typeof currentValue === 'string' ? currentValue.trim() : '';
  const isPlaceholder = (value: string) => /^(not_verified|needs_review|needs_official_source|pending|n\/a)$/i.test(value);
  if (!previous) return !current || isPlaceholder(current);
  if (!current) return false;
  const normalize = (value: string) => value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('en-US');
  if (normalize(previous) === normalize(current)) return true;
  if (field === 'tuition_international') {
    const oldFee = parseAnnualTuition(previous);
    const currentFee = parseAnnualTuition(current);
    return !!oldFee && !!currentFee && oldFee.amount === currentFee.amount && oldFee.currency === currentFee.currency;
  }
  if (field.startsWith('intake_')) {
    const oldIntake = parseIntakeCandidate(field, previous);
    const currentIntake = parseIntakeCandidate(field, current);
    return !!oldIntake && !!currentIntake && oldIntake.year === currentIntake.year && oldIntake.month === currentIntake.month && oldIntake.active === currentIntake.active;
  }
  if (field === 'portfolio_requirement' || field === 'interview_requirement') {
    const oldFlag = parseExplicitBoolean(previous);
    const currentFlag = parseExplicitBoolean(current);
    return oldFlag !== null && currentFlag !== null && oldFlag === currentFlag;
  }
  if (field === 'course_status' || field === 'course_availability' || field === 'university_status') {
    const state = (value: string) => /\b(closed|suspended|withdrawn|discontinued|inactive|ceased|dissolved)\b/i.test(value) ? 'closed'
      : /\b(open|active|available|offered|operational)\b/i.test(value) ? 'open' : null;
    const oldState = state(previous);
    const currentState = state(current);
    return !!oldState && oldState === currentState;
  }
  return false;
}

async function recordHistory(tx: any, change: any, userId: string, approvalId: string, actualOldValue: string | null) {
  const common = {
    fieldName: change.fieldName,
    oldValue: actualOldValue,
    newValue: change.newValue ?? null,
    changeId: change.id,
    changeType: change.changeType,
    sourceUrl: change.sourceUrl,
    detectedAt: change.detectedAt,
    approvedBy: userId,
    approvedAt: new Date(),
    approvalId,
  };

  if (change.entityType === "UNIVERSITY" && change.universitySlug) {
    await tx.universityHistory.create({ data: { universitySlug: change.universitySlug, ...common } });
  } else if (change.entityType === "COURSE" && change.courseSlug) {
    await tx.courseHistory.create({
      data: { courseSlug: change.courseSlug, universitySlug: change.universitySlug ?? null, ...common },
    });
  } else if (change.entityType === "SCHOLARSHIP") {
    await tx.scholarshipHistory.create({
      data: {
        scholarshipSlug: change.courseSlug || change.universitySlug || change.id,
        universitySlug: change.universitySlug ?? null,
        ...common,
      },
    });
  }
}

// Approval gates below bind a human decision to one exact, current, official
// source version. Legacy candidates without a snapshot/quote must be rechecked.
async function validateApprovalEvidence(tx: any, change: any) {
  const source = await tx.officialSource.findUnique({ where: { id: change.sourceId } });
  if (!source || !isOfficialMonitoringSourceType(source.sourceType) || !['verified', 'VERIFIED'].includes(source.verificationStatus)) {
    throw Object.assign(new Error('Approval refused: source is not verified as an official source.'), { httpStatus: 409 });
  }
  if (source.status !== 'ACTIVE' || !source.monitoringEnabled) {
    throw Object.assign(new Error('Approval refused: source is paused, retired, or broken. Re-verify it before approving this candidate.'), { httpStatus: 409 });
  }
  if (!change.snapshotId) {
    throw Object.assign(new Error('Approval refused: this legacy change has no immutable source snapshot. Request a recheck to attach fresh evidence.'), { httpStatus: 409 });
  }
  const snapshot = await tx.sourceSnapshot.findUnique({ where: { id: change.snapshotId } });
  if (!snapshot || snapshot.sourceId !== source.id) {
    throw Object.assign(new Error('Approval refused: evidence snapshot is missing or belongs to another source.'), { httpStatus: 409 });
  }
  const latest = await tx.sourceSnapshot.findFirst({ where: { sourceId: source.id }, orderBy: { capturedAt: 'desc' } });
  if (!latest || latest.id !== snapshot.id || source.lastContentHash !== snapshot.contentHash) {
    throw Object.assign(new Error('Approval refused: a newer source version exists. Recheck this change before deciding.'), { httpStatus: 409 });
  }
  if (typeof change.newValue !== 'string' || !change.newValue.trim()) {
    throw Object.assign(new Error('Approval refused: no explicit new value was recorded.'), { httpStatus: 409 });
  }
  let changeUrl: string;
  try { changeUrl = normalizeOfficialSourceUrl(change.sourceUrl); }
  catch { throw Object.assign(new Error('Approval refused: detected source URL is not a safe HTTPS URL.'), { httpStatus: 409 }); }
  if (snapshot.finalUrl) {
    try {
      if (normalizeOfficialSourceUrl(snapshot.finalUrl) !== changeUrl) throw new Error('mismatch');
    } catch {
      throw Object.assign(new Error('Approval refused: the cited URL does not match the URL captured in the evidence snapshot.'), { httpStatus: 409 });
    }
  }

  const value = await tx.dataChangeValue.findFirst({ where: { changeId: change.id, fieldName: change.fieldName } });
  const quote = value?.evidenceQuote;
  const normalize = (text: string) => text.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('en-US');
  const expectedHash = createHash('sha256').update(String(change.newValue)).digest('hex');
  const snapshotText = typeof snapshot.textExtract === 'string' ? normalize(snapshot.textExtract) : '';
  if (!quote || value.newValue !== change.newValue || value.newValueHash !== expectedHash ||
    !normalize(quote).includes(normalize(change.newValue)) || !snapshotText.includes(normalize(quote))) {
    throw Object.assign(new Error('Approval refused: a matching SHA-256 value and exact source-text quote from the attached snapshot are required. Recheck or move this item to manual review.'), { httpStatus: 409 });
  }
  if (value.sourceUrl) {
    try {
      if (normalizeOfficialSourceUrl(value.sourceUrl) !== changeUrl) throw new Error('mismatch');
    } catch {
      throw Object.assign(new Error('Approval refused: the value evidence URL does not match the captured source.'), { httpStatus: 409 });
    }
  }
  return { snapshot, source };
}

function isSupportedProductionChange(change: any, snapshot: any, source: any): boolean {
  const value = typeof change.newValue === 'string' ? change.newValue.trim() : '';
  if (!value || value.length > 1_000) return false;
  if (change.entityType === 'UNIVERSITY') {
    if (!change.universitySlug) return false;
    return change.fieldName === 'university_name' || change.fieldName === 'city' ||
      (change.fieldName === 'university_status' && change.changeType === 'UNIVERSITY_CLOSED' && /closed|ceased|dissolved/i.test(value));
  }
  if (change.entityType !== 'COURSE' || !change.courseSlug) return false;

  if (['course_title', 'course_code', 'degree_level', 'qualification', 'subject_area', 'study_mode', 'campus', 'location',
    'international_eligibility', 'application_deadline', 'international_deadline', 'academic_requirement',
    'country_specific_requirement', 'bangladesh_specific_requirement', 'work_experience_requirement',
    'portfolio_requirement', 'interview_requirement', 'application_url', 'official_course_url'].includes(change.fieldName)) {
    if (change.fieldName === 'international_eligibility') return normalizeInternationalEligibility(value) !== null;
    if (['portfolio_requirement', 'interview_requirement'].includes(change.fieldName)) return parseExplicitBoolean(value) !== null;
    if (['application_url', 'official_course_url'].includes(change.fieldName)) {
      try { normalizeOfficialSourceUrl(value); return true; } catch { return false; }
    }
    return true;
  }
  if (change.fieldName === 'course_duration') return parseCourseDurationMonths(value) !== null;
  if (change.fieldName === 'course_status' || change.fieldName === 'course_availability') {
    return change.changeType === 'COURSE_CLOSED' && /closed|suspended|withdrawn|discontinued/i.test(value);
  }
  if (change.fieldName === 'tuition_international') return parseAnnualTuition(value) !== null;
  if (change.fieldName === 'application_deadline' || change.fieldName === 'international_deadline') return true;
  if (change.fieldName.startsWith('intake_')) return parseIntakeCandidate(change.fieldName, value) !== null;
  if (['english_ielts', 'english_pte', 'english_toefl', 'english_duolingo', 'english_other'].includes(change.fieldName)) return true;
  if (change.fieldName === 'modules' || change.fieldName === 'course_structure' || change.fieldName === 'career_outcomes') {
    return parseJsonArray(value) !== null;
  }
  return false;
}

async function applyChangeToProduction(tx: any, change: any, source: any, snapshot: any, userId: string) {
  const value = String(change.newValue).trim();
  const now = new Date();
  const sourceUrl = normalizeOfficialSourceUrl(change.sourceUrl);

  if (change.entityType === 'UNIVERSITY' && change.universitySlug) {
    const page = await tx.universityPage.findUnique({ where: { slug: change.universitySlug } });
    const crm = await tx.crmUniversity.findFirst({ where: { slug: change.universitySlug } });
    if (!page && !crm) throw new Error('The referenced university does not exist in the public or CRM catalogue.');
    const pageData: Record<string, unknown> = { sourceUrl };
    const crmData: Record<string, unknown> = { sourceUrl, lastApprovedUpdateAt: now.toISOString(), updatedBy: userId };
    if (change.fieldName === 'university_name') {
      pageData.name = value;
      crmData.name = value;
    } else if (change.fieldName === 'city') {
      pageData.city = value;
      crmData.city = value;
    } else if (change.fieldName === 'university_status' && change.changeType === 'UNIVERSITY_CLOSED') {
      pageData.approvalStatus = 'DRAFT';
      crmData.status = 'inactive';
      crmData.publicationStatus = 'draft';
    } else {
      throw new Error(`No university production mapping exists for field ${change.fieldName}.`);
    }
    if (page) await tx.universityPage.update({ where: { slug: change.universitySlug }, data: pageData });
    if (crm) await tx.crmUniversity.update({ where: { id: crm.id }, data: crmData });
    return;
  }

  if (change.entityType !== 'COURSE' || !change.courseSlug) {
    throw new Error(`No approved production mapping exists for ${change.entityType}.${change.fieldName}.`);
  }
  const page = await tx.coursePage.findUnique({ where: { slug: change.courseSlug } });
  const crm = await tx.crmCourse.findFirst({ where: { slug: change.courseSlug } });
  if (!page && !crm) throw new Error('The referenced course does not exist in the public or CRM catalogue.');

  const pageData: Record<string, unknown> = { sourceUrl };
  const crmData: Record<string, unknown> = { sourceUrl, lastApprovedUpdateAt: now.toISOString(), updatedBy: userId };
  const field = change.fieldName as string;
  switch (field) {
    case 'course_title':
      if (value.length > 512) throw new Error('Course title exceeds the CRM field limit.');
      pageData.name = value;
      crmData.courseTitle = value;
      crmData.name = value;
      break;
    case 'course_code': crmData.courseCode = value; break;
    case 'degree_level': pageData.level = value; crmData.studyLevel = value; crmData.programLevel = value; break;
    case 'qualification': crmData.qualification = value; break;
    case 'subject_area': pageData.subject = value; crmData.subjectArea = value; crmData.disciplineArea = value; break;
    case 'study_mode': crmData.deliveryMode = value; crmData.attendanceMode = value; break;
    case 'campus': crmData.campus = value; break;
    case 'location': pageData.city = value; crmData.city = value; break;
    case 'course_duration':
      pageData.duration = value;
      crmData.durationMonths = parseCourseDurationMonths(value);
      break;
    case 'international_eligibility': {
      const eligibility = normalizeInternationalEligibility(value);
      if (!eligibility) throw new Error('The official eligibility wording is not in the supported reviewed status list.');
      pageData.internationalEligibility = eligibility;
      crmData.internationalEligibility = eligibility;
      break;
    }
    case 'course_status':
    case 'course_availability':
      if (change.changeType !== 'COURSE_CLOSED' || !/closed|suspended|withdrawn|discontinued/i.test(value)) throw new Error('Only an explicit official closure may change publication status.');
      pageData.approvalStatus = 'DRAFT';
      crmData.status = 'closed';
      crmData.publicationStatus = 'draft';
      break;
    case 'tuition_international': {
      const annualFee = parseAnnualTuition(value);
      if (!annualFee) throw new Error('Tuition must include one unambiguous amount, currency, and explicit annual period before it can be published to Course Finder.');
      pageData.tuition = value;
      crmData.tuitionFee = annualFee.amount;
      crmData.currency = annualFee.currency;
      crmData.tuitionPeriod = 'per year';
      break;
    }
    case 'application_deadline':
    case 'international_deadline':
      pageData.deadline = value;
      crmData.deadline = value;
      break;
    case 'application_url': crmData.officialApplicationUrl = normalizeOfficialSourceUrl(value); break;
    case 'official_course_url':
      crmData.officialUrl = normalizeOfficialSourceUrl(value);
      break;
    case 'academic_requirement':
    case 'english_ielts':
    case 'english_pte':
    case 'english_toefl':
    case 'english_duolingo':
    case 'english_other':
    case 'country_specific_requirement':
    case 'bangladesh_specific_requirement':
    case 'work_experience_requirement':
    case 'portfolio_requirement':
    case 'interview_requirement':
      if (field.startsWith('english_')) pageData.englishRequirement = value;
      if (field === 'academic_requirement') pageData.academicRequirement = value;
      if (!crm) throw new Error('CRM course record is required to apply a structured requirement update.');
      await upsertCourseRequirement(tx, crm, change, now);
      break;
    case 'intake_january': case 'intake_february': case 'intake_march': case 'intake_april':
    case 'intake_may': case 'intake_june': case 'intake_july': case 'intake_august':
    case 'intake_september': case 'intake_october': case 'intake_november': case 'intake_december':
    case 'intake_other': {
      if (!crm) throw new Error('CRM course record is required to update an intake.');
      const intake = parseIntakeCandidate(field, value);
      if (!intake) throw new Error('The intake needs an exact 2027/2028 month and explicit availability state.');
      await upsertCourseIntake(tx, crm, change, intake, now);
      break;
    }
    case 'modules':
    case 'course_structure':
      if (!page) throw new Error('A public CoursePage is required to publish modules/structure.');
      pageData.modules = JSON.stringify(parseJsonArray(value));
      break;
    case 'career_outcomes': {
      const outcomes = parseJsonArray(value);
      if (!outcomes) throw new Error('Career outcomes must be a source-backed JSON array for safe publication.');
      if (page) pageData.careerOutcomes = JSON.stringify(outcomes);
      crmData.careerOutcomes = JSON.stringify(outcomes);
      break;
    }
    default:
      throw new Error(`No course production mapping exists for field ${field}.`);
  }

  if (crm) await tx.crmCourse.update({ where: { id: crm.id }, data: crmData });
  if (page) await tx.coursePage.update({ where: { slug: change.courseSlug }, data: pageData });
}

async function upsertCourseRequirement(tx: any, crmCourse: any, change: any, now: Date) {
  const existing = await tx.crmCourseRequirement.findMany({
    where: { courseId: crmCourse.courseId },
    orderBy: { updatedAt: 'desc' },
    take: 2,
  });
  if (existing.length > 1) throw new Error('Multiple CRM requirement records exist for this course; resolve the duplicate before applying a monitored change.');
  const data: Record<string, unknown> = {
    verificationStatus: 'VERIFIED',
    officialRequirementUrl: normalizeOfficialSourceUrl(change.sourceUrl),
    lastCheckedAt: now.toISOString(),
  };
  const value = String(change.newValue).trim();
  if (change.fieldName === 'academic_requirement') data.academicReq = value;
  else if (change.fieldName === 'country_specific_requirement' || change.fieldName === 'bangladesh_specific_requirement') data.countrySpecificRequirement = value;
  else if (change.fieldName === 'work_experience_requirement') data.workExperience = value;
  else if (change.fieldName === 'portfolio_requirement') data.portfolioRequired = parseExplicitBoolean(value);
  else if (change.fieldName === 'interview_requirement') data.interviewRequired = parseExplicitBoolean(value);
  else if (String(change.fieldName).startsWith('english_')) {
    data.englishTest = value;
    const scores = parseEnglishScores(value);
    if (change.fieldName === 'english_ielts' && scores.overall !== null) {
      data.ieltsOverall = scores.overall;
      if (scores.minimum !== null) data.ieltsMinBand = scores.minimum;
    } else if (change.fieldName === 'english_pte' && scores.overall !== null) data.pteOverall = scores.overall;
    else if (change.fieldName === 'english_toefl' && scores.overall !== null) data.toeflOverall = scores.overall;
    else if (change.fieldName === 'english_duolingo' && scores.overall !== null) data.detOverall = scores.overall;
  }
  if (existing[0]) await tx.crmCourseRequirement.update({ where: { id: existing[0].id }, data });
  else await tx.crmCourseRequirement.create({ data: { ...data, universityId: crmCourse.universityId, courseId: crmCourse.courseId } });
}

async function upsertCourseIntake(tx: any, crmCourse: any, change: any, intake: { year: number; month: string; active: boolean }, now: Date) {
  const matches = await tx.crmCourseIntakeFee.findMany({
    where: { courseId: crmCourse.courseId, intakeYear: intake.year, intakeMonth: intake.month },
    orderBy: { updatedAt: 'desc' },
    take: 2,
  });
  if (matches.length > 1) throw new Error('Duplicate CRM intake rows exist for this course/month/year; resolve them before applying the monitoring result.');
  const data = {
    intakeName: String(change.newValue).trim(),
    intakeSourceUrl: normalizeOfficialSourceUrl(change.sourceUrl),
    lastCheckedAt: now.toISOString(),
    verificationStatus: 'VERIFIED',
    status: intake.active ? 'active' : 'inactive',
  };
  if (matches[0]) await tx.crmCourseIntakeFee.update({ where: { id: matches[0].id }, data });
  else await tx.crmCourseIntakeFee.create({
    data: {
      ...data,
      universityId: crmCourse.universityId,
      courseId: crmCourse.courseId,
      intakeYear: intake.year,
      intakeMonth: intake.month,
    },
  });
}

function normalizeInternationalEligibility(value: string): string | null {
  const normalized = value.trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ');
  if ((INTERNATIONAL_ELIGIBILITY_REVIEW_VALUES as readonly string[]).includes(normalized)) return normalized;
  if (/\b(closed to international students|not eligible for international students|international students are not eligible|domestic only)\b/.test(normalized)) return 'closed_to_international_students';
  if (/\b(eligible for international students|international students (are )?eligible|open to international students)\b/.test(normalized)) return 'eligible_for_international_students';
  return null;
}

function parseExplicitBoolean(value: string): boolean | null {
  const normalized = value.trim().toLocaleLowerCase('en-US');
  if (/^(no|false|not required|optional|not compulsory|not mandatory)$/.test(normalized) || /\b(not required|optional|not compulsory|not mandatory)\b/.test(normalized)) return false;
  if (/^(yes|true|required|compulsory|mandatory)$/.test(normalized) || /\b(required|compulsory|mandatory)\b/.test(normalized)) return true;
  return null;
}

function parseCourseDurationMonths(value: string): number | null {
  const matches = [...value.matchAll(/(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?)\b/gi)];
  if (matches.length !== 1) return null;
  const amount = Number(matches[0][1]);
  const unit = matches[0][2].toLowerCase();
  const months = unit.startsWith('y') ? amount * 12 : amount;
  return Number.isFinite(months) && months > 0 && months <= 120 && Number.isInteger(months) ? months : null;
}

function parseIntakeCandidate(fieldName: string, value: string): { year: number; month: string; active: boolean } | null {
  const monthByField: Record<string, string> = {
    intake_january: 'January', intake_february: 'February', intake_march: 'March', intake_april: 'April',
    intake_may: 'May', intake_june: 'June', intake_july: 'July', intake_august: 'August',
    intake_september: 'September', intake_october: 'October', intake_november: 'November', intake_december: 'December',
  };
  const month = monthByField[fieldName];
  if (!month) return null;
  const years = [...value.matchAll(/\b20\d{2}\b/g)].map((match) => Number(match[0]));
  if (years.length !== 1) return null;
  const year = years[0];
  const monthNumber = Object.keys(monthByField).indexOf(fieldName) + 1;
  if (year !== 2027 && !(year === 2028 && monthNumber === 1)) return null;
  const inactive = /\b(closed|unavailable|not available|not open|no intake|discontinued)\b/i.test(value);
  const active = !inactive && /\b(open|available|accepting applications|applications open|offered)\b/i.test(value);
  if (active === inactive) return null;
  return { year, month, active };
}

function parseAnnualTuition(value: string): { amount: number; currency: string } | null {
  // Do not fill a missing period/currency from the university's country or AI
  // key facts. Only publish a fee when the quoted candidate itself states all
  // three: one unambiguous amount, an explicit currency, and annual period.
  if (!/\b(per\s+(academic\s+)?year|annual(?:ly)?|yearly)\b/i.test(value)) return null;
  const numericTokens = [...value.matchAll(/(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g)]
    .map((match) => Number(match[0].replace(/,/g, '')))
    .filter((number) => !(number >= 1900 && number <= 2099));
  if (numericTokens.length !== 1 || !Number.isFinite(numericTokens[0]) || numericTokens[0] <= 0 || numericTokens[0] > 1_000_000) return null;
  const currency = value.match(/\b(AUD|NZD|GBP|USD|CAD|EUR|SGD|HKD|CHF|JPY|CNY|INR)\b/i)?.[1]?.toUpperCase()
    || (/£/.test(value) ? 'GBP' : '')
    || (/€/.test(value) ? 'EUR' : '');
  if (!currency) return null;
  return { amount: numericTokens[0], currency };
}

function parseJsonArray(value: string): unknown[] | null {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseEnglishScores(value: string): { overall: number | null; minimum: number | null } {
  const overallMatch = value.match(/(?:overall|total|score)\D{0,20}(\d+(?:\.\d+)?)/i);
  const numbers = [...value.matchAll(/\b\d+(?:\.\d+)?\b/g)].map((match) => Number(match[0]));
  const overall = overallMatch ? Number(overallMatch[1]) : numbers[0];
  const minimumMatch = value.match(/(?:no\s+(?:band|component|section)\s+(?:below|less than)|minimum\s+(?:band|component|score)?\s*(?:of)?|each\s+(?:band|component)\s*(?:at least)?|not less than)\s*(\d+(?:\.\d+)?)/i);
  const minimum = minimumMatch ? Number(minimumMatch[1]) : null;
  return {
    overall: Number.isFinite(overall) && overall > 0 && overall <= 120 ? overall : null,
    minimum: minimum !== null && Number.isFinite(minimum) && minimum > 0 && minimum <= 120 ? minimum : null,
  };
}
