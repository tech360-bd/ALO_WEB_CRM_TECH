"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Supervisor = {
  id: string;
  slug: string;
  name: string;
  academicTitle: string | null;
  department: string | null;
  publicProfileUrl: string | null;
  researchInterests: string | null;
  acceptingStudents: boolean;
  verificationStatus: string;
  publicationStatus: string;
  updatedAt: string;
  university?: { id: string; slug: string; officialName: string } | null;
  researchArea?: { id: string; slug: string; name: string } | null;
};

const FIELDS = [
  { name: "name", label: "Name", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from name" },
  { name: "academicTitle", label: "Academic Title", type: "text" as const, placeholder: "Professor, Dr, Lecturer" },
  { name: "universityId", label: "University ID", type: "text" as const, required: true, placeholder: "cuid of the parent university" },
  { name: "department", label: "Department", type: "text" as const },
  { name: "researchAreaId", label: "Research Area ID", type: "text" as const, placeholder: "cuid (optional)" },
  { name: "researchInterests", label: "Research Interests (comma separated)", type: "text" as const },
  { name: "publicProfileUrl", label: "Public Profile URL", type: "text" as const },
  { name: "officialSourceUrl", label: "Official Source URL", type: "text" as const },
  { name: "applicationGuidance", label: "Application Guidance", type: "textarea" as const },
  { name: "acceptingStudents", label: "Accepting Students", type: "checkbox" as const },
  { name: "verificationStatus", label: "Verification Status", type: "select" as const, options: [
    { value: "draft", label: "Draft" },
    { value: "pending-review", label: "Pending Review" },
    { value: "verified", label: "Verified" },
    { value: "published", label: "Published" },
    { value: "needs-update", label: "Needs Update" },
    { value: "archived", label: "Archived" },
  ] },
  { name: "publicationStatus", label: "Publication Status", type: "select" as const, options: [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "archived", label: "Archived" },
  ] },
];

export default function AdminHigherStudySupervisorsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supervisor | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(s: Supervisor) { setEditing(s); setDialogOpen(true); }

  async function destroy(s: Supervisor) {
    if (!confirm(`Delete supervisor "${s.name}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/higher-study/admin/supervisors/${s.id}`, { method: "DELETE" });
      toast.success("Supervisor deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<Supervisor>[] = [
    { key: "name", label: "Supervisor", render: (s) => (
      <div>
        <div className="font-medium">
          {s.academicTitle && <span className="text-muted-foreground mr-1">{s.academicTitle}</span>}
          {s.name}
          {s.acceptingStudents && <Badge variant="default" className="ml-1 text-[10px]">Accepting</Badge>}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{s.slug}</div>
      </div>
    ) },
    { key: "university", label: "University", render: (s) => s.university?.officialName || "—" },
    { key: "department", label: "Department", render: (s) => s.department || "—" },
    { key: "researchArea", label: "Research Area", render: (s) => s.researchArea?.name || "—" },
    { key: "researchInterests", label: "Interests", render: (s) => s.researchInterests ? <span className="text-xs">{s.researchInterests}</span> : "—" },
    { key: "publicationStatus", label: "Status", render: (s) => <Badge variant={s.publicationStatus === "published" ? "default" : "outline"}>{s.publicationStatus}</Badge> },
    { key: "updatedAt", label: "Updated", render: (s) => <span className="text-xs text-muted-foreground">{fmtDate(s.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Supervisor>
        key={refreshKey}
        title="Higher Study — Supervisors"
        subtitle="PhD / research supervisor profiles"
        endpoint="/api/v1/higher-study/admin/supervisors"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        filters={[
          { label: "Published", value: "published", param: "publicationStatus" },
          { label: "Draft", value: "draft", param: "publicationStatus" },
          { label: "Verified", value: "verified", param: "verifiedStatus" },
        ]}
        onCreate={openCreate}
        createLabel="Add Supervisor"
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
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Supervisor updated." : "Supervisor created."); }}
        endpoint="/api/v1/higher-study/admin/supervisors"
        title={editing ? "Edit Supervisor" : "Add Supervisor"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
