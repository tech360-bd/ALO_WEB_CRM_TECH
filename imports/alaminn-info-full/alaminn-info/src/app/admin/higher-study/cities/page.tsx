"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type City = {
  id: string;
  slug: string;
  name: string;
  countryId: string;
  status: string;
  updatedAt: string;
  country?: { id: string; slug: string; name: string } | null;
  _count?: { universities: number };
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  published: "default",
  approved: "default",
  draft: "secondary",
  "pending-review": "outline",
  "needs-update": "destructive",
  archived: "destructive",
};

const FIELDS = [
  { name: "name", label: "Name", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from name" },
  { name: "countryId", label: "Country ID", type: "text" as const, required: true, placeholder: "cuid of the parent country" },
  { name: "overview", label: "Overview", type: "textarea" as const },
  { name: "livingCost", label: "Living Cost", type: "textarea" as const },
  { name: "transport", label: "Transport", type: "textarea" as const },
  { name: "accommodation", label: "Accommodation", type: "textarea" as const },
  { name: "studentLife", label: "Student Life", type: "textarea" as const },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "draft", label: "Draft" },
    { value: "pending-review", label: "Pending Review" },
    { value: "approved", label: "Approved" },
    { value: "published", label: "Published" },
    { value: "needs-update", label: "Needs Update" },
    { value: "archived", label: "Archived" },
  ] },
];

export default function AdminHigherStudyCitiesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<City | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(c: City) { setEditing(c); setDialogOpen(true); }

  async function destroy(c: City) {
    if (!confirm(`Delete city "${c.name}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/higher-study/admin/cities/${c.id}`, { method: "DELETE" });
      toast.success("City deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<City>[] = [
    { key: "name", label: "City", render: (c) => (
      <div>
        <div className="font-medium">{c.name}</div>
        <div className="text-xs text-muted-foreground font-mono">{c.slug}</div>
      </div>
    ) },
    { key: "country", label: "Country", render: (c) => c.country?.name || <span className="text-xs text-muted-foreground">—</span> },
    { key: "universities", label: "Universities", render: (c) => String(c._count?.universities ?? 0) },
    { key: "status", label: "Status", render: (c) => <Badge variant={STATUS_VARIANTS[c.status] || "default"}>{c.status}</Badge> },
    { key: "updatedAt", label: "Updated", render: (c) => <span className="text-xs text-muted-foreground">{fmtDate(c.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<City>
        key={refreshKey}
        title="Higher Study — Cities"
        subtitle="Manage student cities linked to countries"
        endpoint="/api/v1/higher-study/admin/cities"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        filters={[
          { label: "Published", value: "published", param: "status" },
          { label: "Draft", value: "draft", param: "status" },
          { label: "Archived", value: "archived", param: "status" },
        ]}
        onCreate={openCreate}
        createLabel="Add City"
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
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "City updated." : "City created."); }}
        endpoint="/api/v1/higher-study/admin/cities"
        title={editing ? "Edit City" : "Add City"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
