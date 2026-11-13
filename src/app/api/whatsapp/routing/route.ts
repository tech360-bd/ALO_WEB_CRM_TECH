import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { determineSenderNumber, MAIN_NUMBER, COO_NUMBER, OFFICIAL_NUMBERS, EMPLOYEE_POOL, toBdDisplayPhone, getWhatsAppNumberConfigStatus } from '@/lib/whatsapp-number-pool';
import { db } from '@/lib/db';
import { mutationOriginAllowed } from '@/lib/request-origin';

function roleSet(auth: AuthContext): Set<string> {
  return new Set(auth.roles.map((role) => role.toLowerCase()));
}

function isAdmin(auth: AuthContext): boolean {
  const roles = roleSet(auth);
  return roles.has('super_admin') || roles.has('admin');
}

function canViewRouting(auth: AuthContext): boolean {
  return isAdmin(auth)
    || auth.permissions.includes('whatsapp.routing.view')
    || auth.permissions.includes('communication.view_all')
    || auth.permissions.includes('communication.view_assigned');
}

function routingLogScope(auth: AuthContext) {
  if (isAdmin(auth) || auth.permissions.includes('whatsapp.routing.view') || auth.permissions.includes('communication.view_all')) return {};

  const scope: Array<Record<string, string>> = [];
  if (auth.userId) scope.push({ assignedToId: auth.userId });
  if (auth.branch) scope.push({ branch: auth.branch });
  // An empty OR would accidentally turn into a broad read. Fail closed instead.
  return scope.length ? { OR: scope } : { id: '__no_matching_routing_log__' };
}

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  if (!isAdmin(auth)) {
    return NextResponse.json({ success: false, error: 'Administrator access is required for routing previews.' }, { status: 403 });
  }
  if (!mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }
    const fields = ['studentId', 'leadId', 'counselorId', 'branch', 'department', 'partnerId', 'campaignId', 'applicationId', 'threadId', 'conversationId'];
    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(body, field) && (typeof body[field] !== 'string' || body[field].length > 191)) {
        return NextResponse.json({ success: false, error: `Invalid ${field}.` }, { status: 400 });
      }
    }
    for (const field of ['isComplaint', 'isFollowUp', 'isUrgent', 'isPartner', 'financeIssue', 'visaIssue']) {
      if (Object.prototype.hasOwnProperty.call(body, field) && typeof body[field] !== 'boolean') {
        return NextResponse.json({ success: false, error: `Invalid ${field}.` }, { status: 400 });
      }
    }
    if (body.explicitNumber !== undefined) {
      const explicitNumber = typeof body.explicitNumber === 'string' ? toBdDisplayPhone(body.explicitNumber) : '';
      if (!explicitNumber || !OFFICIAL_NUMBERS.includes(explicitNumber)) {
        return NextResponse.json({ success: false, error: 'Routing preview number must be in the operator-configured sender list.' }, { status: 400 });
      }
      body.explicitNumber = explicitNumber;
    }

    const routing = await determineSenderNumber({
      studentId: body.studentId,
      leadId: body.leadId,
      counselorId: body.counselorId,
      branch: body.branch,
      department: body.department,
      isComplaint: body.isComplaint,
      isFollowUp: body.isFollowUp,
      isUrgent: body.isUrgent,
      isPartner: body.isPartner,
      partnerId: body.partnerId,
      campaignId: body.campaignId,
      applicationId: body.applicationId,
      financeIssue: body.financeIssue,
      visaIssue: body.visaIssue,
      explicitNumber: body.explicitNumber,
    });

    // Record only administrator-initiated previews; a preview is not evidence
    // that the selected Meta sender is configured or provider-verified.
    await db.communicationRoutingLog.create({
      data: {
        threadId: body.threadId || '',
        conversationId: body.conversationId || '',
        studentId: body.studentId || '',
        fromNumber: '',
        toNumber: routing.number,
        routingReason: `preview:${routing.reason}`,
        priority: body.isUrgent ? 3 : body.isComplaint ? 2 : 1,
        assignedToId: body.counselorId || '',
        branch: body.branch || '',
        department: body.department || '',
        fallbackUsed: routing.fallback,
      },
    });

    return NextResponse.json({
      success: true,
      routing: { ...routing, providerStatus: 'not_checked', isPreview: true },
      configuredNumbers: {
        main: MAIN_NUMBER || null,
        urgentSupport: COO_NUMBER || null,
        employeePool: EMPLOYEE_POOL,
        pool: OFFICIAL_NUMBERS,
        status: getWhatsAppNumberConfigStatus(),
        ownershipAndProviderConnectionVerified: false,
      },
      priority: [
        'explicit_assignment',
        'student_counselor',
        'branch_assignment',
        'department_routing',
        'purpose_specific',
        'default_fallback',
      ],
    });
  } catch {
    return NextResponse.json({ success: false, error: 'WhatsApp routing preview failed.' }, { status: 503 });
  }
});

export const GET = withAuth(async (_req: Request, auth: AuthContext) => {
  if (!canViewRouting(auth)) {
    return NextResponse.json({ success: false, error: 'WhatsApp routing view permission required.' }, { status: 403 });
  }
  try {
    const logs = await db.communicationRoutingLog.findMany({
      where: routingLogScope(auth),
      select: {
        id: true,
        threadId: true,
        conversationId: true,
        routingReason: true,
        toNumber: true,
        priority: true,
        assignedToName: true,
        branch: true,
        department: true,
        fallbackUsed: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      logs,
      configuredNumbers: {
        main: MAIN_NUMBER || null,
        urgentSupport: COO_NUMBER || null,
        employeePool: EMPLOYEE_POOL,
        pool: OFFICIAL_NUMBERS,
        status: getWhatsAppNumberConfigStatus(),
        ownershipAndProviderConnectionVerified: false,
      },
      integrationState: 'ROUTING_PREVIEW_ONLY_PROVIDER_CONNECTION_UNVERIFIED',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'WhatsApp routing history could not be loaded.' }, { status: 503 });
  }
});
