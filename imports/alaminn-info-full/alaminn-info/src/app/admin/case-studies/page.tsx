"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type CaseStudy = {
  id: string; title: string; slug: string; category: string;
  featured: boolean; readTime: number; createdAt: string;
};

const FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, required: true, placeholder: "auto-generated" },
  { name: "category", label: "Category", type: "select" as const, required: true, options: [
    { value: "education-operations", label: "Education Operations" },
    { value: "ai-crm", label: "AI / CRM" },
    { value: "sales-growth", label: "Sales Growth" },
  ] },
  { name: "context", label: "Context", type: "textarea" as const },
  { name: "challenge", label: "Challenge", type: "textarea" as const },
  { name: "role", label: "Role", type: "text" as const },
  { name: "intervention", label: "Intervention", type: "textarea" as const },
  { name: "systemBuilt", label: "System Built", type: "textarea" as const },
  { name: "outcome", label: "Outcome", type: "textarea" as const },
  { name: "readTime", label: "Read Time (minutes)", type: "number" as const },
  { name: "featured", label: "Featured", type: "checkbox" as const },
];

export default function AdminCaseStudiesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CaseStudy | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function destroy(c: CaseStudy) {
    if (!confirm(`Delete case study "${c.title}"?`)) return;
    try {
      await adminFetch(`/api/v1/admin/case-studies/${c.id}`, { method: "DELETE" });
      toast.success("Case study deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed."); }
  }

  const columns: Column<CaseStudy>[] = [
    { key: "title", label: "Title", render: (c) => (
      <div>
        <div className="font-medium">{c.title} {c.featured && <Badge variant="default" className="ml-1 text-[10px]">Featured</Badge>}</div>
        <div className="text-xs text-muted-foreground font-mono">{c.slug}</div>
      </div>
    )},
    { key: "category", label: "Category", render: (c) => <Badge variant="outline">{c.category}</Badge> },
    { key: "readTime", label: "Read Time", render: (c) => `${c.readTime} min` },
    { key: "createdAt", label: "Created", render: (c) => <span className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</span> },
  ];

  return (
    <>
      <CrudList<CaseStudy>
        key={refreshKey}
        title="Case Studies"
        subtitle="Long-form CMS for verified case studies"
        endpoint="/api/v1/admin/case-studies"
        columns={columns}
        filters={[
          { label: "Education Ops", value: "education-operations", param: "category" },
          { label: "AI / CRM", value: "ai-crm", param: "category" },
          { label: "Sales Growth", value: "sales-growth", param: "category" },
        ]}
        onCreate={() => { setEditing(null); setDialogOpen(true); }}
        createLabel="Add Case Study"
        rowActions={(c) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(c)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Case study updated." : "Case study created."); }}
        endpoint="/api/v1/admin/case-studies"
        title={editing ? "Edit Case Study" : "Add Case Study"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
