"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Question = {
  id: string;
  questionType: string;
  questionText: string;
  correctAnswer: string | null;
  points: number;
  orderIndex: number;
  skillArea: string;
  testId: string;
  updatedAt: string;
  test?: { id: string; slug: string; title: string } | null;
};

const FIELDS = [
  { name: "testId", label: "Practice Test ID", type: "text" as const, required: true, placeholder: "cuid of the parent practice test" },
  { name: "questionType", label: "Question Type", type: "select" as const, options: [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "true-false", label: "True / False" },
    { value: "fill-blank", label: "Fill in the Blank" },
    { value: "short-answer", label: "Short Answer" },
    { value: "essay", label: "Essay" },
    { value: "matching", label: "Matching" },
  ] },
  { name: "questionText", label: "Question Text", type: "textarea" as const, required: true },
  { name: "correctAnswer", label: "Correct Answer", type: "text" as const },
  { name: "explanation", label: "Explanation (Markdown)", type: "textarea" as const },
  { name: "skillArea", label: "Skill Area", type: "select" as const, options: [
    { value: "reading", label: "Reading" },
    { value: "listening", label: "Listening" },
    { value: "speaking", label: "Speaking" },
    { value: "writing", label: "Writing" },
    { value: "grammar", label: "Grammar" },
    { value: "vocab", label: "Vocabulary" },
  ] },
  { name: "points", label: "Points", type: "number" as const },
  { name: "orderIndex", label: "Order Index", type: "number" as const },
];

export default function AdminEnglishLearningQuestionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(q: Question) { setEditing(q); setDialogOpen(true); }

  async function destroy(q: Question) {
    if (!confirm(`Delete question "${q.questionText.slice(0, 50)}..."? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/english-learning/admin/questions/${q.id}`, { method: "DELETE" });
      toast.success("Question deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<Question>[] = [
    { key: "questionText", label: "Question", render: (q) => (
      <div className="max-w-md">
        <div className="font-medium line-clamp-2">{q.questionText}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {q.test?.title || <span className="font-mono">test:{q.testId}</span>}
        </div>
      </div>
    ) },
    { key: "questionType", label: "Type", render: (q) => <Badge variant="outline">{q.questionType}</Badge> },
    { key: "skillArea", label: "Skill", render: (q) => <Badge variant="outline">{q.skillArea}</Badge> },
    { key: "correctAnswer", label: "Answer", render: (q) => q.correctAnswer ? <span className="text-xs">{q.correctAnswer}</span> : "—" },
    { key: "points", label: "Points", render: (q) => String(q.points) },
    { key: "orderIndex", label: "Order", render: (q) => String(q.orderIndex) },
    { key: "updatedAt", label: "Updated", render: (q) => <span className="text-xs text-muted-foreground">{fmtDate(q.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Question>
        key={refreshKey}
        title="English Learning — Questions"
        subtitle="Bank of practice questions linked to practice tests"
        endpoint="/api/v1/english-learning/admin/questions"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        onCreate={openCreate}
        createLabel="Add Question"
        rowActions={(q) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => openEdit(q)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(q)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Question updated." : "Question created."); }}
        endpoint="/api/v1/english-learning/admin/questions"
        title={editing ? "Edit Question" : "Add Question"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
