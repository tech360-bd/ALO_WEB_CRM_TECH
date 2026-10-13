"use client";

/**
 * CompareButton — adds or removes an entity from the comparison list
 * stored in localStorage under `alaminn:hs:compare`.
 *
 * The comparison list shape:
 *   { [entityType]: Array<{ slug, name }> }
 *
 * Each entity type has its own list (max 4 items each). The button:
 *  - shows "Add to Compare" with a Plus icon when not yet saved
 *  - shows "Added to Compare" with a Check icon when already saved
 *  - disables itself when 4 items already compared and the current
 *    entity isn't one of them
 *  - is fully keyboard accessible (it's a <button>)
 */
import { useCallback, useEffect, useState } from "react";
import { Plus, Check, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_COMPARISON_ITEMS } from "@/lib/higher-study/constants";
import type { EntityType } from "@/lib/higher-study/types";

const STORAGE_KEY = "alaminn:hs:compare";

export interface CompareItem {
  slug: string;
  name: string;
}

export interface CompareStorage {
  [entityType: string]: CompareItem[];
}

/** Read the full comparison storage (safe for SSR — returns {} on first paint). */
function readStorage(): CompareStorage {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as CompareStorage;
  } catch {
    return {};
  }
}

/** Persist the full comparison storage. */
function writeStorage(data: CompareStorage): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Dispatch a custom event so other CompareButton instances update.
    window.dispatchEvent(new CustomEvent("alaminn:hs:compare-change"));
  } catch {
    // ignore quota / privacy errors
  }
}

export interface CompareButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick" | "type"> {
  entityType: EntityType;
  entitySlug: string;
  entityName: string;
  /** Max items per comparison list (default from constants: 4). */
  maxCompare?: number;
  /** Optional href to the compare page (rendered as a small "view" link). */
  compareHref?: string;
}

/**
 * Render a compare toggle button. Uses localStorage so anonymous
 * visitors can build comparisons across page navigations.
 */
export function CompareButton({
  entityType,
  entitySlug,
  entityName,
  maxCompare = MAX_COMPARISON_ITEMS,
  compareHref,
  variant = "outline",
  size = "default",
  className,
  children: _children,
  ...rest
}: CompareButtonProps) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount + subscribe to changes.
  useEffect(() => {
    // setHydrated must run in an effect so SSR and client render
    // the same output on first paint (avoids hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
    const refresh = () => {
      const data = readStorage();
      setItems(data[entityType] ?? []);
    };
    refresh();
    window.addEventListener("alaminn:hs:compare-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("alaminn:hs:compare-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [entityType]);

  const isInList = items.some((i) => i.slug === entitySlug);
  const isFull = !isInList && items.length >= maxCompare;

  const handleClick = useCallback(() => {
    const data = readStorage();
    const list = data[entityType] ?? [];
    if (isInList) {
      // Remove
      data[entityType] = list.filter((i) => i.slug !== entitySlug);
    } else {
      if (list.length >= maxCompare) return;
      data[entityType] = [...list, { slug: entitySlug, name: entityName }];
    }
    writeStorage(data);
  }, [entityType, entitySlug, entityName, isInList, maxCompare]);

  // SSR placeholder — render same shape to avoid hydration mismatch,
  // but disabled (we don't know the saved state yet).
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
        <Columns3 className="h-4 w-4" aria-hidden="true" />
        Compare
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={isInList ? "default" : variant}
      size={size}
      onClick={handleClick}
      disabled={isFull}
      aria-pressed={isInList}
      aria-label={
        isInList
          ? `Remove ${entityName} from comparison`
          : isFull
            ? `Comparison list is full (max ${maxCompare})`
            : `Add ${entityName} to comparison`
      }
      className={cn(
        "transition-all",
        isInList &&
          "bg-blue-600 text-white hover:bg-blue-700 shadow-blue",
        isFull && !isInList && "cursor-not-allowed opacity-50",
        className,
      )}
      {...rest}
    >
      {isInList ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Plus className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{isInList ? "In Compare" : "Compare"}</span>
      {compareHref && (
        <a
          href={compareHref}
          className="sr-only"
          aria-label="View comparison page"
        >
          View comparison
        </a>
      )}
    </Button>
  );
}
