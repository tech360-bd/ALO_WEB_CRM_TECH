import { NextRequest, NextResponse } from 'next/server'
import { calculateEligibility, type StudentProfile } from '@/lib/course-finder'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseSlug, profile } = body

    if (!courseSlug) {
      return NextResponse.json(
        { error: 'courseSlug is required.' },
        { status: 400 }
      )
    }

    // NOTE: Student-specific eligibility requires authentication which is not
    // available in this sandbox. General eligibility is always available.
    // In production with auth, the session would be checked here.
    let studentProfile: StudentProfile | undefined = undefined

    // Allow frontend to pass profile data for manual/personalized check
    if (profile && typeof profile === 'object') {
      studentProfile = {
        gpa: profile.gpa,
        gpaScale: profile.gpaScale,
        englishTest: profile.englishTest,
        englishScore: profile.englishScore,
        highestDegree: profile.highestDegree,
        degreeClass: profile.degreeClass,
        workExperienceYears: profile.workExperienceYears,
        backlogs: profile.backlogs,
      }
    }

    const result = await calculateEligibility(courseSlug, studentProfile)

    return NextResponse.json({
      success: true,
      courseSlug,
      isAuthenticated: false,
      ...result,
    })
  } catch (error) {
    console.error('Eligibility check error:', error)
    return NextResponse.json(
      { error: 'Failed to check eligibility.' },
      { status: 500 }
    )
  }
}
