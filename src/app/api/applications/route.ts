import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { logAuditAction } from '@/lib/auth-middleware';
import { logStudentEvent } from '@/lib/student-auth';
import { canViewB2B, canViewB2BCommission, stripB2BFields, mapStageToSafeStatus, APPLICATION_SOURCES } from '@/lib/application-manager/service';

export async function GET(req: Request) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const source = searchParams.get('source');
  const country = searchParams.get('country');
  const university = searchParams.get('university');
  const course = searchParams.get('course');
  const intake = searchParams.get('intake');
  const counselorId = searchParams.get('counselorId');
  const officerId = searchParams.get('officerId');
  const documentStatus = searchParams.get('documentStatus');
  const offerStatus = searchParams.get('offerStatus');
  const casStatus = searchParams.get('casStatus');
  const deadlineFilter = searchParams.get('deadline');
  const urgent = searchParams.get('urgent');
  const confidential = searchParams.get('confidential');
  const sla = searchParams.get('sla');
  const status = searchParams.get('status');
  const stage = searchParams.get('stage');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const skip = (page - 1) * limit;

  let where: any = {};

  // Ownership / visibility filtering
  if (authRes.type === 'student') {
    where.studentId = authRes.data.studentId;
  } else {
    const portal = authRes.data;
    const roles = portal.roles || [];
    const isSuper = roles.includes('super_admin') || roles.includes('admin') || roles.includes('application_manager') || roles.includes('application_team');
    if (!isSuper) {
      if (portal.userType === 'partner' || roles.includes('partner')) {
        where.partnerId = portal.userId;
      } else if (portal.userType === 'counselor' || roles.includes('counselor')) {
        where.counselorId = portal.userId;
      } else if (roles.includes('visa_officer')) {
        // visa officer can see only VISA_HANDOVER_READY and beyond
        where.stage = { in: ['VISA_HANDOVER_READY', 'VISA_FILE_CREATED', 'VISA_PREPARATION', 'CAS_RECEIVED', 'I20_RECEIVED', 'COE_RECEIVED'] };
      }
    }
  }

  // Filters
  if (source) where.applicationSource = source;
  if (country) where.country = { contains: country, mode: 'insensitive' };
  if (university) where.universityName = { contains: university, mode: 'insensitive' };
  if (course) where.courseName = { contains: course, mode: 'insensitive' };
  if (intake) where.intake = { contains: intake, mode: 'insensitive' };
  if (counselorId) where.counselorId = counselorId;
  if (officerId) where.appTeamOfficerId = officerId;
  if (documentStatus) where.documentStatus = documentStatus;
  if (offerStatus) where.offerStatus = offerStatus;
  if (casStatus) where.casI20CoeStatus = casStatus;
  if (status) where.safeStatus = status;
  if (stage) where.stage = stage;
  if (sla) where.slaStatus = sla;
  if (confidential === 'true') where.isB2bConfidential = true;
  if (urgent === 'true') {
    where.deadlineDate = { lte: new Date(Date.now() + 3 * 86400000) };
  }
  if (deadlineFilter) {
    if (deadlineFilter === 'OVERDUE') where.deadlineDate = { lt: new Date() };
    if (deadlineFilter === 'DUE_TODAY') {
      const today = new Date();
      today.setHours(0,0,0,0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate()+1);
      where.deadlineDate = { gte: today, lt: tomorrow };
    }
  }
  if (search) {
    where.OR = [
      { applicationCode: { contains: search, mode: 'insensitive' } },
      { studentId: { contains: search, mode: 'insensitive' } },
      { universityName: { contains: search, mode: 'insensitive' } },
      { courseName: { contains: search, mode: 'insensitive' } },
      { country: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const [applications, total] = await Promise.all([
      db.application.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          b2bApplications: { include: { b2bProvider: true } },
          deadlines: { where: { status: { not: 'COMPLETED' } }, orderBy: { deadlineDate: 'asc' }, take: 1 },
        },
      }),
      db.application.count({ where }),
    ]);

    // Determine B2B view permission
    let canViewB2BFlag = false;
    let canViewCommission = false;
    if (authRes.type === 'portal') {
      canViewB2BFlag = canViewB2B(authRes.data.roles, authRes.data.permissions);
      canViewCommission = canViewB2BCommission(authRes.data.roles, authRes.data.permissions);
    }

    const sanitized = applications.map(app => {
      const withSafe = {
        ...app,
        safeStatus: app.safeStatus || mapStageToSafeStatus(app.stage),
      };
      return stripB2BFields(withSafe, canViewB2BFlag, canViewCommission);
    });

    return NextResponse.json({
      success: true,
      data: sanitized,
      applications: sanitized,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      meta: { canViewB2B: canViewB2BFlag },
    });
  } catch (e: any) {
    console.error('GET /api/applications error', e);
    return NextResponse.json({ success: false, error: 'Failed to fetch applications', details: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  if (authRes.type === 'student') {
    // students can create self application - userType check not needed, StudentAuthContext has no userType
  }

  const body = await req.json();

  // Validation
  if (!body.studentId && authRes.type !== 'student') {
    return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 });
  }
  if (!body.universityName || !body.courseName) {
    return NextResponse.json({ success: false, error: 'universityName and courseName required' }, { status: 400 });
  }

  const applicationSource = body.applicationSource || (authRes.type === 'student' ? 'STUDENT_SELF_APPLICATION' : 'DIRECT_ALO_APPLICATION');
  if (!APPLICATION_SOURCES.includes(applicationSource as any)) {
    return NextResponse.json({ success: false, error: 'Invalid applicationSource' }, { status: 400 });
  }

  const isB2b = applicationSource === 'B2B_INBOUND_APPLICATION' || applicationSource === 'B2B_OUTBOUND_APPLICATION' || !!body.b2bProviderId;

  // B2B creation requires permission
  if (isB2b && authRes.type === 'portal') {
    const canManage = canViewB2B(authRes.data.roles, authRes.data.permissions);
    if (!canManage) {
      return NextResponse.json({ success: false, error: 'Forbidden: B2B application creation requires application.view_b2b permission' }, { status: 403 });
    }
  }

  const applicationCode = body.applicationCode || `APP-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;
  const stage = body.stage || 'APPLICATION_DRAFT';
  const safeStatus = mapStageToSafeStatus(stage);

  try {
    const newApp = await db.application.create({
      data: {
        applicationCode,
        studentId: authRes.type === 'student' ? authRes.data.studentId : body.studentId,
        partnerId: body.partnerId || (authRes.type === 'portal' && authRes.data.userType === 'partner' ? authRes.data.userId : ''),
        counselorId: body.counselorId || '',
        counselorName: body.counselorName || '',
        applicationOfficer: body.applicationOfficer || body.appTeamOfficerId || '',
        appTeamOfficerId: body.appTeamOfficerId || body.applicationOfficer || '',
        visaOfficerId: body.visaOfficerId || '',
        universityId: body.universityId || '',
        universityName: body.universityName,
        courseId: body.courseId || '',
        courseName: body.courseName,
        country: body.country || '',
        intake: body.intake || '',
        level: body.level || '',
        applicationSource,
        isB2b,
        isB2bConfidential: isB2b,
        b2bType: body.b2bType || (applicationSource === 'B2B_INBOUND_APPLICATION' ? 'B2B_INBOUND' : applicationSource === 'B2B_OUTBOUND_APPLICATION' ? 'B2B_OUTBOUND' : ''),
        b2bProviderId: body.b2bProviderId || '',
        stage,
        safeStatus,
        reviewStatus: body.reviewStatus || 'PENDING',
        documentStatus: body.documentStatus || 'PENDING',
        paymentStatus: body.paymentStatus || 'PENDING',
        offerStatus: body.offerStatus || 'PENDING',
        casI20CoeStatus: body.casI20CoeStatus || 'NOT_STARTED',
        visaHandoverStatus: body.visaHandoverStatus || 'NOT_READY',
        status: body.status || 'active',
        deadline: body.deadline || '',
        notes: body.notes || '',
        internalNotes: body.internalNotes || '',
        createdBy: authRes.type === 'portal' ? authRes.data.userId : authRes.data.studentId,
      },
    });

    // Create status log
    await db.applicationStatusLog.create({
      data: {
        applicationId: newApp.id,
        oldStatus: '',
        newStatus: stage,
        safeStatus,
        changedBy: authRes.type === 'portal' ? authRes.data.userId : authRes.data.studentId,
        visibility: isB2b ? 'B2B_CONFIDENTIAL' : 'public_safe',
        note: isB2b ? `Application created via B2B channel ${applicationSource}` : `Application created: ${applicationSource}`,
      },
    });

    // If B2B, create B2bApplication record
    if (isB2b && body.b2bProviderId) {
      await db.b2bApplication.create({
        data: {
          applicationId: newApp.id,
          b2bProviderId: body.b2bProviderId,
          b2bType: body.b2bType || (applicationSource === 'B2B_INBOUND_APPLICATION' ? 'B2B_INBOUND' : 'B2B_OUTBOUND'),
          b2bReference: body.b2bReference || '',
          submissionRoute: body.submissionRoute || 'B2B_OUTBOUND',
          b2bStatus: 'SUBMITTED',
          b2bCommissionType: body.b2bCommissionType || '',
          b2bCommissionAmount: body.b2bCommissionAmount || 0,
          b2bPaymentCondition: body.b2bPaymentCondition || '',
          b2bClaimStage: body.b2bClaimStage || 'NOT_CLAIMED',
          b2bInternalNote: body.b2bInternalNote || body.internalNotes || '',
          createdBy: authRes.type === 'portal' ? authRes.data.userId : authRes.data.studentId,
        },
      });
    }

    // Audit log
    if (authRes.type === 'portal') {
      await logAuditAction(authRes.data, 'CREATE_APPLICATION', 'Application', newApp.id, { applicationSource, isB2b });
      await db.auditLog.create({
        data: {
          userId: authRes.data.userId,
          action: 'CREATE_APPLICATION',
          resource: 'Application',
          resourceId: newApp.id,
          details: JSON.stringify({ applicationCode, applicationSource, studentId: newApp.studentId, isB2b }),
          actorRole: authRes.data.roles?.[0] || '',
          studentId: newApp.studentId,
        },
      });
    } else {
      await logStudentEvent(authRes.data.studentId, 'CREATED_APPLICATION', { applicationId: newApp.id });
    }

    return NextResponse.json({ success: true, data: newApp, application: newApp });
  } catch (e: any) {
    console.error('POST /api/applications error', e);
    return NextResponse.json({ success: false, error: 'Failed to create application', details: e.message }, { status: 500 });
  }
}
