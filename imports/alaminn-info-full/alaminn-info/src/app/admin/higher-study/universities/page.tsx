"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type University = {
  id: string;
  slug: string;
  officialName: string;
  institutionType: string | null;
  countryId: string;
  cityId: string | null;
  featured: boolean;
  verificationStatus: string;
  publicationStatus: string;
  updatedAt: string;
  country?: { id: string; slug: string; name: string; flagEmoji: string | null } | null;
  city?: { id: string; slug: string; name: string } | null;
  _count?: { courses: number; scholarships: number; supervisors: number };
};

const FIELDS = [
  { name: "officialName", label: "Official Name", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from official name" },
  { name: "countryId", label: "Country ID", type: "text" as const, required: true, placeholder: "cuid of the parent country" },
  { name: "cityId", label: "City ID", type: "text" as const, placeholder: "cuid (optional)" },
  { name: "alternativeNames", label: "Alternative Names (comma separated)", type: "text" as const },
  { name: "establishedYear", label: "Established Year", type: "number" as const },
  { name: "institutionType", label: "Institution Type", type: "select" as const, options: [
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
    { value: "specialist", label: "Specialist" },
    { value: "conservatoire", label: "Conservatoire" },
    { value: "research-intensive", label: "Research-intensive" },
    { value: "modern", label: "Modern" },
  ] },
  { name: "officialWebsite", label: "Official Website", type: "text" as const },
  { name: "logoUrl", label: "Logo URL", type: "text" as const },
  { name: "studyLevels", label: "Study Levels (comma separated)", type: "text" as const },
  { name: "overview", label: "Overview", type: "textarea" as const },
  { name: "tuitionFeeRange", label: "Tuition Fee Range", type: "text" as const },
  { name: "estimatedLivingCosts", label: "Estimated Living Costs", type: "text" as const },
  { name: "ieltsRequirement", label: "IELTS Requirement", type: "text" as const },
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

export default function AdminHigherStudyUniversitiesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<University | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(u: University) { setEditing(u); setDialogOpen(true); }

  async function destroy(u: University) {
    if (!confirm(`Delete university "${u.officialName}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/higher-study/admin/universities/${u.id}`, { method: "DELETE" });
      toast.success("University deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<University>[] = [
    { key: "officialName", label: "University", render: (u) => (
      <div>
        <div className="font-medium">
          {u.officialName}
          {u.featured && <Badge variant="default" className="ml-1 text-[10px]">Featured</Badge>}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{u.slug}</div>
      </div>
    ) },
    { key: "country", label: "Country", render: (u) => u.country ? (
      <span className="text-sm">{u.country.flagEmoji} {u.country.name}</span>
    ) : "—" },
    { key: "city", label: "City", render: (u) => u.city?.name || "—" },
    { key: "institutionType", label: "Type", render: (u) => u.institutionType ? <Badge variant="outline">{u.institutionType}</Badge> : "—" },
    { key: "entities", label: "Entities", render: (u) => (
      <div className="text-xs text-muted-foreground">
        {u._count?.courses ?? 0} courses · {u._count?.scholarships ?? 0} schol · {u._count?.supervisors ?? 0} supervisors
      </div>
    ) },
    { key: "verificationStatus", label: "Verification", render: (u) => <Badge variant="secondary">{u.verificationStatus}</Badge> },
    { key: "publicationStatus", label: "Publication", render: (u) => <Badge variant={u.publicationStatus === "published" ? "default" : "outline"}>{u.publicationStatus}</Badge> },
    { key: "updatedAt", label: "Updated", render: (u) => <span className="text-xs text-muted-foreground">{fmtDate(u.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<University>
        key={refreshKey}
        title="Higher Study — Universities"
        subtitle="Manage university profiles shown on the public Higher Study module"
        endpoint="/api/v1/higher-study/admin/universities"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        filters={[
          { label: "Published", value: "published", param: "publicationStatus" },
          { label: "Draft", value: "draft", param: "publicationStatus" },
          { label: "Verified", value: "verified", param: "verifiedStatus" },
          { label: "Needs Update", value: "needs-update", param: "verifiedStatus" },
        ]}
        onCreate={openCreate}
        createLabel="Add University"
        rowActions={(u) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(u)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(u)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "University updated." : "University created."); }}
        endpoint="/api/v1/higher-study/admin/universities"
        title={editing ? "Edit University" : "Add University"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
