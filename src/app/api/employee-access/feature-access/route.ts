import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';
import { canAccessFeatureEngine } from '@/lib/employee-access-engine';
import { writePortalAudit } from '@/lib/transactional-audit';

const RuleInput = z.object({
  id: z.string().min(1).max(191).optional(),
  ownerType: z.enum(['EMPLOYEE', 'USER']),
  ownerId: z.string().min(1).max(191),
  featureKey: z.string().min(1).max(191).regex(/^[a-zA-Z0-9_.-]+$/),
  isEnabled: z.boolean(),
  requiresApproval: z.boolean(),
  limitValue: z.number().int().min(0).max(2147483647),
  reason: z.string().trim().min(8).max(500),
}).strict();

const ACTIONS = new Set([
  'view', 'create', 'edit', 'submit', 'accept', 'reject', 'approve', 'verify', 'send',
  'download', 'upload', 'export', 'assign', 'reassign', 'archive', 'configure', 'manage',
  'escalate', 'generate', 'publish', 'delete', 'use',
]);
const FEATURE_KEY = /^[a-z][a-z0-9_.:-]{1,99}$/;

function isSuperAdmin(auth: AuthContext): boolean {
  return auth.roles.some((role) => role.toUpperCase() === 'SUPER_ADMIN');
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const featureKey = (searchParams.get('featureKey') || '').trim().toLowerCase();
    const action = (searchParams.get('action') || 'view').trim().toLowerCase();

    if (featureKey) {
      if (!FEATURE_KEY.test(featureKey) || !ACTIONS.has(action)) {
        return NextResponse.json({ success: false, error: 'A valid featureKey and action are required.' }, { status: 400 });
      }
      const allowed = await canAccessFeatureEngine(auth.userId, auth.roles, featureKey, action);
      return NextResponse.json({ success: true, featureKey, action, allowed });
    }

    // Permission configuration is administrative data. Ordinary employees may
    // check their own access, but must not enumerate other employees' grants.
    const rules = isSuperAdmin(auth)
      ? await db.featureAccessRule.findMany({ take: 100, orderBy: { updatedAt: 'desc' } }).catch(() => [])
      : [];
    const accessibleFeatures = await Promise.all(
      ['whatsapp', 'social', 'email', 'phone', 'ai', 'application', 'student', 'document', 'finance', 'visa', 'marketing', 'partner', 'b2b', 'quota']
        .map(async (featureKey) => ({
          featureKey,
          allowed: await canAccessFeatureEngine(auth.userId, auth.roles, featureKey, 'view').catch(() => false),
        })),
    );

    return NextResponse.json({ success: true, rules, canManageRules: isSuperAdmin(auth), accessibleFeatures });
  } catch {
    return NextResponse.json({ success: false, error: 'Feature access could not be loaded.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;
    if (!isSuperAdmin(auth)) {
      return NextResponse.json({ success: false, error: 'Super Admin required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'A JSON request body is required.' }, { status: 400 });
    }
    const employeeRef = typeof body.employeeId === 'string' ? body.employeeId.trim() : '';
    const featureKey = typeof body.featureKey === 'string' ? body.featureKey.trim().toLowerCase() : '';
    const action = typeof body.action === 'string' ? body.action.trim().toLowerCase() : 'view';
    const isEnabled = typeof body.isEnabled === 'boolean' ? body.isEnabled : true;
    const requiresApproval = typeof body.requiresApproval === 'boolean' ? body.requiresApproval : false;
    const limitValue = body.limitValue === undefined ? 0 : body.limitValue;

    if (!employeeRef || employeeRef.length > 191) {
      return NextResponse.json({ success: false, error: 'employeeId is required.' }, { status: 400 });
    }
    if (!FEATURE_KEY.test(featureKey) || !ACTIONS.has(action)) {
      return NextResponse.json({ success: false, error: 'A valid featureKey and action are required.' }, { status: 400 });
    }
    if (!Number.isSafeInteger(limitValue) || limitValue < 0 || limitValue > 1_000_000) {
      return NextResponse.json({ success: false, error: 'limitValue must be an integer from 0 to 1000000.' }, { status: 400 });
    }

    const employee = await db.employee.findFirst({
      where: { OR: [{ id: employeeRef }, { userId: employeeRef }, { employeeId: employeeRef }] },
      select: { id: true, userId: true, employeeId: true },
    });
    if (!employee) return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });

    // The central access engine stores view rules under the bare key and each
    // non-view action under an exact key, e.g. employee.profile.private.edit.
    const persistedFeatureKey = action === 'view' ? featureKey : `${featureKey}.${action}`;
    const where = { ownerType: 'employee', ownerId: employee.id, featureKey: persistedFeatureKey };
    const existing = await db.featureAccessRule.findFirst({ where, select: { id: true } });
    const rule = existing
      ? await db.featureAccessRule.update({
          where: { id: existing.id },
          data: { isEnabled, limitValue, requiresApproval, updatedBy: auth.userId },
        })
      : await db.featureAccessRule.create({
          data: {
            ...where,
            isEnabled,
            limitValue,
            requiresApproval,
            createdBy: auth.userId,
            updatedBy: auth.userId,
          },
        });

    await logAuditAction(auth, existing ? 'EMPLOYEE_FEATURE_ACCESS_UPDATED' : 'EMPLOYEE_FEATURE_ACCESS_CREATED', 'FeatureAccessRule', rule.id, {
      employeeId: employee.id,
      featureKey,
      action,
      isEnabled,
      requiresApproval,
      limitValue,
    });

    return NextResponse.json({ success: true, data: rule }, { status: existing ? 200 : 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Feature access could not be saved.' }, { status: 503 });
  }
}
