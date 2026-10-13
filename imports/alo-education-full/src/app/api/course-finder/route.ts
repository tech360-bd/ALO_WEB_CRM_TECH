import { NextRequest, NextResponse } from 'next/server'
import { searchCourses, searchUniversities } from '@/lib/course-finder'

type SearchMode = 'courses' | 'universities'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode, country, course, subject, level, duration, intake, university, keyword, page, limit } = body

    // "course" is an alias for "subject" from some frontends
    const effectiveSubject = subject || course

    const searchMode: SearchMode = mode === 'universities' ? 'universities' : 'courses'

    if (searchMode === 'courses') {
      // Country + subject minimum required
      if (!country && !effectiveSubject) {
        return NextResponse.json(
          { error: 'At least one of country or subject is required for course search.' },
          { status: 400 }
        )
      }

      const results = await searchCourses({
        country,
        subject: effectiveSubject,
        level,
        duration,
        intake,
        university,
        keyword,
        page: page || 1,
        limit: limit || 12,
      })

      return NextResponse.json({
        success: true,
        mode: 'courses',
        ...results,
      })
    }

    // University search
    const results = await searchUniversities({
      country,
      name: keyword,
      studyLevel: level,
      subject: effectiveSubject,
      page: page || 1,
      limit: limit || 12,
    })

    return NextResponse.json({
      success: true,
      mode: 'universities',
      ...results,
    })
  } catch (error) {
    console.error('Course Finder search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search. Please try again.' },
      { status: 500 }
    )
  }
}
