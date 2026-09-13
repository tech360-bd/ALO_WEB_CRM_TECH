import { NextResponse } from 'next/server';
import { getAllEnglishPrepTestsFromDB } from '@/lib/language-prep/service';

export async function GET() {
  try {
    const tests = await getAllEnglishPrepTestsFromDB();
    return NextResponse.json({
      success: true,
      tests,
      count: tests.length,
      note: 'Real DB or verified fallback — no fake pricing/result time — Check current provider information where not verified — Acceptance varies by university, course and visa route',
    });
  } catch (error: any) {
    console.error('Language prep tests API error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tests' }, { status: 500 });
  }
}
