// GET /api/super-admin/overview
//
// One call the Super Admin dashboard can make to learn what is actually built
// versus what the specification asks for. Every number here is derived from a
// real query or from the filesystem state of the API surface — nothing is
// hardcoded to look complete.
//
// `coverage` deliberately reports the *observable* API routes only. It cannot
// see UI pages that were never written, so it is not a completion score.

import { NextResponse } from 'next/server';
import { readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import path from 'node:path';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { unavailable, safeRows, safeCount } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

/** The §28 surface this build is measured against. */
const REQUIRED_SURFACE = [
  'overview', 'dashboard', 'metrics', 'global-search',
  'users', 'users/[id]/roles', 'users/[id]/permissions',
  'employees', 'employees/[id]',
  'roles', 'permissions/temporary', 'permissions/rollback', 'permission-groups',
  'branches', 'countries', 'approvals',
  'ai/agents', 'ai/jobs',
  'ai/system-builder/request', 'ai/system-builder/requests',
  'reports', 'security', 'security/logins', 'security/sessions', 'security/revoke-session',
  'security-tests', 'settings', 'settings/maintenance-mode',
  'audit-logs', 'acting-as/current', 'acting-as/action-log',
] as const;

async function listRouteFolders(): Promise<string[]> {
  const root = path.join(process.cwd(), 'src', 'app', 'api', 'super-admin');
  const found: string[] = [];
  async function walk(dir: string, prefix: string) {
    let entries: Dirent[];
    try {
      entries = await readdir(dir, { withFileTypes: true, encoding: 'utf8' }) as Dirent[];
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      try {
        await readdir(path.join(full));
      } catch {
        continue;
      }
      found.push(nextPrefix);
      await walk(full, nextPrefix);
    }
  }
  await walk(root, '');
  return found;
}

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  try {
    const [
      students, leads, applications, employees, branches, countries,
      aiAgents, aiAgentsActive, aiJobsWaiting, pendingApprovals,
      reportsGenerated, activeSessions, buildRequests,
    ] = await Promise.all([
      safeCount(() => db.student.count()),
      safeCount(() => db.lead.count()),
      safeCount(() => db.application.count()),
      safeCount(() => db.employee.count()),
      safeCount(() => db.office.count()),
      safeCount(() => db.country.count()),
      safeCount(() => db.aiAgent.count()),
      safeCount(() => db.aiAgent.count({ where: { status: 'ACTIVE' } })),
      safeCount(() => db.aiTask.count({ where: { status: 'WAITING' } })),
      safeCount(() => db.approvalRequest.count({ where: { status: 'pending' } })),
      safeCount(() => db.report.count()),
      safeCount(() => db.portalSession.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } })),
      safeCount(() => db.moduleBuildRequest.count()),
    ]);

    const present = new Set(await listRouteFolders());
    const missing = REQUIRED_SURFACE.filter((route) => !present.has(route));

    const recentAudit = await safeRows<{ action: string; entityType: string; createdAt: Date; actorUserId: string }>(
      () => db.portalAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { action: true, entityType: true, createdAt: true, actorUserId: true },
      }),
    );

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      data: {
        students, leads, applications, employees, branches, countries,
        aiAgents, aiAgentsActive, aiJobsWaiting, pendingApprovals,
        reportsGenerated, activeSessions, buildRequests,
      },
      apiSurface: {
        required: REQUIRED_SURFACE.length,
        present: REQUIRED_SURFACE.length - missing.length,
        missing,
        allFolders: present.size,
        note: 'Counts route folders on disk under src/app/api/super-admin. UI pages are not counted.',
      },
      recentActivity: recentAudit.map((row) => ({
        action: row.action,
        entityType: row.entityType,
        actorUserId: row.actorUserId,
        when: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return unavailable('super-admin/overview', error);
  }
}

export const GET = withAuth(handleGet);
