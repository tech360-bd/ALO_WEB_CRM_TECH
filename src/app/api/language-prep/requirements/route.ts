import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { getAllEnglishPrepTestsFromDB } from '@/lib/language-prep/service';
import { hasCurrentLanguagePrepSourceReview, hasCurrentLanguagePrepVerification } from '@/lib/language-prep/verification';

const VERIFIED_STATUSES = ['verified', 'verified_recent', 'VERIFIED', 'VERIFIED_RECENT'];

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const values = ['country', 'university', 'course', 'studyLevel', 'test'].map((key) => (params.get(key) || '').trim());
  if (values.some((value) => value.length > 120)) {
    return NextResponse.json({ success: false, error: 'Search values must be 120 characters or fewer.' }, { status: 400 });
  }
  const [country, university, course, studyLevel, testSlug] = values;
  if (!university && !course) return NextResponse.json({ success: false, error: 'Enter a university or course.' }, { status: 400 });

  try {
    const publishedTests = await getAllEnglishPrepTestsFromDB();
    const selectedTest = testSlug ? publishedTests.find((test) => test.slug === testSlug.toLowerCase()) : undefined;
    if (testSlug && !selectedTest) {
      return NextResponse.json({
        success: true,
        requirements: [],
        count: 0,
        message: 'No current source-reviewed test record is available. Confirm directly with the official institution and provider.',
        disclaimer: 'A missing result is not evidence that a test is accepted or rejected.',
      });
    }

    const where: Prisma.EnglishPrepRequirementWhereInput = {
      status: 'active',
      test: { status: 'active', verificationStatus: { in: VERIFIED_STATUSES }, ...(testSlug ? { slug: testSlug.toLowerCase() } : {}) },
      ...(country ? { countryName: { contains: country } } : {}),
      ...(university ? { universityName: { contains: university } } : {}),
      ...(course ? { courseName: { contains: course } } : {}),
      ...(studyLevel ? { studyLevel: { contains: studyLevel } } : {}),
    };
    const recorded = await db.englishPrepRequirement.findMany({
      where,
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, testId: true, countryName: true, universityName: true, courseName: true,
        studyLevel: true, minimumScore: true, componentRequirements: true, waiverAvailable: true,
        remarks: true, sourceUrl: true, sourceName: true, lastVerifiedAt: true,
        test: { select: { name: true, verificationStatus: true, lastVerifiedAt: true, sourceUrl: true } },
      },
    });

    let requirements = recorded
      .filter((row) => hasCurrentLanguagePrepSourceReview(row) && hasCurrentLanguagePrepVerification(row.test))
      .map(({ test, ...row }) => ({ ...row, testName: test.name }));

    if (!requirements.length) {
      const countries = country
        ? await db.country.findMany({
            where: { OR: [{ name: { contains: country } }, { slug: country.toLowerCase() }, { code: country }, { countryCode: country }] },
            select: { id: true, name: true, slug: true, code: true, countryCode: true },
          })
        : [];
      const countryIds = [...new Set(countries.flatMap((row) => [row.id, row.slug, row.code, row.countryCode]).filter(Boolean))];
      const scoreField: Record<string, 'ieltsOverall' | 'pteOverall' | 'toeflOverall' | 'detOverall'> = {
        ielts: 'ieltsOverall', 'pte-academic': 'pteOverall', 'toefl-ibt': 'toeflOverall', duolingo: 'detOverall',
      };
      const names: Record<string, string> = {
        'ielts-ukvi': 'IELTS UKVI', oietc: 'ELLT', 'oxford-ellt': 'ELLT', languagecert: 'LanguageCert',
        kaplan: 'Kaplan', oet: 'OET', 'cambridge-english': 'Cambridge', gre: 'GRE', gmat: 'GMAT', sat: 'SAT', act: 'ACT', moi: 'MOI',
      };
      const field = testSlug ? scoreField[testSlug.toLowerCase()] : undefined;
      const crmWhere: Prisma.CrmCourseRequirementWhereInput = {
        verificationStatus: { in: VERIFIED_STATUSES },
        officialRequirementUrl: { startsWith: 'https://' },
        university: { status: 'active', ...(university ? { name: { contains: university } } : {}) },
        course: {
          status: 'active',
          ...(course ? { courseTitle: { contains: course } } : {}),
          ...(studyLevel ? { studyLevel: { contains: studyLevel } } : {}),
          ...(country ? { countryId: { in: countryIds } } : {}),
        },
        ...(testSlug ? field ? { [field]: { gt: 0 } } : { englishTest: { contains: names[testSlug.toLowerCase()] || testSlug } } : {}),
      };
      const crm = await db.crmCourseRequirement.findMany({
        where: crmWhere,
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { courseTitle: true, countryId: true, studyLevel: true } },
          university: { select: { name: true } },
        },
      });
      requirements = crm
        .filter((row) => hasCurrentLanguagePrepVerification({
          verificationStatus: row.verificationStatus,
          officialUrl: row.officialRequirementUrl,
          lastVerifiedAt: row.lastCheckedAt,
        }))
        .map((row) => ({
          id: row.id,
          testId: '',
          testName: selectedTest?.name || row.englishTest || 'See recorded minimum',
          countryName: countries.find((item) => [item.id, item.slug, item.code, item.countryCode].includes(row.course.countryId))?.name || '',
          universityName: row.university.name,
          courseName: row.course.courseTitle,
          studyLevel: row.course.studyLevel,
          minimumScore: field ? `${testSlug}: ${row[field]}${testSlug === 'toefl-ibt' && row[field] > 6 ? ' (legacy score; confirm current equivalence with the institution)' : ''}` : row.englishTest || (row.ieltsOverall ? `IELTS: ${row.ieltsOverall}` : 'Not recorded'),
          componentRequirements: row.componentScores,
          waiverAvailable: row.moiAccepted,
          remarks: 'Confirm the current source before applying.',
          sourceUrl: row.officialRequirementUrl,
          sourceName: 'University course requirement',
          lastVerifiedAt: row.lastCheckedAt,
        }));
    }

    return NextResponse.json({
      success: true,
      requirements,
      count: requirements.length,
      message: requirements.length ? 'Recently source-reviewed records; confirm current guidance before applying.' : 'No current matching requirements are recorded. Check the official university course page.',
      disclaimer: 'A recent site review marker and HTTPS source are required, but are not independent external verification. Requirements vary by institution, course, test version and visa route.',
    });
  } catch (error) {
    console.error('Language requirement lookup failed', error);
    return NextResponse.json({ success: false, error: 'Requirements are temporarily unavailable. Please retry.' }, { status: 503 });
  }
}
