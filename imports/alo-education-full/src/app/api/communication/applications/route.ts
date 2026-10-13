import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')?.trim()

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    // studentId param is Student.id (cuid), query Application directly
    const applications = await db.application.findMany({
      where: { studentId },
      select: {
        applicationId: true,
        university: true,
        course: true,
        country: true,
        intake: true,
        studyLevel: true,
        stage: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (applications.length === 0) {
      return NextResponse.json({ applications: [] })
    }

    const applicationIds = applications.map((a) => a.applicationId)

    // Subquery: count documents by status for each application
    const docCounts = await db.applicationDocument.groupBy({
      by: ['applicationId', 'status'],
      where: { applicationId: { in: applicationIds } },
      _count: { status: true },
    })

    // Build a lookup: applicationId -> { MISSING: n, VERIFIED: n, PENDING_REVIEW: n }
    const countsMap: Record<string, Record<string, number>> = {}
    for (const row of docCounts) {
      if (!countsMap[row.applicationId]) countsMap[row.applicationId] = {}
      countsMap[row.applicationId][row.status] = row._count.status
    }

    const result = applications.map((app) => {
      const counts = countsMap[app.applicationId] || {}
      return {
        applicationId: app.applicationId,
        university: app.university,
        course: app.course,
        country: app.country,
        intake: app.intake,
        studyLevel: app.studyLevel,
        stage: app.stage,
        totalDocs: (counts['MISSING'] || 0) + (counts['VERIFIED'] || 0) + (counts['PENDING_REVIEW'] || 0),
        missingDocs: counts['MISSING'] || 0,
        verifiedDocs: counts['VERIFIED'] || 0,
      }
    })

    return NextResponse.json({ applications: result })
  } catch (error) {
    console.error('[communication/applications] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}
