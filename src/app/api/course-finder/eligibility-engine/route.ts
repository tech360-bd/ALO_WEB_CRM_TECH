// POST /api/course-finder/eligibility-engine
//
// Public, rule-based eligibility check used by /eligibility-check and
// /ai/course-match. All rules live in src/lib/course-finder/eligibility-rules.ts
// (pure and unit-tested); this route only loads the verified public catalogue,
// runs the engine and returns the result.
//
// Integrity rules:
//  - Only courses that pass the canonical public catalogue filter
//    (published + verified + source-linked, university public, not closed to
//    international students) are evaluated.
//  - Only VERIFIED requirement and intake/fee rows are used; nothing is
//    defaulted. Missing data is reported as "not yet recorded".
//  - Alternative routes are themselves evaluated by the same engine and only
//    offered when they come out Eligible / Likely / Conditionally eligible.
//  - The student identity is taken from the server session only — never from
//    the request body. Anonymous checks are not stored.
//  - No AI is used to decide eligibility.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { authenticateRequest } from '@/lib/auth-middleware';
import { publicCourseWhere, publicIntakeWhere, publicRequirementWhere } from '@/lib/public-catalog';
import {
  ALTERNATIVE_ACCEPTABLE,
  ELIGIBILITY_CATEGORIES,
  ELIGIBILITY_DISCLAIMERS,
  evaluateEligibility,
  normalizeCourseLevel,
  pathwayLevelsFor,
  profileFromPayload,
  type CourseRuleInput,
  type EligibilityCategory,
  type EligibilityEvaluation,
  type StudentProfile,
} from '@/lib/course-finder/eligibility-rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RULE_VERSION = 'alo-eligibility-rules-2026-10-12';
const MAX_EVALUATED = 100;
const MAX_RETURNED = 50;
const MAX_BODY_BYTES = 64 * 1024;

const COUNTRY_ALIASES: Record<string, string[]> = {
  uk: ['United Kingdom', 'UK', 'GB'],
  'united kingdom': ['United Kingdom', 'UK', 'GB'],
  usa: ['United States', 'USA', 'US'],
  'united states': ['United States', 'USA', 'US'],
  uae: ['United Arab Emirates', 'UAE', 'Dubai'],
};

const LEVEL_FILTERS: Array<{ test: RegExp; where: Record<string, unknown> }> = [
  { test: /foundation/i, where: { OR: [{ studyLevel: { contains: 'Foundation' } }, { programLevel: { contains: 'Foundation' } }] } },
  { test: /mba/i, where: { courseTitle: { contains: 'MBA' } } },
  { test: /phd|doctor|research/i, where: { OR: [{ studyLevel: { contains: 'PhD' } }, { studyLevel: { contains: 'Research' } }, { studyLevel: { contains: 'Doctor' } }] } },
  { test: /postgrad|master/i, where: { OR: [{ studyLevel: { contains: 'Postgraduate' } }, { studyLevel: { contains: 'Master' } }] } },
  { test: /undergrad|bachelor/i, where: { OR: [{ studyLevel: { contains: 'Undergraduate' } }, { studyLevel: { contains: 'Bachelor' } }] } },
  { test: /diploma|certificate/i, where: { OR: [{ studyLevel: { contains: 'Diploma' } }, { studyLevel: { contains: 'Certificate' } }] } },
];

function text(v: unknown, max = 80): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
}

function preferenceWhere(prefs: Record<string, unknown>): Record<string, unknown>[] {
  const and: Record<string, unknown>[] = [];
  const countries = Array.isArray(prefs.preferredCountries)
    ? prefs.preferredCountries.map((c) => text(c)).filter((c): c is string => !!c && c.toLowerCase() !== 'other').slice(0, 12)
    : [];
  if (countries.length) {
    const names = [...new Set(countries.flatMap((c) => COUNTRY_ALIASES[c.toLowerCase()] ?? [c]))];
    and.push({
      OR: names.flatMap((name) => [
        { country: { contains: name } },
        { university: { is: { country: { contains: name } } } },
      ]),
    });
  }
  const level = text(prefs.preferredStudyLevel);
  if (level && !/^other$/i.test(level)) {
    const match = LEVEL_FILTERS.find((l) => l.test.test(level));
    if (match) and.push(match.where);
  }
  const subject = text(prefs.preferredSubject);
  if (subject) {
    and.push({
      OR: [
        { courseTitle: { contains: subject } },
        { subjectArea: { contains: subject } },
        { disciplineArea: { contains: subject } },
      ],
    });
  }
  return and;
}

