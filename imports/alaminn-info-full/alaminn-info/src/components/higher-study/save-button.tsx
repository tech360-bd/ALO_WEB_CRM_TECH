"use client";

/**
 * SaveButton — bookmark an entity for later.
 *
 * For anonymous visitors: stores in localStorage (`alaminn:hs:saved`).
 * For authenticated users (when a `userId` prop is passed or when
 * the auth context is available — future enhancement): also POSTs
 * to `/api/v1/higher-study/saved` for server-side persistence.
 *
 * The current implementation always mirrors to localStorage and
 * additionally fires a POST to the saved-items API when the user
 * is authenticated (detected via a `data-authed` attribute on
 * `<html>` — set by future login UI). When the request fails, the
 * localStorage mirror is still kept so the UI is consistent.
 */
import { useCallback, useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/lib/higher-study/types";

const STORAGE_KEY = "alaminn:hs:saved";

export interface SavedItem {
  entityType: EntityType;
  slug: string;
  name: string;
  savedAt: string;
}

export interface SavedStorage {
  [entityType: string]: SavedItem[];
}

function readStorage(): SavedStorage {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as SavedStorage;
  } catch {
    return {};
  }
}

function writeStorage(data: SavedStorage): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("alaminn:hs:saved-change"));
  } catch {
    // ignore
  }
}

export interface SaveButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick" | "type"> {
  entityType: EntityType;
  entitySlug: string;
  entityName: string;
  /** Optional notes to attach when persisting server-side. */
  notes?: string;
}

/**
 * Render a save / bookmark toggle. Persists to localStorage and
 * attempts a server POST when the visitor is authenticated.
 */
export function SaveButton({
  entityType,
  entitySlug,
  entityName,
  notes,
  variant = "outline",
  size = "default",
  className,
  children: _children,
  ...rest
}: SaveButtonProps) {
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    // setHydrated must run in an effect so SSR and client render
    // the same output on first paint (avoids hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
    const refresh = () => {
      const data = readStorage();
      const list = data[entityType] ?? [];
      setSaved(list.some((i) => i.slug === entitySlug));
    };
    refresh();
    window.addEventListener("alaminn:hs:saved-change", refresh);
    window.addEventListener("storage", refresh);
    // Detect authentication state (set by future login UI as <html data-authed="true">).
    const html = document.documentElement;
    const updateAuthed = () =>
      setAuthed(html.getAttribute("data-authed") === "true");
    updateAuthed();
    const observer = new MutationObserver(updateAuthed);
    observer.observe(html, { attributes: true, attributeFilter: ["data-authed"] });
    return () => {
      window.removeEventListener("alaminn:hs:saved-change", refresh);
      window.removeEventListener("storage", refresh);
      observer.disconnect();
    };
  }, [entityType, entitySlug]);

  const handleClick = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const data = readStorage();
    const list = data[entityType] ?? [];
    const nextSaved = !saved;

    if (nextSaved) {
      data[entityType] = [
        ...list,
        {
          entityType,
          slug: entitySlug,
          name: entityName,
          savedAt: new Date().toISOString(),
        },
      ];
    } else {
      data[entityType] = list.filter((i) => i.slug !== entitySlug);
    }
    writeStorage(data);
    setSaved(nextSaved);

    // If authenticated, also mirror to server (best-effort, no UI blocking on failure).
    if (authed) {
      try {
        await fetch("/api/v1/higher-study/saved", {
          method: nextSaved ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType,
            entitySlug,
            entityName,
            notes,
          }),
        });
      } catch {
        // Server sync failed — localStorage mirror is the source of truth.
      }
    }
    setBusy(false);
  }, [busy, entityType, entitySlug, entityName, saved, authed, notes]);

  // SSR placeholder.
  if (!hydrated) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(className)}
        disabled
        aria-hidden="true"
        tabIndex={-1}
        {...rest}
      >
        <Bookmark className="h-4 w-4" aria-hidden="true" />
        Save
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={saved ? "default" : variant}
      size={size}
      onClick={handleClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={
        saved ? `Unsave ${entityName}` : `Save ${entityName}`
      }
      className={cn(
        "transition-all",
        saved && "bg-orange-600 text-white hover:bg-orange-700 shadow-orange",
        className,
      )}
      {...rest}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : saved ? (
        <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Bookmark className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{saved ? "Saved" : "Save"}</span>
    </Button>
  );
}
