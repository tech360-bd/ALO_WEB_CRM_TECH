"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Article = {
  id: string; title: string; slug: string; category: string;
  status: string; featured: boolean; readingMinutes: number;
  publishedAt: string; updatedAt: string;
};

const FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, required: true, placeholder: "auto-generated" },
  { name: "category", label: "Category", type: "select" as const, required: true, options: [
    { value: "executive-leadership", label: "Executive Leadership" },
    { value: "business-operations", label: "Business Operations" },
    { value: "sales-growth", label: "Sales Growth" },
    { value: "international-education", label: "International Education" },
    { value: "university-partnerships", label: "University Partnerships" },
    { value: "bangladesh-market", label: "Bangladesh Market" },
    { value: "ai-automation", label: "AI Automation" },
    { value: "crm-technology", label: "CRM Technology" },
    { value: "digital-marketing", label: "Digital Marketing" },
    { value: "personal-branding", label: "Personal Branding" },
    { value: "professional-development", label: "Professional Development" },
  ] },
  { name: "summary", label: "Summary", type: "textarea" as const, required: true },
  { name: "body", label: "Body (Markdown)", type: "textarea" as const, required: true },
  { name: "tags", label: "Tags (comma separated)", type: "text" as const },
  { name: "author", label: "Author", type: "text" as const },
  { name: "readingMinutes", label: "Reading Time (minutes)", type: "number" as const },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "draft", label: "Draft" },
    { value: "review", label: "Review" },
    { value: "approved", label: "Approved" },
    { value: "scheduled", label: "Scheduled" },
    { value: "published", label: "Published" },
    { value: "archived", label: "Archived" },
  ] },
  { name: "featured", label: "Featured", type: "checkbox" as const },
  { name: "coverMedia", label: "Cover Image URL", type: "text" as const },
];

export default function AdminArticlesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function destroy(a: Article) {
    if (!confirm(`Delete article "${a.title}"?`)) return;
    try {
      await adminFetch(`/api/v1/admin/articles/${a.id}`, { method: "DELETE" });
      toast.success("Article deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed."); }
  }

  async function togglePublish(a: Article) {
    const newStatus = a.status === "published" ? "draft" : "published";
    try {
      await adminFetch(`/api/v1/admin/articles/${a.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Article ${newStatus === "published" ? "published" : "unpublished"}.`);
      setRefreshKey((k) => k + 1);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Toggle failed."); }
  }

  const columns: Column<Article>[] = [
    { key: "title", label: "Title", render: (a) => (
      <div>
        <div className="font-medium">{a.title} {a.featured && <Badge variant="default" className="ml-1 text-[10px]">Featured</Badge>}</div>
        <div className="text-xs text-muted-foreground font-mono">{a.slug}</div>
      </div>
    )},
    { key: "category", label: "Category", render: (a) => <Badge variant="outline">{a.category}</Badge> },
    { key: "status", label: "Status", render: (a) => <Badge variant={a.status === "published" ? "default" : "secondary"}>{a.status}</Badge> },
    { key: "readingMinutes", label: "Read", render: (a) => `${a.readingMinutes}m` },
    { key: "publishedAt", label: "Published", render: (a) => <span className="text-xs text-muted-foreground">{fmtDate(a.publishedAt)}</span> },
  ];

  return (
    <>
      <CrudList<Article>
        key={refreshKey}
        title="Articles"
        subtitle="Blog and insights CMS — publish, unpublish, feature"
        endpoint="/api/v1/admin/articles"
        columns={columns}
        filters={[
          { label: "Draft", value: "draft", param: "status" },
          { label: "Review", value: "review", param: "status" },
          { label: "Published", value: "published", param: "status" },
          { label: "Archived", value: "archived", param: "status" },
        ]}
        onCreate={() => { setEditing(null); setDialogOpen(true); }}
        createLabel="Write Article"
        rowActions={(a) => (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="outline" onClick={() => togglePublish(a)}>
              {a.status === "published" ? "Unpublish" : "Publish"}
            </Button>
            <Button size="icon" variant="ghost" onClick={() => { setEditing(a); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(a)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Article updated." : "Article created."); }}
        endpoint="/api/v1/admin/articles"
        title={editing ? "Edit Article" : "Write Article"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