const COURSE_SELECT = {
  id: true,
  courseId: true,
  courseTitle: true,
  slug: true,
  universityId: true,
  country: true,
  studyLevel: true,
  programLevel: true,
  subjectArea: true,
  qualification: true,
  internationalEligibility: true,
  officialUrl: true,
  sourceUrl: true,
  lastVerifiedAt: true,
  university: { select: { name: true, country: true, slug: true } },
  requirements: {
    where: publicRequirementWhere(),
    orderBy: { updatedAt: 'desc' as const },
    take: 1,
    select: {
      academicReq: true, minScore: true, gradingSystem: true,
      ieltsOverall: true, ieltsMinBand: true, pteOverall: true, pteMinBand: true,
      toeflOverall: true, detOverall: true, moiAccepted: true, ownEnglishTest: true,
      workExperience: true, portfolioRequired: true, interviewRequired: true,
      officialRequirementUrl: true, lastCheckedAt: true,
    },
  },
  intakeFees: {
    where: publicIntakeWhere(),
    orderBy: [{ intakeYear: 'asc' as const }],
    take: 1,
    select: { yearlyTuition: true, tuitionCurrency: true, feeSourceUrl: true, lastCheckedAt: true },
  },
};

type CourseRecord = {
  id: string;
  courseId: string;
  courseTitle: string;
  slug: string;
  universityId: string;
  country: string;
  studyLevel: string;
  programLevel: string;
  subjectArea: string;
  qualification: string;
  internationalEligibility: string;
  officialUrl: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  university: { name: string; country: string; slug: string } | null;
  requirements: Array<Record<string, unknown>>;
  intakeFees: Array<{ yearlyTuition: number; tuitionCurrency: string; feeSourceUrl: string; lastCheckedAt: string }>;
};

function toRuleInput(c: CourseRecord): CourseRuleInput {
  const fee = c.intakeFees[0];
  return {
    courseId: c.courseId,
    title: c.courseTitle,
    slug: c.slug || c.courseId,
    universityName: c.university?.name ?? null,
    country: c.country || c.university?.country || null,
    studyLevel: c.studyLevel,
    programLevel: c.programLevel,
    internationalEligibility: c.internationalEligibility,
    sourceUrl: c.officialUrl || c.sourceUrl || null,
    lastVerifiedAt: c.lastVerifiedAt || null,
    requirement: (c.requirements[0] as CourseRuleInput['requirement']) ?? null,
    fee: fee ? { yearlyTuition: fee.yearlyTuition, currency: fee.tuitionCurrency, sourceUrl: fee.feeSourceUrl, lastCheckedAt: fee.lastCheckedAt } : null,
  };
}

/** Response row — field names kept compatible with the existing checker UI. */
function toResultRow(c: CourseRecord, e: EligibilityEvaluation) {
  const fee = c.intakeFees[0];
  return {
    courseId: c.courseId,
    courseTitle: c.courseTitle,
    universityName: c.university?.name ?? null,
    universitySlug: c.university?.slug ?? null,
    country: c.country || c.university?.country || null,
    studyLevel: c.studyLevel,
    normalizedLevel: e.normalizedLevel,
    qualification: c.qualification || null,
    tuitionFee: fee && fee.yearlyTuition > 0 ? fee.yearlyTuition : null,
    tuitionCurrency: fee && fee.yearlyTuition > 0 ? fee.tuitionCurrency || null : null,
    eligibilityCategory: e.category,
    categoryLabel: e.categoryLabel,
    reason: e.reason,
    matchScore: e.requirementsMetPercent,
    requirementsMetPercent: e.requirementsMetPercent,
    requirements: e.requirements.map((r) => ({
      key: r.key,
      name: r.name,
      universityRequirement: r.universityRequirement,
      studentValue: r.studentValue,
      result: r.result,
      kind: r.kind,
      sourceType: r.sourceType,
      source: r.source,
      lastVerifiedAt: r.lastVerifiedAt,
      action: r.action,
    })),
    improvementPlan: e.improvementPlan,
    nextSteps: e.nextSteps,
    alternativeRoutes: [] as Array<{ courseTitle: string; universityName: string | null; reason: string; slug: string; eligibilityCategory: EligibilityCategory }>,
    slug: c.slug || c.courseId,
    sourceUrl: c.officialUrl || c.sourceUrl || null,
    lastVerifiedAt: c.lastVerifiedAt || null,
  };
}

