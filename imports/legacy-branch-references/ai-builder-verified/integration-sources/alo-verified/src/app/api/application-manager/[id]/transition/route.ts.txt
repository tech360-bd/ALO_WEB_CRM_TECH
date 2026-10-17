import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * POST /api/application-manager/[id]/transition
 *
 * Body: { toStatus: string, note?: string, changedBy?: string }
 *
 * Validates the requested transition against a fixed state machine, then
 * atomically writes:
 *  1. Application update (new status + relevant date stamp)
 *  2. ApplicationStatusHistory row
 *  3. AuditLog row
 *
 * All inside a single $transaction — if any step fails, all roll back.
 *
 * Status transition rules (server-enforced):
 *   draft → submitted
 *   submitted → under_review | rejected
 *   under_review → conditional_offer | unconditional_offer | rejected
 *   conditional_offer → unconditional_offer | withdrawn
 *   unconditional_offer → deposit_paid
 *   deposit_paid → cas_received
 *   cas_received → visa_applied
 *   visa_applied → visa_approved | visa_refused
 *   visa_approved → enrolled
 *   ANY → withdrawn | cancelled  (note required)
 *
 * Invalid transitions → 400 with allowed list.
 */

const TRANSITIONS: Record<string, string[]> = {
  draft: ['submitted', 'withdrawn', 'cancelled'],
  submitted: ['under_review', 'rejected', 'withdrawn', 'cancelled'],
  under_review: ['conditional_offer', 'unconditional_offer', 'rejected', 'withdrawn', 'cancelled'],
  conditional_offer: ['unconditional_offer', 'withdrawn', 'cancelled'],
  unconditional_offer: ['deposit_paid', 'withdrawn', 'cancelled'],
  deposit_paid: ['cas_received', 'withdrawn', 'cancelled'],
  cas_received: ['visa_applied', 'withdrawn', 'cancelled'],
  visa_applied: ['visa_approved', 'visa_refused', 'withdrawn', 'cancelled'],
  visa_approved: ['enrolled', 'withdrawn', 'cancelled'],
  // Terminal states — no forward transitions, only allow re-open via withdrawn/cancelled
  visa_refused: ['withdrawn', 'cancelled'],
  rejected: ['withdrawn', 'cancelled'],
  enrolled: ['withdrawn', 'cancelled'],
  withdrawn: [],
  cancelled: [],
};

// Side-effect date stamps per target status
const STATUS_DATE_FIELDS: Record<string, string> = {
  conditional_offer: 'offerDate',
  unconditional_offer: 'offerDate',
  deposit_paid: 'depositDate',
  cas_received: 'casDate',
  visa_applied: 'visaDate',
  visa_approved: 'visaDate',
  visa_refused: 'visaDate',
  enrolled: 'enrollmentDate',
  submitted: 'applicationDate', // already set at creation but kept consistent
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authOrResponse = await requireRole(request, ['application_manager', 'super_admin', 'admin']);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Application id is required' }, { status: 400 });
    }

    const body = await request.json();
    const toStatus = typeof body.toStatus === 'string' ? body.toStatus.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim() : null;

    if (!toStatus) {
      return NextResponse.json({ error: 'toStatus is required' }, { status: 400 });
    }

    // withdrawn + cancelled require a note (per spec)
    const isTerminalExit = toStatus === 'withdrawn' || toStatus === 'cancelled';
    if (isTerminalExit && !note) {
      return NextResponse.json(
        { error: `A reason note is required when transitioning to "${toStatus}"`, code: 'NOTE_REQUIRED' },
        { status: 400 }
      );
    }

    // Fetch the current application (within transaction to avoid TOCTOU)
    const application = await db.application.findUnique({
      where: { id },
      select: {
        id: true,
        applicationId: true,
        status: true,
        studentId: true,
        partnerId: true,
        source: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // B2B confidentiality — only privileged roles can transition B2B applications
    if (application.source === 'B2B') {
      // requireRole already restricted to application_manager/super_admin/admin
      // — but double-check by role name set:
      const userRoles = auth.user.roles?.map((r) => r.name) ?? [];
      const allowed = userRoles.some((r) =>
        ['application_manager', 'super_admin', 'admin'].includes(r)
      );
      if (!allowed) {
        return NextResponse.json(
          { error: 'Forbidden — B2B applications require application_manager/admin/super_admin role', code: 'B2B_CONFIDENTIAL' },
          { status: 403 }
        );
      }
    }

    const fromStatus = application.status;
    const allowed = TRANSITIONS[fromStatus] ?? [];

    if (!allowed.includes(toStatus)) {
      return NextResponse.json(
        {
          error: `Invalid transition: ${fromStatus} → ${toStatus}`,
          code: 'INVALID_TRANSITION',
          fromStatus,
          attempted: toStatus,
          allowed,
        },
        { status: 400 }
      );
    }

    // No-op if same status
    if (fromStatus === toStatus) {
      return NextResponse.json(
        { error: 'Application is already in this status', code: 'NO_OP' },
        { status: 400 }
      );
    }

    // Build date-stamp update
    const updateData: Record<string, unknown> = { status: toStatus };
    const dateField = STATUS_DATE_FIELDS[toStatus];
    if (dateField) {
      updateData[dateField] = new Date();
    }

    // Atomic transition: Application update + ApplicationStatusHistory + AuditLog
    const result = await db.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id },
        data: updateData,
        include: {
          student: { select: { firstName: true, lastName: true } },
          university: { select: { name: true } },
        },
      });

      const history = await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus,
          toStatus,
          changedBy: auth.user.id,
          note,
        },
      });

      return { updated, history };
    });

    // Audit log OUTSIDE the transaction — logAudit swallows errors so a failed
    // audit write never rolls back the (already-committed) business change.
    await logAudit({
      userId: auth.user.id,
      action: 'application_status_transition',
      module: 'application_manager',
      recordId: application.id,
      oldData: { status: fromStatus, applicationId: application.applicationId },
      newData: {
        status: toStatus,
        applicationId: application.applicationId,
        note,
        historyId: result.history.id,
      },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      application: result.updated,
      history: result.history,
      fromStatus,
      toStatus,
    });
  } catch (error) {
    console.error('application-manager/[id]/transition error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
