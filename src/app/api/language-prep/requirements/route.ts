import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const values = ['country', 'university', 'course', 'studyLevel', 'test'].map(key => (params.get(key) || '').trim());
  if (values.some(value => value.length > 120)) return NextResponse.json({ success: false, error: 'Search values must be 120 characters or fewer.' }, { status: 400 });
  const [country, university, course, studyLevel, testSlug] = values;
  if (!university && !course) return NextResponse.json({ success: false, error: 'Enter a university or course.' }, { status: 400 });
  try {
    const where: Prisma.EnglishPrepRequirementWhereInput = {
      status: 'active', test: { status: 'active', ...(testSlug ? { slug: testSlug } : {}) },
      ...(country ? { countryName: { contains: country } } : {}),
      ...(university ? { universityName: { contains: university } } : {}),
      ...(course ? { courseName: { contains: course } } : {}),
      ...(studyLevel ? { studyLevel: { contains: studyLevel } } : {}),
    };
    const recorded = await db.englishPrepRequirement.findMany({ where, take: 20, orderBy: { createdAt: 'desc' },
      select: { id: true, testId: true, countryName: true, universityName: true, courseName: true, studyLevel: true, minimumScore: true, componentRequirements: true, waiverAvailable: true, remarks: true, sourceUrl: true, sourceName: true, lastVerifiedAt: true, test: { select: { name: true } } },
    });
    let requirements = recorded.map(({ test, ...row }) => ({ ...row, testName: test.name }));
    if (!requirements.length) {
      const countries = country ? await db.country.findMany({ where: { OR: [{ name: { contains: country } }, { slug: country.toLowerCase() }, { code: country }, { countryCode: country }] }, select: { id: true, name: true, slug: true, code: true, countryCode: true } }) : [];
      const countryIds = [...new Set(countries.flatMap(row => [row.id, row.slug, row.code, row.countryCode]).filter(Boolean))];
      const scoreField: Record<string, 'ieltsOverall' | 'pteOverall' | 'toeflOverall' | 'detOverall'> = { ielts: 'ieltsOverall', 'pte-academic': 'pteOverall', 'toefl-ibt': 'toeflOverall', duolingo: 'detOverall' };
      const names: Record<string, string> = { 'ielts-ukvi': 'IELTS UKVI', oietc: 'ELLT', 'oxford-ellt': 'ELLT', languagecert: 'LanguageCert', kaplan: 'Kaplan', oet: 'OET', 'cambridge-english': 'Cambridge', gre: 'GRE', gmat: 'GMAT', sat: 'SAT', act: 'ACT', moi: 'MOI' };
      const field = scoreField[testSlug];
      const crmWhere: Prisma.CrmCourseRequirementWhereInput = {
        university: { status: 'active', ...(university ? { name: { contains: university } } : {}) },
        course: { status: 'active', ...(course ? { courseTitle: { contains: course } } : {}), ...(studyLevel ? { studyLevel: { contains: studyLevel } } : {}), ...(country ? { countryId: { in: countryIds } } : {}) },
        ...(testSlug ? field ? { [field]: { gt: 0 } } : { englishTest: { contains: names[testSlug] || testSlug } } : {}),
      };
      const crm = await db.crmCourseRequirement.findMany({ where: crmWhere, take: 20, orderBy: { createdAt: 'desc' }, include: { course: { select: { courseTitle: true, countryId: true, studyLevel: true } }, university: { select: { name: true } } } });
      requirements = crm.map(row => ({
        id: row.id, testId: '', testName: testSlug || row.englishTest || 'See recorded minimum',
        countryName: countries.find(item => [item.id, item.slug, item.code, item.countryCode].includes(row.course.countryId))?.name || '',
        universityName: row.university.name, courseName: row.course.courseTitle, studyLevel: row.course.studyLevel,
        minimumScore: field ? `${testSlug}: ${row[field]}${testSlug === 'toefl-ibt' && row[field] > 6 ? ' (legacy score; confirm current equivalence with the institution)' : ''}` : row.englishTest || (row.ieltsOverall ? `IELTS: ${row.ieltsOverall}` : 'Not recorded'),
        componentRequirements: row.componentScores, waiverAvailable: row.moiAccepted, remarks: 'Confirm the current source before applying.',
        sourceUrl: row.officialRequirementUrl, sourceName: 'University course requirement', lastVerifiedAt: row.lastCheckedAt ? new Date(row.lastCheckedAt) : null,
      }));
    }
    return NextResponse.json({ success: true, requirements, count: requirements.length,
      message: requirements.length ? 'Recorded requirements; confirm current source guidance.' : 'No matching requirements are recorded. Check the official university course page.',
      disclaimer: 'Requirements vary by university, course, exam version and visa route. A stored record is not proof of current acceptance.',
    });
  } catch (error) {
    console.error('Language requirement lookup failed', error);
    return NextResponse.json({ success: false, error: 'Requirements are temporarily unavailable. Please retry.' }, { status: 503 });
  }
}
