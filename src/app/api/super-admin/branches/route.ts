// GET  /api/super-admin/branches — Branch Control Center (real aggregates)
// POST /api/super-admin/branches — create a branch (Office)
//
// "Branch" maps to the existing `offices` table (and `employees.branch` for
// staff assignment). No duplicate Branch model is introduced.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import type { BranchControlRow } from '@/lib/super-admin/types';

export const dynamic = 'force-dynamic';

/** Runs a query and degrades to typed rows instead of throwing. */
async function safeRows<T>(fn: () => Promise<unknown>, fallback: T[]): Promise<T[]> {
  try {
    return (await fn()) as T[];
  } catch {
    return fallback;
  }
}

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  try {
    const [offices, employees, applications] = await Promise.all([
      db.office.findMany({ orderBy: { name: 'asc' } }),
      db.employee.findMany({ select: { branch: true, status: true, role: true } }),
      db.application.findMany({ select: { stage: true, documentStatus: true } }).catch(() => []),
    ]);

    const employeeBranches = [...new Set(employees.map((e) => e.branch).filter(Boolean))];

    const [leads, students] = await Promise.all([
      safeRows<{ branch: string | null; _count: { _all: number } }>(
        () => db.lead.groupBy({ by: ['branch'], _count: { _all: true } }), [],
      ),
      safeRows<{ currentCity: string; _count: { _all: number } }>(
        () => db.student.groupBy({ by: ['currentCity'], _count: { _all: true } }), [],
      ),
    ]);

    const leadsByBranch = new Map<string, number>(
      leads.map((row) => [row.branch || '', row._count._all] as [string, number]),
    );
    const studentTotal = students.reduce((sum, row) => sum + row._count._all, 0);

    const officeRows: BranchControlRow[] = offices.map((office) => {
      const branchEmployees = employees.filter(
        (e) => e.branch && (e.branch.toLowerCase() === office.code.toLowerCase() || e.branch.toLowerCase() === office.name.toLowerCase()),
      );
      const activeLeads = leadsByBranch.get(office.code) || leadsByBranch.get(office.name) || 0;
      return {
        id: office.id,
        code: office.code,
        name: office.name,
        city: office.city,
        country: office.country,
        status: office.status,
        employees: branchEmployees.length,
        activeLeads,
        activeStudents: 0,
        activeApplications: 0,
        pendingDocuments: 0,
        conversionRate: null,
        performanceScore: null,
      };
    });

    return NextResponse.json({
      success: true,
      branches: officeRows,
      unassigned: {
        employeesWithoutBranch: employees.filter((e) => !e.branch).length,
        branchLabelsInUse: employeeBranches,
      },
      totals: {
        offices: offices.length,
        employees: employees.length,
        activeApplications: applications.filter((a) => a.stage !== 'CLOSED').length,
        pendingDocuments: applications.filter((a) => ['PENDING', 'INCOMPLETE'].includes(a.documentStatus)).length,
        students: studentTotal,
        leads: leads.reduce((sum, row) => sum + row._count._all, 0),
      },
      notes: [
        'Student count is stored per city, not per office, so per-branch student totals are reported as 0 rather than estimated.',
        'Applications carry no branch column today; only organisation-wide totals are shown.',
      ],
    });
  } catch (error) {
    console.error('[super-admin/branches] failed', error);
    return NextResponse.json({ success: false, error: 'Branch control is temporarily unavailable.' }, { status: 503 });
  }
}

const Body = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/, 'Use letters, digits, dash or underscore.'),
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(40).optional(),
  reason: z.string().trim().min(8).max(500),
}).strict();

async function handlePost(request: Request, auth: AuthContext) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Cross-origin mutation denied.' }, { status: 403 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid request body.' },
      { status: 400 },
    );
  }
  const input = parsed.data;

  try {
    const office = await db.$transaction(async (tx) => {
      const created = await tx.office.create({
        data: {
          code: input.code.toUpperCase(),
          name: input.name,
          city: input.city || null,
          country: input.country || null,
          address: input.address || null,
          phone: input.phone || null,
        },
      });
      await writePortalAudit(tx, auth, 'BRANCH_CREATED', 'Office', created.id, {
        reason: input.reason,
        code: created.code,
        name: created.name,
      }, request);
      return created;
    });
    return NextResponse.json({ success: true, branch: { id: office.id, code: office.code, name: office.name } });
  } catch (error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: string }).code) : '';
    if (code === 'P2002') {
      return NextResponse.json({ success: false, error: 'A branch with that code already exists.' }, { status: 409 });
    }
    console.error('[super-admin/branches POST] failed', error);
    return NextResponse.json({ success: false, error: 'Branch could not be created and audited.' }, { status: 503 });
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
