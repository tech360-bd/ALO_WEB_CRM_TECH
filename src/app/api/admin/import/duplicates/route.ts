import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export const GET = withAuth(async (request: Request, auth: AuthContext) => {
  if (!auth.roles.some((role) => role.toLowerCase() === 'super_admin')) {
    return NextResponse.json({ success: false, error: 'Super Admin access required.' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batchId');
  const level = searchParams.get('level');
  if (level && !['none', 'low', 'medium', 'high'].includes(level)) {
    return NextResponse.json({ success: false, error: 'Unsupported duplicate risk level.' }, { status: 400 });
  }
  const requestedPage = Number(searchParams.get('page') || 1);
  const requestedLimit = Number(searchParams.get('limit') || 100);
  const maximumPage = batchId ? 250 : 10_000;
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, maximumPage) : 1;
  const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 100;
  const where: any = {};
  if (batchId) where.batchId = batchId;
  where.duplicateRiskLevel = level || { not: 'none' };
  try {
    const [rows, total] = await Promise.all([
      db.importStagingStudent.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: [{ rowNumber: 'asc' }, { createdAt: 'asc' }] }),
      db.importStagingStudent.count({ where }),
    ]);
    const enriched = await Promise.all(rows.map(async (staged) => {
      const existing = staged.matchedStudentId
        ? await db.student.findUnique({
            where: { id: staged.matchedStudentId },
            select: { id: true, studentId: true, name: true, email: true, phone: true, currentCountry: true, status: true, updatedAt: true },
          }).catch(() => null)
        : null;
      return { staged, existing };
    }));
    return NextResponse.json({ success: true, duplicates: enriched, total, pagination: { page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch {
    return NextResponse.json({ success: false, error: 'Duplicate review data could not be loaded.' }, { status: 503 });
  }
});
