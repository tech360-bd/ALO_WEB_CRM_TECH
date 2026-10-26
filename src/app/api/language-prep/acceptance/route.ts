import { NextResponse } from 'next/server';
import { getAllEnglishPrepTestsFromDB } from '@/lib/language-prep/service';
import { reviewLanguageAcceptance } from '@/lib/language-prep/editorial';
import { ENGLISH_PREP_ACCEPTANCE } from '@/lib/language-prep/data';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const countrySlug = searchParams.get('country')?.toLowerCase() || 'uk';

    // Map country slugs to acceptance
    let acceptanceData: any[] = [];
    try {
      const { db } = await import('@/lib/db');
      const dbAcc = await (db as any).englishPrepAcceptance?.findMany?.({
        where: { countrySlug: countrySlug, status: 'active' },
      });
      if (dbAcc && dbAcc.length > 0) acceptanceData = dbAcc.map(reviewLanguageAcceptance);
      else acceptanceData = ENGLISH_PREP_ACCEPTANCE.filter(a => a.countrySlug === countrySlug || a.countrySlug === 'general');
    } catch {
      acceptanceData = ENGLISH_PREP_ACCEPTANCE.filter(a => a.countrySlug === countrySlug || a.countrySlug === 'general');
    }

    // Get all tests and filter by country acceptance
    const allTests = await getAllEnglishPrepTestsFromDB();
    
    // Build country-specific test list
    const countryTests = allTests.filter(test => {
      // For general, show all english_proficiency tests
      if (countrySlug === 'general') return test.testType === 'english_proficiency';
      // Check if test has acceptance for this country or is generally accepted
      const hasAcc = ENGLISH_PREP_ACCEPTANCE.some(a => a.testId === test.id && (a.countrySlug === countrySlug || a.countrySlug === 'general'));
      if (hasAcc) return true;
      // Fallback: for major countries, show popular tests
      if (['uk', 'canada', 'australia', 'usa', 'ireland', 'new-zealand', 'uae', 'europe'].includes(countrySlug)) {
        return ['ielts', 'ielts-ukvi', 'pte-academic', 'toefl-ibt', 'duolingo', 'oxford-ellt', 'oietc'].includes(test.slug);
      }
      return false;
    });

    // Ensure MOI is not incorrectly represented as English proficiency test — show as guidance
    const moiTest = allTests.find(t => t.slug === 'moi');

    return NextResponse.json({
      success: true,
      country: countrySlug,
      tests: countryTests,
      moiGuidance: moiTest,
      acceptanceData,
      count: countryTests.length,
      disclaimer: 'Acceptance varies by university, course and visa route. Check university-specific acceptance. Information requires verification where source not listed.',
      note: 'Destination Acceptance Explorer — interactive destination selector UK/Canada/Australia/USA/Ireland/New Zealand/Dubai/UAE/Europe — Show relevant English tests — DO NOT claim universal acceptance — Display Acceptance varies by university, course and visa route',
    });
  } catch (error: any) {
    console.error('Acceptance API error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch acceptance' }, { status: 500 });
  }
}
