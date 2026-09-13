import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    const branches = await (db as any).employeeBranch.findMany({ orderBy: { name: 'asc' } }).catch(() => []);

    return NextResponse.json({ success: true, branches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Admin/Super Admin required' }, { status: 403 });

    const body = await req.json();
    const { name, code, country, city, address, managerId } = body;
    if (!name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 });

    const branch = await (db as any).employeeBranch.create({
      data: { name, code: code || name.toUpperCase().replace(/\s+/g,'_'), country: country || '', city: city || '', address: address || '', managerId: managerId || null },
    });

    await logAuditAction(auth, 'BRANCH_CREATED', 'EmployeeBranch', branch.id, { name });

    return NextResponse.json({ success: true, data: branch });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
