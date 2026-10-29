import { db } from '@/lib/db';
import { EnglishTest } from './types';
import { hasCurrentLanguagePrepSourceReview, hasCurrentLanguagePrepVerification } from './verification';

function isoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}

function mapVerifiedTest(test: any): EnglishTest {
  return {
    id: test.id,
    name: test.name,
    slug: test.slug,
    shortName: test.shortName || test.name,
    shortDescription: test.shortDescription || '',
    longDescription: test.longDescription || '',
    testType: test.testType || 'english_proficiency',
    provider: test.provider || '',
    logo: test.logo || '',
    icon: test.icon || '',
    officialUrl: test.officialUrl || '',
    format: test.format || 'Check current provider information',
    durationMinutes: test.durationMinutes || 0,
    durationDisplay: test.durationDisplay || 'Check current provider information',
    scoringSystem: test.scoringSystem || 'Check official provider information',
    resultTimeline: test.resultTimeline || 'Check current provider information',
    costSummary: test.costSummary || 'Check current provider information',
    validitySummary: test.validitySummary || 'Check official provider',
    bestFor: test.bestFor || '',
    acceptanceSummary: test.acceptanceSummary || 'Acceptance varies by university, course and visa route',
    difficultyLevel: test.difficultyLevel || '',
    status: test.status || 'active',
    isPopular: Boolean(test.isPopular),
    isFeatured: Boolean(test.isFeatured),
    sortOrder: test.sortOrder || 0,
    sourceUrl: test.sourceUrl || '',
    sourceName: test.sourceName || '',
    verifiedBy: test.verifiedBy || '',
    verificationStatus: String(test.verificationStatus || 'pending').toLowerCase() as EnglishTest['verificationStatus'],
    lastVerifiedAt: isoDate(test.lastVerifiedAt),
    seoTitle: test.seoTitle || `${test.name} Preparation | Requirements, Format & Study Abroad Guidance | ALO Education`,
    seoDescription: test.seoDescription || `Explore current ${test.name} information and confirm requirements with official providers and institutions.`,
  };
}

/** Only current DB records with an explicit verified marker and HTTPS source are public. */
export async function getAllEnglishPrepTestsFromDB(): Promise<EnglishTest[]> {
  if (process.env.SKIP_CMS_DB === '1') return [];
  try {
    const records = await (db as any).englishPrepTest?.findMany?.({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    if (!Array.isArray(records)) return [];
    return records.filter((record: any) => hasCurrentLanguagePrepVerification(record)).map(mapVerifiedTest);
  } catch (error) {
    console.warn('DB fetch failed for EnglishPrepTest; unpublished catalogue returned.', error);
    return [];
  }
}

export async function getEnglishPrepTestBySlugFromDB(slug: string): Promise<EnglishTest | null> {
  if (process.env.SKIP_CMS_DB === '1') return null;
  try {
    const clean = slug.toLowerCase().trim();
    const test = await (db as any).englishPrepTest?.findFirst?.({
      where: { slug: clean, status: 'active' },
    });
    if (!test || !hasCurrentLanguagePrepVerification(test)) return null;
    return mapVerifiedTest(test);
  } catch (error) {
    console.warn('DB fetch failed for single EnglishPrepTest; item remains unpublished.', error);
    return null;
  }
}

export async function getModulesByTestIdFromDB(testId: string) {
  if (process.env.SKIP_CMS_DB === '1') return [];
  try {
    const modules = await (db as any).englishPrepModule?.findMany?.({
      where: { testId, status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    return Array.isArray(modules) ? modules.filter((record: any) => hasCurrentLanguagePrepSourceReview(record)) : [];
  } catch (error) {
    console.warn('DB modules fetch failed; unreviewed modules remain unpublished.', error);
    return [];
  }
}

export async function getFaqsByTestIdFromDB(testId: string) {
  if (process.env.SKIP_CMS_DB === '1') return [];
  try {
    const faqs = await (db as any).englishPrepFaq?.findMany?.({
      where: { testId, status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    return Array.isArray(faqs) ? faqs.filter((record: any) => hasCurrentLanguagePrepSourceReview(record)) : [];
  } catch (error) {
    console.warn('DB FAQ fetch failed; unreviewed FAQs remain unpublished.', error);
    return [];
  }
}

export async function getAcceptanceByTestIdFromDB(testId: string) {
  if (process.env.SKIP_CMS_DB === '1') return [];
  try {
    const acceptance = await (db as any).englishPrepAcceptance?.findMany?.({
      where: { testId, status: 'active' },
    });
    return Array.isArray(acceptance)
      ? acceptance.filter((record: any) => hasCurrentLanguagePrepSourceReview(record))
      : [];
  } catch (error) {
    console.warn('DB acceptance fetch failed; unreviewed acceptance records remain unpublished.', error);
    return [];
  }
}

export async function getSuccessStoriesFromDB(testId?: string) {
  if (process.env.SKIP_CMS_DB === '1') return [];
  try {
    const where: any = { status: 'published', consentStatus: 'approved' };
    if (testId) where.testId = testId;
    const stories = await (db as any).englishPrepSuccessStory?.findMany?.({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, studentName: true, universityName: true, courseName: true, previousScore: true, finalScore: true, testimonial: true },
    });
    return Array.isArray(stories) ? stories : [];
  } catch (error) {
    console.warn('DB success stories fetch failed; no story cards returned.', error);
    return [];
  }
}

// Course Finder connection — return only recently source-reviewed requirements.
export async function getCoursesByEnglishTest(testSlug: string, limit = 24) {
  try {
    const test = await getEnglishPrepTestBySlugFromDB(testSlug);
    if (!test) return [];
    const requirements = await db.crmCourseRequirement.findMany({
      where: {
        englishTest: { contains: test.shortName },
        verificationStatus: { in: ['VERIFIED', 'verified', 'VERIFIED_RECENT', 'verified_recent'] },
      },
      take: limit,
      select: { courseId: true, officialRequirementUrl: true, lastCheckedAt: true, verificationStatus: true },
    });
    const courseIds = requirements
      .filter((record) => hasCurrentLanguagePrepVerification({
        verificationStatus: record.verificationStatus,
        officialUrl: record.officialRequirementUrl,
        lastVerifiedAt: record.lastCheckedAt,
      }))
      .map((record) => record.courseId);
    if (courseIds.length === 0) return [];
    return db.crmCourse.findMany({
      where: { courseId: { in: courseIds }, status: 'active' },
      take: limit,
    });
  } catch (error) {
    console.warn('Course finder English filter failed', error);
    return [];
  }
}

export async function getPublishedLanguageStoryCards(): Promise<import('./types').PublishedLanguageStory[]> {
  if (process.env.SKIP_CMS_DB === '1') return [];
  const stories = await getSuccessStoriesFromDB();
  return stories.map(({ id, studentName, universityName, courseName, previousScore, finalScore, testimonial }: import('./types').PublishedLanguageStory) => ({ id, studentName, universityName, courseName, previousScore, finalScore, testimonial }));
}
