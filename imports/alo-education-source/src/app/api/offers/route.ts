import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth, requirePermission, isErrorResponse, auditLog, parsePagination } from '@/lib/access-control';

const OFFER_STATUSES = ['PENDING_RESPONSE', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED'];

// ─── GET: List offers ───────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const sp = req.nextUrl.searchParams;

    // Permission: applications.view_all or own
    if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
      const perm = await requirePermission(req, 'applications.view_all');
      if (isErrorResponse(perm)) {
        if (auth.user.role !== 'STUDENT') return perm;
      }
    }

    const { page, limit, skip } = parsePagination(sp);

    const where: Record<string, unknown> = {};
    if (sp.get('status')) where.status = sp.get('status');
    if (sp.get('applicationId')) where.applicationId = sp.get('applicationId');

    // Students see only own
    if (auth.user.role === 'STUDENT') {
      const student = await db.student.findFirst({ where: { email: auth.user.email } });
      if (student) where.studentId = student.id;
    }

    const [data, total] = await Promise.all([
      db.offer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.offer.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, meta: { page, limit, total } });
  } catch (error) {
    console.error('Error listing offers:', error);
    return NextResponse.json({ success: false, error: 'Failed to list offers.' }, { status: 500 });
  }
}

// ─── POST: Create offer ─────────────────────────────────────

const createOfferSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  universityName: z.string().min(1, 'University name is required'),
  courseName: z.string().min(1, 'Course name is required'),
  country: z.string().min(1, 'Country is required'),
  offerType: z.string().default('CONDITIONAL'),
  conditions: z.string().optional(),
  scholarshipAmount: z.string().optional(),
  scholarshipCurrency: z.string().optional(),
  tuitionFee: z.string().optional(),
  responseDeadline: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, 'applications.update_all');
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Validate linked application exists
    const app = await db.application.findUnique({ where: { id: parsed.data.applicationId } });
    if (!app) {
      return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
    }

    const offer = await db.offer.create({
      data: {
        applicationId: parsed.data.applicationId,
        studentId: app.studentId,
        universityName: parsed.data.universityName,
        courseName: parsed.data.courseName,
        country: parsed.data.country,
        offerType: parsed.data.offerType,
        conditions: parsed.data.conditions || undefined,
        scholarshipAmount: parsed.data.scholarshipAmount || undefined,
        scholarshipCurrency: parsed.data.scholarshipCurrency || undefined,
        tuitionFee: parsed.data.tuitionFee || undefined,
        responseDeadline: parsed.data.responseDeadline ? new Date(parsed.data.responseDeadline) : undefined,
        notes: parsed.data.notes || undefined,
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'OFFER_CREATE',
      resource: 'Offer',
      resourceId: offer.id,
      details: { universityName: parsed.data.universityName, courseName: parsed.data.courseName },
    });

    return NextResponse.json({ success: true, data: offer }, { status: 201 });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json({ success: false, error: 'Failed to create offer.' }, { status: 500 });
  }
}

// ─── PATCH: Update offer status ─────────────────────────────

const patchOfferSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['ACCEPTED', 'DECLINED', 'EXPIRED']),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = patchOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const existing = await db.offer.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Offer not found.' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
      respondedAt: new Date(),
    };

    const offer = await db.offer.update({
      where: { id: parsed.data.id },
      data: updateData,
    });

    await auditLog({
      userId: auth.user.id,
      action: 'OFFER_STATUS_UPDATE',
      resource: 'Offer',
      resourceId: parsed.data.id,
      details: { from: existing.status, to: parsed.data.status },
    });

    return NextResponse.json({ success: true, data: offer });
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json({ success: false, error: 'Failed to update offer.' }, { status: 500 });
  }
}
