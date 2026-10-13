"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-primitives";
import { ALL_ROLES, ROLE_LABELS, rolePermissions, type Permission } from "@/lib/rbac";

const PERMISSION_GROUPS: { label: string; perms: string[] }[] = [
  { label: "Dashboard", perms: ["dashboard.view"] },
  { label: "Contacts / CRM", perms: ["contacts.view", "contacts.create", "contacts.update", "contacts.delete", "contacts.export"] },
  { label: "Inquiries", perms: ["inquiries.view", "inquiries.create", "inquiries.update", "inquiries.delete", "inquiries.export"] },
  { label: "Opportunities", perms: ["opportunities.view", "opportunities.create", "opportunities.update", "opportunities.delete", "opportunities.export"] },
  { label: "Meetings", perms: ["meetings.view", "meetings.update", "meetings.delete"] },
  { label: "AI Workspace", perms: ["ai_tasks.view", "ai_tasks.create", "ai_tasks.update", "ai_tasks.delete", "ai_approvals.view", "ai_approvals.decide"] },
  { label: "Articles", perms: ["articles.view", "articles.create", "articles.update", "articles.publish", "articles.delete"] },
  { label: "Resources", perms: ["resources.view", "resources.create", "resources.update", "resources.delete"] },
  { label: "Projects", perms: ["projects.view", "projects.create", "projects.update", "projects.delete"] },
  { label: "Case Studies", perms: ["case_studies.view", "case_studies.create", "case_studies.update", "case_studies.delete"] },
  { label: "Impact Records", perms: ["impact_records.view", "impact_records.create", "impact_records.update", "impact_records.delete"] },
  { label: "Newsletter", perms: ["newsletter.view", "newsletter.export", "newsletter.send"] },
  { label: "Partnerships", perms: ["partnerships.view", "partnerships.update", "student_referrals.view", "student_referrals.update"] },
  { label: "Audit & Security", perms: ["audit_logs.view", "audit_logs.export", "security_settings.view", "security_settings.update", "integration_settings.view", "integration_settings.update"] },
  { label: "User Management", perms: ["users.view", "users.create", "users.update", "users.delete", "users.role_assign"] },
];

export default function AdminRolesPage() {
  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle="The 11-role RBAC matrix — server-side source of truth"
      />

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">The 11 Roles</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_ROLES.map((r) => (
              <div key={r} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{ROLE_LABELS[r]}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r}</div>
                </div>
                <Badge variant="outline">{rolePermissions(r).size}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Permission Matrix</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-2 sticky left-0 bg-card">Permission</th>
                {ALL_ROLES.map((r) => (
                  <th key={r} className="p-2 text-center" title={ROLE_LABELS[r]}>{r.split("_")[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.flatMap((g) => g.perms).map((perm) => (
                <tr key={perm} className="border-b">
                  <td className="p-2 font-mono sticky left-0 bg-card">{perm}</td>
                  {ALL_ROLES.map((r) => {
                    const has = rolePermissions(r).has(perm as Permission);
                    return (
                      <td key={r} className="p-2 text-center">
                        {has ? <span className="text-emerald-600">✓</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
