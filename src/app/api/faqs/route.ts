import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const faqs = await db.homepageFaq.findMany({
      where: { status: 'ACTIVE' },
      select: {
        question: true,
        answer: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(
      { faqs },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('FAQs API error:', error);
    return NextResponse.json(
      { error: 'Failed to load FAQs' },
      { status: 500 }
    );
  }
}
