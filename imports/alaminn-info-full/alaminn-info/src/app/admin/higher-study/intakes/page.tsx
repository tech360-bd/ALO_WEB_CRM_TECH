"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDay, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Intake = {
  id: string;
  slug: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  applicationDeadline: string | null;
  status: string;
  updatedAt: string;
  _count?: { courses: number };
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "default",
  upcoming: "secondary",
  closed: "destructive",
};

const FIELDS = [
  { name: "name", label: "Name", type: "text" as const, required: true, placeholder: "Fall 2026 (Sep–Oct)" },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "fall-2026" },
  { name: "startDate", label: "Start Date", type: "date" as const },
  { name: "endDate", label: "End Date", type: "date" as const },
  { name: "applicationDeadline", label: "Application Deadline", type: "date" as const },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "open", label: "Open" },
    { value: "upcoming", label: "Upcoming" },
    { value: "closed", label: "Closed" },
  ] },
];

export default function AdminHigherStudyIntakesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Intake | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(i: Intake) { setEditing(i); setDialogOpen(true); }

  async function destroy(i: Intake) {
    if (!confirm(`Delete intake "${i.name}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/higher-study/admin/intakes/${i.id}`, { method: "DELETE" });
      toast.success("Intake deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<Intake>[] = [
    { key: "name", label: "Intake", render: (i) => (
      <div>
        <div className="font-medium">{i.name}</div>
        <div className="text-xs text-muted-foreground font-mono">{i.slug}</div>
      </div>
    ) },
    { key: "startDate", label: "Start", render: (i) => <span className="text-xs text-muted-foreground">{fmtDay(i.startDate)}</span> },
    { key: "endDate", label: "End", render: (i) => <span className="text-xs text-muted-foreground">{fmtDay(i.endDate)}</span> },
    { key: "applicationDeadline", label: "App Deadline", render: (i) => <span className="text-xs text-muted-foreground">{fmtDay(i.applicationDeadline)}</span> },
    { key: "status", label: "Status", render: (i) => <Badge variant={STATUS_VARIANTS[i.status] || "default"}>{i.status}</Badge> },
    { key: "courses", label: "Courses", render: (i) => String(i._count?.courses ?? 0) },
    { key: "updatedAt", label: "Updated", render: (i) => <span className="text-xs text-muted-foreground">{fmtDate(i.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Intake>
        key={refreshKey}
        title="Higher Study — Intakes"
        subtitle="Admission intakes / terms that courses can attach to"
        endpoint="/api/v1/higher-study/admin/intakes"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        filters={[
          { label: "Open", value: "open", param: "status" },
          { label: "Upcoming", value: "upcoming", param: "status" },
          { label: "Closed", value: "closed", param: "status" },
        ]}
        onCreate={openCreate}
        createLabel="Add Intake"
        rowActions={(i) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(i)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(i)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Intake updated." : "Intake created."); }}
        endpoint="/api/v1/higher-study/admin/intakes"
        title={editing ? "Edit Intake" : "Add Intake"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
