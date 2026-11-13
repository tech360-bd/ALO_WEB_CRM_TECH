import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'fullName', 'studentId', 'journeyStage']);
const ASSIGNED_STUDENT_VIEW_PERMISSIONS = new Set(['s1', 'student.view_assigned', 'students.view_assigned']);

function uniqueIds(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function boundedInteger(raw: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

export const GET = withAuth(async (request: Request, auth: AuthContext) => {
  const actorRoles = [auth.userType, ...auth.roles].map((role) => role.trim().toUpperCase());
  if (actorRoles.some((role) => ['STUDENT', 'PARTNER'].includes(role))) {
    return NextResponse.json({ success: false, error: 'Employee access is required.' }, { status: 403 });
  }

  const employee = await db.employee.findUnique({
    where: { userId: auth.userId },
    select: { id: true, userId: true, employeeId: true, status: true },
  });
  if (!employee || employee.status.toLowerCase() !== 'active') {
    return NextResponse.json({ success: false, error: 'An active employee record is required.' }, { status: 403 });
  }
  if (!auth.permissions.some((permission) => ASSIGNED_STUDENT_VIEW_PERMISSIONS.has(permission))) {
    return NextResponse.json({ success: false, error: 'Assigned-student view permission is required.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = boundedInteger(url.searchParams.get('page'), 1, 1, 1_000_000);
  const limit = boundedInteger(url.searchParams.get('limit'), 20, 1, 100);
  const requestedSort = url.searchParams.get('sortBy') || 'createdAt';
  const sortBy = ALLOWED_SORT_FIELDS.has(requestedSort) ? requestedSort : 'createdAt';
  const requestedDirection = (url.searchParams.get('sortOrder') || 'desc').toLowerCase();
  const sortOrder: 'asc' | 'desc' = requestedDirection === 'asc' ? 'asc' : 'desc';
  const search = (url.searchParams.get('search') || '').trim().slice(0, 120);
  const stage = (url.searchParams.get('stage') || '').trim().slice(0, 80);
  const country = (url.searchParams.get('country') || '').trim().slice(0, 80);
  const assignedIds = uniqueIds([employee.id, employee.userId, employee.employeeId]);
  const where: Record<string, unknown> = { counselorId: { in: assignedIds } };
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { studentId: { contains: search } },
      { preferredCountry: { contains: search } },
      { preferredSubject: { contains: search } },
    ];
  }
  if (stage) where.journeyStage = stage;
  if (country) where.preferredCountry = country;

  try {
    const [students, total] = await Promise.all([
      db.portalStudentProfile.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          studentId: true,
          fullName: true,
          preferredCountry: true,
          preferredIntake: true,
          preferredSubject: true,
          preferredLevel: true,
          journeyStage: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.portalStudentProfile.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: students,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Assigned students could not be loaded.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
});
