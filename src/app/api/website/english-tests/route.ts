import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tests = await db.websiteEnglishTest.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, tests });
  } catch (error) {
    console.error('English tests fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch English tests' },
      { status: 500 }
    );
  }
}
