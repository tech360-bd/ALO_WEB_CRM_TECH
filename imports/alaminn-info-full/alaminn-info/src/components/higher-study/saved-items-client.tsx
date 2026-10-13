"use client";

/**
 * SavedItemsClient — renders the saved-items dashboard from localStorage.
 *
 * Reads from `alaminn:hs:saved` (the same key SaveButton writes to),
 * groups by entity type, and renders each item with a remove button.
 *
 * Cross-instance sync: listens for the `alaminn:hs:saved-change`
 * custom event + the `storage` event so removing from one tab updates
 * others.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkX,
  Building2,
  GraduationCap,
  Award,
  FlaskConical,
  UserSearch,
  BookOpen,
  Trash2,
  ExternalLink,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmptyState } from "./empty-state";
import type { EntityType } from "@/lib/higher-study/types";

const STORAGE_KEY = "alaminn:hs:saved";

interface SavedItem {
  entityType: EntityType;
  slug: string;
  name: string;
  savedAt: string;
}

interface SavedStorage {
  [entityType: string]: SavedItem[];
}

const ENTITY_LABELS: Record<string, string> = {
  university: "Universities",
  course: "Courses",
  scholarship: "Scholarships",
  research: "Research Projects",
  supervisor: "Supervisors",
  resource: "Resources",
};

const ENTITY_ICONS: Record<string, typeof Building2> = {
  university: Building2,
  course: GraduationCap,
  scholarship: Award,
  research: FlaskConical,
  supervisor: UserSearch,
  resource: BookOpen,
};

const ENTITY_HREFS: Record<string, string> = {
  university: "/higher-study/global-universities",
  course: "/higher-study/course-finder",
  scholarship: "/higher-study/scholarships",
  research: "/higher-study/phd-research",
  supervisor: "/higher-study/supervisors",
  resource: "/higher-study/study-resources",
};

const ENTITY_DETAIL_PREFIX: Record<string, string> = {
  university: "/higher-study/universities",
  course: "/higher-study/courses",
  scholarship: "/higher-study/scholarships",
  research: "/higher-study/research",
  supervisor: "/higher-study/supervisors",
  resource: "/higher-study/resources",
};

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

/**
 * Render the saved-items dashboard.
 */
export function SavedItemsClient() {
  const [storage, setStorage] = useState<SavedStorage>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // setMounted must run in an effect so SSR and client render the same
    // output on first paint (avoids hydration mismatch). setStorage is
    // populated from localStorage which is only available after mount.
    // The listeners keep storage in sync across tabs/instances.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setStorage(readStorage());

    const refresh = () => setStorage(readStorage());
    window.addEventListener("alaminn:hs:saved-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("alaminn:hs:saved-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const onRemove = useCallback(
    (entityType: string, slug: string, name: string) => {
      try {
        const next = readStorage();
        const list = next[entityType] ?? [];
        next[entityType] = list.filter((i) => i.slug !== slug);
        if (next[entityType].length === 0) delete next[entityType];
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent("alaminn:hs:saved-change"));
        setStorage(next);
        toast.success(`Removed “${name}” from saved`);
      } catch {
        toast.error("Could not remove item");
      }
    },
    [],
  );

  const onClearAll = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.confirm("Remove ALL saved items from this device?")) return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("alaminn:hs:saved-change"));
    setStorage({});
    toast.success("All saved items cleared");
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch — render a small skeleton.
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center text-ink-500 shadow-soft">
        Loading saved items…
      </div>
    );
  }

  const entityTypes = Object.keys(ENTITY_LABELS);
  const totalItems = entityTypes.reduce(
    (acc, k) => acc + (storage[k]?.length ?? 0),
    0,
  );

  if (totalItems === 0) {
    return (
      <EmptyState
        title="No saved items yet"
        description="Bookmark universities, courses, scholarships and more — they'll appear here for quick access. Saved items stay on this device unless you sign in."
        icon={Bookmark}
        action={{
          label: "Browse universities",
          href: "/higher-study/global-universities",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-soft">
        <div>
          <p className="font-display text-sm font-extrabold text-ink-900">
            {totalItems} saved item{totalItems === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-ink-500">
            Stored on this device only. Sign in to sync across devices.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="gap-1.5 rounded-xl border-ink-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Clear all
        </Button>
      </div>

      {entityTypes.map((et) => {
        const items = storage[et] ?? [];
        if (items.length === 0) return null;
        const Icon = ENTITY_ICONS[et] ?? Bookmark;
        const browseHref = ENTITY_HREFS[et] ?? "/higher-study";
        const detailPrefix = ENTITY_DETAIL_PREFIX[et] ?? "/higher-study";

        return (
          <section
            key={et}
            className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft sm:p-6"
          >
            <header className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h2 className="font-display text-base font-extrabold text-ink-900">
                  {ENTITY_LABELS[et]}
                </h2>
                <Badge className="bg-ink-100 text-[10px] font-bold uppercase tracking-wider text-ink-700">
                  {items.length}
                </Badge>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-lg text-blue-700 hover:bg-blue-50"
              >
                <Link href={browseHref}>
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                  Browse more
                </Link>
              </Button>
            </header>

            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={`${item.entityType}-${item.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 bg-ink-50/40 p-3 transition-colors hover:border-ink-200 hover:bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`${detailPrefix}/${item.slug}`}
                      className="block truncate font-semibold text-ink-900 hover:text-orange-600"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-ink-500">
                      Saved {new Date(item.savedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-lg p-0 text-blue-700 hover:bg-blue-50"
                      aria-label={`View ${item.name}`}
                    >
                      <Link href={`${detailPrefix}/${item.slug}`}>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(item.entityType, item.slug, item.name)}
                      className="h-8 w-8 rounded-lg p-0 text-red-600 hover:bg-red-50"
                      aria-label={`Remove ${item.name} from saved`}
                    >
                      <BookmarkX className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
