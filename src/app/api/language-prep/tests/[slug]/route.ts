import { NextResponse } from 'next/server';
import { getEnglishPrepTestBySlugFromDB, getModulesByTestIdFromDB, getFaqsByTestIdFromDB, getAcceptanceByTestIdFromDB, getSuccessStoriesFromDB } from '@/lib/language-prep/service';

function isSafeResource(record: any): boolean {
  const url = typeof record?.resourceUrl === 'string' ? record.resourceUrl.trim() : '';
  if (!url) return false;
  if (record.isExternal) {
    try { return new URL(url).protocol === 'https:'; } catch { return false; }
  }
  return url.startsWith('/') && !url.startsWith('//');
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const cleanSlug = slug.toLowerCase().trim();
    const test = await getEnglishPrepTestBySlugFromDB(cleanSlug);
    if (!test) {
      return NextResponse.json({ success: false, error: 'Test not found or not currently source-verified.' }, { status: 404 });
    }

    const [modules, faqs, acceptance, successStories] = await Promise.all([
      getModulesByTestIdFromDB(test.id),
      getFaqsByTestIdFromDB(test.id),
      getAcceptanceByTestIdFromDB(test.id),
      getSuccessStoriesFromDB(test.id),
    ]);

    let resources: any[] = [];
    try {
      const { db } = await import('@/lib/db');
      const records = await (db as any).englishPrepResource?.findMany?.({
        where: { testId: test.id, status: 'active' },
        orderBy: { sortOrder: 'asc' },
      });
      resources = Array.isArray(records) ? records.filter(isSafeResource) : [];
    } catch (error) {
      console.warn('Language-prep resources unavailable; no resource fallback is published.', error);
    }

    return NextResponse.json({
      success: true,
      test,
      modules,
      faqs,
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
        note: 'A recent site review marker and HTTPS source are required for publication; this code-level gate is not independent external verification.',
      },
      note: 'Acceptance, fees, formats and result timelines can change. Confirm current details with the official provider, receiving institution and relevant authority.',
    });
  } catch (error) {
    console.error('Language prep test detail API error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch test detail' }, { status: 500 });
  }
}
