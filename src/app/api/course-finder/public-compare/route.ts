// GET /api/course-finder/public-compare?ids=a,b,c,d
//
// Public, read-only comparison of up to 4 courses. Only records that pass the
// canonical public filter (course + university VERIFIED, published, active,
// source-linked, open to international students) are returned, with VERIFIED
// intake/fee and requirement rows only. Identifiers that are unknown or not
// public are listed as unavailable without saying why. Rankings are not shown
// (a ranking needs its provider and edition).
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  PUBLIC_SCHOLARSHIP_COUNT_FILTER,
  publicCourseIdentifierWhere,
  publicIntakeWhere,
  publicRequirementWhere,
  stripInternalFields,
} from '@/lib/public-catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_COMPARE = 4;

function parseIds(raw: string | null): string[] | null {
  if (!raw) return null;
  const ids = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))];
  if (ids.length === 0 || ids.length > MAX_COMPARE || ids.some((id) => id.length > 191)) return null;
  return ids;
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const pos = (v: unknown) => (typeof v === 'number' && v > 0 ? v : null);

export async function GET(req: Request) {
  const ids = parseIds(new URL(req.url).searchParams.get('ids'));
  if (!ids) return NextResponse.json({ error: `Provide 1–${MAX_COMPARE} course identifiers in ids (comma-separated)` }, { status: 400 });
  try {
    const found = await Promise.all(ids.map(async (identifier) => {
      const where = publicCourseIdentifierWhere(identifier);
      if (!where) return { identifier, course: null };
      const course = await db.crmCourse.findFirst({
        where: where as any,
        include: {
          university: { select: { universityId: true, slug: true, name: true, country: true, city: true, campusName: true, officialUrl: true, sourceUrl: true, lastVerifiedAt: true } },
          intakeFees: { where: publicIntakeWhere() as any, orderBy: [{ intakeYear: 'asc' }, { id: 'asc' }], take: 6 },
          requirements: { where: publicRequirementWhere() as any, take: 1 },
          _count: { select: { scholarshipRecords: { where: PUBLIC_SCHOLARSHIP_COUNT_FILTER as any } } },
        },
      });
      return { identifier, course };
    }));

    const courses = found.filter((f) => f.course).map(({ identifier, course }) => {
      const c = course as Record<string, any>;
      const req0 = (c.requirements ?? [])[0] as Record<string, any> | undefined;
      return {
        identifier,
        courseId: str(c.courseId),
        slug: str(c.slug) || str(c.courseId),
        courseTitle: str(c.courseTitle),
        universityName: str(c.university?.name),
        universitySlug: str(c.university?.slug) || str(c.university?.universityId),
        country: str(c.country) || str(c.university?.country),
        city: str(c.city) || str(c.university?.city),
        campus: str(c.campus) || str(c.university?.campusName),
        studyLevel: str(c.studyLevel) || str(c.programLevel),
        qualification: str(c.qualification),
        durationMonths: pos(c.durationMonths),
        deliveryMode: str(c.deliveryMode) || str(c.attendanceMode),
        internationalEligibility: str(c.internationalEligibility) || 'not_verified',
        scholarshipsRecorded: (c._count?.scholarshipRecords ?? 0) > 0,
        officialCourseUrl: str(c.officialUrl),
        courseSourceUrl: str(c.sourceUrl) || str(c.officialUrl),
        courseLastVerifiedAt: str(c.lastVerifiedAt),
        intakes: (c.intakeFees ?? []).map((f: Record<string, any>) => ({
          intakeYear: f.intakeYear ?? null,
          intakeMonth: str(f.intakeMonth),
          applicationDeadline: str(f.applicationDeadline),
          yearlyTuition: pos(f.yearlyTuition),
          tuitionCurrency: str(f.tuitionCurrency),
          tuitionPeriod: str(f.tuitionPeriod),
          depositAmount: pos(f.depositAmount),
          depositCurrency: str(f.depositCurrency),
          appFeeAmount: pos(f.appFeeAmount),
          appFeeCurrency: str(f.appFeeCurrency),
          feeSourceUrl: str(f.feeSourceUrl),
          intakeSourceUrl: str(f.intakeSourceUrl),
          lastCheckedAt: str(f.lastCheckedAt),
        })),
        requirement: req0 ? {
          academicReq: str(req0.academicReq),
          minScore: str(req0.minScore),
          gradingSystem: str(req0.gradingSystem),
          ieltsOverall: pos(req0.ieltsOverall),
          ieltsMinBand: pos(req0.ieltsMinBand),
          pteOverall: pos(req0.pteOverall),
          toeflOverall: pos(req0.toeflOverall),
          detOverall: pos(req0.detOverall),
          moiAccepted: typeof req0.moiAccepted === 'boolean' ? req0.moiAccepted : null,
          interviewRequired: typeof req0.interviewRequired === 'boolean' ? req0.interviewRequired : null,
          portfolioRequired: typeof req0.portfolioRequired === 'boolean' ? req0.portfolioRequired : null,
          officialRequirementUrl: str(req0.officialRequirementUrl),
          lastCheckedAt: str(req0.lastCheckedAt),
        } : null,
      };
    });
    const unavailable = found.filter((f) => !f.course).map((f) => f.identifier);
    return NextResponse.json(stripInternalFields({ courses, unavailable, max: MAX_COMPARE }), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[course-finder/public-compare] failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Comparison is temporarily unavailable' }, { status: 503 });
  }
}
