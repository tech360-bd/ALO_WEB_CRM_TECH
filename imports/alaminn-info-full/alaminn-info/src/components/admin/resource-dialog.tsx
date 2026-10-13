"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { adminFetch, slugify } from "./lib";

type Field =
  | { name: string; label: string; type: "text" | "email" | "tel" | "number" | "textarea"; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; required?: boolean }
  | { name: string; label: string; type: "checkbox"; required?: boolean }
  | { name: string; label: string; type: "date"; required?: boolean };

/**
 * Generic create/edit dialog used by most admin pages.
 * On save: PUT (if id) or POST (if not) to endpoint, then onClose(savedItem).
 */
export function ResourceDialog({
  open, onClose, onSaved, endpoint, title, fields, initial, id,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  endpoint: string;            // e.g. "/api/v1/admin/contacts"
  title: string;
  fields: Field[];
  initial?: Record<string, unknown>;
  id?: string;                 // when set → PUT /endpoint/[id], else POST /endpoint
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initial || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(name: string, v: unknown) {
    setValues((s) => ({ ...s, [name]: v }));
  }

  async function save() {
    setLoading(true);
    setError(null);
    try {
      // Auto-slug if a slug field is present and tied to a name field
      const payload = { ...values };
      if ("slug" in payload && !payload.slug && payload.name) {
        payload.slug = slugify(String(payload.name));
      }
      const url = id ? `${endpoint}/${id}` : endpoint;
      const method = id ? "PUT" : "POST";
      const env = await adminFetch(url, { method, body: JSON.stringify(payload) });
      onSaved();
      onClose();
      void env;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fill in the fields below. Required fields are marked with *.</DialogDescription>
        </DialogHeader>

        {error && <div className="text-sm text-destructive">{error}</div>}

        <div className="grid gap-4 py-2">
          {fields.map((f) => {
            const v = values[f.name] ?? (f.type === "checkbox" ? false : "");
            return (
              <div key={f.name} className="grid gap-2">
                <Label htmlFor={f.name}>
                  {f.label}{f.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.name}
                    value={String(v)}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={"placeholder" in f ? f.placeholder : ""}
                    rows={4}
                  />
                ) : f.type === "select" ? (
                  <Select value={String(v)} onValueChange={(val) => set(f.name, val)}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === "checkbox" ? (
                  <input
                    id={f.name}
                    type="checkbox"
                    checked={Boolean(v)}
                    onChange={(e) => set(f.name, e.target.checked)}
                    className="h-4 w-4"
                  />
                ) : (
                  <Input
                    id={f.name}
                    type={f.type}
                    value={String(v)}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={"placeholder" in f ? f.placeholder : ""}
                  />
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={save} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            {id ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
