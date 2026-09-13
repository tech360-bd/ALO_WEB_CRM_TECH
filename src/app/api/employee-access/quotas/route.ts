import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

// Quota engine: CHECK → ALLOW/REJECT → RECORD usage
export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || auth.userId;
    const partnerId = searchParams.get('partnerId');

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin');
    if (employeeId !== auth.userId && !isSuper) {
      return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    // Employee quotas from Employee model quotaUsage?
    const employee = await db.portalUser.findUnique({ where: { id: employeeId } }).catch(() => null);
    const usage = await (db as any).quotaUsage.findMany({ where: { userId: employeeId }, orderBy: { createdAt: 'desc' }, take: 50 }).catch(() => []);

    // Partner quotas
    let partnerQuota = null;
    if (partnerId) {
      partnerQuota = await (db as any).partnerQuota.findMany({ where: { partnerId } }).catch(() => []);
    }

    return NextResponse.json({
      success: true,
      employeeQuotas: usage,
      partnerQuotas: partnerQuota,
      engine: 'CHECK_BEFORE_ACTION → ALLOW/REJECT → RECORD_USAGE with audit',
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
    const { featureKey, requestedAmount, reason, partnerId } = body;
    if (!featureKey) return NextResponse.json({ success: false, error: 'featureKey required' }, { status: 400 });

    // Check quota before action
    const currentUsage = await (db as any).quotaUsage.count({ where: { userId: auth.userId, featureKey } }).catch(() => 0);
    const limit = 100; // default — should be from package

    if (currentUsage >= limit) {
      // Create extra quota request
      const extraRequest = await (db as any).extraQuotaRequest.create({
        data: {
          partnerId: partnerId || auth.userId,
          featureKey,
          requestedAmount: requestedAmount || 10,
          reason: reason || 'Quota exceeded',
          status: 'pending',
        },
      }).catch(() => null);

      await logAuditAction(auth, 'QUOTA_EXCEEDED', 'QuotaUsage', auth.userId, { featureKey, currentUsage, limit });

      return NextResponse.json({
        success: false,
        error: 'Quota exceeded — extra quota request created',
        currentUsage,
        limit,
        extraRequest,
        allowed: false,
      }, { status: 429 });
    }

    // Record usage
    const usage = await (db as any).quotaUsage.create({
      data: {
        userId: auth.userId,
        featureKey,
        amount: 1,
      },
    }).catch(() => null);

    await logAuditAction(auth, 'QUOTA_USED', 'QuotaUsage', auth.userId, { featureKey });

    return NextResponse.json({ success: true, allowed: true, usage, currentUsage: currentUsage + 1, limit });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
