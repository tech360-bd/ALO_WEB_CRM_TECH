import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const resource = await db.blogPost.findUnique({
      where: { slug },
      select: {
        slug: true,
        title: true,
        category: true,
        excerpt: true,
        content: true,
        heroImage: true,
        author: true,
        readingTime: true,
        keyTakeaways: true,
        whoAppliesTo: true,
        requirements: true,
        stepByStep: true,
        documents: true,
        timeline: true,
        fees: true,
        importantDates: true,
        commonMistakes: true,
        aloGuidance: true,
        officialSources: true,
        metaTitle: true,
        metaDescription: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!resource || resource.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json(
      { resource },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Resource detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to load resource' },
      { status: 500 }
    );
  }
}
