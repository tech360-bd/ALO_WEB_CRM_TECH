// ============================================================
// /api/crm/ucc/form-fill/approve
// POST — Approve or reject an AI-suggested autofill value
// High-risk fields (passport, financial, identity) require
// ADMIN-level approval. Normal fields require COUNSELOR+.
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const HIGH_RISK_ROLES = ['SUPER_ADMIN', 'ADMIN'];
const STANDARD_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER'];

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { suggestionId, action, correctedValue, rejectionReason } = await request.json() as {
      suggestionId: string;
      action: 'approve' | 'reject';
      correctedValue?: string;
      rejectionReason?: string;
    };

    if (!suggestionId || !action) {
      return NextResponse.json(
        { success: false, error: 'suggestionId and action (approve/reject) are required.' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'action must be "approve" or "reject".' }, { status: 400 });
    }

    const suggestion = await db.formFillSuggestion.findUnique({ where: { id: suggestionId } });
    if (!suggestion) {
      return NextResponse.json({ success: false, error: 'Suggestion not found.' }, { status: 404 });
    }

    if (suggestion.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Suggestion has already been ${suggestion.status}.` },
        { status: 409 }
      );
    }

    // High-risk fields require elevated role
    const primaryRole = auth.roles?.[0] || auth.userType || '';
    if (suggestion.isHighRisk && !HIGH_RISK_ROLES.includes(primaryRole)) {
      return NextResponse.json(
        {
          success: false,
          error: 'High-risk field autofill requires ADMIN or SUPER_ADMIN approval.',
          requiresElevatedRole: true,
        },
        { status: 403 }
      );
    }

    if (!STANDARD_ROLES.includes(primaryRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const finalValue = action === 'approve'
      ? (correctedValue ?? suggestion.suggestedValue)
      : suggestion.suggestedValue;

    const updated = await db.formFillSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        suggestedValue: finalValue,
        approvedBy: action === 'approve' ? auth.userId : undefined,
        approvedAt: action === 'approve' ? new Date() : undefined,
        rejectedBy: action === 'reject' ? auth.userId : undefined,
        rejectedAt: action === 'reject' ? new Date() : undefined,
        rejectionReason: rejectionReason || '',
      },
    });

    await logAuditAction(
      auth,
      action === 'approve' ? 'AUTOFILL_APPROVED' : 'AUTOFILL_REJECTED',
      'FormFillSuggestion',
      suggestionId,
      {
        formField: suggestion.formField,
        targetEntity: suggestion.targetEntity,
        isHighRisk: suggestion.isHighRisk,
        correctedValue: correctedValue ? 'provided' : 'unchanged',
      }
    );

    return NextResponse.json({ success: true, suggestion: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const url = new URL(request.url);
    const ocrJobId = url.searchParams.get('ocrJobId');
    const status = url.searchParams.get('status') || 'pending';
    const targetEntityId = url.searchParams.get('targetEntityId');

    const where: Record<string, unknown> = { status };
    if (ocrJobId) where.ocrJobId = ocrJobId;
    if (targetEntityId) where.targetEntityId = targetEntityId;

    const suggestions = await db.formFillSuggestion.findMany({
      where,
      include: { ocrJob: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, suggestions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
