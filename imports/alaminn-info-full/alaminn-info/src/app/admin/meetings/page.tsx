"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate, fmtDay } from "@/components/admin/lib";
import { toast } from "sonner";

type Meeting = {
  id: string; reference: string; meetingType: string; contactName: string;
  contactEmail: string; organization: string | null; topic: string | null;
  status: string; requestedDate: string; requestedTime: string; createdAt: string;
};

const FIELDS = [
  { name: "meetingType", label: "Type", type: "select" as const, required: true, options: [
    { value: "discovery", label: "Discovery" },
    { value: "strategy", label: "Strategy" },
    { value: "partnership", label: "Partnership" },
    { value: "education", label: "Education" },
  ] },
  { name: "contactName", label: "Contact Name", type: "text" as const, required: true },
  { name: "contactEmail", label: "Contact Email", type: "email" as const, required: true },
  { name: "organization", label: "Organization", type: "text" as const },
  { name: "topic", label: "Topic", type: "textarea" as const },
  { name: "requestedDate", label: "Date", type: "date" as const },
  { name: "requestedTime", label: "Time (HH:mm)", type: "text" as const },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "new", label: "New" },
    { value: "confirmed", label: "Confirmed" },
    { value: "rescheduled", label: "Rescheduled" },
    { value: "cancelled", label: "Cancelled" },
    { value: "completed", label: "Completed" },
  ] },
];

export default function AdminMeetingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function destroy(m: Meeting) {
    if (!confirm(`Delete meeting "${m.reference}"?`)) return;
    try {
      await adminFetch(`/api/v1/admin/meetings/${m.id}`, { method: "DELETE" });
      toast.success("Meeting deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed."); }
  }

  const columns: Column<Meeting>[] = [
    { key: "reference", label: "Reference", render: (m) => <span className="font-mono text-xs">{m.reference}</span> },
    { key: "contactName", label: "Contact", render: (m) => (
      <div>
        <div className="font-medium">{m.contactName}</div>
        <a href={`mailto:${m.contactEmail}`} className="text-xs text-primary hover:underline">{m.contactEmail}</a>
      </div>
    )},
    { key: "meetingType", label: "Type", render: (m) => <Badge variant="outline">{m.meetingType}</Badge> },
    { key: "topic", label: "Topic", render: (m) => m.topic || "—" },
    { key: "requestedDate", label: "When", render: (m) => (
      <span className="text-xs">{fmtDay(m.requestedDate)} · {m.requestedTime}</span>
    )},
    { key: "status", label: "Status", render: (m) => <Badge variant="secondary">{m.status}</Badge> },
    { key: "createdAt", label: "Created", render: (m) => <span className="text-xs text-muted-foreground">{fmtDate(m.createdAt)}</span> },
  ];

  return (
    <>
      <CrudList<Meeting>
        key={refreshKey}
        title="Meetings"
        subtitle="Discovery calls, strategy sessions and partnership meetings"
        endpoint="/api/v1/admin/meetings"
        columns={columns}
        filters={[
          { label: "New", value: "new", param: "status" },
          { label: "Confirmed", value: "confirmed", param: "status" },
          { label: "Completed", value: "completed", param: "status" },
          { label: "Cancelled", value: "cancelled", param: "status" },
        ]}
        onCreate={() => { setEditing(null); setDialogOpen(true); }}
        createLabel="Add Meeting"
        rowActions={(m) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => { setEditing(m); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(m)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Meeting updated." : "Meeting created."); }}
        endpoint="/api/v1/admin/meetings"
        title={editing ? "Edit Meeting" : "Add Meeting"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
