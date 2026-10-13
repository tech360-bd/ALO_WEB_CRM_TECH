import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  try {
    const { country } = await params

    const guide = await db.countryEducationGuide.findUnique({
      where: { countrySlug: country },
      include: {
        steps: {
          where: { isPublished: true },
          orderBy: { stepNumber: 'asc' },
        },
      },
    })

    if (!guide || !guide.isPublished) {
      return NextResponse.json(
        { error: `Education guide for '${country}' is not available.` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      guide: {
        countrySlug: guide.countrySlug,
        title: guide.title,
        slug: guide.slug,
        shortDescription: guide.shortDescription,
        heroImage: guide.heroImage,
        version: guide.version,
        steps: guide.steps.map((s) => ({
          stepNumber: s.stepNumber,
          title: s.title,
          description: s.description,
          requirements: s.requirements,
          documents: s.documents,
          timeline: s.timeline,
          tips: s.tips,
          officialLinks: s.officialLinks,
          image: s.image,
        })),
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    })
  } catch (error) {
    console.error('Country guide API error:', error)
    return NextResponse.json(
      { error: 'Failed to load country guide.' },
      { status: 500 }
    )
  }
}
