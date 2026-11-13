import { db } from '@/lib/db';
import { validateRequestAccess } from '@/lib/access-control/central-security-engine';
import type { AuthContext } from '@/lib/auth-middleware';

export async function appointmentStudentScope(auth: AuthContext, action: string): Promise<string[]> {
  if (['STUDENT', 'PARTNER'].includes(auth.userType.toUpperCase())) return [];
  const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { id: true, employeeId: true, userId: true, status: true } });
  if (!employee || employee.status.toLowerCase() !== 'active') return [];
  const identifiers = [employee.id, employee.employeeId, employee.userId];
  const access = await validateRequestAccess({ userId: auth.userId }, 'employee.appointments', action, { assigneeId: auth.userId });
  if (!access.allowed) return [];
  const students = await db.student.findMany({ where: { counselorId: { in: identifiers } }, select: { id: true, studentId: true } });
  return [...new Set(students.flatMap(student => [student.id, student.studentId]))];
}
