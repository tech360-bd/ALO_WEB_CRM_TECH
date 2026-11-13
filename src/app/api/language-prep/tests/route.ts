import { NextResponse } from 'next/server';
import { getAllEnglishPrepTestsFromDB } from '@/lib/language-prep/service';

export async function GET() {
  try {
    const tests = await getAllEnglishPrepTestsFromDB();
    return NextResponse.json({
      success: true,
      tests,
      count: tests.length,
      note: 'Only active database records with a recent verified marker and HTTPS source are returned. This code-level gate is not independent external verification.',
    });
  } catch (error) {
    console.error('Language prep tests API error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tests' }, { status: 500 });
  }
}
