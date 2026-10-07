import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAuditAction } from '@/lib/auth-middleware';
import {
  requirePartnerContext,
  requirePartnerSuperAdmin,
  requireAloSuperAdmin,
} from '@/lib/partner-tenant-guard';
import { getQuota, STARTER_SEAT_LIMIT } from '@/lib/access-check-engine';

/**
 * Partner extra-seat request workflow.
 *
 * This route previously had NO authentication of any kind:
 *   - GET  returned every partner's seat requests to anonymous callers, and
 *          scoped only on a `partnerId` query parameter.
 *   - POST trusted `partnerId`, `requestedBy` and `currentLimit` from the body.
 *   - PATCH let ANY anonymous caller set `status: "APPROVED"` on any request,
 *          which is the exact escalation that defeats the partner user limit.
 *
 * Approval is now reserved for ALO Education Super Admins, and partner
 * accounts are explicitly barred from approving their own requests.
 */

const MAX_EXTRA_SEATS = 50;

// GET — seat requests for the caller's own tenant only.
export async function GET(req: NextRequest) {
  const ctx = await requirePartnerContext(req);
  if (ctx instanceof NextResponse) return ctx;

  try {
    const requests = await db.partnerUserSeatRequest.findMany({
      where: { partnerId: ctx.partnerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, partnerId: ctx.partnerId, requests });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to load seat requests.' },
      { status: 500 },
    );
  }
}

// POST — Partner Super Admin requests extra seats for their OWN tenant.
export async function POST(req: NextRequest) {
  const ctx = await requirePartnerSuperAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await req.json().catch(() => ({}));
    const requestedExtraSeats = Number(body?.requestedExtraSeats);
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';

    if (!Number.isInteger(requestedExtraSeats) || requestedExtraSeats < 1 || requestedExtraSeats > MAX_EXTRA_SEATS) {
      return NextResponse.json(
        { success: false, error: `requestedExtraSeats must be a whole number between 1 and ${MAX_EXTRA_SEATS}.` },
        { status: 400 },
      );
    }
    if (reason.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please provide a reason of at least 10 characters for the extra seats.' },
        { status: 400 },
      );
    }

    // Only one open request per tenant, so a partner cannot flood ALO review.
    const pending = await db.partnerUserSeatRequest.findFirst({
      where: { partnerId: ctx.partnerId, status: 'PENDING' },
    });
    if (pending) {
      return NextResponse.json(
        { success: false, error: 'You already have a seat request awaiting ALO Education review.', requestId: pending.id },
        { status: 409 },
      );
    }

    // currentLimit is read from the server, never from the request body.
    const currentLimit = (await getQuota('PARTNER', ctx.partnerId, 'user_seats')) || STARTER_SEAT_LIMIT;

    const request = await db.partnerUserSeatRequest.create({
      data: {
        partnerId: ctx.partnerId,
        requestedBy: ctx.userId,
        currentLimit,
        requestedExtraSeats,
        reason,
        status: 'PENDING',
      },
    });

    await logAuditAction(ctx, 'PARTNER_SEAT_REQUEST_CREATED', 'PartnerUserSeatRequest', request.id, {
      partnerId: ctx.partnerId,
      currentLimit,
      requestedExtraSeats,
      reason,
    });

    return NextResponse.json({
      success: true,
      request,
      message: 'Extra seat request submitted. ALO Education Super Admin will review and approve or reject it.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to submit seat request.' },
      { status: 500 },
    );
  }
}

// PATCH — ALO Education Super Admin approves or rejects. Partners are blocked.
export async function PATCH(req: NextRequest) {
  const auth = await requireAloSuperAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const id = typeof body?.id === 'string' ? body.id : '';
    const status = String(body?.status || '').toUpperCase();
    const reviewNote = typeof body?.reviewNote === 'string' ? body.reviewNote : '';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Request id is required.' }, { status: 400 });
    }
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return NextResponse.json(
        { success: false, error: 'status must be APPROVED or REJECTED.' },
        { status: 400 },
      );
    }

    const existing = await db.partnerUserSeatRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Seat request not found.' }, { status: 404 });
    }
    if (existing.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: `This request has already been ${existing.status.toLowerCase()}.` },
        { status: 409 },
      );
    }

    // Approval and the resulting limit increase happen together, so an
    // approved request can never be left without its extra seats applied.
    const request = await db.$transaction(async (tx: any) => {
      const updated = await tx.partnerUserSeatRequest.update({
        where: { id },
        data: { status, reviewedBy: auth.userId, reviewNote },
      });

      if (status === 'APPROVED') {
        const assignment = await tx.partnerPackageAssignment.findFirst({
          where: { partnerId: existing.partnerId, status: 'active' },
        });
        const newLimit = (existing.currentLimit || STARTER_SEAT_LIMIT) + existing.requestedExtraSeats;
        if (assignment) {
          await tx.partnerPackageAssignment.update({
            where: { id: assignment.id },
            data: { seatOverride: newLimit },
          }).catch(() => null);
        }
      }
      return updated;
    });

    await logAuditAction(auth, `PARTNER_SEAT_REQUEST_${status}`, 'PartnerUserSeatRequest', id, {
      partnerId: existing.partnerId,
      previousLimit: existing.currentLimit,
      requestedExtraSeats: existing.requestedExtraSeats,
      reviewNote,
    });

    return NextResponse.json({
      success: true,
      request,
      message: `Seat request ${status.toLowerCase()}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to review seat request.' },
      { status: 500 },
    );
  }
}
