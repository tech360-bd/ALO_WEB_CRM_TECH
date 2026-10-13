import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_EXAM_FIELDS = {
  slug: true,
  name: true,
  fullName: true,
  shortName: true,
  intro: true,
  description: true,
  whoShouldTake: true,
  testFormat: true,
  modules: true,
  duration: true,
  scoring: true,
  results: true,
  cost: true,
  acceptedCountries: true,
  universityAcceptance: true,
  visaRelevance: true,
  minScoreByDest: true,
  prepStrategy: true,
  listeningPrep: true,
  readingPrep: true,
  writingPrep: true,
  speakingPrep: true,
  mockTestStrategy: true,
  commonMistakes: true,
  retakeInfo: true,
  scoreValidity: true,
  registration: true,
  testDayChecklist: true,
  aloSupport: true,
  faqs: true,
  metaTitle: true,
  metaDescription: true,
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const exam = await db.examPage.findUnique({
      where: { slug },
      select: PUBLIC_EXAM_FIELDS,
    });

    if (!exam || exam.approvalStatus !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json(
      { exam },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Exam detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to load exam' },
      { status: 500 }
    );
  }
}
