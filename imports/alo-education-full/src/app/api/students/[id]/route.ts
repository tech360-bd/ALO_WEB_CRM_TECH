import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth as requireAuthApi, requireRole } from '@/lib/api-auth';
import { requireAuth, requirePermission, isErrorResponse, auditLog } from '@/lib/access-control';

// ─── GET: Get student by ID ─────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiAuth = await requireRole(req, ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'APPLICATION_TEAM', 'VISA_TEAM', 'FINANCE', 'BRANCH_MANAGER', 'FRONT_DESK', 'STUDENT']);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    // Students can only view their own record, or staff with students.view_all
    if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
      if (auth.user.role === 'STUDENT') {
        const student = await db.student.findFirst({ where: { email: auth.user.email } });
        if (!student || student.id !== id) {
          return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 });
        }
      } else {
        const perm = await requirePermission(req, 'students.view_all');
        if (isErrorResponse(perm)) return perm;
      }
    }

    const student = await db.student.findUnique({
      where: { id },
      include: {
        academicRecords: { orderBy: { createdAt: 'desc' } },
        englishScores: { orderBy: { createdAt: 'desc' } },
        timelineEvents: { orderBy: { createdAt: 'desc' } },
        applications: {
          include: {
            documents: true,
            emails: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found.' }, { status: 404 });
    }

    // Get offers, visa records, and payments for the student's applications
    const applicationIds = student.applications.map(a => a.id);
    const [offers, visaRecords, payments] = await Promise.all([
      applicationIds.length > 0 ? db.offer.findMany({ where: { applicationId: { in: applicationIds } } }) : [],
      applicationIds.length > 0 ? db.visaApplication.findMany({ where: { studentId: id } }) : [],
      db.payment.findMany({ where: { studentId: id }, include: { invoices: true }, orderBy: { createdAt: 'desc' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { ...student, offers, visaRecords, payments },
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch student.' }, { status: 500 });
  }
}

// ─── PATCH: Update student ───────────────────────────────────

const updateStudentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  mobile: z.string().optional(),
  nationality: z.string().optional(),
  studyDestination: z.string().optional(),
  programTitle: z.string().optional(),
  studyLevel: z.string().optional(),
  studyArea: z.string().optional(),
  intake: z.string().optional(),
  status: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiAuth = await requireRole(req, ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'APPLICATION_TEAM', 'STUDENT']);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    // Permission check: own or students.update_all
    if (auth.user.role === 'STUDENT') {
      const student = await db.student.findFirst({ where: { email: auth.user.email } });
      if (!student || student.id !== id) {
        return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 });
      }
      // Students cannot update their own status
      const body = await req.json();
      if (body.status !== undefined) {
        return NextResponse.json({ success: false, error: 'Cannot update own status.' }, { status: 403 });
      }
    } else {
      const perm = await requirePermission(req, 'students.update_all');
      if (isErrorResponse(perm)) return perm;
    }

    const existing = await db.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Student not found.' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateStudentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.firstName || parsed.data.lastName) {
      const first = parsed.data.firstName || existing.firstName;
      const last = parsed.data.lastName || existing.lastName;
      updateData.firstName = first;
      updateData.lastName = last;
      updateData.fullName = `${first} ${last}`;
    }
    if (parsed.data.mobile !== undefined) updateData.mobile = parsed.data.mobile;
    if (parsed.data.nationality !== undefined) updateData.nationality = parsed.data.nationality;
    if (parsed.data.studyDestination !== undefined) updateData.studyDestination = parsed.data.studyDestination;
    if (parsed.data.programTitle !== undefined) updateData.programTitle = parsed.data.programTitle;
    if (parsed.data.studyLevel !== undefined) updateData.studyLevel = parsed.data.studyLevel;
    if (parsed.data.studyArea !== undefined) updateData.studyArea = parsed.data.studyArea;
    if (parsed.data.intake !== undefined) updateData.intake = parsed.data.intake;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

    const student = await db.student.update({
      where: { id },
      data: updateData,
    });

    await auditLog({
      userId: auth.user.id,
      action: 'STUDENT_UPDATE',
      resource: 'Student',
      resourceId: id,
      details: parsed.data,
    });

    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ success: false, error: 'Failed to update student.' }, { status: 500 });
  }
}
