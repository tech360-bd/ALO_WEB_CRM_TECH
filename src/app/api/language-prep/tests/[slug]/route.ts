import { NextResponse } from 'next/server';
import { getEnglishPrepTestBySlugFromDB, getModulesByTestIdFromDB, getFaqsByTestIdFromDB, getAcceptanceByTestIdFromDB, getSuccessStoriesFromDB } from '@/lib/language-prep/service';
import { ENGLISH_PREP_MODULES, ENGLISH_PREP_FAQS, ENGLISH_PREP_RESOURCES } from '@/lib/language-prep/data';
import { getTestBySlug } from '@/lib/language-prep/data';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const cleanSlug = slug.toLowerCase().trim();
    
    const test = await getEnglishPrepTestBySlugFromDB(cleanSlug);
    if (!test) {
      return NextResponse.json({ success: false, error: 'Test not found — Check /language-prep for available tests' }, { status: 404 });
    }

    // Get related data with DB fallback
    const modules = await getModulesByTestIdFromDB(test.id, test.slug);
    const faqs = await getFaqsByTestIdFromDB(test.id, test.slug);
    const acceptance = await getAcceptanceByTestIdFromDB(test.id);
    const successStories = await getSuccessStoriesFromDB(test.id);
    
    // Resources — try DB, fallback to hardcoded
    let resources: any[] = [];
    try {
      const { db } = await import('@/lib/db');
      const dbResources = await (db as any).englishPrepResource?.findMany?.({
        where: { testId: test.id, status: 'active' },
        orderBy: { sortOrder: 'asc' },
      });
      if (dbResources && dbResources.length > 0) resources = dbResources;
      else resources = ENGLISH_PREP_RESOURCES.filter(r => r.testId === test.id);
    } catch {
      resources = ENGLISH_PREP_RESOURCES.filter(r => r.testId === test.id);
    }

    // If modules empty, use hardcoded by slug
    const finalModules = modules.length > 0 ? modules : (ENGLISH_PREP_MODULES[test.slug] || []);
    const finalFaqs = faqs.length > 0 ? faqs : ENGLISH_PREP_FAQS.filter(f => f.testId === test.id);

    return NextResponse.json({
      success: true,
      test,
      modules: finalModules,
      faqs: finalFaqs,
      acceptance,
      resources,
      successStories,
      seo: {
        title: test.seoTitle,
        description: test.seoDescription,
        canonical: `https://aloeducation.com/language-prep/${test.slug}`,
      },
      verification: {
        sourceUrl: test.sourceUrl,
        sourceName: test.sourceName,
        verifiedBy: test.verifiedBy,
        lastVerifiedAt: test.lastVerifiedAt,
        verificationStatus: test.verificationStatus,
        note: 'Every factual test information should support source_url, source_name, last_verified_at — If not verified, display Check official provider information — No fake content',
      },
      note: 'MOI Guidance is guidance resource, not incorrectly represented as English proficiency test — Acceptance varies by university, course and visa route — No fake testimonials/scores/acceptance/visa claims/pricing/result timelines',
    });
  } catch (error: any) {
    console.error('Language prep test detail API error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch test detail' }, { status: 500 });
  }
}
