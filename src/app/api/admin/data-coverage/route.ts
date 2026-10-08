import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

function isAdmin(auth: AuthContext) {
  const roles = new Set(auth.roles.map((role) => role.toLowerCase()));
  return roles.has('admin') || roles.has('super_admin') || ['admin', 'super_admin'].includes(auth.userType.toLowerCase());
}

function percent(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthIndex = new Map(monthNames.map((month, index) => [month.toLowerCase(), index]));

function normalizeMonth(value: string): string | null {
  const key = String(value || '').trim().toLowerCase();
  if (!key) return null;
  const index = monthIndex.get(key) ?? monthNames.findIndex((month) => month.toLowerCase().startsWith(key.slice(0, 3)));
  return index >= 0 ? monthNames[index] : null;
}

export const GET = withAuth(async (_request: Request, auth: AuthContext) => {
  if (!isAdmin(auth)) return NextResponse.json({ success: false, error: 'Admin access is required.' }, { status: 403 });
  try {
    const [
      universityTotal, universityVerified, universityResearch, universityNoCourses,
      universityMissingSource, universityMissingLocation, universityMissingImage,
      courseTotal, courseVerified, courseResearch, courseExpired, courseConflicting,
      courseMissingFee, courseMissingIntake, courseMissingRequirements, courseMissingEnglish,
      courseMissingSource, courseMissingInternationalEligibility,
      intakeRows, pendingConflicts, totalCountries, totalSubjects, totalDegrees,
      discoveryUniversities, discoveryCourses, researchQueue, universityQueue, conflicts,
      universitiesByCountry, coursesBySubject,
    ] = await Promise.all([
      db.crmUniversity.count(),
      db.crmUniversity.count({ where: { verificationStatus: 'VERIFIED' } }),
      db.crmUniversity.count({ where: { verificationStatus: { not: 'VERIFIED' } } }),
      db.crmUniversity.count({ where: { courses: { none: {} } } }),
      db.crmUniversity.count({ where: { AND: [{ sourceUrl: '' }, { officialUrl: '' }, { website: '' }] } }),
      db.crmUniversity.count({ where: { AND: [{ city: '' }, { country: '' }] } }),
      db.crmUniversity.count({ where: { AND: [{ heroImageSourceUrl: '' }, { logo: '' }] } }),
      db.crmCourse.count(),
      db.crmCourse.count({ where: { verificationStatus: 'VERIFIED' } }),
      db.crmCourse.count({ where: { verificationStatus: { not: 'VERIFIED' } } }),
      db.crmCourse.count({ where: { verificationStatus: { in: ['EXPIRED', 'OUTDATED'] } } }),
      db.crmCourse.count({ where: { verificationStatus: { contains: 'CONFLICT' } } }),
      db.crmCourse.count({ where: { tuitionFee: 0, intakeFees: { none: {} } } }),
      db.crmCourse.count({ where: { intakeFees: { none: {} }, courseIntakes: { none: {} } } }),
      db.crmCourse.count({ where: { requirements: { none: {} } } }),
      db.crmCourse.count({ where: { englishRequirements: { none: {} }, requirements: { none: {} } } }),
      db.crmCourse.count({ where: { AND: [{ sourceUrl: '' }, { officialUrl: '' }] } }),
      db.crmCourse.count({ where: { internationalEligibility: { in: ['', 'not_verified', 'unknown'] } } }),
      db.crmCourseIntakeFee.groupBy({
        by: ['intakeYear', 'intakeMonth', 'verificationStatus'],
        where: { status: 'active', intakeYear: { gte: 2027, lte: 2028 } },
        _count: { _all: true },
      }),
      db.dataConflict.count({ where: { status: 'PENDING' } }),
      db.country.count(),
      db.studyArea.count(),
      db.studyLevel.count(),
      db.crmDiscoveryRecord.count({ where: { pipelineStatus: { in: ['DISCOVERED', 'NEW'] } } }).catch(() => 0),
      db.crmDiscoveryRecord.count({ where: { discoveredCourseTitle: { not: '' } } }).catch(() => 0),
      db.crmCourse.findMany({
        where: {
          OR: [
            { verificationStatus: { not: 'VERIFIED' } },
            { sourceUrl: '' },
            { intakeFees: { none: {} }, courseIntakes: { none: {} } },
          ],
        },
        orderBy: { updatedAt: 'asc' }, take: 12,
        select: { id: true, courseId: true, courseTitle: true, slug: true, country: true, subjectArea: true, studyLevel: true, verificationStatus: true, sourceUrl: true, lastVerifiedAt: true, university: { select: { name: true, slug: true, country: true } }, intakeFees: { take: 2, orderBy: { intakeYear: 'asc' }, select: { intakeMonth: true, intakeYear: true, verificationStatus: true } }, _count: { select: { intakeFees: true, requirements: true } } },
      }),
      db.crmUniversity.findMany({
        where: { OR: [{ verificationStatus: { not: 'VERIFIED' } }, { courses: { none: {} } }, { sourceUrl: '' }] },
        orderBy: { updatedAt: 'asc' }, take: 10,
        select: { id: true, universityId: true, name: true, slug: true, country: true, city: true, verificationStatus: true, sourceUrl: true, _count: { select: { courses: true } } },
      }),
      db.dataConflict.findMany({ where: { status: 'PENDING' }, orderBy: { detectedAt: 'desc' }, take: 10 }),
      db.crmUniversity.groupBy({ by: ['country'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
      db.crmCourse.groupBy({ by: ['subjectArea'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
    ]);

    const months = new Map<string, { discovered: number; verified: number; requiringResearch: number }>();
    for (const year of [2027, 2028]) {
      for (const month of monthNames) {
        if (year === 2028 && month !== 'January') continue;
        months.set(`${month} ${year}`, { discovered: 0, verified: 0, requiringResearch: 0 });
      }
    }
    for (const row of intakeRows as any[]) {
      const month = normalizeMonth(row.intakeMonth);
      const key = month ? `${month} ${row.intakeYear}` : null;
      if (!key || !months.has(key)) continue;
      const bucket = months.get(key)!;
      const count = row._count?._all || 0;
      bucket.discovered += count;
      if (String(row.verificationStatus).toUpperCase() === 'VERIFIED') bucket.verified += count;
      else bucket.requiringResearch += count;
    }
    const monthCoverage = [...months.entries()].map(([label, values]) => ({
      label,
      ...values,
      coverage: percent(values.verified, values.discovered),
    }));
    const intakeTotal = monthCoverage.reduce((sum, month) => sum + month.discovered, 0);
    const verifiedIntakes = monthCoverage.reduce((sum, month) => sum + month.verified, 0);

    const universityCompleteSignals = Math.max(0, universityVerified) + Math.max(0, universityTotal - universityMissingSource) + Math.max(0, universityTotal - universityMissingLocation) + Math.max(0, universityTotal - universityMissingImage) + Math.max(0, universityTotal - universityNoCourses);
    const courseCompleteSignals = courseVerified + (courseTotal - courseMissingSource) + (courseTotal - courseMissingFee) + (courseTotal - courseMissingIntake) + (courseTotal - courseMissingRequirements) + (courseTotal - courseMissingInternationalEligibility);
    const intakeSourceMissing = (intakeRows as any[]).filter((row) => String(row.verificationStatus).toUpperCase() !== 'VERIFIED').reduce((sum, row) => sum + (row._count?._all || 0), 0);
    const universitiesCompletePercent = percent(universityCompleteSignals, universityTotal * 5);
    const coursesCompletePercent = percent(courseCompleteSignals, courseTotal * 6);
    const intakeCompletePercent = percent(verifiedIntakes, intakeTotal);

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      scope: 'Live records in the ALO CRM database; discovered records are not counted as verified.',
      completeness: {
        overall: percent((universityCompleteSignals + courseCompleteSignals + verifiedIntakes), universityTotal * 5 + courseTotal * 6 + intakeTotal),
        universities: universitiesCompletePercent,
        courses: coursesCompletePercent,
        intakes: intakeCompletePercent,
      },
      universities: {
        discovered: universityTotal + discoveryUniversities,
        total: universityTotal,
        verified: universityVerified,
        requiringResearch: universityResearch,
        noCourses: universityNoCourses,
        missingSource: universityMissingSource,
        missingLocation: universityMissingLocation,
        missingImages: universityMissingImage,
      },
      courses: {
        discovered: courseTotal + discoveryCourses,
        total: courseTotal,
        verified: courseVerified,
        requiringResearch: courseResearch,
        expired: courseExpired,
        conflicting: courseConflicting,
        missingTuition: courseMissingFee,
        missingIntake: courseMissingIntake,
        missingRequirements: courseMissingRequirements,
        missingEnglish: courseMissingEnglish,
        missingSource: courseMissingSource,
        missingInternationalEligibility: courseMissingInternationalEligibility,
      },
      intakeWindow: {
        start: 'January 2027',
        end: 'January 2028',
        discovered: intakeTotal,
        verified: verifiedIntakes,
        requiringResearch: intakeTotal - verifiedIntakes,
        sourceOrVerificationMissing: intakeSourceMissing,
        months: monthCoverage,
      },
      referenceData: { countries: totalCountries, subjects: totalSubjects, degrees: totalDegrees },
      conflicts: { pending: pendingConflicts, records: conflicts },
      researchQueue: { courses: researchQueue, universities: universityQueue },
      distribution: {
        universitiesByCountry: universitiesByCountry.map((row: any) => ({ country: row.country || 'Country not recorded', count: row._count.id })),
        coursesBySubject: coursesBySubject.filter((row: any) => row.subjectArea).map((row: any) => ({ subject: row.subjectArea, count: row._count.id })),
      },
    });
  } catch (error) {
    console.error('[admin-data-coverage] query failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Coverage could not be calculated from the current database state.' }, { status: 503 });
  }
});
