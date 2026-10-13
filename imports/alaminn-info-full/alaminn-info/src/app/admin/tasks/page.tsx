"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Task = {
  id: string; title: string; status: string; priority: string;
  dueDate: string | null; assignee: { name: string | null } | null;
  contact: { fullName: string } | null; createdAt: string;
};

const PRIORITY_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline", medium: "secondary", high: "default", critical: "destructive",
};

const FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "description", label: "Description", type: "textarea" as const },
  { name: "priority", label: "Priority", type: "select" as const, options: [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ] },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "open", label: "Open" },
    { value: "in-progress", label: "In Progress" },
    { value: "done", label: "Done" },
    { value: "overdue", label: "Overdue" },
    { value: "cancelled", label: "Cancelled" },
  ] },
  { name: "dueDate", label: "Due Date", type: "date" as const },
  { name: "contactId", label: "Contact ID (optional)", type: "text" as const },
];

export default function AdminTasksPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function destroy(t: Task) {
    if (!confirm(`Delete task "${t.title}"?`)) return;
    try {
      await adminFetch(`/api/v1/admin/tasks/${t.id}`, { method: "DELETE" });
      toast.success("Task deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed."); }
  }

  const columns: Column<Task>[] = [
    { key: "title", label: "Task", render: (t) => (
      <div>
        <div className="font-medium">{t.title}</div>
        {t.contact && <div className="text-xs text-muted-foreground">↳ {t.contact.fullName}</div>}
      </div>
    )},
    { key: "priority", label: "Priority", render: (t) => <Badge variant={PRIORITY_COLORS[t.priority] || "default"}>{t.priority}</Badge> },
    { key: "status", label: "Status", render: (t) => <Badge variant="secondary">{t.status}</Badge> },
    { key: "assignee", label: "Assignee", render: (t) => t.assignee?.name || "Unassigned" },
    { key: "dueDate", label: "Due", render: (t) => t.dueDate ? fmtDate(t.dueDate) : "—" },
    { key: "createdAt", label: "Created", render: (t) => <span className="text-xs text-muted-foreground">{fmtDate(t.createdAt)}</span> },
  ];

  return (
    <>
      <CrudList<Task>
        key={refreshKey}
        title="Tasks"
        subtitle="Personal and team task management"
        endpoint="/api/v1/admin/tasks"
        columns={columns}
        filters={[
          { label: "Open", value: "open", param: "status" },
          { label: "In Progress", value: "in-progress", param: "status" },
          { label: "Done", value: "done", param: "status" },
          { label: "Overdue", value: "overdue", param: "status" },
        ]}
        onCreate={() => { setEditing(null); setDialogOpen(true); }}
        createLabel="Add Task"
        rowActions={(t) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(t)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Task updated." : "Task created."); }}
        endpoint="/api/v1/admin/tasks"
        title={editing ? "Edit Task" : "Add Task"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
