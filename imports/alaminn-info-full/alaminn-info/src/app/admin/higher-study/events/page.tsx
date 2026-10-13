"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate, fmtDay } from "@/components/admin/lib";
import { toast } from "sonner";

type Event = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  eventDate: string;
  endDate: string | null;
  location: string | null;
  organiser: string | null;
  registrationUrl: string | null;
  imageUrl: string | null;
  status: string;
  updatedAt: string;
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  upcoming: "secondary",
  live: "default",
  ended: "outline",
  cancelled: "destructive",
};

const FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from title" },
  { name: "eventDate", label: "Event Date", type: "date" as const, required: true },
  { name: "endDate", label: "End Date", type: "date" as const },
  { name: "location", label: "Location", type: "text" as const, placeholder: "online or city name" },
  { name: "organiser", label: "Organiser", type: "text" as const },
  { name: "registrationUrl", label: "Registration URL", type: "text" as const },
  { name: "imageUrl", label: "Image URL", type: "text" as const },
  { name: "description", label: "Description", type: "textarea" as const },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "upcoming", label: "Upcoming" },
    { value: "live", label: "Live" },
    { value: "ended", label: "Ended" },
    { value: "cancelled", label: "Cancelled" },
  ] },
];

export default function AdminHigherStudyEventsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(e: Event) { setEditing(e); setDialogOpen(true); }

  async function destroy(e: Event) {
    if (!confirm(`Delete event "${e.title}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/higher-study/admin/events/${e.id}`, { method: "DELETE" });
      toast.success("Event deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e2) {
      toast.error(e2 instanceof Error ? e2.message : "Delete failed.");
    }
  }

  const columns: Column<Event>[] = [
    { key: "title", label: "Event", render: (e) => (
      <div>
        <div className="font-medium">{e.title}</div>
        <div className="text-xs text-muted-foreground font-mono">{e.slug}</div>
      </div>
    ) },
    { key: "eventDate", label: "Date", render: (e) => <span className="text-xs text-muted-foreground">{fmtDay(e.eventDate)}</span> },
    { key: "endDate", label: "End", render: (e) => <span className="text-xs text-muted-foreground">{fmtDay(e.endDate)}</span> },
    { key: "location", label: "Location", render: (e) => e.location || "—" },
    { key: "organiser", label: "Organiser", render: (e) => e.organiser || "—" },
    { key: "status", label: "Status", render: (e) => <Badge variant={STATUS_VARIANTS[e.status] || "default"}>{e.status}</Badge> },
    { key: "updatedAt", label: "Updated", render: (e) => <span className="text-xs text-muted-foreground">{fmtDate(e.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Event>
        key={refreshKey}
        title="Higher Study — Events"
        subtitle="Webinars, info sessions, and fairs shown on the Higher Study module"
        endpoint="/api/v1/higher-study/admin/events"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        filters={[
          { label: "Upcoming", value: "upcoming", param: "status" },
          { label: "Live", value: "live", param: "status" },
          { label: "Ended", value: "ended", param: "status" },
          { label: "Cancelled", value: "cancelled", param: "status" },
        ]}
        onCreate={openCreate}
        createLabel="Add Event"
        rowActions={(e) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(e)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(e)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Event updated." : "Event created."); }}
        endpoint="/api/v1/higher-study/admin/events"
        title={editing ? "Edit Event" : "Add Event"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
