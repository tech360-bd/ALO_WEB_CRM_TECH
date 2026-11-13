import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { writePortalAudit } from '@/lib/transactional-audit';

type ActiveEmployee = { id: string; userId: string; employeeId: string; status: string };
const PERFORMANCE_SELECT = { id: true, period: true, targetLeads: true, achievedLeads: true, targetConversion: true, achievedConversion: true, targetRevenue: true, achievedRevenue: true, score: true, feedback: true, managerRating: true, createdAt: true, updatedAt: true } as const;
const EMPLOYEE_ALIASES = (employee: ActiveEmployee, profile?: { id: string; employeeId: string } | null) => [...new Set([employee.id, employee.userId, employee.employeeId, profile?.id, profile?.employeeId].filter((value): value is string => Boolean(value)))];

async function authenticateEmployee(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  const roles = [auth.userType, ...auth.roles].map((role) => role.trim().toUpperCase());
  if (auth.identityDomain !== 'user' || roles.some((role) => ['STUDENT', 'PARTNER'].includes(role))) return NextResponse.json({ success: false, error: 'Employee access only.' }, { status: 403 });
  const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { id: true, userId: true, employeeId: true, status: true } }).catch(() => null);
  if (!employee || employee.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'An active employee record is required.' }, { status: 403 });
  return { auth, employee };
}

function validNumber(value: unknown, minimum: number, maximum: number, integer = false): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum && (!integer || Number.isInteger(value));
}

