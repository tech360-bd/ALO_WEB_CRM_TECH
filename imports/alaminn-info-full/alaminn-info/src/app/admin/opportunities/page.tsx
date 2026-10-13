"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Opportunity = {
  id: string;
  title: string;
  value: number | null;
  currency: string;
  stage: string;
  priority: string;
  closeDate: string | null;
  createdAt: string;
  contact: { id: string; fullName: string; email: string; organization: string | null };
  inquiry: { id: string; reference: string } | null;
};

const STAGE_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  "review-required": "destructive",
  qualified: "secondary",
  "discovery-scheduled": "secondary",
  "discovery-completed": "outline",
  "scope-required": "secondary",
  "proposal-drafting": "secondary",
  "proposal-sent": "outline",
  negotiation: "secondary",
  approved: "default",
  "in-progress": "default",
  won: "default",
  lost: "destructive",
  "on-hold": "outline",
  archived: "destructive",
};

const PRIORITY_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  critical: "destructive",
};

const STAGE_OPTIONS = [
  { value: "new", label: "New" },
  { value: "review-required", label: "Review Required" },
  { value: "qualified", label: "Qualified" },
  { value: "discovery-scheduled", label: "Discovery Scheduled" },
  { value: "discovery-completed", label: "Discovery Completed" },
  { value: "scope-required", label: "Scope Required" },
  { value: "proposal-drafting", label: "Proposal Drafting" },
  { value: "proposal-sent", label: "Proposal Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "approved", label: "Approved" },
  { value: "in-progress", label: "In Progress" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "on-hold", label: "On Hold" },
  { value: "archived", label: "Archived" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "contactId", label: "Contact ID", type: "text" as const, required: true },
  { name: "value", label: "Estimated Value", type: "number" as const },
  { name: "currency", label: "Currency", type: "select" as const, options: [
    { value: "USD", label: "USD" },
    { value: "BDT", label: "BDT" },
    { value: "EUR", label: "EUR" },
    { value: "GBP", label: "GBP" },
  ] },
  { name: "stage", label: "Stage", type: "select" as const, options: STAGE_OPTIONS },
  { name: "priority", label: "Priority", type: "select" as const, options: PRIORITY_OPTIONS },
  { name: "closeDate", label: "Expected Close Date", type: "date" as const },
];

export default function AdminOpportunitiesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(o: Opportunity) { setEditing(o); setDialogOpen(true); }

  async function destroy(o: Opportunity) {
    if (!confirm(`Delete opportunity "${o.title}"? This cannot be undone.`)) return;
    try {
      // Use PATCH to mark as archived (safe deletion) since no DELETE endpoint exists yet
      await adminFetch(`/api/v1/admin/opportunities`, {
        method: "PATCH",
        body: JSON.stringify({ id: o.id, stage: "archived" }),
      });
      toast.success("Opportunity archived.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Archive failed.");
    }
  }

  const columns: Column<Opportunity>[] = [
    { key: "title", label: "Title", render: (o) => (
      <div>
        <div className="font-medium">{o.title}</div>
        {o.inquiry && <div className="text-xs text-muted-foreground">From: {o.inquiry.reference}</div>}
      </div>
    )},
    { key: "contact", label: "Contact", render: (o) => (
      <div>
        <div className="font-medium">{o.contact?.fullName || "—"}</div>
        <div className="text-xs text-muted-foreground">{o.contact?.email || "—"}</div>
        {o.contact?.organization && <div className="text-xs text-muted-foreground">{o.contact.organization}</div>}
      </div>
    )},
    { key: "value", label: "Value", render: (o) => o.value ? `${o.currency} ${o.value.toLocaleString()}` : "—" },
    { key: "stage", label: "Stage", render: (o) => <Badge variant={STAGE_COLORS[o.stage] || "default"}>{o.stage}</Badge> },
    { key: "priority", label: "Priority", render: (o) => <Badge variant={PRIORITY_COLORS[o.priority] || "outline"}>{o.priority}</Badge> },
    { key: "closeDate", label: "Close Date", render: (o) => o.closeDate ? <span className="text-xs text-muted-foreground">{fmtDate(o.closeDate)}</span> : "—" },
    { key: "createdAt", label: "Created", render: (o) => <span className="text-xs text-muted-foreground">{fmtDate(o.createdAt)}</span> },
  ];

  return (
    <>
      <CrudList<Opportunity>
        key={refreshKey}
        title="Opportunities"
        subtitle="Sales pipeline — track deals from new to won"
        endpoint="/api/v1/admin/opportunities"
        columns={columns}
        filters={[
          { label: "New", value: "new", param: "stage" },
          { label: "Qualified", value: "qualified", param: "stage" },
          { label: "Proposal Sent", value: "proposal-sent", param: "stage" },
          { label: "Negotiation", value: "negotiation", param: "stage" },
          { label: "Won", value: "won", param: "stage" },
          { label: "Lost", value: "lost", param: "stage" },
          { label: "Archived", value: "archived", param: "stage" },
        ]}
        onCreate={openCreate}
        createLabel="Add Opportunity"
        rowActions={(o) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(o)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(o)} aria-label="Archive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Opportunity updated." : "Opportunity created."); }}
        endpoint="/api/v1/admin/opportunities"
        title={editing ? "Edit Opportunity" : "Add Opportunity"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
