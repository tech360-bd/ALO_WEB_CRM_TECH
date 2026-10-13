"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Tutor = {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  yearsExperience: number | null;
  hourlyRateUsd: number | null;
  currency: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  isPublished: boolean;
  verificationStatus: string;
  officialProfileUrl: string | null;
  updatedAt: string;
};

const FIELDS = [
  { name: "name", label: "Name", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, placeholder: "auto-generated from name" },
  { name: "bio", label: "Bio", type: "textarea" as const },
  { name: "avatarUrl", label: "Avatar URL", type: "text" as const },
  { name: "specialties", label: "Specialties (comma separated)", type: "text" as const },
  { name: "qualifications", label: "Qualifications (comma separated)", type: "text" as const },
  { name: "yearsExperience", label: "Years of Experience", type: "number" as const },
  { name: "hourlyRateUsd", label: "Hourly Rate (USD)", type: "number" as const },
  { name: "currency", label: "Currency", type: "text" as const, placeholder: "USD" },
  { name: "officialProfileUrl", label: "Official Profile URL", type: "text" as const },
  { name: "isAvailable", label: "Available", type: "checkbox" as const },
  { name: "isPublished", label: "Published", type: "checkbox" as const },
  { name: "verificationStatus", label: "Verification Status", type: "select" as const, options: [
    { value: "draft", label: "Draft" },
    { value: "pending-review", label: "Pending Review" },
    { value: "verified", label: "Verified" },
    { value: "published", label: "Published" },
    { value: "needs-update", label: "Needs Update" },
    { value: "archived", label: "Archived" },
  ] },
];

export default function AdminEnglishLearningTutorsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tutor | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(t: Tutor) { setEditing(t); setDialogOpen(true); }

  async function destroy(t: Tutor) {
    if (!confirm(`Delete tutor "${t.name}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/v1/english-learning/admin/tutors/${t.id}`, { method: "DELETE" });
      toast.success("Tutor deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  const columns: Column<Tutor>[] = [
    { key: "name", label: "Tutor", render: (t) => (
      <div>
        <div className="font-medium">
          {t.name}
          {t.isAvailable && <Badge variant="default" className="ml-1 text-[10px]">Available</Badge>}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{t.slug}</div>
      </div>
    ) },
    { key: "yearsExperience", label: "Experience", render: (t) => t.yearsExperience != null ? `${t.yearsExperience}y` : "—" },
    { key: "hourlyRateUsd", label: "Rate", render: (t) => t.hourlyRateUsd != null ? `${t.hourlyRateUsd}/${t.currency}` : "—" },
    { key: "rating", label: "Rating", render: (t) => `${t.rating.toFixed(1)} (${t.reviewCount})` },
    { key: "verificationStatus", label: "Verification", render: (t) => <Badge variant="secondary">{t.verificationStatus}</Badge> },
    { key: "isPublished", label: "Published", render: (t) => <Badge variant={t.isPublished ? "default" : "outline"}>{t.isPublished ? "Yes" : "No"}</Badge> },
    { key: "updatedAt", label: "Updated", render: (t) => <span className="text-xs text-muted-foreground">{fmtDate(t.updatedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Tutor>
        key={refreshKey}
        title="English Learning — Tutors"
        subtitle="Tutor profiles shown on the English Learning module"
        endpoint="/api/v1/english-learning/admin/tutors"
        columns={columns}
        responseShape="nested"
        pageSizeParam="limit"
        onCreate={openCreate}
        createLabel="Add Tutor"
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
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Tutor updated." : "Tutor created."); }}
        endpoint="/api/v1/english-learning/admin/tutors"
        title={editing ? "Edit Tutor" : "Add Tutor"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
