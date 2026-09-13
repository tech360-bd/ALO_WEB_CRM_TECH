import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

// Application workflow controlled transitions
const APPLICATION_WORKFLOW = {
  states: ['draft','submitted','under_review','document_check','offer_pending','offer_received','offer_accepted','payment_pending','payment_verified','visa_pending','visa_submitted','visa_approved','enrolled','rejected','withdrawn','deferred'],
  transitions: {
    draft: ['submitted'],
    submitted: ['under_review','rejected'],
    under_review: ['document_check','rejected'],
    document_check: ['offer_pending','rejected'],
    offer_pending: ['offer_received','rejected'],
    offer_received: ['offer_accepted','rejected'],
    offer_accepted: ['payment_pending'],
    payment_pending: ['payment_verified','rejected'],
    payment_verified: ['visa_pending'],
    visa_pending: ['visa_submitted'],
    visa_submitted: ['visa_approved','rejected'],
    visa_approved: ['enrolled'],
    rejected: ['draft'], // reapply
    withdrawn: [],
    deferred: ['draft'],
  },
};

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    return NextResponse.json({
      success: true,
      applicationWorkflow: APPLICATION_WORKFLOW,
      documentWorkflow: {
        states: ['pending','uploaded','under_review','verified','rejected','expired'],
        note: 'Document checklist + follow-up tracking required',
      },
      payrollWorkflow: {
        states: ['draft','review_pending','reviewed','approved','paid','rejected'],
        note: 'AI cannot finalize high-risk — AI PREPARES → HUMAN CHECK → HUMAN APPROVAL → FINAL',
      },
      leaveWorkflow: {
        states: ['pending','approved','rejected','cancelled'],
        note: 'Separation of duties — cannot approve own leave',
      },
      permissionWorkflow: {
        states: ['requested','reviewing','approved','rejected','active','expired','revoked'],
      },
      offerLetter: {
        note: 'Provenance — who created, who verified, who sent, signed URL, expiry, audit',
        serialFormat: 'ALO-UK-2026-000123',
      },
      commentSystems: {
        studentVisible: 'Student can see — never include internal notes',
        internal: 'Internal only — never shown to student, permission-controlled',
      },
      sla: {
        reminder: 'Auto-reminder before SLA breach',
        warning: 'Warning at 80% SLA',
        escalation: 'Escalation at 100% SLA — assign to senior',
      },
      interview: {
        steps: ['research','prep','practice','scoring','recording','human_final_review'],
        note: 'AI may score draft, but human final review required',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { entityType, entityId, fromState, toState, reason } = body;
    if (!entityType || !entityId || !toState) return NextResponse.json({ success: false, error: 'entityType, entityId, toState required' }, { status: 400 });

    // Validate transition
    const workflow = entityType === 'application' ? APPLICATION_WORKFLOW : null;
    if (workflow && fromState) {
      const allowed = (workflow.transitions as any)[fromState] || [];
      if (!allowed.includes(toState)) {
        return NextResponse.json({ success: false, error: `Invalid transition ${fromState} → ${toState}. Allowed: ${allowed.join(',')}` }, { status: 400 });
      }
    }

    // Check permission to transition
    const canApprove = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('application_manager') || auth.roles.includes('branch_manager');
    if (toState === 'rejected' || toState === 'approved' || toState === 'enrolled') {
      if (!canApprove) return NextResponse.json({ success: false, error: 'Approval permission required for this transition' }, { status: 403 });
    }

    await logAuditAction(auth, `${entityType.toUpperCase()}_${toState.toUpperCase()}`, entityType, entityId, { fromState, toState, reason });

    await (db as any).employeeAuditLog.create({
      data: {
        employeeId: auth.userId,
        actorId: auth.userId,
        actorRole: auth.roles[0] || '',
        action: `${entityType}_state_change`,
        targetType: entityType,
        targetId: entityId,
        oldValue: JSON.stringify({ state: fromState }),
        newValue: JSON.stringify({ state: toState }),
        reason: reason || '',
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: `Transition ${fromState} → ${toState} logged with audit` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
