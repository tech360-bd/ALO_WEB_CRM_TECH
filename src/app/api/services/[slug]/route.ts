import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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
  status: true,
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const service = await db.service.findUnique({
      where: { slug },
      select: PUBLIC_SERVICE_FIELDS,
    });

    if (!service || service.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(
      { service },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Service detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to load service' },
      { status: 500 }
    );
  }
}
