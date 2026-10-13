"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Project = {
  id: string; name: string; slug: string; category: string; status: string;
  featured: boolean; visibility: string; createdAt: string;
};

const FIELDS = [
  { name: "name", label: "Project Name", type: "text" as const, required: true },
  { name: "slug", label: "Slug", type: "text" as const, required: true, placeholder: "auto-generated from name" },
  { name: "category", label: "Category", type: "select" as const, required: true, options: [
    { value: "education", label: "Education" },
    { value: "ai", label: "AI" },
    { value: "software", label: "Software" },
    { value: "crm", label: "CRM" },
    { value: "automation", label: "Automation" },
    { value: "marketing", label: "Marketing" },
    { value: "research", label: "Research" },
    { value: "professional-brand", label: "Professional Brand" },
    { value: "client-work", label: "Client Work" },
  ] },
  { name: "shortDescription", label: "Short Description", type: "text" as const, required: true },
  { name: "fullDescription", label: "Full Description", type: "textarea" as const },
  { name: "technologies", label: "Technologies (comma separated)", type: "text" as const },
  { name: "status", label: "Status", type: "select" as const, options: [
    { value: "planned", label: "Planned" },
    { value: "in-testing", label: "In Testing" },
    { value: "connected", label: "Connected" },
    { value: "active", label: "Active" },
    { value: "on-hold", label: "On Hold" },
  ] },
  { name: "visibility", label: "Visibility", type: "select" as const, options: [
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
  ] },
  { name: "featured", label: "Featured", type: "checkbox" as const },
];

export default function AdminProjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function destroy(p: Project) {
    if (!confirm(`Delete project "${p.name}"?`)) return;
    try {
      await adminFetch(`/api/v1/admin/projects/${p.id}`, { method: "DELETE" });
      toast.success("Project deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed."); }
  }

  const columns: Column<Project>[] = [
    { key: "name", label: "Project", render: (p) => (
      <div>
        <div className="font-medium">{p.name} {p.featured && <Badge variant="default" className="ml-1 text-[10px]">Featured</Badge>}</div>
        <div className="text-xs text-muted-foreground font-mono">{p.slug}</div>
      </div>
    )},
    { key: "category", label: "Category", render: (p) => <Badge variant="outline">{p.category}</Badge> },
    { key: "status", label: "Status", render: (p) => <Badge variant="secondary">{p.status}</Badge> },
    { key: "visibility", label: "Visibility", render: (p) => p.visibility },
    { key: "createdAt", label: "Created", render: (p) => <span className="text-xs text-muted-foreground">{fmtDate(p.createdAt)}</span> },
  ];

  return (
    <>
      <CrudList<Project>
        key={refreshKey}
        title="Projects"
        subtitle="Project portfolio and ecosystem initiatives"
        endpoint="/api/v1/admin/projects"
        columns={columns}
        filters={[
          { label: "Education", value: "education", param: "category" },
          { label: "AI", value: "ai", param: "category" },
          { label: "Software", value: "software", param: "category" },
          { label: "CRM", value: "crm", param: "category" },
          { label: "Active", value: "active", param: "status" },
          { label: "Planned", value: "planned", param: "status" },
        ]}
        onCreate={() => { setEditing(null); setDialogOpen(true); }}
        createLabel="Add Project"
        rowActions={(p) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(p)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Project updated." : "Project created."); }}
        endpoint="/api/v1/admin/projects"
        title={editing ? "Edit Project" : "Add Project"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
