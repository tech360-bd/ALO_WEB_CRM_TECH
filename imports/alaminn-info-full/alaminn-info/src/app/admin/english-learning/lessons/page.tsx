"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  courseId: string;
  orderIndex: number;
  durationMinutes: number | null;
  lessonType: string;
  videoUrl: string | null;
  isFreePreview: boolean;
  isPublished: boolean;
  updatedAt: string;
  course?: { id: string; slug: string; title: string } | null;
};

const FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from title" },
  { name: "courseId", label: "Course ID", type: "text" as const, required: true, placeholder: "cuid of the parent course" },
  { name: "orderIndex", label: "Order Index", type: "number" as const },
  { name: "lessonType", label: "Lesson Type", type: "select" as const, options: [
    { value: "video", label: "Video" },
    { value: "reading", label: "Reading" },
    { value: "listening", label: "Listening" },
    { value: "speaking", label: "Speaking" },
    { value: "writing", label: "Writing" },
    { value: "grammar", label: "Grammar" },
    { value: "vocab", label: "Vocabulary" },
    { value: "quiz", label: "Quiz" },
  ] },
  { name: "summary", label: "Summary", type: "textarea" as const },
  { name: "content", label: "Content (Markdown)", type: "textarea" as const },
  { name: "durationMinutes", label: "Duration (minutes)", type: "number" as const },
  { name: "videoUrl", label: "Video URL", type: "text" as const },
  { name: "transcript", label: "Transcript (Markdown)", type: "textarea" as const },
  { name: "isFreePreview", label: "Free Preview", type: "checkbox" as const },
  { name: "isPublished", label: "Published", type: "checkbox" as const },
];

export default function AdminEnglishLearningLessonsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(l: Lesson) { setEditing(l); setDialogOpen(true); }

  async function destroy(l: Lesson) {
    if (!confirm(`Delete lesson "${l.title}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/english-learning/admin/lessons/${l.id}`, { method: "DELETE" });
      toast.success("Lesson deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<Lesson>[] = [
    { key: "title", label: "Lesson", render: (l) => (
      <div>
        <div className="font-medium">
          {l.title}
          {l.isFreePreview && <Badge variant="default" className="ml-1 text-[10px]">Free</Badge>}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{l.slug}</div>
      </div>
    ) },
    { key: "course", label: "Course", render: (l) => l.course?.title || <span className="text-xs text-muted-foreground">{l.courseId}</span> },
    { key: "lessonType", label: "Type", render: (l) => <Badge variant="outline">{l.lessonType}</Badge> },
    { key: "orderIndex", label: "Order", render: (l) => String(l.orderIndex) },
    { key: "durationMinutes", label: "Duration", render: (l) => l.durationMinutes ? `${l.durationMinutes}m` : "—" },
    { key: "isPublished", label: "Published", render: (l) => <Badge variant={l.isPublished ? "default" : "outline"}>{l.isPublished ? "Yes" : "No"}</Badge> },
    { key: "updatedAt", label: "Updated", render: (l) => <span className="text-xs text-muted-foreground">{fmtDate(l.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Lesson>
        key={refreshKey}
        title="English Learning — Lessons"
        subtitle="Lessons grouped under courses"
        endpoint="/api/v1/english-learning/admin/lessons"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        onCreate={openCreate}
        createLabel="Add Lesson"
        rowActions={(l) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(l)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(l)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Lesson updated." : "Lesson created."); }}
        endpoint="/api/v1/english-learning/admin/lessons"
        title={editing ? "Edit Lesson" : "Add Lesson"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
