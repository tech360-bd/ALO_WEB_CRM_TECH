import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CRM_MODULE_WORKSPACES, SUPER_ADMIN_PORTAL_WORKSPACES } from '../../src/lib/super-admin/workspaces';

const ROOT = process.cwd();

function routePageExists(href: string): boolean {
  const pathname = href.split(/[?#]/, 1)[0];
  const pagePath = pathname === '/' ? 'src/app/page.tsx' : `src/app${pathname}/page.tsx`;
  return existsSync(join(ROOT, pagePath));
}

describe('Super Admin portal and module workspace registry', () => {
  it('provides management controls and a real preview route for every portal surface', () => {
    expect(SUPER_ADMIN_PORTAL_WORKSPACES.map(({ key }) => key)).toEqual([
      'website', 'crm', 'student', 'employee', 'partner', 'university', 'parent',
    ]);

    for (const workspace of SUPER_ADMIN_PORTAL_WORKSPACES) {
      expect(workspace.controls.length, `${workspace.key} management links`).toBeGreaterThan(0);
      expect(routePageExists(workspace.previewHref), `${workspace.key} preview ${workspace.previewHref}`).toBe(true);
      for (const control of workspace.controls) {
        expect(routePageExists(control.href), `${workspace.key} control ${control.href}`).toBe(true);
      }
    }
  });

  it('routes every CRM module to an existing dedicated workspace', () => {
    const expectedModules = [
      'overview', 'leads', 'students', 'applications', 'documents', 'visa', 'finance',
      'marketing', 'hr', 'partners', 'universities', 'courses', 'communications',
      'tasks', 'reports', 'audit',
    ];
    expect(Object.keys(CRM_MODULE_WORKSPACES).sort()).toEqual(expectedModules.sort());
    for (const [module, workspace] of Object.entries(CRM_MODULE_WORKSPACES)) {
      expect(routePageExists(workspace.href), `${module} workspace ${workspace.href}`).toBe(true);
    }
  });

  it('mounts the portal hub from Master Command Center and exposes the selected CRM workspace', () => {
    const master = readFileSync(join(ROOT, 'src/components/admin/SuperAdminMasterCommandCenter.tsx'), 'utf8');
    const crm = readFileSync(join(ROOT, 'src/components/admin/SuperAdminCrmCommandCenter.tsx'), 'utf8');
    const operating = readFileSync(join(ROOT, 'src/components/admin/super-admin-operating/SuperAdminOperatingDashboard.tsx'), 'utf8');
    const aiCenter = readFileSync(join(ROOT, 'src/components/admin/super-admin-command-center/SuperAdminCommandCenter.tsx'), 'utf8');
    expect(master).toContain('SuperAdminPortalWorkspaceHub');
    expect(master).toContain('activeTab==="portals"');
    expect(crm).toContain('CRM_MODULE_WORKSPACES[activeModule]');
    expect(crm).toContain('initialModule');
    expect(crm).not.toContain('handleAgentAction("assign_lead"');
    expect(operating).toContain("Website & CRM Workspaces");
    expect(aiCenter).toContain('Website &amp; CRM workspaces');
  });
});
