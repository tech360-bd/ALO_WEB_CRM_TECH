"use client";

/**
 * CompareActions — Save / share / clear comparison buttons.
 *
 * Save: writes the current comparison to localStorage under a named
 *       "saved comparison" slot so the user can re-open it later.
 * Share: copies the current URL (which contains ?slugs=...) to the
 *        clipboard and shows a toast.
 * Clear: empties the comparison list (also removes from the
 *        `alaminn:hs:compare` localStorage key).
 */
import { useCallback, useState } from "react";
import { Share2, Trash2, Bookmark, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/lib/higher-study/types";

const STORAGE_KEY = "alaminn:hs:compare";
const SAVED_KEY = "alaminn:hs:comparisons-saved";

export interface CompareActionsProps {
  entityType: EntityType;
  slugs: string[];
  className?: string;
}

/**
 * Render Save/Share/Clear buttons for a comparison view.
 */
export function CompareActions({
  entityType,
  slugs,
  className,
}: CompareActionsProps) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const onShare = useCallback(async () => {
    if (slugs.length === 0) return;
    const url = `${window.location.origin}${window.location.pathname}?slugs=${slugs.join(",")}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Comparison link copied to clipboard");
    } catch {
      // Clipboard API not available — open a prompt instead.
      window.prompt("Copy this link to share:", url);
    }
  }, [slugs]);

  const onSave = useCallback(() => {
    if (slugs.length === 0) return;
    setSaving(true);
    try {
      const raw = window.localStorage.getItem(SAVED_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      existing.push({
        entityType,
        slugs,
        savedAt: new Date().toISOString(),
      });
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(existing));
      setSaved(true);
      toast.success("Comparison saved to this device");
    } catch {
      toast.error("Could not save — storage may be full");
    } finally {
      setSaving(false);
    }
  }, [entityType, slugs]);

  const onClear = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[entityType] = [];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      window.dispatchEvent(new CustomEvent("alaminn:hs:compare-change"));
      // Also clear the URL ?slugs= param
      const url = new URL(window.location.href);
      url.searchParams.delete("slugs");
      window.history.replaceState({}, "", url.toString());
      toast.success("Comparison cleared");
    } catch {
      toast.error("Could not clear comparison");
    }
  }, [entityType]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onSave}
        disabled={slugs.length === 0 || saving || saved}
        className="gap-1.5 rounded-xl border-ink-200"
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : saved ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        ) : (
          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {saved ? "Saved" : "Save comparison"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onShare}
        disabled={slugs.length === 0}
        className="gap-1.5 rounded-xl border-ink-200"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
        Share
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClear}
        disabled={slugs.length === 0}
        className="gap-1.5 rounded-xl border-ink-200 text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        Clear
      </Button>
    </div>
  );
}
