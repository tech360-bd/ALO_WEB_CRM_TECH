/**
 * Shared record builder for the manual CrmCourse create endpoints
 * (POST /api/admin/courses and POST /api/admin/courses/create).
 *
 * Phase 1 review (2026-10-12), P0-A. Before this, both endpoints:
 *  - marked the course, intake/fee row and requirement row VERIFIED whenever
 *    any sourceUrl string was supplied, and stamped lastVerifiedAt = now;
 *  - accepted publicationStatus / status from the request body;
 *  - filled missing facts with invented values (IELTS 6.5, PTE 58, TOEFL 80,
 *    DET 115, "Recognized Bachelor degree with minimum 60% or GPA 3.0",
 *    September 2026 intake, "Rolling" deadline, GBP, MSc, 12 months,
 *    "Postgraduate", "Main Campus", ...).
 * Together that let an admin request create a public, "verified" course with
 * fabricated requirements in one call.
 *
 * Now: creation is never verification and never publication. Every row is
 * NEEDS_REVIEW / draft, no verification date is written, and a fact that was
 * not supplied is left empty (schema "not set" value) instead of invented.
 * Verification and publication stay with the reviewed Course Finder admin
 * workflow.
 */
import { isAcceptableSourceUrl } from './content-page-guards';

export const MANUAL_CREATE_VERIFICATION = 'NEEDS_REVIEW';
export const MANUAL_CREATE_PUBLICATION = 'draft';
export const MANUAL_CREATE_STATUS = 'draft';

type Uni = { universityId: string; city?: string | null; country?: string | null; campusName?: string | null };

export type ManualCourseBuild =
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      course: Record<string, unknown>;
      intake: Record<string, unknown> | null;
      requirement: Record<string, unknown> | null;
      warnings: string[];
    };

const str = (v: unknown, max = 191) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown): number | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

