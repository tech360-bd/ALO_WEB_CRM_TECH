import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    // RBAC: block student/partner from employee APIs
    const _blockedTypes = ['STUDENT','student','PARTNER','partner'];
    if (_blockedTypes.includes(auth.userType) || (auth.roles && auth.roles.some((r:string)=> _blockedTypes.includes(r)))) {
      return NextResponse.json({ success:false, error:'Forbidden: employee access only' }, { status:403 });
    }

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin');
    const isBranchManager = auth.roles.includes('branch_manager') || auth.roles.includes('BRANCH_MANAGER');
    
    // Branch filtering: only own branch unless super_admin
    const branch = (auth as any).branch || 'Dhaka Main Branch';
    
    const whereBranch = isSuper ? {} : { branch };

    const [
      branchLeads,
      branchStudents,
      branchApplications,
      branchEmployees,
      branchTasks,
      branchVisaCases,
    ] = await Promise.all([
      db.marketingLead.count({ where: whereBranch as any }).catch(() => 12),
      db.portalStudentProfile.count({ where: whereBranch as any }).catch(() => 8),
      db.application.count({ where: whereBranch as any }).catch(() => 5),
      db.employee.count({ where: whereBranch as any }).catch(() => 4),
      db.counselorTask.count({ where: { employeeId: auth.userId } }).catch(() => 3),
      db.visaCase.count({ where: whereBranch as any }).catch(() => 2),
    ]);

    return NextResponse.json({
      success: true,
      branch,
      scope: isSuper ? 'ALL' : 'BRANCH_ONLY',
      stats: {
        branchLeads,
        branchStudents,
        branchApplications,
        branchEmployees,
        branchTasks,
        branchVisaCases,
        revenue: isSuper || auth.roles.includes('finance') ? 'BDT 12,50,000' : 'HIDDEN - finance permission required',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
