"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil, ExternalLink } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { UploadButton, type UploadResult } from "@/components/admin/upload-button";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Document = {
  id: string; title: string; fileName: string; fileUrl: string;
  mimeType: string | null; size: number | null; category: string | null;
  description: string | null; createdAt: string;
};

const FIELDS = [
  { name: "title", label: "Title", type: "text" as const, required: true },
  { name: "fileName", label: "Filename", type: "text" as const, required: true },
  { name: "fileUrl", label: "File URL", type: "text" as const, required: true, placeholder: "/uploads/document.pdf" },
  { name: "mimeType", label: "MIME Type", type: "text" as const, placeholder: "application/pdf" },
  { name: "size", label: "Size (bytes)", type: "number" as const },
  { name: "category", label: "Category", type: "select" as const, options: [
    { value: "contract", label: "Contract" },
    { value: "proposal", label: "Proposal" },
    { value: "report", label: "Report" },
    { value: "legal", label: "Legal" },
    { value: "financial", label: "Financial" },
    { value: "media", label: "Media" },
    { value: "other", label: "Other" },
  ] },
  { name: "description", label: "Description", type: "textarea" as const },
];

export default function AdminDocumentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function destroy(d: Document) {
    if (!confirm(`Delete document "${d.title}"?`)) return;
    try {
      await adminFetch(`/api/v1/admin/documents/${d.id}`, { method: "DELETE" });
      toast.success("Document deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed."); }
  }

  function onUploaded(asset: UploadResult) {
    // Copy the new asset URL to the clipboard so the user can paste it
    // into the document form's "File URL" field, and surface it as a
    // toast hint.
    navigator.clipboard?.writeText(asset.url).catch(() => null);
    toast.success(`File URL copied — paste it into the File URL field when adding the document: ${asset.url}`);
  }

  const columns: Column<Document>[] = [
    { key: "title", label: "Document", render: (d) => (
      <div>
        <div className="font-medium">{d.title}</div>
        <div className="text-xs text-muted-foreground">{d.fileName}</div>
      </div>
    )},
    { key: "category", label: "Category", render: (d) => d.category ? <Badge variant="outline">{d.category}</Badge> : "—" },
    { key: "mimeType", label: "Type", render: (d) => d.mimeType || "—" },
    { key: "size", label: "Size", render: (d) => d.size ? `${(d.size / 1024).toFixed(1)} KB` : "—" },
    { key: "createdAt", label: "Added", render: (d) => <span className="text-xs text-muted-foreground">{fmtDate(d.createdAt)}</span> },
  ];

  return (
    <>
      <CrudList<Document>
        key={refreshKey}
        title="Documents"
        subtitle="Document registry — proposals, contracts, reports"
        endpoint="/api/v1/admin/documents"
        columns={columns}
        filters={[
          { label: "Contract", value: "contract", param: "category" },
          { label: "Proposal", value: "proposal", param: "category" },
          { label: "Report", value: "report", param: "category" },
          { label: "Legal", value: "legal", param: "category" },
        ]}
        onCreate={() => { setEditing(null); setDialogOpen(true); }}
        createLabel="Add Document"
        extraActions={<UploadButton onUploaded={onUploaded} label="Upload File" />}
        rowActions={(d) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" asChild><a href={d.fileUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
            <Button size="icon" variant="ghost" onClick={() => { setEditing(d); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(d)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Document updated." : "Document added."); }}
        endpoint="/api/v1/admin/documents"
        title={editing ? "Edit Document" : "Add Document"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
