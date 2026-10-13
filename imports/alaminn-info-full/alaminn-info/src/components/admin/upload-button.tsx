"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

export type UploadResult = {
  id: string;
  url: string;
  filename: string;
  mimeType: string | null;
  size: number | null;
};

type Props = {
  /** Optional category to attach to the uploaded asset. */
  category?: string;
  /** Called after a successful upload. */
  onUploaded: (asset: UploadResult) => void;
  /** Button label. */
  label?: string;
};

/**
 * Reusable file-upload widget that posts multipart/form-data to
 * /api/v1/admin/uploads and surfaces progress / errors via toasts.
 *
 * Note: we use a raw `fetch` here (not adminFetch) because the helper
 * forces a `content-type: application/json` header, which would
 * clobber the multipart boundary the browser sets automatically.
 */
export function UploadButton({ category, onUploaded, label = "Upload File" }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (category) fd.append("category", category);

      const res = await fetch("/api/v1/admin/uploads", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      let json: { success: boolean; message: string; data: UploadResult } | null = null;
      try {
        json = await res.json();
      } catch {
        throw new Error(`HTTP ${res.status}: invalid JSON response`);
      }
      if (!json) {
        throw new Error(`HTTP ${res.status}: empty response`);
      }
      if (!res.ok || !json.success) {
        throw new Error(json.message || `HTTP ${res.status}`);
      }
      toast.success(`Uploaded ${json.data.filename}.`);
      onUploaded(json.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <Input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
        aria-label={label}
      />
      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <UploadCloud className="h-4 w-4 mr-1" />
        )}
        {label}
      </Button>
    </>
  );
}
