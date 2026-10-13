"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDay, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type StudentStory = {
  id: string;
  slug: string;
  studentName: string;
  universityName: string | null;
  courseName: string | null;
  country: string | null;
  intake: string | null;
  featured: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

const FIELDS = [
  { name: "studentName", label: "Student Name", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from name" },
  { name: "universityName", label: "University Name", type: "text" as const },
  { name: "courseName", label: "Course Name", type: "text" as const },
  { name: "country", label: "Country", type: "text" as const },
  { name: "intake", label: "Intake", type: "text" as const, placeholder: "Fall 2025" },
  { name: "imageUrl", label: "Image URL", type: "text" as const },
  { name: "story", label: "Story", type: "textarea" as const },
  { name: "advice", label: "Advice", type: "textarea" as const },
  { name: "publishedAt", label: "Published At", type: "date" as const },
  { name: "featured", label: "Featured", type: "checkbox" as const },
];

export default function AdminHigherStudyStudentStoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StudentStory | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(s: StudentStory) { setEditing(s); setDialogOpen(true); }

  async function destroy(s: StudentStory) {
    if (!confirm(`Delete story for "${s.studentName}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/higher-study/admin/student-stories/${s.id}`, { method: "DELETE" });
      toast.success("Story deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<StudentStory>[] = [
    { key: "studentName", label: "Student", render: (s) => (
      <div>
        <div className="font-medium">
          {s.studentName}
          {s.featured && <Badge variant="default" className="ml-1 text-[10px]">Featured</Badge>}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{s.slug}</div>
      </div>
    ) },
    { key: "universityName", label: "University", render: (s) => s.universityName || "—" },
    { key: "courseName", label: "Course", render: (s) => s.courseName || "—" },
    { key: "country", label: "Country", render: (s) => s.country || "—" },
    { key: "intake", label: "Intake", render: (s) => s.intake || "—" },
    { key: "publishedAt", label: "Published", render: (s) => <span className="text-xs text-muted-foreground">{fmtDay(s.publishedAt)}</span> },
    { key: "updatedAt", label: "Updated", render: (s) => <span className="text-xs text-muted-foreground">{fmtDate(s.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<StudentStory>
        key={refreshKey}
        title="Higher Study — Student Stories"
        subtitle="Alumni testimonials shown on the Higher Study module"
        endpoint="/api/v1/higher-study/admin/student-stories"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        onCreate={openCreate}
        createLabel="Add Story"
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
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Story updated." : "Story created."); }}
        endpoint="/api/v1/higher-study/admin/student-stories"
        title={editing ? "Edit Student Story" : "Add Student Story"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
