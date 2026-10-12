import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth as requireAuthApi, requireRole } from '@/lib/api-auth';
import { requireAuth, requirePermission, isErrorResponse, auditLog, parsePagination } from '@/lib/access-control';

const VISA_STATUS_TRANSITIONS: Record<string, string[]> = {
  NOT_STARTED: ['IN_PROGRESS', 'SUBMITTED'],
  IN_PROGRESS: ['SUBMITTED', 'ON_HOLD'],
  SUBMITTED: ['DECISION_PENDING', 'WITHDRAWN'],
  DECISION_PENDING: ['APPROVED', 'REJECTED', 'WITHDRAWN'],
  APPROVED: [],
  REJECTED: ['RE_APPLIED'],
  WITHDRAWN: ['NOT_STARTED', 'IN_PROGRESS'],
  ON_HOLD: ['IN_PROGRESS', 'WITHDRAWN'],
  RE_APPLIED: ['SUBMITTED'],
};

// ─── GET: List visa applications ─────────────────────────────

export async function GET(req: NextRequest) {
  const apiAuth = await requireAuthApi(req);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const sp = req.nextUrl.searchParams;

    // Permission: applications.view_all or own
    if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
      const perm = await requirePermission(req, 'applications.view_all');
      if (isErrorResponse(perm)) {
        // Allow students to see their own visa applications
        if (auth.user.role !== 'STUDENT') return perm;
      }
    }

    const { page, limit, skip } = parsePagination(sp);

    const where: Record<string, unknown> = {};
    if (sp.get('status')) where.status = sp.get('status');
    if (sp.get('country')) where.country = sp.get('country');

    // Students see only own
    if (auth.user.role === 'STUDENT') {
      const student = await db.student.findFirst({ where: { email: auth.user.email } });
      if (student) where.studentId = student.id;
    }

    const [data, total] = await Promise.all([
      db.visaApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.visaApplication.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, meta: { page, limit, total } });
  } catch (error) {
    console.error('Error listing visa applications:', error);
    return NextResponse.json({ success: false, error: 'Failed to list visa applications.' }, { status: 500 });
  }
}

// ─── POST: Create visa application ───────────────────────────

const createVisaSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  country: z.string().min(1, 'Country is required'),
  visaType: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, 'applications.update_all');
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createVisaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Validate linked application exists
    const app = await db.application.findUnique({ where: { id: parsed.data.applicationId } });
    if (!app) {
      return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
    }

    const appNo = `VISA-${Date.now().toString(36).toUpperCase()}`;
    const visa = await db.visaApplication.create({
      data: {
        applicationId: appNo,
        studentId: app.studentId,
        country: parsed.data.country,
        visaType: parsed.data.visaType || undefined,
        notes: parsed.data.notes || undefined,
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'VISA_CREATE',
      resource: 'VisaApplication',
      resourceId: visa.id,
      details: { country: parsed.data.country, studentId: app.studentId },
    });

    return NextResponse.json({ success: true, data: visa }, { status: 201 });
  } catch (error) {
    console.error('Error creating visa application:', error);
    return NextResponse.json({ success: false, error: 'Failed to create visa application.' }, { status: 500 });
  }
}

// ─── PATCH: Update visa status/info ──────────────────────────

const patchVisaSchema = z.object({
  id: z.string().min(1),
  status: z.string().optional(),
  submissionDate: z.string().optional(),
  decisionDate: z.string().optional(),
  outcome: z.string().optional(),
  visaGrantDate: z.string().optional(),
  expiryDate: z.string().optional(),
  casNumber: z.string().optional(),
  gwfNumber: z.string().optional(),
  notes: z.string().optional(),
  documentsJson: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const apiAuth = await requireAuthApi(req);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  // Only VISA_OFFICER, VISA_INTERVIEW_OFFICER, or higher roles
  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'VISA_OFFICER', 'VISA_INTERVIEW_OFFICER', 'APPLICATION_TEAM'];
  if (!allowedRoles.includes(auth.user.role)) {
    return NextResponse.json({ success: false, error: 'Permission denied. Visa officer or higher role required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = patchVisaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const existing = await db.visaApplication.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Visa application not found.' }, { status: 404 });
    }

    // Validate status transitions
    if (parsed.data.status && parsed.data.status !== existing.status) {
      const allowed = VISA_STATUS_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(parsed.data.status)) {
        return NextResponse.json({ success: false, error: `Invalid transition: ${existing.status} → ${parsed.data.status}` }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status) updateData.status = parsed.data.status;
    if (parsed.data.submissionDate) updateData.submissionDate = new Date(parsed.data.submissionDate);
    if (parsed.data.decisionDate) updateData.decisionDate = new Date(parsed.data.decisionDate);
    if (parsed.data.outcome) updateData.outcome = parsed.data.outcome;
    if (parsed.data.visaGrantDate) updateData.visaGrantDate = new Date(parsed.data.visaGrantDate);
    if (parsed.data.expiryDate) updateData.expiryDate = new Date(parsed.data.expiryDate);
    if (parsed.data.casNumber) updateData.casNumber = parsed.data.casNumber;
    if (parsed.data.gwfNumber) updateData.gwfNumber = parsed.data.gwfNumber;
    if (parsed.data.notes) updateData.notes = parsed.data.notes;
    if (parsed.data.documentsJson) updateData.documentsJson = parsed.data.documentsJson;

    const visa = await db.visaApplication.update({
      where: { id: parsed.data.id },
      data: updateData,
    });

    await auditLog({
      userId: auth.user.id,
      action: 'VISA_UPDATE',
      resource: 'VisaApplication',
      resourceId: parsed.data.id,
      details: { from: existing.status, to: parsed.data.status || existing.status },
    });

    return NextResponse.json({ success: true, data: visa });
  } catch (error) {
    console.error('Error updating visa application:', error);
    return NextResponse.json({ success: false, error: 'Failed to update visa application.' }, { status: 500 });
  }
}
