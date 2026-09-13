import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('hr_manager');
    const where: any = {};
    if (status) where.status = status;
    if (employeeId) {
      if (!isSuper && employeeId !== auth.userId) return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
      where.employeeId = employeeId;
    } else if (!isSuper) {
      where.employeeId = auth.userId;
    }

    const requests = await (db as any).employeePermissionRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }).catch(() => []);

    return NextResponse.json({ success: true, requests, count: requests.length });
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
    const { featureKey, action, scopeType, scopeId, duration, reason } = body;
    if (!featureKey || !reason) return NextResponse.json({ success: false, error: 'featureKey and reason required' }, { status: 400 });

    // Employee cannot approve own permission request — enforced via status requested
    const request = await (db as any).employeePermissionRequest.create({
      data: {
        employeeId: auth.userId,
        featureKey,
        action: action || 'view',
        scopeType: scopeType || 'own',
        scopeId: scopeId || '',
        duration: duration || '',
        reason,
        status: 'requested',
      },
    });

    await logAuditAction(auth, 'PERMISSION_REQUESTED', 'EmployeePermissionRequest', request.id, { featureKey, action, reason });

    // Notify super admin
    try {
      await db.portalNotification.create({
        data: {
          userId: 'super_admin',
          title: 'New Permission Request',
          message: `${auth.name} requested ${action} on ${featureKey} — Reason: ${reason}`,
          type: 'permission_request',
        },
      });
    } catch {}

    return NextResponse.json({ success: true, data: request, message: 'Permission request submitted — workflow REQUESTED → REVIEWING → APPROVED/REJECTED → ACTIVE' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('hr_manager');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Admin/HR/Super Admin required to approve' }, { status: 403 });

    const body = await req.json();
    const { id, status, reviewNote } = body;
    if (!id || !status) return NextResponse.json({ success: false, error: 'id and status required' }, { status: 400 });

    // Separation of duties: cannot approve own request
    const existing = await (db as any).employeePermissionRequest.findUnique({ where: { id } }).catch(() => null);
    if (existing && existing.employeeId === auth.userId) {
      return NextResponse.json({ success: false, error: 'Cannot approve own permission request — separation of duties' }, { status: 403 });
    }

    const updated = await (db as any).employeePermissionRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy: auth.userId,
        reviewedAt: new Date(),
        ...(status === 'approved' ? { approvedBy: auth.userId, approvedAt: new Date() } : {}),
      },
    });

    // If approved, create temporary permission
    if (status === 'approved' && existing) {
      const durationDays = parseInt(existing.duration) || 7;
      await (db as any).employeeTemporaryPermission.create({
        data: {
          employeeId: existing.employeeId,
          featureKey: existing.featureKey,
          action: existing.action,
          scopeType: existing.scopeType,
          scopeId: existing.scopeId,
          grantedBy: auth.userId,
          approvedBy: auth.userId,
          reason: existing.reason,
          startDate: new Date(),
          endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      }).catch(() => {});
    }

    await logAuditAction(auth, `PERMISSION_${status.toUpperCase()}`, 'EmployeePermissionRequest', id, { status, reviewNote });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
