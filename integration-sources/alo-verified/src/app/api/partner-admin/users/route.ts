import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * GET  /api/partner-admin/users   — list partner staff (scoped to own partner)
 * POST /api/partner-admin/users   — create staff with 3-seat limit (atomic transaction)
 * DELETE /api/partner-admin/users  — remove staff (?id=...)
 *
 * Seat limit: 1 super_admin (the Partner.user link) + 2 PartnerStaff rows = 3 seats total.
 * The POST handler counts existing PartnerStaff rows INSIDE a $transaction so two
 * concurrent create requests cannot both pass the seat-count check.
 */

const SEAT_LIMIT = 3; // total seats (incl. super_admin)
const MAX_STAFF_ROWS = SEAT_LIMIT - 1; // PartnerStaff rows allowed (2)

function resolvePartnerId(auth: { user: { userType: string; referenceId: string | null; roles?: { name: string }[] } }, request: NextRequest): { partnerId: string | null; error?: NextResponse } {
  if (auth.user.userType === 'partner') {
    if (!auth.user.referenceId) return { partnerId: null, error: NextResponse.json({ error: 'Partner record missing on user' }, { status: 400 }) };
    return { partnerId: auth.user.referenceId };
  }
  if (auth.user.userType === 'employee') {
    const userRoles = auth.user.roles?.map((r) => r.name) ?? [];
    if (userRoles.includes('super_admin')) {
      const qp = new URL(request.url).searchParams.get('partnerId');
      return { partnerId: qp || null };
    }
    return { partnerId: null, error: NextResponse.json({ error: 'Forbidden — insufficient role' }, { status: 403 }) };
  }
  return { partnerId: null, error: NextResponse.json({ error: 'Forbidden — insufficient role' }, { status: 403 }) };
}

export async function GET(request: NextRequest) {
  const authOrResponse = await requireRole(request, ['partner_super_admin', 'super_admin']);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  try {
    const { partnerId, error } = resolvePartnerId(auth, request);
    if (error) return error;
    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId is required (use ?partnerId=)' }, { status: 400 });
    }

    const [staff, superAdminUser] = await Promise.all([
      db.partnerStaff.findMany({
        where: { partnerId },
        orderBy: { createdAt: 'asc' },
      }),
      db.user.findFirst({
        where: { referenceId: partnerId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          userRoles: { include: { role: { select: { name: true, displayName: true } } } },
        },
      }),
    ]);

    return NextResponse.json({
      seatLimit: SEAT_LIMIT,
      seatsUsed: 1 + staff.length,
      seatsRemaining: Math.max(0, SEAT_LIMIT - 1 - staff.length),
      superAdmin: superAdminUser
        ? {
            id: superAdminUser.id,
            name: superAdminUser.name,
            email: superAdminUser.email,
            phone: superAdminUser.phone,
            status: superAdminUser.status,
            role: superAdminUser.userRoles[0]?.role?.name || 'partner_super_admin',
            displayName: superAdminUser.userRoles[0]?.role?.displayName || 'Partner Super Admin',
            kind: 'super_admin',
          }
        : null,
      staff: staff.map((s) => ({ ...s, kind: 'staff' })),
    });
  } catch (error) {
    console.error('partner-admin/users GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authOrResponse = await requireRole(request, ['partner_super_admin', 'super_admin']);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  try {
    const { partnerId, error } = resolvePartnerId(auth, request);
    if (error) return error;
    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId is required (use ?partnerId=)' }, { status: 400 });
    }

    const body = await request.json();

    // Update mode: when body.id is supplied (with _update flag), update an
    // existing staff row instead of creating a new one. Used by the role
    // assignment page to change a staff member's role without using a new seat.
    if (body.id && body._update === true) {
      const existing = await db.partnerStaff.findUnique({ where: { id: body.id } });
      if (!existing || existing.partnerId !== partnerId) {
        return NextResponse.json({ error: 'Staff member not found in your organization' }, { status: 404 });
      }
      const newRole = typeof body.role === 'string' && body.role ? body.role : existing.role;
      const updated = await db.partnerStaff.update({
        where: { id: body.id },
        data: { role: newRole },
      });
      await logAudit({
        userId: auth.user.id,
        action: 'partner_staff_role_update',
        module: 'partner_admin',
        recordId: body.id,
        oldData: existing,
        newData: updated,
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
      return NextResponse.json({ staff: updated });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : null;
    const phone = typeof body.phone === 'string' ? body.phone.trim() : null;
    const role = typeof body.role === 'string' && body.role ? body.role : 'staff';

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (email) {
      const dup = await db.partnerStaff.findFirst({ where: { partnerId, email } });
      if (dup) {
        return NextResponse.json({ error: 'A staff member with this email already exists' }, { status: 409 });
      }
    }

    // Atomic seat-limit check + create
    let created;
    try {
      created = await db.$transaction(async (tx) => {
        const count = await tx.partnerStaff.count({ where: { partnerId } });
        if (count >= MAX_STAFF_ROWS) {
          throw new Error('SEAT_LIMIT');
        }
        return tx.partnerStaff.create({
          data: { partnerId, name, email, phone, role, status: 'active' },
        });
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'SEAT_LIMIT') {
        return NextResponse.json(
          {
            error: 'Seat limit reached',
            code: 'SEAT_LIMIT',
            detail: `Your subscription allows ${SEAT_LIMIT} seats total (1 super admin + ${MAX_STAFF_ROWS} staff). Remove a staff member before adding another.`,
            allowed: SEAT_LIMIT,
            used: SEAT_LIMIT,
          },
          { status: 402 }
        );
      }
      throw err;
    }

    await logAudit({
      userId: auth.user.id,
      action: 'partner_staff_create',
      module: 'partner_admin',
      recordId: created.id,
      newData: created,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ staff: created }, { status: 201 });
  } catch (error) {
    console.error('partner-admin/users POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authOrResponse = await requireRole(request, ['partner_super_admin', 'super_admin']);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  try {
    const { partnerId, error } = resolvePartnerId(auth, request);
    if (error) return error;
    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId is required (use ?partnerId=)' }, { status: 400 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    const existing = await db.partnerStaff.findUnique({ where: { id } });
    if (!existing || existing.partnerId !== partnerId) {
      return NextResponse.json({ error: 'Staff member not found in your organization' }, { status: 404 });
    }

    await db.partnerStaff.delete({ where: { id } });

    await logAudit({
      userId: auth.user.id,
      action: 'partner_staff_delete',
      module: 'partner_admin',
      recordId: id,
      oldData: existing,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('partner-admin/users DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
