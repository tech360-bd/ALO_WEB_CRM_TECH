import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logSecurityAudit, validateRequestAccess } from '@/lib/access-control/central-security-engine';

export async function POST(req: Request) {
  try {
    const { adminId, exitingEmployeeId, targetEmployeeId } = await req.json();

    if (!adminId || !exitingEmployeeId || !targetEmployeeId) {
      return NextResponse.json({ error: 'Missing reassignment parameters' }, { status: 400 });
    }

    const access = await validateRequestAccess({ userId: adminId }, 'employees', 'reassign');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason || 'Unauthorized' }, { status: 403 });
    }

    const exitingEmp = await db.employee.findUnique({ where: { id: exitingEmployeeId } });
    const targetEmp = await db.employee.findUnique({ where: { id: targetEmployeeId } });

    if (!exitingEmp || !targetEmp) {
      return NextResponse.json({ error: 'Exiting or Target employee not found' }, { status: 404 });
    }

    // Reassign leads/students assigned to exiting employee
    const reassignedLeads = await db.partnerLead.updateMany({
      where: { assignedCounselorId: exitingEmp.userId },
      data: { assignedCounselorId: targetEmp.userId, assignedCounselorName: targetEmp.name },
    });

    const reassignedTasks = await db.counselorTask.updateMany({
      where: { employeeId: exitingEmp.id },
      data: { employeeId: targetEmp.id },
    });

    // Record reassignment log
    const logRecord = await db.employeeReassignment.create({
      data: {
        exitingEmployeeId,
        targetEmployeeId,
        reassignedBy: adminId,
        studentsCount: reassignedLeads.count,
        tasksCount: reassignedTasks.count,
        status: 'completed',
      },
    });

    await logSecurityAudit({
      actorId: adminId,
      actorRole: 'Admin',
      action: 'WORK_REASSIGNMENT_EXECUTED',
      targetType: 'Employee',
      targetId: exitingEmployeeId,
      newValue: JSON.stringify({ targetEmployeeId, studentsReassigned: reassignedLeads.count }),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully reassigned ${reassignedLeads.count} leads and ${reassignedTasks.count} tasks to ${targetEmp.name}.`,
      reassignment: logRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error executing work reassignment' }, { status: 500 });
  }
}
