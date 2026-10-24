import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (_request: Request, auth: AuthContext, context: { params: Promise<{ id: string }> | { id: string } }) => {
  if (!auth.roles.some((role) => role.toLowerCase() === 'super_admin')) {
    return NextResponse.json({ success: false, error: 'Super Admin access required.' }, { status: 403 });
  }
  try {
    const { id } = await context.params;
    const batch = await db.importBatch.findUnique({ where: { id }, include: { students: true, errors: true } });
    if (!batch) return NextResponse.json({ success: false, error: 'Batch not found.' }, { status: 404 });

    const duplicateRows = batch.students.filter((row) => row.duplicateRiskLevel !== 'none');
    const missingRequired = batch.students.filter((row) => row.status === 'needs_information');
    const previewMatches = await Promise.all(duplicateRows.map(async (staged) => ({
      stagedStudent: staged,
      existingStudent: staged.matchedStudentId
        ? await db.student.findUnique({
            where: { id: staged.matchedStudentId },
            select: { id: true, studentId: true, name: true, email: true, phone: true, currentCountry: true },
          }).catch(() => null)
        : null,
    })));

    return NextResponse.json({
      success: true,
      preview: {
        totalRows: batch.totalRows,
        newCount: batch.newCount,
        matchedCount: batch.matchedCount,
        duplicateCount: batch.duplicateCount,
        errorCount: batch.errorCount,
        stagedStudentsSample: batch.students.slice(0, 100),
        duplicateMatches: previewMatches,
        missingRequiredFields: missingRequired.map((row) => ({ rowNumber: row.rowNumber, studentName: row.studentName, errorDetails: row.errorDetails })),
        importErrors: batch.errors,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Import preview could not be loaded.' }, { status: 503 });
  }
});
