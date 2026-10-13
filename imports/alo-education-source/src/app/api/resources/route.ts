import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_BLOG_FIELDS = {
  slug: true,
  title: true,
  category: true,
  excerpt: true,
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
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: Record<string, unknown> = { status: 'PUBLISHED' };
    if (category) {
      where.category = category;
    }

    const [resources, total, categories] = await Promise.all([
      db.blogPost.findMany({
        where,
        select: PUBLIC_BLOG_FIELDS,
        orderBy: { createdAt: 'desc' },
      }),
      db.blogPost.count({ where }),
      db.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { category: true },
        distinct: ['category'],
      }),
    ]);

    return NextResponse.json(
      {
        resources,
        total,
        categories: categories.map((c) => c.category),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Resources API error:', error);
    return NextResponse.json(
      { error: 'Failed to load resources' },
      { status: 500 }
    );
  }
}
