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
    const q = searchParams.get('q')?.trim()

    if (!q) {
      return NextResponse.json({ students: [] })
    }

    const students = await db.student.findMany({
      where: {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { fullName: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        email: true,
        mobile: true,
        studyDestination: true,
        status: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error('[communication/students] Error:', error)
    return NextResponse.json({ error: 'Failed to search students' }, { status: 500 })
  }
}