async function loadAlternativePool(failing: CourseRecord[]): Promise<CourseRecord[]> {
  if (!failing.length) return [];
  const universityIds = [...new Set(failing.map((c) => c.universityId))].slice(0, 30);
  const subjects = [...new Set(failing.map((c) => c.subjectArea).filter(Boolean))].slice(0, 15);
  const or: Record<string, unknown>[] = [{ universityId: { in: universityIds } }];
  if (subjects.length) or.push({ subjectArea: { in: subjects } });
  return (await db.crmCourse.findMany({
    where: { AND: [publicCourseWhere(), { OR: or }] },
    select: COURSE_SELECT,
    take: 300,
  })) as unknown as CourseRecord[];
}

function pickAlternatives(failing: CourseRecord, failingEval: EligibilityEvaluation, pool: CourseRecord[], profile: StudentProfile, now: Date) {
  const pathways = pathwayLevelsFor(failingEval.normalizedLevel);
  const scored: Array<{ c: CourseRecord; e: EligibilityEvaluation; rank: number }> = [];
  for (const c of pool) {
    if (c.courseId === failing.courseId) continue;
    const sameUni = c.universityId === failing.universityId;
    const sameSubject = !!failing.subjectArea && c.subjectArea === failing.subjectArea;
    const level = normalizeCourseLevel(c.studyLevel, c.programLevel, c.courseTitle);
    const isPathway = pathways.includes(level);
    if (!(sameUni && (isPathway || sameSubject)) && !(sameSubject && (level === failingEval.normalizedLevel || isPathway))) continue;
    const e = evaluateEligibility(profile, toRuleInput(c), now);
    if (!ALTERNATIVE_ACCEPTABLE.includes(e.category)) continue;
    scored.push({ c, e, rank: (sameUni ? 2 : 0) + (isPathway ? 1 : 0) + ALTERNATIVE_ACCEPTABLE.length - ALTERNATIVE_ACCEPTABLE.indexOf(e.category) });
  }
  scored.sort((a, b) => b.rank - a.rank);
  return scored.slice(0, 3).map(({ c, e }) => ({
    courseTitle: c.courseTitle,
    universityName: c.university?.name ?? null,
    slug: c.slug || c.courseId,
    eligibilityCategory: e.category,
    reason: `${e.categoryLabel} for your profile${pathways.includes(e.normalizedLevel) ? ' — a pathway towards the original course level' : ''}${c.universityId === failing.universityId ? ' at the same university' : ''}.`,
  }));
}

