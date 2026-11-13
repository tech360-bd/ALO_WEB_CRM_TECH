import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (request: Request, auth: AuthContext, context: { params: Promise<{ id: string }> | { id: string } }) => {
  if (!auth.roles.some((role) => role.toLowerCase() === 'super_admin')) {
    return NextResponse.json({ success: false, error: 'Super Admin access required.' }, { status: 403 });
  }
  const search = new URL(request.url).searchParams;
  const requestedPage = Number(search.get('page') || 1);
  const requestedLimit = Number(search.get('limit') || 100);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 250) : 1;
  const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 100;
  try {
    const { id } = await context.params;
    const [batch, totalStudents, totalErrors] = await Promise.all([
      db.importBatch.findUnique({
        where: { id },
        include: {
          students: { orderBy: { rowNumber: 'asc' }, skip: (page - 1) * limit, take: limit },
          errors: { orderBy: { rowNumber: 'asc' }, skip: (page - 1) * limit, take: limit },
        },
      }),
      db.importStagingStudent.count({ where: { batchId: id } }),
      db.importError.count({ where: { batchId: id } }),
    ]);
    if (!batch) return NextResponse.json({ success: false, error: 'Batch not found.' }, { status: 404 });
    const matchedIds = [...new Set(batch.students.map((row) => row.matchedStudentId).filter(Boolean))];
    const existingStudents = matchedIds.length
      ? await db.student.findMany({
          where: { id: { in: matchedIds } },
          select: { id: true, studentId: true, name: true, email: true, phone: true, currentCountry: true },
        })
      : [];
    const existingByStagedId = Object.fromEntries(batch.students.map((row) => [
      row.id,
      existingStudents.find((student) => student.id === row.matchedStudentId) || null,
    ]));
    return NextResponse.json({
      success: true,
      batch,
      existingByStagedId,
      pagination: { page, limit, totalStudents, totalErrors, totalPages: Math.max(1, Math.ceil(totalStudents / limit)) },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Import batch could not be loaded.' }, { status: 503 });
  }
});
