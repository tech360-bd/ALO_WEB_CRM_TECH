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
  summary: string | null;
  resourceType: string;
  url: string | null;
  durationMinutes: number | null;
  readingTimeMinutes: number | null;
  level: string;
  isPublished: boolean;
  isFeatured: boolean;
  authorName: string | null;
  sourceName: string | null;
  updatedAt: string;
};

const FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from title" },
  { name: "resourceType", label: "Resource Type", type: "select" as const, options: [
    { value: "article", label: "Article" },
    { value: "video", label: "Video" },
    { value: "infographic", label: "Infographic" },
    { value: "audio", label: "Audio" },
    { value: "pdf", label: "PDF" },
  ] },
  { name: "level", label: "Level", type: "select" as const, options: [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "ielts", label: "IELTS" },
    { value: "toefl", label: "TOEFL" },
    { value: "pte", label: "PTE" },
    { value: "det", label: "Duolingo" },
    { value: "gre", label: "GRE" },
    { value: "gmat", label: "GMAT" },
  ] },
  { name: "url", label: "URL", type: "text" as const },
  { name: "summary", label: "Summary", type: "textarea" as const },
  { name: "description", label: "Description (Markdown)", type: "textarea" as const },
  { name: "durationMinutes", label: "Duration (minutes)", type: "number" as const },
  { name: "readingTimeMinutes", label: "Reading Time (minutes)", type: "number" as const },
  { name: "authorName", label: "Author Name", type: "text" as const },
  { name: "sourceName", label: "Source Name", type: "text" as const },
  { name: "isPublished", label: "Published", type: "checkbox" as const },
  { name: "isFeatured", label: "Featured", type: "checkbox" as const },
];

export default function AdminEnglishLearningResourcesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(r: Resource) { setEditing(r); setDialogOpen(true); }

  async function destroy(r: Resource) {
    if (!confirm(`Delete resource "${r.title}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/english-learning/admin/resources/${r.id}`, { method: "DELETE" });
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
          {r.isFeatured && <Badge variant="default" className="ml-1 text-[10px]">Featured</Badge>}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{r.slug}</div>
      </div>
    ) },
    { key: "resourceType", label: "Type", render: (r) => <Badge variant="outline">{r.resourceType}</Badge> },
    { key: "level", label: "Level", render: (r) => <Badge variant="outline">{r.level}</Badge> },
    { key: "durationMinutes", label: "Duration", render: (r) => r.durationMinutes ? `${r.durationMinutes}m` : "—" },
    { key: "readingTimeMinutes", label: "Read", render: (r) => r.readingTimeMinutes ? `${r.readingTimeMinutes}m` : "—" },
    { key: "authorName", label: "Author", render: (r) => r.authorName || "—" },
    { key: "isPublished", label: "Published", render: (r) => <Badge variant={r.isPublished ? "default" : "outline"}>{r.isPublished ? "Yes" : "No"}</Badge> },
    { key: "updatedAt", label: "Updated", render: (r) => <span className="text-xs text-muted-foreground">{fmtDate(r.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Resource>
        key={refreshKey}
        title="English Learning — Resources"
        subtitle="Articles, videos, infographics shown on the English Learning module"
        endpoint="/api/v1/english-learning/admin/resources"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
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
        endpoint="/api/v1/english-learning/admin/resources"
        title={editing ? "Edit Resource" : "Add Resource"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
