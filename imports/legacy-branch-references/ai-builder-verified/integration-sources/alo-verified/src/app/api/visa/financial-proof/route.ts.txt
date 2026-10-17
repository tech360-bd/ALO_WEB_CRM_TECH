import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appendTimeline } from '@/lib/visa-readiness';
import { verifyAuth } from '@/lib/auth';

// ============================================================
// VISA FINANCIAL PROOF API
// GET  /api/visa/financial-proof?studentId=...  → latest review
// POST /api/visa/financial-proof                → create / upsert review
// PUT  /api/visa/financial-proof                → update existing review
// ============================================================

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }
    const review = await db.financialProofReview.findFirst({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ review });
  } catch (error) {
    console.error('Financial proof GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }
    const data = {
      studentId: body.studentId,
      applicationId: body.applicationId || null,
      visaFileId: body.visaFileId || null,
      bankStatementStatus: body.bankStatementStatus || 'missing',
      bankSolvencyStatus: body.bankSolvencyStatus || 'missing',
      sponsorLetterStatus: body.sponsorLetterStatus || 'missing',
      affidavitStatus: body.affidavitStatus || 'missing',
      taxDocumentStatus: body.taxDocumentStatus || 'missing',
      incomeSourceStatus: body.incomeSourceStatus || 'missing',
      depositReceiptStatus: body.depositReceiptStatus || 'missing',
      fundsMaturityNote: body.fundsMaturityNote || null,
      reviewerNote: body.reviewerNote || null,
      reviewerId: body.reviewerId || null,
      riskFlag: body.riskFlag || 'low',
      finalFinanceStatus: body.finalFinanceStatus || 'pending',
      reviewedAt: body.reviewedAt ? new Date(body.reviewedAt) : null,
    };
    const review = await db.financialProofReview.create({ data });
    await appendTimeline({
      studentId: body.studentId,
      eventType: 'financial_review',
      title: 'Financial proof review created',
      actorType: 'employee',
      metadata: { reviewId: review.id, riskFlag: review.riskFlag },
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Financial proof POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const update: Record<string, string | null | Date> = {};
    const allowedFields = [
      'bankStatementStatus', 'bankSolvencyStatus', 'sponsorLetterStatus',
      'affidavitStatus', 'taxDocumentStatus', 'incomeSourceStatus', 'depositReceiptStatus',
      'fundsMaturityNote', 'reviewerNote', 'reviewerId', 'riskFlag', 'finalFinanceStatus',
    ];
    for (const f of allowedFields) {
      if (body[f] !== undefined) update[f] = body[f];
    }
    if (body.finalFinanceStatus === 'approved' || body.finalFinanceStatus === 'rejected') {
      update.reviewedAt = new Date();
    }
    const review = await db.financialProofReview.update({
      where: { id: body.id },
      data: update,
    });
    return NextResponse.json({ review });
  } catch (error) {
    console.error('Financial proof PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