export async function POST(req: Request) {
  // Anonymous endpoint: throttle per client before any database work.
  const limited = rateLimitMiddleware(req, 'lead_create');
  if (limited) return limited;

  const length = Number(req.headers.get('content-length') || 0);
  if (length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const now = new Date();
  const profile = profileFromPayload(body, now);
  const prefs = ((body as Record<string, unknown>).studyPreferences ?? {}) as Record<string, unknown>;

  // Optional: evaluate only the given public courses (Compare page, max 4).
  // They still pass the canonical public filter; preferences are not applied.
  const rawIds = (body as Record<string, unknown>).courseIds;
  const compareIds = Array.isArray(rawIds)
    ? [...new Set(rawIds.filter((v): v is string => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= 191).map((v) => v.trim()))].slice(0, 4)
    : [];
  if (Array.isArray(rawIds) && compareIds.length === 0) {
    return NextResponse.json({ error: 'courseIds must contain 1–4 course identifiers' }, { status: 400 });
  }
  const scope = compareIds.length
    ? [{ OR: [{ courseId: { in: compareIds } }, { slug: { in: compareIds } }] }]
    : preferenceWhere(typeof prefs === 'object' && prefs ? prefs : {});

  try {
    const courses = (await db.crmCourse.findMany({
      where: { AND: [publicCourseWhere(), ...scope] },
      select: COURSE_SELECT,
      take: MAX_EVALUATED,
      orderBy: { updatedAt: 'desc' },
    })) as unknown as CourseRecord[];

    const evaluated = courses.map((c) => ({ c, e: evaluateEligibility(profile, toRuleInput(c), now) }));
    const failing = evaluated.filter(({ e }) => e.category === 'NOT_CURRENTLY_ELIGIBLE' || e.category === 'PARTIALLY_MATCHED');
    const pool = await loadAlternativePool(failing.map(({ c }) => c));

    const order = new Map(ELIGIBILITY_CATEGORIES.map((k, i) => [k, i]));
    const rows = evaluated
      .map(({ c, e }) => {
        const row = toResultRow(c, e);
        if (e.category === 'NOT_CURRENTLY_ELIGIBLE' || e.category === 'PARTIALLY_MATCHED') {
          row.alternativeRoutes = pickAlternatives(c, e, pool, profile, now);
        }
        return row;
      })
      .sort((a, b) => (order.get(a.eligibilityCategory)! - order.get(b.eligibilityCategory)!) || b.requirementsMetPercent - a.requirementsMetPercent)
      .slice(0, MAX_RETURNED);

    const summaryCounts = Object.fromEntries(ELIGIBILITY_CATEGORIES.map((k) => [k, 0])) as Record<EligibilityCategory, number>;
    for (const r of rows) summaryCounts[r.eligibilityCategory]++;

    // Persist only for an authenticated session; identity comes from the server.
    let assessmentId: string | null = null;
    const auth = await authenticateRequest(req).catch(() => null);
    if (auth && !(auth instanceof NextResponse) && auth.userType.toUpperCase() === 'STUDENT') {
      const saved = await db.finderEligibilityResult.create({
        data: {
          studentId: auth.userId,
          assessmentId: null,
          result: JSON.stringify({ ruleVersion: RULE_VERSION, evaluatedAt: now.toISOString(), profile }),
          eligibleCourses: JSON.stringify(rows.map((r) => ({ courseId: r.courseId, category: r.eligibilityCategory, requirementsMetPercent: r.requirementsMetPercent }))),
          score: rows.length ? Math.round(rows.reduce((t, r) => t + r.requirementsMetPercent, 0) / rows.length) : 0,
        },
        select: { id: true },
      });
      assessmentId = saved.id;
    }

    return NextResponse.json({
      assessmentId,
      ruleVersion: RULE_VERSION,
      evaluatedCourses: courses.length,
      results: rows,
      total: rows.length,
      summary: {
        eligible: summaryCounts.ELIGIBLE,
        likelyEligible: summaryCounts.LIKELY_ELIGIBLE,
        conditionallyEligible: summaryCounts.CONDITIONALLY_ELIGIBLE,
        partiallyMatched: summaryCounts.PARTIALLY_MATCHED,
        notCurrentlyEligible: summaryCounts.NOT_CURRENTLY_ELIGIBLE,
        insufficientInfo: summaryCounts.INSUFFICIENT_INFO,
        counsellorReviewRequired: summaryCounts.COUNSELLOR_REVIEW_REQUIRED,
      },
      emptyCatalogue: courses.length === 0,
      disclaimers: ELIGIBILITY_DISCLAIMERS,
      disclaimer: ELIGIBILITY_DISCLAIMERS.join(' '),
    });
  } catch (error) {
    console.error('[eligibility-engine] evaluation failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Eligibility check is temporarily unavailable' }, { status: 500 });
  }
}
