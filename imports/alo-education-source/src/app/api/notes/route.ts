import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, parsePagination, auditLog } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createNoteSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  content: z.string().min(1),
  isPinned: z.boolean().default(false),
  isConfidential: z.boolean().default(false),
  attachments: z.array(z.any()).optional().transform(v => JSON.stringify(v || [])),
});

/* ------------------------------------------------------------------ */
/*  GET — List notes with filters, pagination                             */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
  const sp = req.nextUrl.searchParams;

  // Build filters
  const filters: Record<string, unknown>[] = [];

  if (sp.get('entityType')) filters.push({ entityType: sp.get('entityType') });
  if (sp.get('entityId')) filters.push({ entityId: sp.get('entityId') });
  if (sp.get('authorId')) filters.push({ authorId: sp.get('authorId') });
  if (sp.get('isPinned') !== null) filters.push({ isPinned: sp.get('isPinned') === 'true' });

  // Confidential notes: only the author, SUPER_ADMIN, and ADMIN can see
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    filters.push({
      OR: [
        { isConfidential: false },
        { authorId: auth.user.id },
      ],
    });
  }

  const where = filters.length > 0 ? { AND: filters } : {};

  try {
    const [data, total] = await Promise.all([
      db.note.findMany({
        where,
        orderBy: { isPinned: 'desc' as const, createdAt: 'desc' as const },
        take: limit,
        skip,
      }),
      db.note.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notes.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create note with Zod validation                                  */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const noteData = await db.note.create({
      data: {
        entityType: parsed.data.entityType,
        entityId: parsed.data.entityId,
        authorId: auth.user.id,
        content: parsed.data.content,
        isPinned: parsed.data.isPinned,
        isConfidential: parsed.data.isConfidential,
        attachments: parsed.data.attachments,
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'CREATE',
      resource: 'Note',
      resourceId: noteData.id,
      details: { entityType: parsed.data.entityType, entityId: parsed.data.entityId },
    });

    return NextResponse.json({ success: true, data: noteData }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create note.' },
      { status: 500 },
    );
  }
}
