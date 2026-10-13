"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Resource = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  author: string | null;
  readingTimeMinutes: number | null;
  featured: boolean;
  verificationStatus: string;
  publicationStatus: string;
  updatedAt: string;
};

const FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from title" },
  { name: "category", label: "Category", type: "select" as const, options: [
    { value: "planning", label: "Planning" },
    { value: "country-guides", label: "Country Guides" },
    { value: "university-guides", label: "University Guides" },
    { value: "course-selection", label: "Course Selection" },
    { value: "scholarship-guides", label: "Scholarship Guides" },
    { value: "phd-guides", label: "PhD Guides" },
    { value: "research-guides", label: "Research Guides" },
    { value: "proposal-guides", label: "Proposal Guides" },
    { value: "supervisor-contact", label: "Supervisor Contact" },
    { value: "sop", label: "Statement of Purpose" },
    { value: "personal-statement", label: "Personal Statement" },
    { value: "cv", label: "CV" },
    { value: "recommendation-letter", label: "Recommendation Letter" },
    { value: "portfolio", label: "Portfolio" },
    { value: "visa", label: "Visa" },
    { value: "financial", label: "Financial" },
    { value: "accommodation", label: "Accommodation" },
    { value: "pre-departure", label: "Pre-departure" },
    { value: "student-life", label: "Student Life" },
    { value: "checklists", label: "Checklists" },
    { value: "interview", label: "Interview" },
    { value: "ielts", label: "IELTS" },
    { value: "pte", label: "PTE" },
    { value: "toefl", label: "TOEFL" },
    { value: "duolingo", label: "Duolingo" },
    { value: "academic-writing", label: "Academic Writing" },
    { value: "research-methods", label: "Research Methods" },
    { value: "publication", label: "Publication" },
    { value: "referencing", label: "Referencing" },
    { value: "research-ethics", label: "Research Ethics" },
    { value: "comparison", label: "Comparison" },
    { value: "faq", label: "FAQ" },
  ] },
  { name: "author", label: "Author", type: "text" as const },
  { name: "reviewer", label: "Reviewer", type: "text" as const },
  { name: "readingTimeMinutes", label: "Reading Time (minutes)", type: "number" as const },
  { name: "summary", label: "Summary", type: "textarea" as const },
  { name: "content", label: "Content (Markdown)", type: "textarea" as const },
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

export default function AdminHigherStudyResourcesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(r: Resource) { setEditing(r); setDialogOpen(true); }

  async function destroy(r: Resource) {
    if (!confirm(`Delete resource "${r.title}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/higher-study/admin/resources/${r.id}`, { method: "DELETE" });
      toast.success("Resource deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<Resource>[] = [
    { key: "title", label: "Resource", render: (r) => (
      <div>
        <div className="font-medium">
          {r.title}
          {r.featured && <Badge variant="default" className="ml-1 text-[10px]">Featured</Badge>}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{r.slug}</div>
      </div>
    ) },
    { key: "category", label: "Category", render: (r) => r.category ? <Badge variant="outline">{r.category}</Badge> : "—" },
    { key: "author", label: "Author", render: (r) => r.author || "—" },
    { key: "readingTimeMinutes", label: "Read", render: (r) => r.readingTimeMinutes ? `${r.readingTimeMinutes}m` : "—" },
    { key: "publicationStatus", label: "Status", render: (r) => <Badge variant={r.publicationStatus === "published" ? "default" : "outline"}>{r.publicationStatus}</Badge> },
    { key: "updatedAt", label: "Updated", render: (r) => <span className="text-xs text-muted-foreground">{fmtDate(r.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Resource>
        key={refreshKey}
        title="Higher Study — Resources"
        subtitle="Long-form study guides shown on the Higher Study resources hub"
        endpoint="/api/v1/higher-study/admin/resources"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        filters={[
          { label: "Published", value: "published", param: "publicationStatus" },
          { label: "Draft", value: "draft", param: "publicationStatus" },
          { label: "Verified", value: "verified", param: "verifiedStatus" },
        ]}
        onCreate={openCreate}
        createLabel="Add Resource"
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
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Resource updated." : "Resource created."); }}
        endpoint="/api/v1/higher-study/admin/resources"
        title={editing ? "Edit Resource" : "Add Resource"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
