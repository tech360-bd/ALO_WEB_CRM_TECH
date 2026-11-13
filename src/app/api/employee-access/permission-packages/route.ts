import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';

const id = z.string().trim().min(1).max(191);
const Permission = z.object({
  featureKey: id.regex(/^[a-zA-Z0-9_.-]+$/),
  action: z.enum(['view','create','edit','submit','accept','reject','approve','verify','send','download','upload','export','assign','reassign','archive','configure','manage','escalate','generate','publish','delete']),
  scopeType: z.enum(['GLOBAL','COUNTRY','BRANCH','OFFICE','DEPARTMENT','TEAM','ASSIGNED','OWN','RECORD']),
  scopeId: z.string().trim().max(191).default(''),
  isEnabled: z.boolean().default(true), requiresApproval: z.boolean().default(false),
}).strict().refine(value => ['GLOBAL','OWN','ASSIGNED'].includes(value.scopeType) || !!value.scopeId, { message: 'Bounded scope requires its persisted identifier.' });
const Package = z.object({ id: id.optional(), name: z.string().trim().min(3).max(100), description: z.string().trim().max(1000).default(''), permissions: z.array(Permission).max(200), reason: z.string().trim().min(8).max(500), isSystem: z.literal(false).optional() }).strict();
const Assignment = z.discriminatedUnion('operation', [
  z.object({ operation: z.literal('assign'), employeeId: id, packageId: id, startsAt: z.string().datetime(), expiresAt: z.string().datetime().nullable(), reason: z.string().trim().min(8).max(500) }).strict(),
  z.object({ operation: z.literal('revoke'), assignmentId: id, reason: z.string().trim().min(8).max(500) }).strict(),
]);
async function authority(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.actingAsSessionId || auth.actorUserId !== auth.userId || ![auth.userType, ...auth.roles].some(role => role.toUpperCase() === 'SUPER_ADMIN')) return NextResponse.json({ success: false, error: 'A non-acting Super Admin session is required.' }, { status: 403 });
  return auth;
}
export async function GET(req: NextRequest) {
  try {
    const auth = await authority(req); if (auth instanceof NextResponse) return auth;
    const [employeePackages, partnerPackages, assignments] = await Promise.all([
      db.permissionPackage.findMany({ orderBy: { updatedAt: 'desc' }, take: 100 }),
      db.partnerPackage.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      db.employeePermissionPackageAssignment.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
    ]);
    return NextResponse.json({ success: true, employeePackages, partnerPackages, assignments });
  } catch { return NextResponse.json({ success: false, error: 'Permission packages are unavailable.' }, { status: 503 }); }
}
export async function POST(req: NextRequest) {
  try {
    const auth = await authority(req); if (auth instanceof NextResponse) return auth;
    const parsed = Package.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid package. Check exact action, scope identifier and change reason.' }, { status: 400 });
    const { id: packageId, reason, isSystem: _isSystem, ...input } = parsed.data;
    const duplicateKeys = input.permissions.map(p => `${p.featureKey}:${p.action}:${p.scopeType}:${p.scopeId}`);
    if (new Set(duplicateKeys).size !== duplicateKeys.length) return NextResponse.json({ success: false, error: 'Duplicate permission entries are not allowed.' }, { status: 400 });
    const previous = packageId ? await db.permissionPackage.findUnique({ where: { id: packageId } }) : null;
    if (packageId && !previous) return NextResponse.json({ success: false, error: 'Package not found.' }, { status: 404 });
    const data = await db.$transaction(async tx => {
      const fields = { name: input.name, description: input.description, permissions: JSON.stringify(input.permissions) };
      const result = packageId ? await tx.permissionPackage.update({ where: { id: packageId }, data: fields }) : await tx.permissionPackage.create({ data: { ...fields, isSystem: false } });
      await writePortalAudit(tx, auth, packageId ? 'PERMISSION_PACKAGE_UPDATED' : 'PERMISSION_PACKAGE_CREATED', 'PermissionPackage', result.id, { reason, previous, current: result }, req);
      return result;
    });
    return NextResponse.json({ success: true, data }, { status: packageId ? 200 : 201 });
  } catch { return NextResponse.json({ success: false, error: 'Package could not be saved and audited. Names must be unique.' }, { status: 503 }); }
}
export async function PATCH(req: NextRequest) {
  try {
    const auth = await authority(req); if (auth instanceof NextResponse) return auth;
    const parsed = Assignment.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid assignment request.' }, { status: 400 });
    const input = parsed.data;
    if (input.operation === 'assign') {
      const [employee, pkg] = await Promise.all([db.employee.findUnique({ where: { id: input.employeeId } }), db.permissionPackage.findUnique({ where: { id: input.packageId } })]);
      if (!employee || !pkg) return NextResponse.json({ success: false, error: 'Employee or package not found.' }, { status: 404 });
      if (employee.userId === auth.userId) return NextResponse.json({ success: false, error: 'Self-grant is not permitted.' }, { status: 403 });
      if (employee.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'Employee must be active.' }, { status: 409 });
      if (input.expiresAt && new Date(input.expiresAt) <= new Date(input.startsAt)) return NextResponse.json({ success: false, error: 'Expiry must follow start time.' }, { status: 400 });
    }
    const result = await db.$transaction(async tx => {
      if (input.operation === 'revoke') {
        const previous = await tx.employeePermissionPackageAssignment.findUnique({ where: { id: input.assignmentId } });
        if (!previous) return null;
        const current = await tx.employeePermissionPackageAssignment.update({ where: { id: previous.id }, data: { status: 'revoked', isActive: false } });
        await writePortalAudit(tx, auth, 'PERMISSION_PACKAGE_REVOKED', 'EmployeePermissionPackageAssignment', current.id, { reason: input.reason, previous, current }, req);
        return current;
      }
      const current = await tx.employeePermissionPackageAssignment.create({ data: { employeeId: input.employeeId, packageId: input.packageId, assignedBy: auth.actorUserId, startsAt: new Date(input.startsAt), expiresAt: input.expiresAt ? new Date(input.expiresAt) : null, status: 'active', isActive: true } });
      await writePortalAudit(tx, auth, 'PERMISSION_PACKAGE_ASSIGNED', 'EmployeePermissionPackageAssignment', current.id, { reason: input.reason, current }, req);
      return current;
    });
    if (!result) return NextResponse.json({ success: false, error: 'Assignment not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: result });
  } catch { return NextResponse.json({ success: false, error: 'Assignment could not be saved and audited.' }, { status: 503 }); }
}
