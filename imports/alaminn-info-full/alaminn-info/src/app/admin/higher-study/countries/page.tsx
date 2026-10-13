"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Country = {
  id: string;
  slug: string;
  name: string;
  officialName: string | null;
  region: string | null;
  flagEmoji: string | null;
  status: string;
  updatedAt: string;
  _count?: { universities: number; courses: number; scholarships: number; cities: number };
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  published: "default",
  approved: "default",
  draft: "secondary",
  "pending-review": "outline",
  "needs-update": "destructive",
  archived: "destructive",
};

const FIELDS = [
  { name: "name", label: "Name", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from name" },
  { name: "officialName", label: "Official Name", type: "text" as const },
  { name: "region", label: "Region", type: "select" as const, options: [
    { value: "Europe", label: "Europe" },
    { value: "North America", label: "North America" },
    { value: "Asia-Pacific", label: "Asia-Pacific" },
    { value: "Middle East", label: "Middle East" },
    { value: "Africa", label: "Africa" },
    { value: "South America", label: "South America" },
    { value: "Oceania", label: "Oceania" },
  ] },
  { name: "flagEmoji", label: "Flag Emoji", type: "text" as const, placeholder: "🇬🇧" },
  { name: "imageUrl", label: "Image URL", type: "text" as const },
  { name: "overview", label: "Overview", type: "textarea" as const },
  { name: "educationSystem", label: "Education System", type: "textarea" as const },
  { name: "tuitionFeeRange", label: "Tuition Fee Range", type: "text" as const },
  { name: "livingCostRange", label: "Living Cost Range", type: "text" as const },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "draft", label: "Draft" },
    { value: "pending-review", label: "Pending Review" },
    { value: "approved", label: "Approved" },
    { value: "published", label: "Published" },
    { value: "needs-update", label: "Needs Update" },
    { value: "archived", label: "Archived" },
  ] },
];

export default function AdminHigherStudyCountriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(c: Country) { setEditing(c); setDialogOpen(true); }

  async function destroy(c: Country) {
    if (!confirm(`Delete country "${c.name}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/higher-study/admin/countries/${c.id}`, { method: "DELETE" });
      toast.success("Country deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<Country>[] = [
    { key: "name", label: "Country", render: (c) => (
      <div>
        <div className="font-medium">
          {c.flagEmoji && <span className="mr-1">{c.flagEmoji}</span>}
          {c.name}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{c.slug}</div>
      </div>
    ) },
    { key: "region", label: "Region", render: (c) => c.region ? <Badge variant="outline">{c.region}</Badge> : "—" },
    { key: "universities", label: "Entities", render: (c) => (
      <div className="text-xs text-muted-foreground">
        {c._count?.universities ?? 0} univ · {c._count?.courses ?? 0} courses · {c._count?.scholarships ?? 0} schol · {c._count?.cities ?? 0} cities
      </div>
    ) },
    { key: "status", label: "Status", render: (c) => <Badge variant={STATUS_VARIANTS[c.status] || "default"}>{c.status}</Badge> },
    { key: "updatedAt", label: "Updated", render: (c) => <span className="text-xs text-muted-foreground">{fmtDate(c.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Country>
        key={refreshKey}
        title="Higher Study — Countries"
        subtitle="Manage destination countries shown on the public Higher Study module"
        endpoint="/api/v1/higher-study/admin/countries"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        filters={[
          { label: "Published", value: "published", param: "status" },
          { label: "Draft", value: "draft", param: "status" },
          { label: "Pending Review", value: "pending-review", param: "status" },
          { label: "Archived", value: "archived", param: "status" },
        ]}
        onCreate={openCreate}
        createLabel="Add Country"
        rowActions={(c) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(c)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(c)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Country updated." : "Country created."); }}
        endpoint="/api/v1/higher-study/admin/countries"
        title={editing ? "Edit Country" : "Add Country"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
