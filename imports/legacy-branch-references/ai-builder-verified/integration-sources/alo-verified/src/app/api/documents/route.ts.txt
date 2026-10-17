import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (studentId) where.studentId = studentId;

    const documents = await db.document.findMany({
      where,
      take: limit,
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json({ documents: [] });
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const document = await db.document.create({
      data: {
        studentId: body.studentId || null,
        documentName: body.name || body.documentName || 'Untitled',
        documentType: body.type || body.documentType || 'other',
        status: 'uploaded',
        filePath: body.fileUrl || body.filePath || null,
        fileSize: body.fileSize || null,
        mimeType: body.mimeType || null,
      } as any,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Documents POST error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