export function buildManualCourseRecords(
  body: Record<string, unknown>,
  uni: Uni,
  courseId: string,
  slug: string,
): ManualCourseBuild {
  // Control fields: only the safe initial values are accepted.
  if (body.publicationStatus !== undefined && body.publicationStatus !== MANUAL_CREATE_PUBLICATION) {
    return { ok: false, status: 422, error: 'New courses are created as drafts. Publish through the review workflow after verification.' };
  }
  if (body.verificationStatus !== undefined && body.verificationStatus !== MANUAL_CREATE_VERIFICATION) {
    return { ok: false, status: 422, error: 'Creating a course cannot verify it. Use the evidence-backed verification workflow.' };
  }
  if (body.status !== undefined && body.status !== MANUAL_CREATE_STATUS) {
    return { ok: false, status: 422, error: 'New courses are created with status draft.' };
  }
  if (body.lastVerifiedAt !== undefined) {
    return { ok: false, status: 400, error: 'lastVerifiedAt cannot be set from a request body.' };
  }

  const sourceUrl = str(body.sourceUrl, 2048);
  if (sourceUrl && !isAcceptableSourceUrl(sourceUrl)) {
    return { ok: false, status: 400, error: 'sourceUrl must be an https official source URL.' };
  }
  for (const key of ['officialUrl', 'officialApplicationUrl'] as const) {
    const value = str(body[key], 2048);
    if (value && !isAcceptableSourceUrl(value)) return { ok: false, status: 400, error: `${key} must be an https URL.` };
  }

  const duration = num(body.durationMonths);
  if (Number.isNaN(duration)) return { ok: false, status: 400, error: 'durationMonths must be a non-negative number.' };

  const warnings: string[] = [];
  const course: Record<string, unknown> = {
    courseId,
    universityId: uni.universityId,
    courseTitle: str(body.courseTitle, 500),
    slug,
    studyLevel: str(body.studyLevel),
    subjectArea: str(body.subjectArea),
    disciplineArea: str(body.disciplineArea),
    durationMonths: duration === null ? 0 : Math.round(duration as number),
    qualification: str(body.qualification),
    deliveryMode: str(body.deliveryMode),
    // Location may be inherited from the university record (not invented).
    campus: str(body.campus) || str(uni.campusName),
    city: str(body.city) || str(uni.city),
    country: str(body.country) || str(uni.country),
    publicTags: Array.isArray(body.publicTags) ? body.publicTags.filter((t) => typeof t === 'string').join(', ') : str(body.publicTags, 1000),
    placementOption: body.placementOption === true,
    onlineOption: body.onlineOption === true,
    officialUrl: str(body.officialUrl, 2048),
    officialApplicationUrl: str(body.officialApplicationUrl, 2048),
    sourceUrl,
    status: MANUAL_CREATE_STATUS,
    verificationStatus: MANUAL_CREATE_VERIFICATION,
    publicationStatus: MANUAL_CREATE_PUBLICATION,
    lastVerifiedAt: '',
  };

  // Intake / fee row: only when an intake year and month were supplied.
  const tuition = num(body.tuitionFee);
  const deposit = num(body.depositAmount);
  const appFee = num(body.appFeeAmount);
  if ([tuition, deposit, appFee].some((v) => Number.isNaN(v))) {
    return { ok: false, status: 400, error: 'Fee amounts must be non-negative numbers.' };
  }
  const currency = str(body.currency, 3).toUpperCase();
  const hasMoney = [tuition, deposit, appFee].some((v) => typeof v === 'number' && v > 0);
  if (hasMoney && !/^[A-Z]{3}$/.test(currency)) {
    return { ok: false, status: 400, error: 'A three-letter currency code is required with any fee amount (no default currency is assumed).' };
  }
  const firstIntake = Array.isArray(body.intakes) && body.intakes[0] && typeof body.intakes[0] === 'object'
    ? (body.intakes[0] as Record<string, unknown>)
    : null;
  const intakeYear = firstIntake ? Number(firstIntake.intakeYear) : NaN;
  const intakeMonth = firstIntake ? str(firstIntake.intakeMonth, 20) : '';
  let intake: Record<string, unknown> | null = null;
  if (Number.isInteger(intakeYear) && intakeYear >= 2000 && intakeYear <= 2100 && intakeMonth) {
    intake = {
      universityId: uni.universityId,
      courseId,
      intakeYear,
      intakeMonth,
      intakeName: str(firstIntake?.intakeName) || `${intakeMonth} ${intakeYear}`,
      applicationDeadline: str(firstIntake?.deadline),
      tuitionCurrency: tuition ? currency : '',
      yearlyTuition: tuition ?? 0,
      totalTuition: (() => { const t = num(firstIntake?.totalTuition); return typeof t === 'number' && !Number.isNaN(t) ? t : 0; })(),
      depositCurrency: deposit ? currency : '',
      depositAmount: deposit ?? 0,
      appFeeCurrency: appFee ? currency : '',
      appFeeAmount: appFee ?? 0,
      feeSourceUrl: sourceUrl,
      verificationStatus: MANUAL_CREATE_VERIFICATION,
    };
  } else if (hasMoney || firstIntake) {
    warnings.push('Fees/intake were not saved: an intake year and month are required, and none are assumed.');
  }

  // Requirement row: only the values actually supplied; 0 / "" mean "not set".
  const scores: Record<string, number> = {};
  for (const key of ['ieltsOverall', 'ieltsMinBand', 'pteOverall', 'toeflOverall', 'detOverall'] as const) {
    const v = num(body[key]);
    if (Number.isNaN(v)) return { ok: false, status: 400, error: `${key} must be a non-negative number.` };
    if (typeof v === 'number') scores[key] = v;
  }
  const academicReq = str(body.academicReq, 5000);
  let requirement: Record<string, unknown> | null = null;
  if (academicReq || Object.keys(scores).length) {
    requirement = {
      universityId: uni.universityId,
      courseId,
      academicReq,
      ...scores,
      moiAccepted: body.moiAccepted === true,
      officialRequirementUrl: sourceUrl,
      verificationStatus: MANUAL_CREATE_VERIFICATION,
    };
  }

  return { ok: true, course, intake, requirement, warnings };
}
