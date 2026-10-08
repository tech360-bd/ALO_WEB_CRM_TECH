import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

const REVIEW_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER', 'MARKETING',
  'super_admin', 'admin', 'marketing_manager', 'marketing',
];
const sha256 = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A valid JSON body is required' }, { status: 400 });
    }
    const studentName = typeof body.studentName === 'string' ? body.studentName.trim().slice(0, 191) : '';
    if (!studentName) return NextResponse.json({ error: 'studentName is required' }, { status: 400 });
    const email = typeof body.studentEmail === 'string' ? body.studentEmail.trim().toLowerCase() : null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'studentEmail must be valid' }, { status: 400 });
    }
    const expiresDays = Number.isInteger(body.expiresDays) ? Math.min(90, Math.max(1, body.expiresDays)) : 30;
    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);
    const invitation = await db.$transaction(async (tx) => {
      const created = await tx.reviewInvitation.create({
        data: {
          token: sha256(rawToken),
          studentId: typeof body.studentId === 'string' ? body.studentId.slice(0, 191) : null,
          studentName,
          studentEmail: email,
          studentPhone: typeof body.studentPhone === 'string' ? body.studentPhone.slice(0, 64) : null,
          counselorId: typeof body.counselorId === 'string' ? body.counselorId.slice(0, 191) : null,
          country: typeof body.country === 'string' ? body.country.slice(0, 100) : null,
          serviceType: typeof body.serviceType === 'string' ? body.serviceType.slice(0, 100) : null,
          googleReviewUrl: typeof body.googleReviewUrl === 'string' ? body.googleReviewUrl.slice(0, 1000) : null,
          facebookRecommendUrl: typeof body.facebookRecommendUrl === 'string' ? body.facebookRecommendUrl.slice(0, 1000) : null,
          campaignId: typeof body.campaignId === 'string' ? body.campaignId.slice(0, 191) : null,
          expiresAt,
        },
        select: { id: true, studentName: true, studentEmail: true, country: true, serviceType: true, status: true, sentAt: true, expiresAt: true },
      });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId,
          action: 'REVIEW_INVITATION_CREATED',
          entityType: 'ReviewInvitation',
          entityId: created.id,
          metadata: JSON.stringify({ expiresAt, createdBy: auth.userId }),
        },
      });
      return created;
    });

    return NextResponse.json({
      invitation,
      reviewUrl: `/review/${rawToken}`,
      message: 'Invitation created. Share this one-time review link with the student.',
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create review invitation' }, { status: 500 });
  }
}, { requireRoles: REVIEW_ROLES });

export const GET = withAuth(async (req) => {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'ALL';
    const allowedStatuses = new Set(['ALL', 'SENT', 'OPENED', 'SUBMITTED', 'EXPIRED']);
    if (!allowedStatuses.has(status)) return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    const parsedLimit = Number.parseInt(url.searchParams.get('limit') || '100', 10);
    const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 100)) : 100;
    const where = status === 'ALL' ? {} : { status };
    const invitations = await db.reviewInvitation.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: limit,
      // Raw bearer tokens and token hashes are never returned from a listing.
      select: {
        id: true, studentId: true, studentName: true, studentEmail: true,
        studentPhone: true, counselorId: true, country: true, serviceType: true,
        campaignId: true, status: true, sentAt: true, openedAt: true,
        submittedAt: true, expiresAt: true, reviewId: true,
      },
    });
    const reviewIds = invitations.flatMap((invitation) => invitation.reviewId ? [invitation.reviewId] : []);
    const reviews = reviewIds.length
      ? await db.studentReview.findMany({
          where: { id: { in: reviewIds } },
          select: { id: true, rating: true, moderationStatus: true, publicationStatus: true },
        })
      : [];
    const reviewMap = new Map(reviews.map((review) => [review.id, review]));
    return NextResponse.json({ invitations: invitations.map((invitation) => ({
      ...invitation,
      review: invitation.reviewId ? reviewMap.get(invitation.reviewId) || null : null,
    })) });
  } catch {
    return NextResponse.json({ error: 'Failed to list review invitations' }, { status: 500 });
  }
}, { requireRoles: REVIEW_ROLES });
