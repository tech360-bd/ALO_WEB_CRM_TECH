"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Inquiry = {
  id: string;
  reference: string;
  type: string;
  status: string;
  subject: string | null;
  message: string | null;
  createdAt: string;
  contact: { id: string; fullName: string; email: string; organization: string | null };
  createdBy: { id: string; name: string; email: string } | null;
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  read: "secondary",
  responded: "outline",
  qualified: "secondary",
  archived: "destructive",
};

const TYPE_LABELS: Record<string, string> = {
  "university-partnership": "Univ. Partnership",
  "business-consultation": "Business Consulting",
  "operations-review": "Operations Review",
  "sales-strategy": "Sales Strategy",
  "education-advisory": "Education Advisory",
  "ai-automation": "AI Automation",
  "crm-digital": "CRM / Digital",
  "tech-collaboration": "Tech Collaboration",
  "personal-branding": "Personal Branding",
  speaking: "Speaking",
  media: "Media",
  "student-referral": "Student Referral",
  other: "Other",
  general: "General",
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "responded", label: "Responded" },
  { value: "qualified", label: "Qualified" },
  { value: "archived", label: "Archived" },
];

const STATUS_FIELDS = [
  { name: "status", label: "Status", type: "select" as const, required: true, options: STATUS_OPTIONS },
  { name: "notes", label: "Internal Notes", type: "textarea" as const },
];

export default function AdminInquiriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Inquiry | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openEdit(i: Inquiry) { setEditing(i); setDialogOpen(true); }

  const columns: Column<Inquiry>[] = [
    { key: "reference", label: "Reference", render: (i) => (
      <div>
        <div className="font-mono text-xs font-medium">{i.reference}</div>
        <div className="text-xs text-muted-foreground">{TYPE_LABELS[i.type] || i.type}</div>
      </div>
    )},
    { key: "contact", label: "Contact", render: (i) => (
      <div>
        <div className="font-medium">{i.contact?.fullName || "—"}</div>
        <div className="text-xs text-muted-foreground">{i.contact?.email || "—"}</div>
        {i.contact?.organization && <div className="text-xs text-muted-foreground">{i.contact.organization}</div>}
      </div>
    )},
    { key: "subject", label: "Subject", render: (i) => i.subject || i.message?.substring(0, 60) || "—" },
    { key: "status", label: "Status", render: (i) => (
      <Badge variant={STATUS_COLORS[i.status] || "default"}>{i.status}</Badge>
    )},
    { key: "createdAt", label: "Received", render: (i) => (
      <span className="text-xs text-muted-foreground">{fmtDate(i.createdAt)}</span>
    )},
  ];

  return (
    <>
      <CrudList<Inquiry>
        key={refreshKey}
        title="Inquiries"
        subtitle="Contact form submissions — review, qualify, and respond"
        endpoint="/api/v1/admin/inquiries"
        columns={columns}
        filters={[
          { label: "New", value: "new", param: "status" },
          { label: "Read", value: "read", param: "status" },
          { label: "Responded", value: "responded", param: "status" },
          { label: "Qualified", value: "qualified", param: "status" },
          { label: "Archived", value: "archived", param: "status" },
        ]}
        rowActions={(i) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(i)} aria-label="Update status">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success("Inquiry updated."); }}
        endpoint="/api/v1/admin/inquiries"
        title={`Update ${editing?.reference || "Inquiry"}`}
        fields={STATUS_FIELDS}
        initial={editing ? { status: editing.status, notes: "" } : {}}
        id={editing?.id}
      />
    </>
  );
}
