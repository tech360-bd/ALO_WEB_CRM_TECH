import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAllEnglishPrepTestsFromDB } from '@/lib/language-prep/service';
import { hasCurrentLanguagePrepSourceReview } from '@/lib/language-prep/verification';

export async function GET(req: Request) {
  try {
    const countrySlug = (new URL(req.url).searchParams.get('country') || 'uk').trim().toLowerCase();
    if (!/^[a-z0-9-]{1,50}$/.test(countrySlug)) {
      return NextResponse.json({ success: false, error: 'Invalid country filter.' }, { status: 400 });
    }

    const [records, tests] = await Promise.all([
      (db as any).englishPrepAcceptance.findMany({
        where: { countrySlug, status: 'active' },
        include: { test: { select: { name: true, slug: true } } },
        orderBy: { countryName: 'asc' },
      }),
      getAllEnglishPrepTestsFromDB(),
    ]);

    const currentAcceptance = records
      .filter((record: any) => hasCurrentLanguagePrepSourceReview(record))
      .map(({ test, ...record }: any) => ({ ...record, testName: test?.name || '', testSlug: test?.slug || '' }));
    const acceptedTestIds = new Set(currentAcceptance.map((record: any) => record.testId));
    const countryTests = tests.filter((test) => acceptedTestIds.has(test.id));
    const moiGuidance = countryTests.find((test) => test.slug === 'moi') || null;

    return NextResponse.json({
      success: true,
      country: countrySlug,
      tests: countryTests,
      moiGuidance,
      acceptanceData: currentAcceptance,
      count: countryTests.length,
      disclaimer: 'Only records with a recent source-review date and HTTPS source are returned. This site marker is not independent external verification. Confirm test acceptance and visa evidence requirements with the institution and relevant authority.',
    });
  } catch (error) {
    console.error('Acceptance API error', error);
    return NextResponse.json({ success: false, error: 'Acceptance information is temporarily unavailable.' }, { status: 503 });
  }
}
