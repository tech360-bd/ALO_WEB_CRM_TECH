"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { CrudList, type Column } from "@/components/admin/crud-list";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { adminFetch, fmtDate } from "@/components/admin/lib";
import { toast } from "sonner";

type Note = {
  id: string; body: string; contact: { fullName: string } | null;
  author: { name: string | null } | null; createdAt: string;
};

const FIELDS = [
  { name: "body", label: "Note", type: "textarea" as const, required: true },
  { name: "contactId", label: "Contact ID (optional)", type: "text" as const },
];

export default function AdminNotesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function destroy(n: Note) {
    if (!confirm("Delete this note?")) return;
    try {
      await adminFetch(`/api/v1/admin/notes/${n.id}`, { method: "DELETE" });
      toast.success("Note deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed."); }
  }

  const columns: Column<Note>[] = [
    { key: "body", label: "Note", render: (n) => (
      <div className="max-w-md">
        <p className="line-clamp-2 text-sm">{n.body}</p>
      </div>
    )},
    { key: "contact", label: "Linked Contact", render: (n) => n.contact?.fullName || "—" },
    { key: "author", label: "Author", render: (n) => n.author?.name || "—" },
    { key: "createdAt", label: "Created", render: (n) => <span className="text-xs text-muted-foreground">{fmtDate(n.createdAt)}</span> },
  ];

  return (
    <>
      <CrudList<Note>
        key={refreshKey}
        title="Notes"
        subtitle="Notes and knowledge base entries linked to contacts"
        endpoint="/api/v1/admin/notes"
        columns={columns}
        onCreate={() => { setEditing(null); setDialogOpen(true); }}
        createLabel="Add Note"
        rowActions={(n) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => { setEditing(n); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => destroy(n)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
      />
      <ResourceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { setDialogOpen(false); setRefreshKey((k) => k + 1); toast.success(editing ? "Note updated." : "Note created."); }}
        endpoint="/api/v1/admin/notes"
        title={editing ? "Edit Note" : "Add Note"}
        fields={FIELDS}
        initial={editing ? { body: editing.body, contactId: "" } : {}}
        id={editing?.id}
      />
    </>
  );
}
