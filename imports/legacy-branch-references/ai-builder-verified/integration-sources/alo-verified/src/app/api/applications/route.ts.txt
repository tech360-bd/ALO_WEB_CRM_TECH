import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { counselorScope } from '@/lib/auth-rbac';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const studentId = searchParams.get('studentId') || '';
    const universityId = searchParams.get('universityId') || '';
    const partnerId = searchParams.get('partnerId') || '';
    const counselorId = searchParams.get('counselorId') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { applicationId: { contains: search } },
        { student: { firstName: { contains: search } } },
        { student: { lastName: { contains: search } } },
        { university: { name: { contains: search } } },
      ];
    }
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (universityId) where.universityId = universityId;
    if (partnerId) where.partnerId = partnerId;
    if (counselorId) where.counselorId = counselorId;

    // ── RBAC scoping ──────────────────────────────────────────────────
    // counselorScope returns non-null for counselor/junior_counselor roles.
    // Application.counselorId stores Employee.id (= auth.user.referenceId).
    // Partner users see only applications sourced through their partnerId.
    // Student users see only their own applications.
    const scope = counselorScope(auth);
    if (scope?.assignedCounselor) {
      where.counselorId = auth.user.referenceId;
    } else if (auth.user.userType === 'partner') {
      where.partnerId = auth.user.referenceId;
    } else if (auth.user.userType === 'student') {
      where.studentId = auth.user.referenceId;
    }

    const [applications, total] = await Promise.all([
      db.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentId: true, email: true, phone: true } },
          university: { select: { id: true, name: true, country: true, city: true } },
          course: { select: { id: true, name: true, level: true, tuitionFee: true } },
          partner: { select: { id: true, companyName: true, partnerId: true } },
          counselor: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
          statusHistory: { take: 5, orderBy: { changedAt: 'desc' } },
        }
      }),
      db.application.count({ where })
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Applications GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    if (!body.studentId || !body.universityId) {
      return NextResponse.json(
        { error: 'Student ID and University ID are required' },
        { status: 400 }
      );
    }

    // Generate application ID
    const lastApp = await db.application.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { applicationId: true }
    });
    let nextNum = 1;
    if (lastApp?.applicationId) {
      const parts = lastApp.applicationId.split('-');
      if (parts.length >= 2) {
        nextNum = parseInt(parts[parts.length - 1]) + 1;
      }
    }
    const applicationId = `APP-${new Date().getFullYear()}${nextNum.toString().padStart(4, '0')}`;

    const application = await db.application.create({
      data: {
        applicationId,
        studentId: body.studentId,
        universityId: body.universityId,
        courseId: body.courseId || null,
        partnerId: body.partnerId || null,
        counselorId: body.counselorId || null,
        source: body.source || 'DIRECT',
        communicationMode: body.communicationMode || 'DIRECT',
        intake: body.intake || null,
        applicationDate: new Date(),
        status: body.status || 'draft',
        notes: body.notes || null,
      },
      include: {
        student: true,
        university: true,
        course: true,
        partner: true,
        counselor: true,
      }
    });

    // Create initial status history
    await db.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        fromStatus: null,
        toStatus: application.status,
        changedBy: body.changedBy || null,
        note: 'Application created',
      }
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('Applications POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
