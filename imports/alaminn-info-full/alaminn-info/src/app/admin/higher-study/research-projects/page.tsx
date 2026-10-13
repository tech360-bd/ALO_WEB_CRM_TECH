"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDay, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type ResearchProject = {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  fundingStatus: string | null;
  duration: string | null;
  startDate: string | null;
  applicationDeadline: string | null;
  featured: boolean;
  verificationStatus: string;
  publicationStatus: string;
  updatedAt: string;
  university?: { id: string; slug: string; officialName: string } | null;
  researchArea?: { id: string; slug: string; name: string } | null;
  supervisor?: { id: string; slug: string; name: string } | null;
};

const FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from title" },
  { name: "universityId", label: "University ID", type: "text" as const, required: true, placeholder: "cuid of the parent university" },
  { name: "department", label: "Department", type: "text" as const },
  { name: "researchAreaId", label: "Research Area ID", type: "text" as const, placeholder: "cuid (optional)" },
  { name: "supervisorId", label: "Supervisor ID", type: "text" as const, placeholder: "cuid (optional)" },
  { name: "coSupervisorId", label: "Co-Supervisor ID", type: "text" as const, placeholder: "cuid (optional)" },
  { name: "fundingStatus", label: "Funding Status", type: "select" as const, options: [
    { value: "fully-funded", label: "Fully Funded" },
    { value: "partially-funded", label: "Partially Funded" },
    { value: "self-funded", label: "Self Funded" },
    { value: "studentship", label: "Studentship" },
    { value: "unfunded", label: "Unfunded" },
  ] },
  { name: "stipend", label: "Stipend", type: "text" as const },
  { name: "duration", label: "Duration", type: "text" as const },
  { name: "startDate", label: "Start Date", type: "date" as const },
  { name: "applicationDeadline", label: "Application Deadline", type: "date" as const },
  { name: "projectSummary", label: "Project Summary", type: "textarea" as const },
  { name: "researchObjectives", label: "Research Objectives", type: "textarea" as const },
  { name: "candidateProfile", label: "Candidate Profile", type: "textarea" as const },
  { name: "academicRequirements", label: "Academic Requirements", type: "textarea" as const },
  { name: "englishRequirements", label: "English Requirements", type: "textarea" as const },
  { name: "officialSourceUrl", label: "Official Source URL", type: "text" as const },
  { name: "featured", label: "Featured", type: "checkbox" as const },
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

export default function AdminHigherStudyResearchProjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ResearchProject | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(r: ResearchProject) { setEditing(r); setDialogOpen(true); }

  async function destroy(r: ResearchProject) {
    if (!confirm(`Delete research project "${r.title}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/higher-study/admin/research/${r.id}`, { method: "DELETE" });
      toast.success("Research project deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<ResearchProject>[] = [
    { key: "title", label: "Project", render: (r) => (
      <div>
        <div className="font-medium">
          {r.title}
          {r.featured && <Badge variant="default" className="ml-1 text-[10px]">Featured</Badge>}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{r.slug}</div>
      </div>
    ) },
    { key: "university", label: "University", render: (r) => r.university?.officialName || "—" },
    { key: "supervisor", label: "Supervisor", render: (r) => r.supervisor?.name || "—" },
    { key: "researchArea", label: "Area", render: (r) => r.researchArea?.name || "—" },
    { key: "fundingStatus", label: "Funding", render: (r) => r.fundingStatus ? <Badge variant="outline">{r.fundingStatus}</Badge> : "—" },
    { key: "applicationDeadline", label: "Deadline", render: (r) => <span className="text-xs text-muted-foreground">{fmtDay(r.applicationDeadline)}</span> },
    { key: "publicationStatus", label: "Status", render: (r) => <Badge variant={r.publicationStatus === "published" ? "default" : "outline"}>{r.publicationStatus}</Badge> },
    { key: "updatedAt", label: "Updated", render: (r) => <span className="text-xs text-muted-foreground">{fmtDate(r.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<ResearchProject>
        key={refreshKey}
        title="Higher Study — Research Projects"
        subtitle="PhD / research project listings linked to supervisors"
        endpoint="/api/v1/higher-study/admin/research"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        filters={[
          { label: "Published", value: "published", param: "publicationStatus" },
          { label: "Draft", value: "draft", param: "publicationStatus" },
          { label: "Verified", value: "verified", param: "verifiedStatus" },
        ]}
        onCreate={openCreate}
        createLabel="Add Research Project"
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
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Research project updated." : "Research project created."); }}
        endpoint="/api/v1/higher-study/admin/research"
        title={editing ? "Edit Research Project" : "Add Research Project"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
