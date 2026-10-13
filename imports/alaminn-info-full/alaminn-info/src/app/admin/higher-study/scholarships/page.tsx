"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDay } from "@/components/admin/lib";
import { toast } from "sonner";

type Scholarship = {
  id: string;
  slug: string;
  name: string;
  provider: string | null;
  fundingType: string | null;
  fundingAmount: string | null;
  deadline: string | null;
  featured: boolean;
  verificationStatus: string;
  publicationStatus: string;
  updatedAt: string;
  country?: { id: string; slug: string; name: string } | null;
  university?: { id: string; slug: string; officialName: string } | null;
};

const FIELDS = [
  { name: "name", label: "Name", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from name" },
  { name: "provider", label: "Provider", type: "text" as const },
  { name: "countryId", label: "Country ID", type: "text" as const, placeholder: "cuid (optional)" },
  { name: "universityId", label: "University ID", type: "text" as const, placeholder: "cuid (optional)" },
  { name: "fundingType", label: "Funding Type", type: "select" as const, options: [
    { value: "fully-funded", label: "Fully Funded" },
    { value: "partially-funded", label: "Partially Funded" },
    { value: "government", label: "Government" },
    { value: "university", label: "University" },
    { value: "department", label: "Department" },
    { value: "research-council", label: "Research Council" },
    { value: "merit", label: "Merit" },
    { value: "need", label: "Need-based" },
    { value: "country-specific", label: "Country-specific" },
    { value: "subject-specific", label: "Subject-specific" },
    { value: "women", label: "Women" },
    { value: "leadership", label: "Leadership" },
    { value: "phd-studentship", label: "PhD Studentship" },
    { value: "tuition-discount", label: "Tuition Discount" },
    { value: "fee-waiver", label: "Fee Waiver" },
    { value: "bursary", label: "Bursary" },
    { value: "grant", label: "Grant" },
    { value: "fellowship", label: "Fellowship" },
  ] },
  { name: "fundingAmount", label: "Funding Amount", type: "text" as const },
  { name: "eligibleStudyLevels", label: "Eligible Study Levels (comma separated)", type: "text" as const },
  { name: "eligibleSubjects", label: "Eligible Subjects (comma separated)", type: "text" as const },
  { name: "eligibleNationalities", label: "Eligible Nationalities (comma separated)", type: "text" as const },
  { name: "openingDate", label: "Opening Date", type: "date" as const },
  { name: "deadline", label: "Deadline", type: "date" as const },
  { name: "eligibilityCriteria", label: "Eligibility Criteria", type: "textarea" as const },
  { name: "applicationProcess", label: "Application Process", type: "textarea" as const },
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

export default function AdminHigherStudyScholarshipsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Scholarship | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(s: Scholarship) { setEditing(s); setDialogOpen(true); }

  async function destroy(s: Scholarship) {
    if (!confirm(`Delete scholarship "${s.name}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/higher-study/admin/scholarships/${s.id}`, { method: "DELETE" });
      toast.success("Scholarship deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<Scholarship>[] = [
    { key: "name", label: "Scholarship", render: (s) => (
      <div>
        <div className="font-medium">
          {s.name}
          {s.featured && <Badge variant="default" className="ml-1 text-[10px]">Featured</Badge>}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{s.slug}</div>
      </div>
    ) },
    { key: "provider", label: "Provider", render: (s) => s.provider || "—" },
    { key: "fundingType", label: "Funding", render: (s) => s.fundingType ? <Badge variant="outline">{s.fundingType}</Badge> : "—" },
    { key: "fundingAmount", label: "Amount", render: (s) => s.fundingAmount || "—" },
    { key: "deadline", label: "Deadline", render: (s) => <span className="text-xs text-muted-foreground">{fmtDay(s.deadline)}</span> },
    { key: "publicationStatus", label: "Status", render: (s) => <Badge variant={s.publicationStatus === "published" ? "default" : "outline"}>{s.publicationStatus}</Badge> },
    { key: "updatedAt", label: "Updated", render: (s) => <span className="text-xs text-muted-foreground">{fmtDay(s.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Scholarship>
        key={refreshKey}
        title="Higher Study — Scholarships"
        subtitle="Manage scholarship / funding opportunities"
        endpoint="/api/v1/higher-study/admin/scholarships"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        filters={[
          { label: "Published", value: "published", param: "publicationStatus" },
          { label: "Draft", value: "draft", param: "publicationStatus" },
          { label: "Archived", value: "archived", param: "publicationStatus" },
        ]}
        onCreate={openCreate}
        createLabel="Add Scholarship"
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
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Scholarship updated." : "Scholarship created."); }}
        endpoint="/api/v1/higher-study/admin/scholarships"
        title={editing ? "Edit Scholarship" : "Add Scholarship"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
