import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { countryId, studyLevel, subject, intake, budget, source } = body;

    const searchLog = await db.searchLog.create({
      data: {
        countryId: countryId || null,
        studyLevel: studyLevel || '',
        subject: subject || '',
        intake: intake || '',
        budget: budget || '',
        source: source || 'homepage',
      },
    });

    return NextResponse.json({
      success: true,
      searchLogId: searchLog.id,
    });
  } catch (error) {
    console.error('Search log creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log search' },
      { status: 500 }
    );
  }
}
