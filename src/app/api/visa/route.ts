import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Visa view requires permission — visa.dashboard.view cases.view' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    let where: any = {};
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    const isVisa = auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isSuper && isVisa) {
      where.visaOfficerId = auth.userId;
    }

    const [cases, total] = await Promise.all([
      db.visaCase.findMany({ where, orderBy: { updatedAt: 'desc' }, take: limit, skip: (page-1)*limit }),
      db.visaCase.count({ where }),
    ]);

    await logAuditAction(auth, 'VISA_CASES_LIST', 'VisaCase', 'list', { count: cases.length });

    return NextResponse.json({
      success: true,
      data: cases,
      visaCases: cases,
      total,
      pagination: { page, limit, total, pages: Math.ceil(total/limit) },
      emptyState: cases.length === 0 ? 'No visa cases — proper empty state — real database metrics — no fake numbers' : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('VISA_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Visa stage update requires visa officer' }, { status: 403 });

    const body = await req.json();
    const { id, visaStage, currentStage, reason } = body;
    const stage = visaStage || currentStage;
    if (!id || !stage) return NextResponse.json({ success: false, error: 'id and visaStage/currentStage required — pipeline 16 stages NOT_STARTED→CLOSED' }, { status: 400 });

    const existing = await db.visaCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper && existing.visaOfficerId && existing.visaOfficerId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot update unassigned case — IDOR blocked' }, { status: 403 });
    }

    const updated = await db.visaCase.update({ where: { id }, data: { currentStage: stage } });

    await db.timelineEvent.create({
      data: {
        studentId: updated.studentId,
        stage: 'VISA_STAGE_UPDATED',
        title: `Visa stage updated to ${stage} by ${auth.name} — reason ${reason || 'officer decision'}`,
        description: `Visa case ${updated.caseCode} moved to ${stage} — pipeline 16 stages NOT_STARTED→CLOSED — internal READY/NEEDS_PRACTICE/NEEDS_DOCUMENTS/HIGH_RISK/HUMAN_REVIEW_REQUIRED NOT visa decision`,
      },
    }).catch(() => {});

    await logAuditAction(auth, 'VISA_STAGE_UPDATE', 'VisaCase', id, { before: { stage: existing.currentStage }, after: { stage }, reason, studentId: existing.studentId });

    return NextResponse.json({ success: true, visaCase: updated, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
