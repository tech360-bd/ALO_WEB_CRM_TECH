import { NextResponse } from 'next/server'
import { getSearchFacets } from '@/lib/course-finder'

export async function GET() {
  try {
    const facets = await getSearchFacets()

    return NextResponse.json({
      success: true,
      ...facets,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Facets API error:', error)
    return NextResponse.json(
      { error: 'Failed to load filter options.' },
      { status: 500 }
    )
  }
}
