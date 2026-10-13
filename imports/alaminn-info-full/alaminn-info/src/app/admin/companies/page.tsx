"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Organization = {
  id: string; name: string; type: string | null; country: string | null;
  website: string | null; status: string; createdAt: string;
};

const FIELDS = [
  { name: "name", label: "Name", type: "text" as const, required: true },
  { name: "type", label: "Type", type: "select" as const, options: [
    { value: "university", label: "University" },
    { value: "education-business", label: "Education Business" },
    { value: "company", label: "Company" },
    { value: "media", label: "Media" },
    { value: "partner", label: "Partner" },
  ] },
  { name: "country", label: "Country", type: "text" as const },
  { name: "website", label: "Website", type: "text" as const, placeholder: "https://" },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ] },
];

export default function AdminCompaniesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(c: Organization) { setEditing(c); setDialogOpen(true); }

  async function destroy(c: Organization) {
    if (!confirm(`Delete organization "${c.name}"?`)) return;
    try {
      await adminFetch(`/api/v1/admin/companies/${c.id}`, { method: "DELETE" });
      toast.success("Organization deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed."); }
  }

  const columns: Column<Organization>[] = [
    { key: "name", label: "Name", render: (c) => (
      <div>
        <div className="font-medium">{c.name}</div>
        {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{c.website}</a>}
      </div>
    )},
    { key: "type", label: "Type", render: (c) => c.type || "—" },
    { key: "country", label: "Country", render: (c) => c.country || "—" },
    { key: "status", label: "Status", render: (c) => <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge> },
    { key: "createdAt", label: "Created", render: (c) => <span className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</span> },
  ];

  return (
    <>
      <CrudList<Organization>
        key={refreshKey}
        title="Companies"
        subtitle="Organizations, partners and ecosystem entities"
        endpoint="/api/v1/admin/companies"
        columns={columns}
        onCreate={openCreate}
        createLabel="Add Company"
        rowActions={(c) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(c)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Company updated." : "Company created."); }}
        endpoint="/api/v1/admin/companies"
        title={editing ? "Edit Company" : "Add Company"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