export async function GET(request: NextRequest) {
  const access = await authenticateEmployee(request);
  if (access instanceof NextResponse) return access;
  const { auth, employee } = access;
  const viewAll = auth.permissions.includes('employee.performance.view_all');
  if (!viewAll && !auth.permissions.includes('employee.performance.view')) return NextResponse.json({ success: false, error: 'Performance-view permission is required.' }, { status: 403 });
  const params = request.nextUrl.searchParams;
  const pageText = params.get('page') || '1';
  const limitText = params.get('limit') || '20';
  if (!/^\d+$/.test(pageText) || !/^\d+$/.test(limitText)) return NextResponse.json({ success: false, error: 'Invalid pagination.' }, { status: 400 });
  const page = Number(pageText);
  const limit = Number(limitText);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) return NextResponse.json({ success: false, error: 'Page must be positive and limit must be between 1 and 100.' }, { status: 400 });
  const sortBy = params.get('sortBy') || 'createdAt';
  const sortOrder = params.get('sortOrder') || 'desc';
  if (!['createdAt', 'period', 'score', 'managerRating'].includes(sortBy) || !['asc', 'desc'].includes(sortOrder)) return NextResponse.json({ success: false, error: 'Invalid performance sort.' }, { status: 400 });
  const period = params.get('period')?.trim() || '';
  if (period.length > 32 || /[\u0000-\u001f]/.test(period)) return NextResponse.json({ success: false, error: 'Invalid performance period.' }, { status: 400 });
  try {
    const profile = await db.employeeProfile.findUnique({ where: { userId: auth.userId }, select: { id: true, employeeId: true } });
    const employeeIds = EMPLOYEE_ALIASES(employee, profile);
    const where = { ...(viewAll ? {} : { employeeId: { in: employeeIds } }), ...(period ? { period } : {}) };
    const [records, total, avgResult] = await Promise.all([
      db.employeePerformance.findMany({ where, orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' }, skip: (page - 1) * limit, take: limit, select: PERFORMANCE_SELECT }),
      db.employeePerformance.count({ where }),
      db.employeePerformance.aggregate({ where, _avg: { score: true, targetLeads: true, achievedLeads: true, targetConversion: true, achievedConversion: true, targetRevenue: true, achievedRevenue: true, managerRating: true } }),
    ]);
    await db.portalAuditLog.create({ data: { actorUserId: auth.actorUserId || auth.userId, action: 'EMPLOYEE_PERFORMANCE_VIEWED', entityType: 'EmployeePerformance', entityId: employee.id, metadata: JSON.stringify({ effectiveUserId: auth.userId, scope: viewAll ? 'AUTHORIZED_COMPANY' : 'SELF', count: total }) } });
    return NextResponse.json({ success: true, data: records, summary: { averageScore: avgResult._avg.score || 0, averageRating: avgResult._avg.managerRating || 0, averageTargetLeads: avgResult._avg.targetLeads || 0, averageAchievedLeads: avgResult._avg.achievedLeads || 0, averageTargetConversion: avgResult._avg.targetConversion || 0, averageAchievedConversion: avgResult._avg.achievedConversion || 0, averageTargetRevenue: avgResult._avg.targetRevenue || 0, averageAchievedRevenue: avgResult._avg.achievedRevenue || 0, totalReviews: total }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Employee performance GET error:', error);
    return NextResponse.json({ success: false, error: 'Performance information is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(request: NextRequest) {
  const access = await authenticateEmployee(request);
  if (access instanceof NextResponse) return access;
  const { auth, employee } = access;
  if (!auth.permissions.includes('employee.performance.manage')) return NextResponse.json({ success: false, error: 'Performance-management permission is required.' }, { status: 403 });
  if (!mutationOriginAllowed(request, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid performance review is required.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  const allowed = new Set(['employeeId', 'period', 'targetLeads', 'achievedLeads', 'targetConversion', 'achievedConversion', 'targetRevenue', 'achievedRevenue', 'score', 'feedback', 'managerRating']);
  if (Object.keys(input).some((key) => !allowed.has(key))) return NextResponse.json({ success: false, error: 'Unsupported performance fields.' }, { status: 400 });
  const employeeId = typeof input.employeeId === 'string' ? input.employeeId.trim() : '';
  const period = typeof input.period === 'string' ? input.period.trim() : '';
  const targetLeads = input.targetLeads ?? 0;
  const achievedLeads = input.achievedLeads ?? 0;
  const targetConversion = input.targetConversion ?? 0;
  const achievedConversion = input.achievedConversion ?? 0;
  const targetRevenue = input.targetRevenue ?? 0;
  const achievedRevenue = input.achievedRevenue ?? 0;
  const score = input.score ?? 0;
  const managerRating = input.managerRating ?? 0;
  const feedback = typeof input.feedback === 'string' ? input.feedback.trim() : '';
  if (!employeeId || employeeId.length > 191 || !period || period.length > 32 || !validNumber(targetLeads, 0, 1000000, true) || !validNumber(achievedLeads, 0, 1000000, true) || !validNumber(targetConversion, 0, 100, false) || !validNumber(achievedConversion, 0, 100, false) || !validNumber(targetRevenue, 0, 1_000_000_000, false) || !validNumber(achievedRevenue, 0, 1_000_000_000, false) || !validNumber(score, 0, 100, false) || !validNumber(managerRating, 0, 5, false) || feedback.length > 4000) return NextResponse.json({ success: false, error: 'Performance review values are invalid.' }, { status: 400 });
  try {
    const target = await db.employee.findFirst({ where: { OR: [{ id: employeeId }, { userId: employeeId }, { employeeId }], status: 'active' }, select: { id: true, userId: true, employeeId: true, status: true } });
    if (!target) return NextResponse.json({ success: false, error: 'Active review subject not found.' }, { status: 404 });
    const targetProfile = await db.employeeProfile.findUnique({ where: { userId: target.userId }, select: { id: true, employeeId: true } });
    if (EMPLOYEE_ALIASES(employee, await db.employeeProfile.findUnique({ where: { userId: auth.userId }, select: { id: true, employeeId: true } })).some((id) => EMPLOYEE_ALIASES(target, targetProfile).includes(id))) return NextResponse.json({ success: false, error: 'Managers cannot create their own performance review.' }, { status: 403 });
    const record = await db.$transaction(async (tx) => {
      const created = await tx.employeePerformance.create({ data: { employeeId: target.id, period, targetLeads, achievedLeads, targetConversion, achievedConversion, targetRevenue, achievedRevenue, score, feedback, managerRating }, select: PERFORMANCE_SELECT });
      await writePortalAudit(tx, auth, 'EMPLOYEE_PERFORMANCE_CREATED', 'EmployeePerformance', created.id, { targetEmployeeId: target.id, period, fields: ['targetLeads', 'achievedLeads', 'targetConversion', 'achievedConversion', 'targetRevenue', 'achievedRevenue', 'score', 'feedback', 'managerRating'] }, request);
      return created;
    });
    return NextResponse.json({ success: true, data: record }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Employee performance POST error:', error);
    return NextResponse.json({ success: false, error: 'Performance review could not be created.' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const access = await authenticateEmployee(request);
  if (access instanceof NextResponse) return access;
  const { auth, employee } = access;
  if (!auth.permissions.includes('employee.performance.manage')) return NextResponse.json({ success: false, error: 'Performance-management permission is required.' }, { status: 403 });
  if (!mutationOriginAllowed(request, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid review update is required.' }, { status: 400 });
  const input = body as Record<string, unknown>;
  const allowed = new Set(['id', 'achievedLeads', 'achievedConversion', 'achievedRevenue', 'score', 'feedback', 'managerRating']);
  if (Object.keys(input).some((key) => !allowed.has(key))) return NextResponse.json({ success: false, error: 'Unsupported review update fields.' }, { status: 400 });
  const id = typeof input.id === 'string' ? input.id.trim() : '';
  const updates: Record<string, unknown> = {};
  for (const [field, min, max, integer] of [['achievedLeads', 0, 1000000, true], ['achievedConversion', 0, 100, false], ['achievedRevenue', 0, 1_000_000_000, false], ['score', 0, 100, false], ['managerRating', 0, 5, false]] as const) {
    if (input[field] !== undefined) {
      if (!validNumber(input[field], min, max, integer)) return NextResponse.json({ success: false, error: `Invalid ${field}.` }, { status: 400 });
      updates[field] = input[field];
    }
  }
  if (input.feedback !== undefined) {
    if (typeof input.feedback !== 'string' || input.feedback.trim().length > 4000) return NextResponse.json({ success: false, error: 'Invalid feedback.' }, { status: 400 });
    updates.feedback = input.feedback.trim();
  }
  if (!id || id.length > 191 || !Object.keys(updates).length) return NextResponse.json({ success: false, error: 'Review id and at least one supported update are required.' }, { status: 400 });
  try {
    const existing = await db.employeePerformance.findUnique({ where: { id }, select: { id: true, employeeId: true, updatedAt: true } });
    if (!existing) return NextResponse.json({ success: false, error: 'Performance review not found.' }, { status: 404 });
    const target = await db.employee.findFirst({ where: { OR: [{ id: existing.employeeId }, { userId: existing.employeeId }, { employeeId: existing.employeeId }], status: 'active' }, select: { id: true, userId: true, employeeId: true, status: true } });
    if (!target) return NextResponse.json({ success: false, error: 'Review subject mapping is unavailable.' }, { status: 409 });
    const actorProfile = await db.employeeProfile.findUnique({ where: { userId: auth.userId }, select: { id: true, employeeId: true } });
    const targetProfile = await db.employeeProfile.findUnique({ where: { userId: target.userId }, select: { id: true, employeeId: true } });
    const actorIds = EMPLOYEE_ALIASES(employee, actorProfile);
    if (actorIds.some((alias) => EMPLOYEE_ALIASES(target, targetProfile).includes(alias))) return NextResponse.json({ success: false, error: 'Managers cannot update their own performance review.' }, { status: 403 });
    const updated = await db.$transaction(async (tx) => {
      const changed = await tx.employeePerformance.updateMany({ where: { id, updatedAt: existing.updatedAt }, data: updates });
      if (changed.count !== 1) throw new Error('review_changed');
      await writePortalAudit(tx, auth, 'EMPLOYEE_PERFORMANCE_UPDATED', 'EmployeePerformance', id, { targetEmployeeId: target.id, fields: Object.keys(updates) }, request);
      return tx.employeePerformance.findUnique({ where: { id }, select: PERFORMANCE_SELECT });
    });
    return NextResponse.json({ success: true, data: updated }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'review_changed') return NextResponse.json({ success: false, error: 'Review changed before the update was saved.' }, { status: 409 });
    console.error('Employee performance PUT error:', error);
    return NextResponse.json({ success: false, error: 'Performance review could not be updated.' }, { status: 503 });
  }
}
