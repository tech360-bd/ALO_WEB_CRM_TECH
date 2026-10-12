import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const countries = await db.countryPage.findMany({
      where: { approvalStatus: 'PUBLISHED' },
      select: {
        slug: true,
        name: true,
        shortName: true,
        flag: true,
        _count: { select: { universities: { where: { approvalStatus: 'PUBLISHED' } } } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      {
        countries: countries.map((c) => ({
          slug: c.slug,
          name: c.name,
          shortName: c.shortName,
          flag: c.flag,
          universities: c._count.universities,
        })),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Countries list API error:', error);
    return NextResponse.json(
      { error: 'Failed to load countries' },
      { status: 500 }
    );
  }
}
