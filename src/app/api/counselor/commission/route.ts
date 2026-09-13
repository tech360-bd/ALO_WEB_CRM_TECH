import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const where: any = { employeeId: auth.userId };
    const commissions = await db.employeeCommission.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    const total = commissions.reduce((s, c) => s + (c.amount || 0), 0);
    const paid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0);
    const pending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.amount || 0), 0);

    // Privacy mode: only show to self, manager, finance, super_admin
    const canSeeAmount = auth.roles.includes('counselor') || auth.roles.includes('super_admin') || auth.roles.includes('admin') || auth.roles.includes('finance') || auth.roles.includes('branch_manager');
    if (!canSeeAmount) return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });

    // If counselor viewing own, mask detailed breakdown? No, self can see own. Others need finance role.
    const sanitized = commissions.map(c => ({
      id: c.id,
      studentId: c.studentId,
      amount: c.amount,
      status: c.status,
      type: (c as any).type || 'commission',
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ success: true, commissions: sanitized, summary: { total, paid, pending } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
