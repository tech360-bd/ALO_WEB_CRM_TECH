import { reportServerEvent } from '@/lib/analytics/server-conversions';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getFormBReadiness } from '@/lib/application-readiness';
import { authenticateUnified } from '@/lib/unified-auth';
import { logAuditAction } from '@/lib/auth-middleware';
import { logStudentEvent } from '@/lib/student-auth';
import { canViewB2B, canManageB2B, canViewB2BCommission, stripB2BFields, mapStageToSafeStatus, APPLICATION_SOURCES } from '@/lib/application-manager/service';
import { DEFAULT_APPLICATION_DOCUMENT_REQUIREMENTS, refreshApplicationDocumentStatus } from '@/lib/application-manager/document-readiness';

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
  const canViewB2BFlag = authRes.type === 'portal' && canViewB2B(authRes.data.roles, authRes.data.permissions);
  const canViewCommission = authRes.type === 'portal' && canViewB2BCommission(authRes.data.roles, authRes.data.permissions);
  if (confidential === 'true' && !canViewB2BFlag) return NextResponse.json({ success: false, error: 'Forbidden: confidential application filtering requires B2B permission.' }, { status: 403 });
  if (source?.toUpperCase().startsWith('B2B_') && !canViewB2BFlag && !canViewCommission) return NextResponse.json({ success: false, error: 'Forbidden: B2B source filtering requires explicit permission.' }, { status: 403 });
  const sla = searchParams.get('sla');
  const status = searchParams.get('status');
  const stage = searchParams.get('stage');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const skip = (page - 1) * limit;

  const scope: Record<string, unknown> = {};
  const roles = authRes.type === 'portal' ? authRes.data.roles.map((role) => role.toLowerCase()) : [];
  if (authRes.type === 'student') {
    scope.studentId = authRes.data.studentId;
  } else {
    const portal = authRes.data;
    const isPartner = Boolean(portal.partnerId || portal.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner')));
    const canViewAll = roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) || portal.permissions.includes('application.view_all');
    if (isPartner) {
      if (!portal.partnerId) return NextResponse.json({ success: false, error: 'Partner identity is not linked to this account.' }, { status: 403 });
      scope.partnerId = portal.partnerId;
    } else if (!canViewAll && (portal.userType.toLowerCase() === 'counselor' || roles.includes('counselor'))) {
      scope.counselorId = portal.userId;
    } else if (!canViewAll && roles.includes('visa_officer')) {
      scope.OR = [
        { visaOfficerId: portal.userId },
        { stage: { in: ['VISA_HANDOVER_READY', 'VISA_FILE_CREATED', 'VISA_PREPARATION', 'VISA_SUBMITTED', 'VISA_DECISION_PENDING', 'VISA_APPROVED', 'VISA_REFUSED', 'PRE_DEPARTURE'] } },
      ];
    } else if (!canViewAll && !roles.includes('finance') && !portal.permissions.includes('application.view')) {
      return NextResponse.json({ success: false, error: 'Forbidden: application.view permission required' }, { status: 403 });
    }
  }

  const filters: Record<string, unknown> = {};
  if (source) filters.applicationSource = source;
  if (country) filters.country = { contains: country };
  if (university) filters.universityName = { contains: university };
  if (course) filters.courseName = { contains: course };
  if (intake) filters.intake = { contains: intake };
  if (counselorId) filters.counselorId = counselorId;
  if (officerId) filters.appTeamOfficerId = officerId;
  if (documentStatus) filters.documentStatus = documentStatus;
  if (offerStatus) filters.offerStatus = offerStatus;
  if (casStatus) filters.casI20CoeStatus = casStatus;
  if (status) filters.safeStatus = status;
  if (stage) filters.stage = stage;
  if (sla) filters.slaStatus = sla;
  if (confidential === 'true') filters.isB2bConfidential = true;

  const dateFilters: Record<string, unknown>[] = [];
  if (urgent === 'true') dateFilters.push({ deadlineDate: { lte: new Date(Date.now() + 3 * 86400000) } });
  if (deadlineFilter === 'OVERDUE') dateFilters.push({ deadlineDate: { lt: new Date() } });
  if (deadlineFilter === 'DUE_TODAY') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateFilters.push({ deadlineDate: { gte: today, lt: tomorrow } });
  }
  if (search) {
    filters.OR = [
      { applicationCode: { contains: search } },
      { studentId: { contains: search } },
      { universityName: { contains: search } },
      { courseName: { contains: search } },
      { country: { contains: search } },
    ];
  }
  const clauses: Record<string, unknown>[] = [];
  if (Object.keys(scope).length) clauses.push(scope);
  // Keep B2B-specific records out of ordinary scopes; Finance with the exact
  // commission grant may see only the sanitized commission projection below.
  if (!canViewB2BFlag && !canViewCommission) clauses.push({
    isB2b: false,
    isB2bConfidential: false,
    applicationSource: { notIn: ['B2B_INBOUND_APPLICATION', 'B2B_OUTBOUND_APPLICATION'] },
    b2bApplications: { none: {} },
  });
  if (Object.keys(filters).length) clauses.push(filters);
  clauses.push(...dateFilters);
  const where = clauses.length ? { AND: clauses } : {};


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

  const portalRoles = authRes.type === 'portal' ? authRes.data.roles.map((role) => role.toLowerCase()) : [];
  const isPartnerUser = Boolean(authRes.type === 'portal' && (authRes.data.partnerId || authRes.data.userType.toLowerCase() === 'partner' || portalRoles.some((role) => role.startsWith('partner'))));
  if (authRes.type === 'portal') {
    if (isPartnerUser && !authRes.data.partnerId) return NextResponse.json({ success: false, error: 'Partner identity is not linked to this account.' }, { status: 403 });
    const canCreate = isPartnerUser || portalRoles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team', 'counselor'].includes(role)) || authRes.data.permissions.includes('application.create');
    if (!canCreate) return NextResponse.json({ success: false, error: 'Forbidden: application.create permission required' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'Invalid application request' }, { status: 400 });

  // Validation
  if (!body.studentId && authRes.type !== 'student') {
    return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 });
  }
  if (typeof body.universityName !== 'string' || !body.universityName.trim() || typeof body.courseName !== 'string' || !body.courseName.trim()) {
    return NextResponse.json({ success: false, error: 'universityName and courseName required' }, { status: 400 });
  }

  if (isPartnerUser && authRes.type === 'portal' && !authRes.data.partnerId) {
    return NextResponse.json({ success: false, error: 'Partner identity is not linked to this account.' }, { status: 403 });
  }
  if (isPartnerUser && authRes.type === 'portal' && body.partnerId && body.partnerId !== authRes.data.partnerId) {
    return NextResponse.json({ success: false, error: 'Client-supplied partnerId does not match the authenticated tenant.' }, { status: 403 });
  }
  if (isPartnerUser && authRes.type === 'portal') {
    const linkedStudent = await db.portalStudentProfile.findFirst({
      where: { studentId: body.studentId, partnerId: authRes.data.partnerId },
      select: { id: true },
    });
    if (!linkedStudent) return NextResponse.json({ success: false, error: 'Student is not linked to this partner tenant.' }, { status: 404 });
  }

  const applicationSource = authRes.type === 'student'
    ? 'STUDENT_SELF_APPLICATION'
    : isPartnerUser
      ? 'PARTNER_APPLICATION'
      : (body.applicationSource || 'DIRECT_ALO_APPLICATION');

  // ── FORM B GATE ───────────────────────────────────────────────────────────
  // A student self-application (Form A on the public site, or the portal Apply
  // button) may only be created once Form B — the portal profile — is complete.
  // This is enforced here, on the server, so the UI cannot be bypassed by
  // calling the API directly. Staff/partner-created applications are unaffected:
  // they run counselor pre-apply workflows instead.
  if (authRes.type === 'student' && applicationSource === 'STUDENT_SELF_APPLICATION') {
    const readiness = await getFormBReadiness(authRes.data.studentId);
    if (!readiness.complete) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORM_B_INCOMPLETE',
          error:
            'Your application profile is not complete yet. Finish the sections below and submit again — we will not create an application with incomplete information.',
          completeness: readiness.percent,
          missingSections: readiness.missing.map((section) => ({
            key: section.key,
            label: section.label,
            href: section.href,
          })),
        },
        { status: 422 },
      );
    }
  }
  if (!APPLICATION_SOURCES.includes(applicationSource as any)) {
    return NextResponse.json({ success: false, error: 'Invalid applicationSource' }, { status: 400 });
  }

  const isB2b = applicationSource === 'B2B_INBOUND_APPLICATION' || applicationSource === 'B2B_OUTBOUND_APPLICATION' || !!body.b2bProviderId;
  const requestedPartnerId = isPartnerUser && authRes.type === 'portal'
    ? authRes.data.partnerId!
    : (typeof body.partnerId === 'string' ? body.partnerId.trim() : '');

  if (!isPartnerUser && requestedPartnerId && authRes.type === 'portal' && !canViewB2B(authRes.data.roles, authRes.data.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: assigning an application to a partner requires B2B permission.' }, { status: 403 });
  }
  if (!isPartnerUser && requestedPartnerId) {
    const partner = await db.partnerProfile.findFirst({ where: { partnerId: requestedPartnerId }, select: { id: true } });
    if (!partner) return NextResponse.json({ success: false, error: 'Unknown partner tenant.' }, { status: 400 });
  }

  // B2B creation is ALO-side only; a student cannot turn a direct application
  // into a confidential B2B record by adding client-controlled source/provider fields.
  let canViewCommissionForCreate = false;
  if (isB2b) {
    if (authRes.type !== 'portal' || !canManageB2B(authRes.data.roles, authRes.data.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden: B2B application creation requires an authorized ALO-side manage permission.' }, { status: 403 });
    }
    if (typeof body.b2bProviderId !== 'string' || !body.b2bProviderId.trim() || body.b2bProviderId.length > 191) {
      return NextResponse.json({ success: false, error: 'A valid b2bProviderId is required for a B2B application.' }, { status: 400 });
    }
    if (body.b2bType !== undefined && !['B2B_INBOUND', 'B2B_OUTBOUND', 'INBOUND', 'OUTBOUND'].includes(body.b2bType)) {
      return NextResponse.json({ success: false, error: 'Invalid b2bType.' }, { status: 400 });
    }
    if (typeof body.b2bCommissionAmount === 'string' || (body.b2bCommissionAmount !== undefined && (typeof body.b2bCommissionAmount !== 'number' || !Number.isFinite(body.b2bCommissionAmount) || body.b2bCommissionAmount < 0))) {
      return NextResponse.json({ success: false, error: 'b2bCommissionAmount must be a finite non-negative number.' }, { status: 400 });
    }
    if (typeof body.b2bInternalNote === 'string' && body.b2bInternalNote.length > 10000) {
      return NextResponse.json({ success: false, error: 'b2bInternalNote is too long.' }, { status: 400 });
    }
    const provider = await db.b2bProvider.findFirst({
      where: { id: body.b2bProviderId.trim(), status: { in: ['ACTIVE', 'active', 'APPROVED', 'approved'] } },
      select: { id: true },
    });
    if (!provider) return NextResponse.json({ success: false, error: 'B2B provider is not active or approved.' }, { status: 400 });
    canViewCommissionForCreate = canViewB2BCommission(authRes.data.roles, authRes.data.permissions);
    const hasCommissionInput = ['b2bCommissionType', 'b2bCommissionAmount', 'b2bPaymentCondition', 'b2bClaimStage'].some((field) => Object.prototype.hasOwnProperty.call(body, field));
    if (hasCommissionInput && !canViewCommissionForCreate) {
      return NextResponse.json({ success: false, error: 'B2B commission updates require application.view_b2b_commission permission.' }, { status: 403 });
    }
  }

  const applicationCode = `APP-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`;
  // Creation is always a draft; clients cannot jump over review/document gates.
  const stage = 'APPLICATION_DRAFT';
  const safeStatus = mapStageToSafeStatus(stage);

  try {
    const newApp = await db.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: {
          applicationCode,
          studentId: authRes.type === 'student' ? authRes.data.studentId : body.studentId,
          partnerId: requestedPartnerId,
          counselorId: isPartnerUser ? '' : (body.counselorId || ''),
          counselorName: isPartnerUser ? '' : (body.counselorName || ''),
          applicationOfficer: isPartnerUser ? '' : (body.applicationOfficer || body.appTeamOfficerId || ''),
          appTeamOfficerId: isPartnerUser ? '' : (body.appTeamOfficerId || body.applicationOfficer || ''),
          visaOfficerId: isPartnerUser ? '' : (body.visaOfficerId || ''),
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
          reviewStatus: 'PENDING',
          documentStatus: 'PENDING',
          paymentStatus: 'PENDING',
          offerStatus: 'PENDING',
          casI20CoeStatus: 'NOT_STARTED',
          visaHandoverStatus: 'NOT_READY',
          status: 'active',
          deadline: body.deadline || '',
          notes: body.notes || '',
          internalNotes: isPartnerUser ? '' : (body.internalNotes || ''),
          createdBy: authRes.type === 'portal' ? authRes.data.userId : authRes.data.studentId,
        },
      });
      await tx.applicationDocument.createMany({
        data: DEFAULT_APPLICATION_DOCUMENT_REQUIREMENTS.map((requirement) => ({
          applicationId: created.id,
          studentId: created.studentId,
          documentType: requirement.type,
          fileName: requirement.label,
          status: 'REQUIRED',
          visibility: 'student_visible',
          version: 1,
        })),
      });
      await refreshApplicationDocumentStatus(tx, created.id);
      await tx.applicationStageHistory.create({
        data: { applicationId: created.id, stage, status: 'completed', note: `Application created as a draft (${applicationSource}).`, actor: authRes.type === 'portal' ? authRes.data.userId : authRes.data.studentId },
      });
      await tx.applicationStatusLog.create({
        data: {
          applicationId: created.id,
          oldStatus: '',
          newStatus: stage,
          safeStatus,
          changedBy: authRes.type === 'portal' ? authRes.data.userId : authRes.data.studentId,
          visibility: isB2b ? 'B2B_CONFIDENTIAL' : 'public_safe',
          note: isB2b ? `Application created as draft via B2B channel ${applicationSource}` : `Application created as draft: ${applicationSource}`,
        },
      });
      if (isB2b && body.b2bProviderId) {
        const b2bType = body.b2bType === 'B2B_INBOUND' || body.b2bType === 'INBOUND' || applicationSource === 'B2B_INBOUND_APPLICATION' ? 'B2B_INBOUND' : 'B2B_OUTBOUND';
        await tx.b2bApplication.create({
          data: {
            applicationId: created.id,
            b2bProviderId: body.b2bProviderId.trim(),
            b2bType,
            b2bReference: typeof body.b2bReference === 'string' ? body.b2bReference.slice(0, 191) : '',
            submissionRoute: typeof body.submissionRoute === 'string' ? body.submissionRoute.slice(0, 191) : b2bType,
            b2bStatus: 'DRAFT',
            b2bCommissionType: canViewCommissionForCreate && typeof body.b2bCommissionType === 'string' ? body.b2bCommissionType.slice(0, 191) : '',
            b2bCommissionAmount: canViewCommissionForCreate && typeof body.b2bCommissionAmount === 'number' && Number.isFinite(body.b2bCommissionAmount) && body.b2bCommissionAmount >= 0 ? body.b2bCommissionAmount : 0,
            b2bPaymentCondition: canViewCommissionForCreate && typeof body.b2bPaymentCondition === 'string' ? body.b2bPaymentCondition.slice(0, 191) : '',
            b2bClaimStage: canViewCommissionForCreate && typeof body.b2bClaimStage === 'string' ? body.b2bClaimStage.slice(0, 191) : 'NOT_CLAIMED',
            b2bInternalNote: typeof body.b2bInternalNote === 'string' ? body.b2bInternalNote.slice(0, 10000) : '',
            createdBy: authRes.type === 'portal' ? authRes.data.userId : authRes.data.studentId,
          },
        });
      }
      return created;
    });

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

    // ── FORM A: notifications ────────────────────────────────────────────────
    // Spec: "Email + team notification" when an application draft is created.
    // Everything here is best-effort and isolated: the draft and its status log
    // are already persisted, so a missing SMTP configuration or a failed
    // notification must never turn a successful creation into an error.
    try {
      const studentId = newApp.studentId;
      const student = studentId
        ? await db.student.findUnique({
            where: { id: studentId },
            select: { name: true, email: true, counselorId: true, counselorName: true, studentId: true },
          })
        : null;

      const counselorId = newApp.counselorId || student?.counselorId || '';
      const counselorName = newApp.counselorName || student?.counselorName || '';
      const courseLine = `${newApp.courseName}${newApp.universityName ? ` at ${newApp.universityName}` : ''}`;
      const intakeLine = newApp.intake ? ` — intake ${newApp.intake}` : '';

      // 1. Team notification inside the CRM (assigned counselor, else the queue).
      if (counselorId) {
        await db.portalNotification.create({
          data: {
            userId: counselorId,
            title: 'New application draft to review',
            message: `${student?.name || 'A student'} started an application: ${courseLine}${intakeLine}.`,
            type: 'application_created',
            isRead: false,
            actionUrl: `/crm/applications/${newApp.id}`,
          },
        }).catch(() => {});
      } else {
        // No counselor on the row: notify every active counselor so the lead cannot
        // sit invisible in the queue.
        const counselors = await db.portalUserRole.findMany({
          where: { role: { name: { in: ['counselor', 'branch_manager'] } } },
          select: { userId: true },
          distinct: ['userId'],
        }).catch(() => []);
        await Promise.all(
          counselors.map((row) =>
            db.portalNotification.create({
              data: {
                userId: row.userId,
                title: 'Unassigned application draft',
                message: `${student?.name || 'A student'} started an application: ${courseLine}${intakeLine}.`,
                type: 'application_created',
                isRead: false,
                actionUrl: `/crm/applications/${newApp.id}`,
              },
            }).catch(() => {})
          )
        );
      }

      // 2. Timeline + student event so the portal shows the draft immediately.
      if (studentId) {
        await db.timelineEvent.create({
          data: {
            studentId,
            stage: 'application_draft_created',
            title: `Application draft: ${courseLine}`,
            description: `Created from ${applicationSource}${intakeLine}. Reference ${applicationCode}.`,
            actor: authRes.type === 'portal' ? authRes.data.userId : studentId,
          },
        }).catch(() => {});
        await db.studentEvent.create({
          data: {
            studentId,
            eventType: 'APPLICATION_DRAFT_CREATED',
            payload: JSON.stringify({ applicationId: newApp.id, applicationCode, courseName: newApp.courseName, intake: newApp.intake }),
          },
        }).catch(() => {});
      }

      // 3. Email: student confirmation + team inbox notification.
      const { sendEmail } = await import('@/lib/email-service');
      const teamInbox = process.env.APPLICATIONS_INBOX || process.env.COUNSELING_INBOX || process.env.LEADS_INBOX || process.env.SMTP_USER;
      const studentHtml = `
        <h2 style="font-family:sans-serif">Your application draft is open, ${student?.name || ''}</h2>
        <p style="font-family:sans-serif">We created a draft application and assigned it to ${counselorName || 'our application team'}.</p>
        <ul style="font-family:sans-serif">
          <li>Course: ${newApp.courseName}</li>
          <li>University: ${newApp.universityName || 'Not specified'}</li>
          <li>Intake: ${newApp.intake || 'Not specified'}</li>
          <li>Reference: ${applicationCode}</li>
        </ul>
        <p style="font-family:sans-serif">Next step: finish or review your profile (Form B) and upload your documents in the student portal. Nothing is sent to the university until your counselor confirms it.</p>`;
      const teamHtml = `
        <h3 style="font-family:sans-serif">New application draft (${applicationSource})</h3>
        <ul style="font-family:sans-serif">
          <li>Student: ${student?.name || 'Unknown'} (${student?.email || 'no email'})</li>
          <li>Student ID: ${student?.studentId || studentId || '—'}</li>
          <li>Course: ${courseLine}${intakeLine}</li>
          <li>Counselor: ${counselorName || 'unassigned — please assign'}</li>
          <li>Reference: ${applicationCode}</li>
        </ul>`;
      const [studentMail, teamMail] = await Promise.all([
        student?.email
          ? sendEmail({ to: student.email, subject: `Application draft created — ${newApp.courseName}`, html: studentHtml, text: `Your application draft for ${courseLine} is open. Reference ${applicationCode}.` })
          : Promise.resolve({ success: false, error: 'NO_STUDENT_EMAIL' }),
        teamInbox
          ? sendEmail({ to: teamInbox, subject: `New application draft: ${student?.name || 'student'} — ${newApp.courseName}`, html: teamHtml, text: `New application draft ${applicationCode} for ${courseLine}` })
          : Promise.resolve({ success: false, error: 'NO_TEAM_INBOX' }),
      ]);
      if (!studentMail.success) console.warn('[applications] student confirmation not sent:', studentMail.error);
      if (!teamMail.success) console.warn('[applications] team notification not sent:', teamMail.error);
    } catch (notifyError) {
      console.error('[applications] Form A notification failed:', notifyError);
    }

    // Authoritative business conversion: an application record now exists.
    // Distinct from the client-side `application_start`, which measures the
    // visitor reaching the apply surface. Business reporting must use this
    // event; the client event measures UX drop-off. See
    // docs/GOOGLE-FREE-STACK.md §"Two layers of conversion events".
    reportServerEvent({
      event: 'application_started',
      reference: applicationCode,
      params: {
        application_reference: applicationCode,
        destination: (newApp as { country?: string }).country ?? undefined,
        course_id: (newApp as { courseId?: string }).courseId ?? undefined,
        university_id: (newApp as { universityId?: string }).universityId ?? undefined,
        intake: (newApp as { intake?: string }).intake ?? undefined,
      },
    });

    return NextResponse.json({ success: true, data: newApp, application: newApp });
  } catch (e: any) {
    console.error('POST /api/applications error', e);
    return NextResponse.json({ success: false, error: 'Failed to create application', details: e.message }, { status: 500 });
  }
}
