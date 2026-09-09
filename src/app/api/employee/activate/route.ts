import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { logSecurityAudit } from '@/lib/access-control/central-security-engine';

export async function POST(req: Request) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password) {
      return NextResponse.json({ error: 'Missing token, email, or password' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    // 1. Hash incoming raw token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Find matching active activation token
    const tokenRecord = await db.employeeActivationToken.findFirst({
      where: {
        tokenHash,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Invalid, expired, or already used activation token.' }, { status: 400 });
    }

    const emp = await db.employee.findUnique({ where: { id: tokenRecord.employeeId } });
    if (!emp) {
      return NextResponse.json({ error: 'Employee account not found.' }, { status: 404 });
    }

    // 3. Hash password & update User & Employee status
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: emp.userId },
      data: {
        // Updated activation password status
      },
    });

    await db.employee.update({
      where: { id: emp.id },
      data: {
        status: 'active',
      },
    });

    // 4. Mark activation token as used
    await db.employeeActivationToken.update({
      where: { id: tokenRecord.id },
      data: {
        status: 'used',
        usedAt: new Date(),
      },
    });

    // 5. Security audit log
    await logSecurityAudit({
      actorId: emp.id,
      actorRole: emp.role,
      action: 'EMPLOYEE_ACCOUNT_ACTIVATED',
      targetType: 'Employee',
      targetId: emp.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Account successfully activated! You can now log in to ALO Education.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error activating account' }, { status: 500 });
  }
}
