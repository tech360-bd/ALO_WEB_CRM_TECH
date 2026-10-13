"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";
import { ALL_ROLES } from "@/lib/rbac";

type User = {
  id: string; email: string; name: string; role: string; status: string;
  lastLoginAt: string | null; createdAt: string;
};

const ROLE_OPTIONS = ALL_ROLES.map((r) => ({ value: r, label: r.replace(/_/g, " ") }));

const FIELDS = [
  { name: "name", label: "Full Name", type: "text" as const, required: true },
  { name: "email", label: "Email", type: "email" as const, required: true },
  { name: "role", label: "Role", type: "select" as const, required: true, options: ROLE_OPTIONS },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
    { value: "inactive", label: "Inactive" },
  ] },
  { name: "password", label: "Password (leave blank on edit; min 8 chars)", type: "text" as const },
];

export default function AdminUsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function destroy(u: User) {
    if (!confirm(`Delete user "${u.email}"?`)) return;
    try {
      await adminFetch(`/api/v1/admin/users/${u.id}`, { method: "DELETE" });
      toast.success("User deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed."); }
  }

  async function suspend(u: User) {
    const newStatus = u.status === "active" ? "suspended" : "active";
    try {
      await adminFetch(`/api/v1/admin/users/${u.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`User ${newStatus === "suspended" ? "suspended" : "reactivated"}.`);
      setRefreshKey((k) => k + 1);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Action failed."); }
  }

  async function resetPassword(u: User) {
    const pw = prompt(`Reset password for ${u.email}.\nEnter new password (min 8 chars):`);
    if (!pw || pw.length < 8) { if (pw !== null) toast.error("Password too short."); return; }
    try {
      await adminFetch(`/api/v1/admin/users/${u.id}`, {
        method: "PUT",
        body: JSON.stringify({ password: pw }),
      });
      toast.success("Password reset.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Reset failed."); }
  }

  const columns: Column<User>[] = [
    { key: "name", label: "User", render: (u) => (
      <div>
        <div className="font-medium">{u.name}</div>
        <div className="text-xs text-muted-foreground">{u.email}</div>
      </div>
    )},
    { key: "role", label: "Role", render: (u) => <Badge variant="outline" className="font-mono text-xs">{u.role}</Badge> },
    { key: "status", label: "Status", render: (u) => <Badge variant={u.status === "active" ? "default" : "destructive"}>{u.status}</Badge> },
    { key: "lastLoginAt", label: "Last Login", render: (u) => u.lastLoginAt ? fmtDate(u.lastLoginAt) : "Never" },
    { key: "createdAt", label: "Joined", render: (u) => <span className="text-xs text-muted-foreground">{fmtDate(u.createdAt)}</span> },
  ];

  return (
    <>
      <CrudList<User>
        key={refreshKey}
        title="Users"
        subtitle="Manage admin users, roles and status"
        endpoint="/api/v1/admin/users"
        columns={columns}
        filters={[
          { label: "Active", value: "active", param: "status" },
          { label: "Suspended", value: "suspended", param: "status" },
          { label: "Inactive", value: "inactive", param: "status" },
        ]}
        onCreate={() => { setEditing(null); setDialogOpen(true); }}
        createLabel="Add User"
        rowActions={(u) => (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="outline" onClick={() => suspend(u)}>{u.status === "active" ? "Suspend" : "Activate"}</Button>
            <Button size="sm" variant="outline" onClick={() => resetPassword(u)}>Reset PW</Button>
            <Button size="icon" variant="ghost" onClick={() => { setEditing(u); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(u)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "User updated." : "User created."); }}
        endpoint="/api/v1/admin/users"
        title={editing ? "Edit User" : "Add User"}
        fields={FIELDS}
        initial={editing ? { ...editing, password: "" } : { status: "active", role: "VIEWER" }}
        id={editing?.id}
      />
    </>
  );
}
