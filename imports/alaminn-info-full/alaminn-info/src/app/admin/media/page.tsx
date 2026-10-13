"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil, Copy } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { UploadButton, type UploadResult } from "@/components/admin/upload-button";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type MediaAsset = {
  id: string; filename: string; url: string; altText: string | null;
  mimeType: string | null; size: number | null; category: string | null; createdAt: string;
};

const FIELDS = [
  { name: "filename", label: "Filename", type: "text" as const, required: true },
  { name: "url", label: "URL", type: "text" as const, required: true, placeholder: "/uploads/..." },
  { name: "altText", label: "Alt Text", type: "text" as const },
  { name: "mimeType", label: "MIME Type", type: "text" as const, placeholder: "image/jpeg" },
  { name: "size", label: "Size (bytes)", type: "number" as const },
  { name: "width", label: "Width (px)", type: "number" as const },
  { name: "height", label: "Height (px)", type: "number" as const },
  { name: "category", label: "Category", type: "select" as const, options: [
    { value: "brand", label: "Brand" },
    { value: "portrait", label: "Portrait" },
    { value: "project", label: "Project" },
    { value: "article", label: "Article" },
    { value: "case-study", label: "Case Study" },
    { value: "general", label: "General" },
  ] },
];

function copyUrl(url: string) {
  navigator.clipboard.writeText(url).then(() => toast.success("URL copied to clipboard."));
}

export default function AdminMediaPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function destroy(m: MediaAsset) {
    if (!confirm(`Delete media asset "${m.filename}"?`)) return;
    try {
      await adminFetch(`/api/v1/admin/media/${m.id}`, { method: "DELETE" });
      toast.success("Media deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed."); }
  }

  function onUploaded(asset: UploadResult) {
    // Copy the new asset URL to the clipboard for convenience and
    // refresh the list so the user sees their upload.
    navigator.clipboard?.writeText(asset.url).catch(() => null);
    toast.success(`Asset URL copied: ${asset.url}`);
    setRefreshKey((k) => k + 1);
  }

  const columns: Column<MediaAsset>[] = [
    { key: "filename", label: "Preview", render: (m) => (
      <div className="flex items-center gap-3">
        {m.mimeType?.startsWith("image/") ? (
          <img src={m.url} alt={m.altText || m.filename} className="h-12 w-12 object-cover rounded border" />
        ) : (
          <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-xs">—</div>
        )}
        <div>
          <div className="font-medium text-sm">{m.filename}</div>
          <div className="text-xs text-muted-foreground">{m.mimeType || "—"} · {m.size ? `${(m.size / 1024).toFixed(1)} KB` : "—"}</div>
        </div>
      </div>
    )},
    { key: "altText", label: "Alt", render: (m) => m.altText || "—" },
    { key: "category", label: "Category", render: (m) => m.category ? <Badge variant="outline">{m.category}</Badge> : "—" },
    { key: "createdAt", label: "Added", render: (m) => <span className="text-xs text-muted-foreground">{fmtDate(m.createdAt)}</span> },
  ];

  return (
    <>
      <CrudList<MediaAsset>
        key={refreshKey}
        title="Media Library"
        subtitle="Image and asset library — copy URLs for use across content"
        endpoint="/api/v1/admin/media"
        columns={columns}
        filters={[
          { label: "Brand", value: "brand", param: "category" },
          { label: "Portrait", value: "portrait", param: "category" },
          { label: "Project", value: "project", param: "category" },
          { label: "Article", value: "article", param: "category" },
        ]}
        onCreate={() => { setEditing(null); setDialogOpen(true); }}
        createLabel="Add Asset (URL)"
        extraActions={<UploadButton onUploaded={onUploaded} label="Upload File" />}
        rowActions={(m) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => copyUrl(m.url)} title="Copy URL"><Copy className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => { setEditing(m); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(m)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Asset updated." : "Asset added."); }}
        endpoint="/api/v1/admin/media"
        title={editing ? "Edit Media Asset" : "Add Media Asset"}
        fields={FIELDS}
        initial={editing || {}}
        id={editing?.id}
      />
    </>
  );
}
