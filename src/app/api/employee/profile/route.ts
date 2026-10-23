import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';

const PROTECTED_FIELDS = new Set([
  'department', 'designation', 'branch', 'joinDate', 'employeeId', 'role', 'userType',
  'permissions', 'status', 'managerId', 'reportingManagerId', 'officeId', 'country', 'scope',
]);
const SELF_EDITABLE_FIELDS = new Set(['name', 'phone', 'avatar', 'emergencyContact']);

function isEmployeeIdentity(auth: AuthContext): boolean {
  const type = auth.userType.toUpperCase();
  return !['STUDENT', 'PARTNER'].includes(type);
}

function validateText(value: unknown, field: string, maxLength: number): string | null {
  if (typeof value !== 'string' || value.length > maxLength) return `${field} must be text no longer than ${maxLength} characters.`;
  return null;
}

async function loadOwnProfile(auth: AuthContext) {
  const employee = await db.employee.findUnique({
    where: { userId: auth.userId },
    select: { id: true, employeeId: true, role: true, status: true, branch: true, department: true, designation: true, joinedAt: true },
  });
  if (!employee || employee.status.toLowerCase() !== 'active') return null;

  const profile = await db.employeeProfile.findUnique({
    where: { userId: auth.userId },
    select: {
      id: true, userId: true, employeeId: true, department: true, designation: true,
      branch: true, joinDate: true, emergencyContact: true, createdAt: true, updatedAt: true,
      user: { select: { id: true, email: true, phone: true, name: true, avatar: true, userType: true, status: true } },
    },
  });
  return profile ? { profile, employee } : null;
}

export async function GET(request: Request) {
  return withAuth(async (_request, auth) => {
    if (!isEmployeeIdentity(auth)) {
      return NextResponse.json({ success: false, error: 'Employee access only.' }, { status: 403 });
    }
    try {
      const result = await loadOwnProfile(auth);
      if (!result) return NextResponse.json({ success: false, error: 'An active employee profile was not found.' }, { status: 404 });
      await db.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId,
          action: 'EMPLOYEE_PROFILE_VIEWED',
          entityType: 'EmployeeProfile',
          entityId: result.profile.id,
          metadata: JSON.stringify(auth.actingAsSessionId ? {
            effectiveUserId: auth.userId,
            actingAsRole: auth.actingAsRole,
            actingAsSessionId: auth.actingAsSessionId,
          } : { effectiveUserId: auth.userId }),
        },
      });
      return NextResponse.json({ success: true, data: { ...result.profile, employee: result.employee } });
    } catch {
      return NextResponse.json({ success: false, error: 'Employee profile is temporarily unavailable.' }, { status: 503 });
    }
  })(request);
}

export async function PUT(request: Request) {
  return withAuth(async (req, auth) => {
    if (!isEmployeeIdentity(auth)) {
      return NextResponse.json({ success: false, error: 'Employee access only.' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'A valid profile update is required.' }, { status: 400 });
    }

    const suppliedFields = Object.keys(body);
    const protectedFields = suppliedFields.filter((field) => PROTECTED_FIELDS.has(field));
    if (protectedFields.length) {
      return NextResponse.json({ success: false, error: 'Employment role, department, branch, manager, and scope fields can only be changed through an authorized HR workflow.', fields: protectedFields }, { status: 403 });
    }
    const unknown = suppliedFields.filter((field) => !SELF_EDITABLE_FIELDS.has(field));
    if (unknown.length) {
      return NextResponse.json({ success: false, error: 'Unsupported profile fields.', fields: unknown }, { status: 400 });
    }

    const limits: Record<string, number> = { name: 120, phone: 32, avatar: 2048, emergencyContact: 500 };
    for (const field of suppliedFields) {
      const error = validateText(body[field], field, limits[field]);
      if (error) return NextResponse.json({ success: false, error }, { status: 400 });
    }
    if (typeof body.name === 'string' && !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'Name cannot be empty.' }, { status: 400 });
    }

    try {
      const existing = await loadOwnProfile(auth);
      if (!existing) return NextResponse.json({ success: false, error: 'An active employee profile was not found.' }, { status: 404 });

      const result = await db.$transaction(async (tx) => {
        const profileData = body.emergencyContact !== undefined ? { emergencyContact: body.emergencyContact.trim() } : {};
        const updatedProfile = Object.keys(profileData).length
          ? await tx.employeeProfile.update({
            where: { userId: auth.userId },
            data: profileData,
            select: { id: true, userId: true, employeeId: true, department: true, designation: true, branch: true, joinDate: true, emergencyContact: true, createdAt: true, updatedAt: true },
          })
          : existing.profile;

        const userData = Object.fromEntries(['name', 'phone', 'avatar'].filter((field) => body[field] !== undefined).map((field) => [field, body[field].trim()]));
        if (Object.keys(userData).length) await tx.portalUser.update({ where: { id: auth.userId }, data: userData });
        await writePortalAudit(tx, auth, 'EMPLOYEE_PROFILE_UPDATED', 'EmployeeProfile', existing.profile.id, { fields: suppliedFields }, req);
        return updatedProfile;
      });

      return NextResponse.json({ success: true, data: result, message: 'Profile changes saved.' });
    } catch {
      return NextResponse.json({ success: false, error: 'Employee profile could not be updated.' }, { status: 503 });
    }
  })(request);
}
