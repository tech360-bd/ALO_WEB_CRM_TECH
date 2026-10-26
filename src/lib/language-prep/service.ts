import { applyReviewedFacts, reviewedModules, reviewLanguageFaq, reviewLanguageAcceptance } from './editorial';
import { db } from '@/lib/db';
import { ENGLISH_PREP_TESTS, ENGLISH_PREP_MODULES, ENGLISH_PREP_FAQS, ENGLISH_PREP_ACCEPTANCE, ENGLISH_PREP_RESOURCES, getTestBySlug as getHardcodedTest } from './data';
import { EnglishTest } from './types';

// Service to fetch English prep tests from DB with fallback to hardcoded data
// Ensures no fake content — only verified data or "Check current provider information"

export async function getAllEnglishPrepTestsFromDB(): Promise<EnglishTest[]> {
  if (process.env.SKIP_CMS_DB === '1') return ENGLISH_PREP_TESTS;
  try {
    const tests = await (db as any).englishPrepTest?.findMany?.({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    if (tests && tests.length > 0) {
      return tests.map((t: any) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        shortName: t.shortName || t.name,
        shortDescription: t.shortDescription || '',
        longDescription: t.longDescription || '',
        testType: t.testType || 'english_proficiency',
        provider: t.provider || '',
        logo: t.logo || '',
        icon: t.icon || '',
        officialUrl: t.officialUrl || '',
        format: t.format || 'Check current provider information',
        durationMinutes: t.durationMinutes || 0,
        durationDisplay: t.durationDisplay || 'Check current provider information',
        scoringSystem: t.scoringSystem || 'Check official provider information',
        resultTimeline: t.resultTimeline || 'Check current provider information',
        costSummary: t.costSummary || 'Check current provider information',
        validitySummary: t.validitySummary || 'Check official provider',
        bestFor: t.bestFor || '',
        acceptanceSummary: t.acceptanceSummary || 'Acceptance varies by university, course and visa route',
        difficultyLevel: t.difficultyLevel || '',
        status: t.status || 'active',
        isPopular: t.isPopular || false,
        isFeatured: t.isFeatured || false,
        sortOrder: t.sortOrder || 0,
        sourceUrl: t.sourceUrl || '',
        sourceName: t.sourceName || '',
        verifiedBy: t.verifiedBy || 'ALO Compliance Team',
        verificationStatus: t.verificationStatus || 'pending',
        lastVerifiedAt: t.lastVerifiedAt ? new Date(t.lastVerifiedAt).toISOString().split('T')[0] : undefined,
        seoTitle: t.seoTitle || `${t.name} Preparation | Requirements, Format & Study Abroad Guidance | ALO Education`,
        seoDescription: t.seoDescription || `Prepare for ${t.name} with expert guidance from ALO Education.`,
      })).map(applyReviewedFacts);
    }
  } catch (e) {
    console.warn('DB fetch failed for EnglishPrepTest, using hardcoded fallback', e);
  }
  // Fallback to hardcoded verified data
  return ENGLISH_PREP_TESTS;
}

export async function getEnglishPrepTestBySlugFromDB(slug: string): Promise<EnglishTest | null> {
  if (process.env.SKIP_CMS_DB === '1') return getHardcodedTest(slug) || null;
  try {
    const clean = slug.toLowerCase().trim();
    const test = await (db as any).englishPrepTest?.findFirst?.({
      where: { slug: clean, status: 'active' },
    });
    if (test) {
      return applyReviewedFacts({
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
        isPopular: test.isPopular || false,
        isFeatured: test.isFeatured || false,
        sortOrder: test.sortOrder || 0,
        sourceUrl: test.sourceUrl || '',
        sourceName: test.sourceName || '',
        verifiedBy: test.verifiedBy || 'ALO Compliance Team',
        verificationStatus: test.verificationStatus || 'pending',
        lastVerifiedAt: test.lastVerifiedAt ? new Date(test.lastVerifiedAt).toISOString().split('T')[0] : undefined,
        seoTitle: test.seoTitle || `${test.name} Preparation | Requirements, Format & Study Abroad Guidance | ALO Education`,
        seoDescription: test.seoDescription || `Prepare for ${test.name} with expert guidance from ALO Education.`,
      });
    }
  } catch (e) {
    console.warn('DB fetch failed for single test', e);
  }
  return getHardcodedTest(slug) || null;
}

export async function getModulesByTestIdFromDB(testId: string, slug?: string, lastReviewedAt?: string) {
  const current = slug ? reviewedModules(slug, testId, lastReviewedAt) : null;
  if (current) return current;
  try {
    const modules = await (db as any).englishPrepModule?.findMany?.({
      where: { testId, status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    if (modules && modules.length > 0) return modules;
  } catch (e) {
    console.warn('DB modules fetch failed', e);
  }
  // Fallback to hardcoded
  if (slug) {
    return ENGLISH_PREP_MODULES[slug] || [];
  }
  return [];
}

export async function getFaqsByTestIdFromDB(testId: string, slug?: string) {
  try {
    const faqs = await (db as any).englishPrepFaq?.findMany?.({
      where: { testId, status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    if (faqs && faqs.length > 0) return faqs.map((faq: { question: string; answer: string }) => reviewLanguageFaq(faq, slug));
  } catch (e) {
    console.warn('DB faqs fetch failed', e);
  }
  if (slug) {
    const hardcoded = ENGLISH_PREP_FAQS.filter(f => f.testId === testId);
    if (hardcoded.length > 0) return hardcoded;
  }
  return [];
}

export async function getAcceptanceByTestIdFromDB(testId: string) {
  try {
    const acc = await (db as any).englishPrepAcceptance?.findMany?.({
      where: { testId, status: 'active' },
    });
    if (acc && acc.length > 0) return acc.map(reviewLanguageAcceptance);
  } catch (e) {
    console.warn('DB acceptance fetch failed', e);
  }
  return ENGLISH_PREP_ACCEPTANCE.filter(a => a.testId === testId);
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
    if (stories && stories.length > 0) return stories;
  } catch (e) {
    console.warn('DB success stories fetch failed', e);
  }
  // No fake stories — return empty, UI will show "Student success stories will appear here after approved publication."
  return [];
}

// Course Finder connection — filter courses by English requirement
export async function getCoursesByEnglishTest(testSlug: string, limit = 24) {
  try {
    const test = getHardcodedTest(testSlug);
    if (!test) return [];
    // Search in CrmCourseRequirement for englishTest containing test name
    const reqs = await db.crmCourseRequirement.findMany({
      where: {
        englishTest: { contains: test.shortName },
      },
      take: limit,
      select: { courseId: true },
    });
    const courseIds = reqs.map(r => r.courseId);
    if (courseIds.length === 0) return [];
    const courses = await db.crmCourse.findMany({
      where: { courseId: { in: courseIds }, status: 'active' },
      take: limit,
    });
    return courses;
  } catch (e) {
    console.warn('Course finder English filter failed', e);
    return [];
  }
}

export async function getPublishedLanguageStoryCards(): Promise<import('./types').PublishedLanguageStory[]> {
  if (process.env.SKIP_CMS_DB === '1') return [];
  const stories = await getSuccessStoriesFromDB();
  return stories.map(({ id, studentName, universityName, courseName, previousScore, finalScore, testimonial }: import('./types').PublishedLanguageStory) => ({ id, studentName, universityName, courseName, previousScore, finalScore, testimonial }));
}
