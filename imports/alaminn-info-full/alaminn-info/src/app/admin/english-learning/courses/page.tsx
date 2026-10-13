"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Course = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  level: string;
  durationWeeks: number | null;
  hoursPerWeek: number | null;
  priceUsd: number | null;
  currency: string;
  isFeatured: boolean;
  isPublished: boolean;
  verificationStatus: string;
  publicationStatus: string;
  updatedAt: string;
};

const FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from title" },
  { name: "summary", label: "Summary", type: "textarea" as const },
  { name: "description", label: "Description (Markdown)", type: "textarea" as const },
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
  { name: "durationWeeks", label: "Duration (weeks)", type: "number" as const },
  { name: "hoursPerWeek", label: "Hours per Week", type: "number" as const },
  { name: "priceUsd", label: "Price (USD)", type: "number" as const },
  { name: "currency", label: "Currency", type: "text" as const, placeholder: "USD" },
  { name: "certificationType", label: "Certification Type", type: "text" as const },
  { name: "passScore", label: "Pass Score", type: "number" as const },
  { name: "heroImageUrl", label: "Hero Image URL", type: "text" as const },
  { name: "introVideoUrl", label: "Intro Video URL", type: "text" as const },
  { name: "officialSourceUrl", label: "Official Source URL", type: "text" as const },
  { name: "metaTitle", label: "Meta Title", type: "text" as const },
  { name: "metaDescription", label: "Meta Description", type: "textarea" as const },
  { name: "isFeatured", label: "Featured", type: "checkbox" as const },
  { name: "isPublished", label: "Published", type: "checkbox" as const },
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

export default function AdminEnglishLearningCoursesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(c: Course) { setEditing(c); setDialogOpen(true); }

  async function destroy(c: Course) {
    if (!confirm(`Delete course "${c.title}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/english-learning/admin/courses/${c.id}`, { method: "DELETE" });
      toast.success("Course deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<Course>[] = [
    { key: "title", label: "Course", render: (c) => (
      <div>
        <div className="font-medium">
          {c.title}
          {c.isFeatured && <Badge variant="default" className="ml-1 text-[10px]">Featured</Badge>}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{c.slug}</div>
      </div>
    ) },
    { key: "level", label: "Level", render: (c) => <Badge variant="outline">{c.level}</Badge> },
    { key: "durationWeeks", label: "Duration", render: (c) => c.durationWeeks ? `${c.durationWeeks}w` : "—" },
    { key: "hoursPerWeek", label: "Hrs/wk", render: (c) => c.hoursPerWeek ? `${c.hoursPerWeek}` : "—" },
    { key: "priceUsd", label: "Price", render: (c) => c.priceUsd != null ? `${c.priceUsd.toLocaleString()} ${c.currency}` : "—" },
    { key: "isPublished", label: "Published", render: (c) => <Badge variant={c.isPublished ? "default" : "outline"}>{c.isPublished ? "Yes" : "No"}</Badge> },
    { key: "updatedAt", label: "Updated", render: (c) => <span className="text-xs text-muted-foreground">{fmtDate(c.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Course>
        key={refreshKey}
        title="English Learning — Courses"
        subtitle="Manage English-language course catalogue"
        endpoint="/api/v1/english-learning/admin/courses"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        filters={[
          { label: "Published", value: "true", param: "isPublished" },
          { label: "Featured", value: "true", param: "isFeatured" },
        ]}
        onCreate={openCreate}
        createLabel="Add Course"
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
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Course updated." : "Course created."); }}
        endpoint="/api/v1/english-learning/admin/courses"
        title={editing ? "Edit Course" : "Add Course"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
