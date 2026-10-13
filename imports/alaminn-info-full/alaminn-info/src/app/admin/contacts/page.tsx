"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Contact = {
  id: string; fullName: string; email: string; phone: string | null;
  organization: string | null; role: string | null; status: string;
  tags: string | null; createdAt: string;
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default", nurturing: "secondary", converted: "outline", archived: "destructive",
};

const FIELDS = [
  { name: "fullName", label: "Full Name", type: "text" as const, required: true },
  { name: "email", label: "Email", type: "email" as const, required: true },
  { name: "phone", label: "Phone", type: "tel" as const },
  { name: "organization", label: "Organization", type: "text" as const },
  { name: "role", label: "Role", type: "text" as const },
  { name: "country", label: "Country", type: "text" as const },
  { name: "tags", label: "Tags (comma separated)", type: "text" as const },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "active", label: "Active" },
    { value: "nurturing", label: "Nurturing" },
    { value: "converted", label: "Converted" },
    { value: "archived", label: "Archived" },
  ] },
];

export default function AdminContactsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(c: Contact) { setEditing(c); setDialogOpen(true); }

  async function destroy(c: Contact) {
    if (!confirm(`Delete contact "${c.fullName}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/admin/contacts/${c.id}`, { method: "DELETE" });
      toast.success("Contact deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<Contact>[] = [
    { key: "fullName", label: "Name", render: (c) => (
      <div>
        <div className="font-medium">{c.fullName}</div>
        <div className="text-xs text-muted-foreground">{c.email}</div>
      </div>
    )},
    { key: "organization", label: "Organization", render: (c) => c.organization || "—" },
    { key: "role", label: "Role", render: (c) => c.role || "—" },
    { key: "phone", label: "Phone", render: (c) => c.phone || "—" },
    { key: "tags", label: "Tags", render: (c) => c.tags ? <Badge variant="outline" className="text-xs">{c.tags}</Badge> : "—" },
    { key: "status", label: "Status", render: (c) => <Badge variant={STATUS_COLORS[c.status] || "default"}>{c.status}</Badge> },
    { key: "createdAt", label: "Created", render: (c) => <span className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</span> },
  ];

  return (
    <>
      <CrudList<Contact>
        key={refreshKey}
        title="Contacts"
        subtitle="Personal CRM — search, filter and manage your contacts"
        endpoint="/api/v1/admin/contacts"
        columns={columns}
        filters={[
          { label: "Active", value: "active", param: "status" },
          { label: "Nurturing", value: "nurturing", param: "status" },
          { label: "Converted", value: "converted", param: "status" },
          { label: "Archived", value: "archived", param: "status" },
        ]}
        onCreate={openCreate}
        createLabel="Add Contact"
        rowActions={(c) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(c)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(c)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Contact updated." : "Contact created."); }}
        endpoint="/api/v1/admin/contacts"
        title={editing ? "Edit Contact" : "Add Contact"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
