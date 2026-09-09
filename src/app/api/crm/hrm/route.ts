import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const department = searchParams.get('department') || '';
      const branch = searchParams.get('branch') || '';
      const status = searchParams.get('status') || '';
      const search = searchParams.get('search') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const where: Record<string, unknown> = {};
      if (department) where.department = department;
      if (branch) where.branch = branch;
      if (status) where.status = status;
      if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
      const [employees, total] = await Promise.all([
        db.employee.findMany({ where, orderBy: { joinedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        db.employee.count({ where }),
      ]);
      const hrProfiles = employees.length > 0
        ? await db.employeeHRProfile.findMany({ where: { employeeId: { in: employees.map(e => e.employeeId) } } })
        : [];
      const recentAttendance = await db.employeeAttendance.findMany({ orderBy: { date: 'desc' }, take: limit });
      return NextResponse.json({
        success: true,
        data: employees.map(emp => ({ ...emp, hrProfile: hrProfiles.find(h => h.employeeId === emp.employeeId) || null })),
        total, page, totalPages: Math.ceil(total / limit),
        meta: { recentAttendance },
      });
    } catch (error) {
      console.error('HRM GET error:', error);
      if (String(error).includes('Unknown table')) return NextResponse.json({ success: true, data: [], total: 0, page: 1, totalPages: 0 });
      return NextResponse.json({ success: false, error: 'Failed to load HRM data' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { name, email, phone, department, designation, branch, role, employeeId } = body;
      if (!name || !employeeId) return NextResponse.json({ success: false, error: 'name and employeeId required' }, { status: 400 });
      const empId = employeeId || ('EMP-' + Date.now());
      const employee = await db.employee.create({
        data: { userId: auth.userId, employeeId: empId, name, email: email || '', phone: phone || '',
          department: department || '', designation: designation || '', branch: branch || '', role: role || 'counselor', status: 'active' },
      });
      await logAuditAction(auth, 'create_employee', 'Employee', employee.id, { name, employeeId: empId, department });
      return NextResponse.json({ success: true, data: employee }, { status: 201 });
    } catch (error) {
      console.error('HRM POST error:', error);
      return NextResponse.json({ success: false, error: 'Failed to create employee' }, { status: 500 });
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, name, email, phone, department, designation, branch, role, status } = body;
      if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
      const existing = await db.employee.findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (department) updateData.department = department;
      if (designation) updateData.designation = designation;
      if (branch) updateData.branch = branch;
      if (role) updateData.role = role;
      if (status) updateData.status = status;
      const employee = await db.employee.update({ where: { id }, data: updateData });
      await logAuditAction(auth, 'update_employee', 'Employee', id, { before: existing.status, after: updateData });
      return NextResponse.json({ success: true, data: employee });
    } catch (error) {
      console.error('HRM PUT error:', error);
      return NextResponse.json({ success: false, error: 'Failed to update employee' }, { status: 500 });
    }
  })(request);
}
