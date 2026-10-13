"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Subject = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  iconUrl: string | null;
  updatedAt: string;
  _count?: { courses: number };
};

const FIELDS = [
  { name: "name", label: "Name", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from name" },
  { name: "category", label: "Category", type: "select" as const, options: [
    { value: "STEM", label: "STEM" },
    { value: "Business", label: "Business" },
    { value: "Humanities", label: "Humanities" },
    { value: "Arts", label: "Arts" },
    { value: "Social Sciences", label: "Social Sciences" },
    { value: "Medicine", label: "Medicine" },
    { value: "Law", label: "Law" },
  ] },
  { name: "iconUrl", label: "Icon URL", type: "text" as const },
  { name: "description", label: "Description", type: "textarea" as const },
];

export default function AdminHigherStudySubjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(s: Subject) { setEditing(s); setDialogOpen(true); }

  async function destroy(s: Subject) {
    if (!confirm(`Delete subject "${s.name}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/higher-study/admin/subjects/${s.id}`, { method: "DELETE" });
      toast.success("Subject deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<Subject>[] = [
    { key: "name", label: "Subject", render: (s) => (
      <div>
        <div className="font-medium">{s.name}</div>
        <div className="text-xs text-muted-foreground font-mono">{s.slug}</div>
      </div>
    ) },
    { key: "category", label: "Category", render: (s) => s.category ? <Badge variant="outline">{s.category}</Badge> : "—" },
    { key: "courses", label: "Courses", render: (s) => String(s._count?.courses ?? 0) },
    { key: "updatedAt", label: "Updated", render: (s) => <span className="text-xs text-muted-foreground">{fmtDate(s.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Subject>
        key={refreshKey}
        title="Higher Study — Subjects"
        subtitle="Discipline taxonomy used to classify courses"
        endpoint="/api/v1/higher-study/admin/subjects"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        onCreate={openCreate}
        createLabel="Add Subject"
        rowActions={(s) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(s)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(s)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Subject updated." : "Subject created."); }}
        endpoint="/api/v1/higher-study/admin/subjects"
        title={editing ? "Edit Subject" : "Add Subject"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
