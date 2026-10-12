import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const PUBLIC_SERVICE_FIELDS = {
  title: true,
  slug: true,
  icon: true,
  shortDescription: true,
  description: true,
  heroImage: true,
  content: true,
  eligibility: true,
  requirements: true,
  documents: true,
  faqEnabled: true,
  ctaLabel: true,
  ctaUrl: true,
  sortOrder: true,
};

export async function GET() {
  try {
    const services = await db.service.findMany({
      where: { status: 'PUBLISHED' },
      select: PUBLIC_SERVICE_FIELDS,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(
      { services },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Services API error:', error);
    return NextResponse.json(
      { error: 'Failed to load services' },
      { status: 500 }
    );
  }
}
