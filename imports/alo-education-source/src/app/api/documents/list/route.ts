import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { eventRouter, EventType } from '@/lib/ai/event-router';

/* ------------------------------------------------------------------ */
/*  Valid statuses & categories                                        */
/* ------------------------------------------------------------------ */

const VALID_STATUSES = ['PENDING', 'UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'];

const VALID_CATEGORIES = [
  'PASSPORT',
  'TRANSCRIPT',
  'DEGREE_CERTIFICATE',
  'ENGLISH_TEST',
  'PERSONAL_STATEMENT',
  'CV',
  'REFERENCE_LETTER',
  'FINANCIAL_DOCUMENT',
  'CAS_DOCUMENT',
  'VISA_DOCUMENT',
  'OFFER_LETTER',
  'OTHER',
];

/* ------------------------------------------------------------------ */
/*  GET — List application documents                                   */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};
    if (applicationId) where.applicationId = applicationId;
    if (status && VALID_STATUSES.includes(status)) where.status = status;
    if (category && VALID_CATEGORIES.includes(category)) where.category = category;

    const [documents, total] = await Promise.all([
      db.applicationDocument.findMany({
        where,
        include: {
          application: { select: { id: true, applicationId: true, university: true, course: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.applicationDocument.count({ where }),
    ]);

    return NextResponse.json({ documents, total });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create document record (metadata only)                      */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const { error: authError } = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { applicationId, category, fileName, fileSize, mimeType, notes } = body;

    if (!applicationId || typeof applicationId !== 'string') {
      return NextResponse.json({ error: 'applicationId is required.' }, { status: 400 });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 },
      );
    }
    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'fileName is required.' }, { status: 400 });
    }

    // Verify application exists
    const app = await db.application.findUnique({ where: { id: applicationId } });
    if (!app) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    const document = await db.applicationDocument.create({
      data: {
        applicationId,
        category,
        fileName: fileName.trim(),
        fileSize: typeof fileSize === 'number' ? fileSize : null,
        mimeType: typeof mimeType === 'string' ? mimeType.trim() || null : null,
        notes: typeof notes === 'string' ? notes.trim() || null : null,
        status: 'PENDING',
      },
      include: {
        application: { select: { id: true, applicationId: true, university: true, course: true } },
      },
    });

    // Fire AI event — document classification & completeness check
    eventRouter.dispatch({
      type: EventType.DOCUMENT_UPLOADED,
      entityType: 'ApplicationDocument',
      entityId: document.id,
      data: { documentId: document.id, category, fileName, studentId: app.studentId, applicationId },
    }).catch(e => console.error('[AI Event] Failed:', e));

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
