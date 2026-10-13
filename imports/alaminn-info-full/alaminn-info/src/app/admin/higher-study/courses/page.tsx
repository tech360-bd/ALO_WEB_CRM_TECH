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
  studyLevel: string;
  qualification: string | null;
  specialisation: string | null;
  duration: string | null;
  studyMode: string | null;
  tuitionFee: number | null;
  tuitionCurrency: string;
  featured: boolean;
  verificationStatus: string;
  publicationStatus: string;
  updatedAt: string;
  university?: { id: string; slug: string; officialName: string } | null;
  country?: { id: string; slug: string; name: string } | null;
  subject?: { id: string; slug: string; name: string } | null;
};

const FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from title" },
  { name: "universityId", label: "University ID", type: "text" as const, required: true, placeholder: "cuid of the parent university" },
  { name: "countryId", label: "Country ID", type: "text" as const, placeholder: "cuid (optional)" },
  { name: "subjectId", label: "Subject ID", type: "text" as const, placeholder: "cuid (optional)" },
  { name: "studyLevel", label: "Study Level", type: "select" as const, required: true, options: [
    { value: "foundation", label: "Foundation" },
    { value: "international-year-one", label: "International Year One" },
    { value: "diploma", label: "Diploma" },
    { value: "hnd", label: "HND" },
    { value: "bachelors", label: "Bachelors" },
    { value: "bachelors-topup", label: "Bachelors Top-up" },
    { value: "graduate-certificate", label: "Graduate Certificate" },
    { value: "graduate-diploma", label: "Graduate Diploma" },
    { value: "pre-masters", label: "Pre-Masters" },
    { value: "masters", label: "Masters" },
    { value: "mba", label: "MBA" },
    { value: "executive-mba", label: "Executive MBA" },
    { value: "msc", label: "MSc" },
    { value: "ma", label: "MA" },
    { value: "llm", label: "LLM" },
    { value: "meng", label: "MEng" },
    { value: "march", label: "MArch" },
    { value: "mph", label: "MPH" },
    { value: "mpa", label: "MPA" },
    { value: "mres", label: "MRes" },
    { value: "mphil", label: "MPhil" },
    { value: "phd", label: "PhD" },
    { value: "dba", label: "DBA" },
    { value: "edd", label: "EdD" },
    { value: "postdoc", label: "Postdoc" },
    { value: "online", label: "Online" },
    { value: "distance", label: "Distance" },
    { value: "blended", label: "Blended" },
    { value: "executive-education", label: "Executive Education" },
    { value: "professional-cert", label: "Professional Certificate" },
  ] },
  { name: "qualification", label: "Qualification", type: "text" as const, placeholder: "BSc, MSc, MBA..." },
  { name: "specialisation", label: "Specialisation", type: "text" as const },
  { name: "duration", label: "Duration", type: "text" as const, placeholder: "1 year full-time" },
  { name: "studyMode", label: "Study Mode", type: "select" as const, options: [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "online", label: "Online" },
    { value: "blended", label: "Blended" },
  ] },
  { name: "tuitionFee", label: "Tuition Fee (USD)", type: "number" as const },
  { name: "tuitionCurrency", label: "Tuition Currency", type: "text" as const, placeholder: "USD" },
  { name: "overview", label: "Overview", type: "textarea" as const },
  { name: "englishRequirements", label: "English Requirements", type: "textarea" as const },
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

export default function AdminHigherStudyCoursesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(c: Course) { setEditing(c); setDialogOpen(true); }

  async function destroy(c: Course) {
    if (!confirm(`Delete course "${c.title}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/higher-study/admin/courses/${c.id}`, { method: "DELETE" });
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
          {c.featured && <Badge variant="default" className="ml-1 text-[10px]">Featured</Badge>}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{c.slug}</div>
      </div>
    ) },
    { key: "university", label: "University", render: (c) => c.university?.officialName || "—" },
    { key: "studyLevel", label: "Level", render: (c) => <Badge variant="outline">{c.studyLevel}</Badge> },
    { key: "qualification", label: "Qualification", render: (c) => c.qualification || "—" },
    { key: "duration", label: "Duration", render: (c) => c.duration || "—" },
    { key: "tuitionFee", label: "Tuition", render: (c) => c.tuitionFee ? `${c.tuitionFee.toLocaleString()} ${c.tuitionCurrency}` : "—" },
    { key: "publicationStatus", label: "Status", render: (c) => <Badge variant={c.publicationStatus === "published" ? "default" : "outline"}>{c.publicationStatus}</Badge> },
    { key: "updatedAt", label: "Updated", render: (c) => <span className="text-xs text-muted-foreground">{fmtDate(c.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Course>
        key={refreshKey}
        title="Higher Study — Courses"
        subtitle="Manage programme / course listings linked to universities"
        endpoint="/api/v1/higher-study/admin/courses"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        filters={[
          { label: "Published", value: "published", param: "publicationStatus" },
          { label: "Draft", value: "draft", param: "publicationStatus" },
          { label: "Archived", value: "archived", param: "publicationStatus" },
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
        endpoint="/api/v1/higher-study/admin/courses"
        title={editing ? "Edit Course" : "Add Course"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
