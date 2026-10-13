"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type PracticeTest = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  testType: string;
  level: string;
  durationMinutes: number | null;
  totalQuestions: number;
  passingScore: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  updatedAt: string;
};

const FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from title" },
  { name: "testType", label: "Test Type", type: "select" as const, options: [
    { value: "ielts-reading", label: "IELTS Reading" },
    { value: "ielts-listening", label: "IELTS Listening" },
    { value: "ielts-writing", label: "IELTS Writing" },
    { value: "ielts-speaking", label: "IELTS Speaking" },
    { value: "toefl-reading", label: "TOEFL Reading" },
    { value: "toefl-listening", label: "TOEFL Listening" },
    { value: "toefl-writing", label: "TOEFL Writing" },
    { value: "toefl-speaking", label: "TOEFL Speaking" },
    { value: "pte", label: "PTE" },
    { value: "duolingo", label: "Duolingo" },
    { value: "gre-verbal", label: "GRE Verbal" },
    { value: "gmat-verbal", label: "GMAT Verbal" },
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
  { name: "durationMinutes", label: "Duration (minutes)", type: "number" as const },
  { name: "totalQuestions", label: "Total Questions", type: "number" as const },
  { name: "passingScore", label: "Passing Score", type: "number" as const },
  { name: "description", label: "Description", type: "textarea" as const },
  { name: "isPublished", label: "Published", type: "checkbox" as const },
  { name: "isFeatured", label: "Featured", type: "checkbox" as const },
];

export default function AdminEnglishLearningPracticeTestsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PracticeTest | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(t: PracticeTest) { setEditing(t); setDialogOpen(true); }

  async function destroy(t: PracticeTest) {
    if (!confirm(`Delete practice test "${t.title}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/english-learning/admin/practice-tests/${t.id}`, { method: "DELETE" });
      toast.success("Practice test deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<PracticeTest>[] = [
    { key: "title", label: "Practice Test", render: (t) => (
      <div>
        <div className="font-medium">
          {t.title}
          {t.isFeatured && <Badge variant="default" className="ml-1 text-[10px]">Featured</Badge>}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{t.slug}</div>
      </div>
    ) },
    { key: "testType", label: "Type", render: (t) => <Badge variant="outline">{t.testType}</Badge> },
    { key: "level", label: "Level", render: (t) => <Badge variant="outline">{t.level}</Badge> },
    { key: "durationMinutes", label: "Duration", render: (t) => t.durationMinutes ? `${t.durationMinutes}m` : "—" },
    { key: "totalQuestions", label: "Questions", render: (t) => String(t.totalQuestions) },
    { key: "passingScore", label: "Pass", render: (t) => t.passingScore ?? "—" },
    { key: "isPublished", label: "Published", render: (t) => <Badge variant={t.isPublished ? "default" : "outline"}>{t.isPublished ? "Yes" : "No"}</Badge> },
    { key: "updatedAt", label: "Updated", render: (t) => <span className="text-xs text-muted-foreground">{fmtDate(t.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<PracticeTest>
        key={refreshKey}
        title="English Learning — Practice Tests"
        subtitle="Mock tests grouped by test type (IELTS, TOEFL, PTE...)"
        endpoint="/api/v1/english-learning/admin/practice-tests"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        onCreate={openCreate}
        createLabel="Add Practice Test"
        rowActions={(t) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(t)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(t)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Practice test updated." : "Practice test created."); }}
        endpoint="/api/v1/english-learning/admin/practice-tests"
        title={editing ? "Edit Practice Test" : "Add Practice Test"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
