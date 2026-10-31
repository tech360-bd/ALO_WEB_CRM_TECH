import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

describe('Super Admin Operating Dashboard — Extended Route & UI Wiring Audit', () => {
  const requiredBackendRoutes: Array<{ routePath: string; methods: string[] }> = [
    { routePath: 'src/app/api/super-admin/reports/route.ts', methods: ['GET'] },
    { routePath: 'src/app/api/super-admin/reports/generate/route.ts', methods: ['POST'] },
    { routePath: 'src/app/api/super-admin/reports/[id]/download/route.ts', methods: ['GET'] },
    { routePath: 'src/app/api/super-admin/ai/jobs/route.ts', methods: ['GET', 'POST'] },
    { routePath: 'src/app/api/super-admin/ai/jobs/[id]/approve/route.ts', methods: ['PATCH'] },
    { routePath: 'src/app/api/super-admin/ai/jobs/[id]/reject/route.ts', methods: ['PATCH'] },
    { routePath: 'src/app/api/super-admin/ai/system-builder/request/route.ts', methods: ['POST'] },
    { routePath: 'src/app/api/super-admin/ai/system-builder/requests/route.ts', methods: ['GET'] },
    {
      routePath: 'src/app/api/super-admin/ai/system-builder/requests/[id]/approve/route.ts',
      methods: ['PATCH'],
    },
    {
      routePath: 'src/app/api/super-admin/ai/system-builder/requests/[id]/apply/route.ts',
      methods: ['POST'],
    },
    { routePath: 'src/app/api/super-admin/approvals/[id]/approve/route.ts', methods: ['PATCH'] },
    { routePath: 'src/app/api/super-admin/approvals/[id]/reject/route.ts', methods: ['PATCH'] },
    {
      routePath: 'src/app/api/super-admin/approvals/[id]/revision-needed/route.ts',
      methods: ['PATCH'],
    },
    { routePath: 'src/app/api/super-admin/security/logins/route.ts', methods: ['GET'] },
    { routePath: 'src/app/api/super-admin/security/sessions/route.ts', methods: ['GET'] },
    { routePath: 'src/app/api/super-admin/security/revoke-session/route.ts', methods: ['POST'] },
    { routePath: 'src/app/api/super-admin/acting-as/action-log/route.ts', methods: ['GET'] },
    { routePath: 'src/app/api/super-admin/permissions/rollback/route.ts', methods: ['GET', 'POST'] },
    {
      routePath: 'src/app/api/super-admin/settings/maintenance-mode/route.ts',
      methods: ['GET', 'PATCH'],
    },
    {
      routePath: 'src/app/api/super-admin/employees/[id]/force-password-change/route.ts',
      methods: ['POST'],
    },
    {
      routePath: 'src/app/api/super-admin/countries/[id]/trigger-data-scan/route.ts',
      methods: ['POST'],
    },
  ];

  it('verifies every Super Admin backend route wired in the dashboard exists and exports matching HTTP methods', () => {
    for (const entry of requiredBackendRoutes) {
      const fullPath = join(ROOT, entry.routePath);
      expect(existsSync(fullPath), `Missing route file ${entry.routePath}`).toBe(true);
      const source = readFileSync(fullPath, 'utf8');
      for (const method of entry.methods) {
        expect(
          source,
          `Route ${entry.routePath} does not export ${method}`,
        ).toMatch(new RegExp(`export\\s+(const|async\\s+function)\\s+${method}\\b`));
      }
    }
  });

  it('mounts SuperAdminExtendedPanels and uses dedicated approval sub-routes with zero Math.random fabrication', () => {
    const dashboardSrc = readFileSync(
      join(ROOT, 'src/components/admin/super-admin-operating/SuperAdminOperatingDashboard.tsx'),
      'utf8',
    );
    const extendedSrc = readFileSync(
      join(ROOT, 'src/components/admin/super-admin-operating/SuperAdminExtendedPanels.tsx'),
      'utf8',
    );

    expect(dashboardSrc).toContain('SuperAdminExtendedPanels');
    expect(dashboardSrc).toContain('/approvals/${encodedId}/approve');
    expect(dashboardSrc).toContain('/approvals/${encodedId}/reject');
    expect(dashboardSrc).toContain('/approvals/${encodedId}/revision-needed');
    expect(dashboardSrc).toContain('/force-password-change');
    expect(dashboardSrc).toContain('/trigger-data-scan');

    expect(extendedSrc).toContain('/api/super-admin/reports/generate');
    expect(extendedSrc).toContain('/api/super-admin/ai/jobs');
    expect(extendedSrc).toContain('/api/super-admin/ai/system-builder/request');
    expect(extendedSrc).toContain('/api/super-admin/security/logins');
    expect(extendedSrc).toContain('/api/super-admin/security/revoke-session');
    expect(extendedSrc).toContain('/api/super-admin/acting-as/action-log');
    expect(extendedSrc).toContain('/api/super-admin/permissions/rollback');
    expect(extendedSrc).toContain('/api/super-admin/settings/maintenance-mode');

    expect(dashboardSrc).not.toContain('Math.random');
    expect(extendedSrc).not.toContain('Math.random');
  });
});
