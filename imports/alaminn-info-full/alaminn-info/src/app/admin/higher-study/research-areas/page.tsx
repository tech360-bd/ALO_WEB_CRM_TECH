"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type ResearchArea = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  updatedAt: string;
  _count?: { researchProjects: number; supervisors: number };
};

const FIELDS = [
  { name: "name", label: "Name", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from name" },
  { name: "description", label: "Description", type: "textarea" as const },
];

export default function AdminHigherStudyResearchAreasPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ResearchArea | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(r: ResearchArea) { setEditing(r); setDialogOpen(true); }

  async function destroy(r: ResearchArea) {
    if (!confirm(`Delete research area "${r.name}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/higher-study/admin/research-areas/${r.id}`, { method: "DELETE" });
      toast.success("Research area deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<ResearchArea>[] = [
    { key: "name", label: "Research Area", render: (r) => (
      <div>
        <div className="font-medium">{r.name}</div>
        <div className="text-xs text-muted-foreground font-mono">{r.slug}</div>
      </div>
    ) },
    { key: "description", label: "Description", render: (r) => r.description ? <span className="text-xs text-muted-foreground line-clamp-2">{r.description}</span> : "—" },
    { key: "entities", label: "Entities", render: (r) => (
      <div className="text-xs text-muted-foreground">
        {r._count?.researchProjects ?? 0} projects · {r._count?.supervisors ?? 0} supervisors
      </div>
    ) },
    { key: "updatedAt", label: "Updated", render: (r) => <span className="text-xs text-muted-foreground">{fmtDate(r.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<ResearchArea>
        key={refreshKey}
        title="Higher Study — Research Areas"
        subtitle="Disciplinary areas used to group research projects + supervisors"
        endpoint="/api/v1/higher-study/admin/research-areas"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        onCreate={openCreate}
        createLabel="Add Research Area"
        rowActions={(r) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(r)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Research area updated." : "Research area created."); }}
        endpoint="/api/v1/higher-study/admin/research-areas"
        title={editing ? "Edit Research Area" : "Add Research Area"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
