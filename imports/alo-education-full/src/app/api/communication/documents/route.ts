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
    const applicationId = searchParams.get('applicationId')?.trim()

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 })
    }

    const documents = await db.applicationDocument.findMany({
      where: { applicationId },
      orderBy: [
        { status: 'asc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('[communication/documents] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}
