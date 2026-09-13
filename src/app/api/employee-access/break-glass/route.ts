import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { reason, scopeType, scopeId, durationHours } = body;
    if (!reason) return NextResponse.json({ success: false, error: 'Reason required for BREAK_GLASS_ACCESS' }, { status: 400 });

    // Require approver for break glass — super_admin or emergency approver
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper) {
      // Create pending break glass request
      const request = await (db as any).employeeBreakGlassAccess.create({
        data: {
          employeeId: auth.userId,
          reason,
          scopeType: scopeType || 'global',
          scopeId: scopeId || '',
          startAt: new Date(),
          expiresAt: new Date(Date.now() + (durationHours || 2) * 60 * 60 * 1000),
          status: 'pending',
        },
      });

      await logAuditAction(auth, 'BREAK_GLASS_REQUESTED', 'EmployeeBreakGlassAccess', request.id, { reason, scopeType });

      return NextResponse.json({ success: true, data: request, message: 'Break glass access requested — requires approver, every action audited' });
    }

    // Super admin can directly grant break glass
    const access = await (db as any).employeeBreakGlassAccess.create({
      data: {
        employeeId: auth.userId,
        reason,
        approverId: auth.userId,
        scopeType: scopeType || 'global',
        scopeId: scopeId || '',
        startAt: new Date(),
        expiresAt: new Date(Date.now() + (durationHours || 2) * 60 * 60 * 1000),
        status: 'active',
      },
    });

    await logAuditAction(auth, 'BREAK_GLASS_GRANTED', 'EmployeeBreakGlassAccess', access.id, { reason, scopeType, expiresAt: access.expiresAt });

    return NextResponse.json({ success: true, data: access, banner: 'BREAK_GLASS_ACCESS ACTIVE — Every action audited' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const accesses = await (db as any).employeeBreakGlassAccess.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }).catch(() => []);

    return NextResponse.json({ success: true, accesses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
