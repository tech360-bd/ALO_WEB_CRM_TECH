import { NextResponse } from 'next/server';
import { getAllEnglishPrepTestsFromDB } from '@/lib/language-prep/service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slugsParam = searchParams.get('tests'); // comma separated
    let tests = await getAllEnglishPrepTestsFromDB();

    if (slugsParam) {
      const requested = slugsParam.split(',').map(s => s.trim().toLowerCase());
      tests = tests.filter(t => requested.includes(t.slug));
    }

    // Build comparison data — no fake claims, only verified fields or "Check current provider information"
    const comparison = tests.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      shortName: t.shortName,
      provider: t.provider,
      duration: t.durationDisplay || 'Check current provider information',
      format: t.format || 'Check current provider information',
      scoring: t.scoringSystem || 'See official test provider guidance',
      resultTimeline: t.resultTimeline || 'Check current provider information',
      cost: t.costSummary || 'Check current provider information',
      validity: t.validitySummary || 'Check official provider',
      bestFor: t.bestFor || 'Check university-specific acceptance',
      acceptance: t.acceptanceSummary || 'Acceptance varies by university, course and visa route',
      officialUrl: t.officialUrl,
      sourceUrl: t.sourceUrl,
      lastVerifiedAt: t.lastVerifiedAt,
      isPopular: t.isPopular,
      testType: t.testType,
    }));

    return NextResponse.json({
      success: true,
      comparison,
      count: comparison.length,
      columns: ['Test', 'Duration', 'Format', 'Scoring', 'Typical Result Timeline', 'Acceptance', 'Best For', 'Preparation Style'],
      note: 'Desktop: Full comparison table. Mobile: Scrollable cards. No fake data — Check current provider information where not verified — Acceptance varies by university, course and visa route',
    });
  } catch (error: any) {
    console.error('Comparison API error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch comparison' }, { status: 500 });
  }
}
