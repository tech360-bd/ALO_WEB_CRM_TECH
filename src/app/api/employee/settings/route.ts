import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';

const PROTECTED_FIELDS = new Set([
  'department', 'designation', 'branch', 'joinDate', 'employeeId', 'role', 'userType', 'permissions',
  'status', 'managerId', 'reportingManagerId', 'officeId', 'country', 'scope', 'isOnline',
]);
const ALLOWED_FIELDS = new Set(['currentPassword', 'newPassword', 'privacyModeOn', 'name', 'phone', 'avatar', 'emergencyContact']);

async function requireActiveEmployee(auth: AuthContext) {
  if (['STUDENT', 'PARTNER'].includes(auth.userType.toUpperCase())) return null;
  return db.employee.findUnique({
    where: { userId: auth.userId },
    select: { id: true, employeeId: true, name: true, email: true, phone: true, department: true, designation: true, branch: true, status: true, joinedAt: true, privacyModeOn: true, isOnline: true },
  }).then((employee) => employee && employee.status.toLowerCase() === 'active' ? employee : null);
}

export async function GET(request: Request) {
  return withAuth(async (_request, auth) => {
    try {
      const employee = await requireActiveEmployee(auth);
      if (!employee) return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
      const [user, profile] = await Promise.all([
        db.portalUser.findUnique({ where: { id: auth.userId }, select: { id: true, email: true, phone: true, name: true, avatar: true, userType: true, status: true } }),
        db.employeeProfile.findUnique({
          where: { userId: auth.userId },
          select: { id: true, employeeId: true, department: true, designation: true, branch: true, joinDate: true, emergencyContact: true },
        }),
      ]);
      if (!user) return NextResponse.json({ success: false, error: 'Employee account not found.' }, { status: 404 });

      await db.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId,
          action: 'EMPLOYEE_SETTINGS_VIEWED',
          entityType: 'PortalUser',
          entityId: auth.userId,
          metadata: JSON.stringify(auth.actingAsSessionId ? { effectiveUserId: auth.userId, actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole } : { effectiveUserId: auth.userId }),
        },
      });
      return NextResponse.json({ success: true, data: { user, profile, employee: { id: employee.id, employeeId: employee.employeeId, department: employee.department, designation: employee.designation, branch: employee.branch, status: employee.status, joinedAt: employee.joinedAt }, privacyModeOn: employee.privacyModeOn, isOnline: employee.isOnline, notificationPreferences: null } });
    } catch {
      return NextResponse.json({ success: false, error: 'Employee settings are temporarily unavailable.' }, { status: 503 });
    }
  })(request);
}

export async function PUT(request: Request) {
  return withAuth(async (req, auth) => {
    if (auth.actingAsSessionId) {
      return NextResponse.json({ success: false, error: 'Account settings cannot be changed while Acting-As.' }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid settings update is required.' }, { status: 400 });
    const fields = Object.keys(body);
    const protectedFields = fields.filter((field) => PROTECTED_FIELDS.has(field));
    if (protectedFields.length) return NextResponse.json({ success: false, error: 'Employment, role, branch, manager, status, and online-presence fields are HR-controlled.', fields: protectedFields }, { status: 403 });
    const unknownFields = fields.filter((field) => !ALLOWED_FIELDS.has(field));
    if (unknownFields.length) return NextResponse.json({ success: false, error: 'Unsupported settings fields.', fields: unknownFields }, { status: 400 });

    const employee = await requireActiveEmployee(auth);
    if (!employee) return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
    if (body.privacyModeOn !== undefined && typeof body.privacyModeOn !== 'boolean') return NextResponse.json({ success: false, error: 'privacyModeOn must be boolean.' }, { status: 400 });

    const stringLimits: Record<string, number> = { name: 120, phone: 32, avatar: 2048, emergencyContact: 500 };
    for (const field of ['name', 'phone', 'avatar', 'emergencyContact']) {
      if (body[field] !== undefined && (typeof body[field] !== 'string' || body[field].length > stringLimits[field])) {
        return NextResponse.json({ success: false, error: `${field} must be text no longer than ${stringLimits[field]} characters.` }, { status: 400 });
      }
    }
    if (body.name !== undefined && !body.name.trim()) return NextResponse.json({ success: false, error: 'Name cannot be empty.' }, { status: 400 });

    const changingPassword = body.newPassword !== undefined || body.currentPassword !== undefined;
    if (changingPassword) {
      if (typeof body.currentPassword !== 'string' || typeof body.newPassword !== 'string') return NextResponse.json({ success: false, error: 'Current and new passwords are required together.' }, { status: 400 });
      if (body.newPassword.length < 8 || body.newPassword.length > 128) return NextResponse.json({ success: false, error: 'New password must be between 8 and 128 characters.' }, { status: 400 });
    }
    if (!fields.length) return NextResponse.json({ success: false, error: 'No settings changes were supplied.' }, { status: 400 });

    try {
      const currentUser = changingPassword
        ? await db.portalUser.findUnique({ where: { id: auth.userId }, select: { passwordHash: true } })
        : null;
      if (changingPassword && (!currentUser?.passwordHash || !await bcrypt.compare(body.currentPassword, currentUser.passwordHash))) {
        return NextResponse.json({ success: false, error: 'Current password is incorrect.' }, { status: 401 });
      }
      const passwordHash = changingPassword ? await bcrypt.hash(body.newPassword, 12) : null;
      await db.$transaction(async (tx) => {
        const userData: Record<string, unknown> = {};
        for (const field of ['name', 'phone', 'avatar']) if (body[field] !== undefined) userData[field] = body[field].trim();
        if (passwordHash) { userData.passwordHash = passwordHash; userData.firstLoginRequired = false; }
        if (Object.keys(userData).length) await tx.portalUser.update({ where: { id: auth.userId }, data: userData });
        if (body.emergencyContact !== undefined) {
          await tx.employeeProfile.update({ where: { userId: auth.userId }, data: { emergencyContact: body.emergencyContact.trim() } });
        }
        if (body.privacyModeOn !== undefined) await tx.employee.update({ where: { userId: auth.userId }, data: { privacyModeOn: body.privacyModeOn } });
        if (passwordHash) await tx.portalSession.updateMany({ where: { userId: auth.userId, id: { not: auth.sessionId }, revokedAt: null }, data: { revokedAt: new Date() } });
        await writePortalAudit(tx, auth, 'EMPLOYEE_SETTINGS_UPDATED', 'PortalUser', auth.userId, { fields: fields.filter((field) => !['currentPassword', 'newPassword'].includes(field)), passwordChanged: Boolean(passwordHash), privacyModeOn: body.privacyModeOn });
      });
      return NextResponse.json({ success: true, message: changingPassword ? 'Settings updated. Other sessions were revoked.' : 'Settings updated.' });
    } catch {
      return NextResponse.json({ success: false, error: 'Employee settings could not be updated.' }, { status: 503 });
    }
  })(request);
}
