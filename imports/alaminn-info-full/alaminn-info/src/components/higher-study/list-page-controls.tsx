"use client";

/**
 * ListPageControls — interactive wrapper that holds the search + filter
 * + sort state for Higher Study list pages and syncs it to the URL via
 * searchParams. The actual data fetching happens server-side via the
 * route's `searchParams` (Next.js re-runs the Server Component when
 * the URL changes).
 *
 * Composition:
 *   <ListPageControls
 *     searchValue={...}
 *     filters={[...]}
 *     filterValues={...}
 *     sortOptions={[...]}
 *     sortValue={...}
 *     suggestions={[...]}
 *   />
 *
 * The component is intentionally dumb about the entity type — it only
 * knows how to:
 *   1. Render a search bar (top)
 *   2. Render the FilterPanel (sidebar)
 *   3. Render a sort Select (top-right)
 *   4. Sync all values to the URL on change (replace, no history spam)
 */
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowUpDown, X, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SearchBar, type SearchSuggestion } from "./search-bar";
import {
  FilterPanel,
  type FilterDefinition,
  type FilterValues,
} from "./filter-panel";
import { cn } from "@/lib/utils";

export interface SortOption {
  value: string;
  label: string;
}

export interface ListPageControlsProps {
  searchPlaceholder?: string;
  searchValue: string;
  searchSuggestions?: SearchSuggestion[];
  filters: FilterDefinition[];
  filterValues: FilterValues;
  sortOptions?: SortOption[];
  sortValue?: string;
  /** Order (asc/desc) — optional, paired with sortValue. */
  orderValue?: "asc" | "desc";
  /** Show the order toggle button (default true if sortOptions given). */
  showOrderToggle?: boolean;
  /** Active filter count for badge display. */
  activeFilterCount?: number;
  /** Optional className for the top toolbar. */
  toolbarClassName?: string;
  /** Optional className for the filter panel wrapper. */
  filterClassName?: string;
  /** ARIA label for the search input. */
  searchAriaLabel?: string;
}

/**
 * Render the toolbar (search + sort) and the filter sidebar.
 * URL syncing is handled internally — no callbacks needed.
 */
export function ListPageControls({
  searchPlaceholder = "Search…",
  searchValue,
  searchSuggestions = [],
  filters,
  filterValues,
  sortOptions = [],
  sortValue,
  orderValue,
  showOrderToggle = true,
  activeFilterCount = 0,
  toolbarClassName,
  filterClassName,
  searchAriaLabel = "Search",
}: ListPageControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Build a new URLSearchParams from current + updates ──
  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "" ||
            (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else {
          params.set(key, value);
        }
      }
      // Reset to page 1 on any filter change (so we don't end up on an
      // out-of-range page after narrowing results).
      if (!("page" in updates)) params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const onSearchChange = useCallback(
    (v: string) => updateParams({ q: v || null }),
    [updateParams],
  );

  const onSortChange = useCallback(
    (v: string) => {
      if (v === "__default__") {
        updateParams({ sort: null, order: null });
      } else {
        updateParams({ sort: v, order: orderValue ?? "asc" });
      }
    },
    [updateParams, orderValue],
  );

  const onToggleOrder = useCallback(() => {
    const next = orderValue === "asc" ? "desc" : "asc";
    updateParams({ order: next });
  }, [updateParams, orderValue]);

  const onFilterChange = useCallback(
    (name: string, value: FilterValues[string]) => {
      if (value === null || value === undefined || value === "" ||
          (Array.isArray(value) && value.length === 0)) {
        updateParams({ [name]: null });
      } else if (typeof value === "boolean") {
        updateParams({ [name]: value ? "true" : null });
      } else if (Array.isArray(value)) {
        // Range (number[]) — render as "min,max" if length 2 with numbers,
        // else a string[] of selected options joined later.
        if (value.length === 2 &&
            typeof value[0] === "number" && typeof value[1] === "number") {
          updateParams({ [name]: `${value[0]},${value[1]}` });
        } else {
          // string[] — pass as-is (updateParams will join with commas).
          updateParams({ [name]: value as string[] });
        }
      } else {
        // Plain string value
        updateParams({ [name]: String(value) });
      }
    },
    [updateParams],
  );

  const onReset = useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    // Remove every filter name + q
    for (const f of filters) params.delete(f.name);
    params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams, filters]);

  // Determine if any filter is active (for the badge).
  const computedActive = useMemo(() => {
    if (activeFilterCount > 0) return activeFilterCount;
    let n = 0;
    for (const f of filters) {
      const v = filterValues[f.name];
      if (v === null || v === undefined || v === "") continue;
      if (Array.isArray(v) && v.length === 0) continue;
      n++;
    }
    if (searchValue) n++;
    return n;
  }, [activeFilterCount, filters, filterValues, searchValue]);

  return (
    <>
      {/* Top toolbar: search + sort */}
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center",
          toolbarClassName,
        )}
      >
        <div className="flex-1">
          <SearchBar
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={onSearchChange}
            suggestions={searchSuggestions}
            ariaLabel={searchAriaLabel}
          />
        </div>
        {sortOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-ink-500" aria-hidden="true" />
              <span className="hidden text-xs font-semibold uppercase tracking-wide text-ink-500 sm:inline">
                Sort
              </span>
            </div>
            <Select
              value={sortValue ?? "__default__"}
              onValueChange={onSortChange}
            >
              <SelectTrigger
                className="h-11 w-[180px] rounded-xl border-ink-200 text-sm focus-visible:ring-orange-400/30"
                aria-label="Sort results"
              >
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">Default</SelectItem>
                {sortOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showOrderToggle && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onToggleOrder}
                aria-label={`Toggle sort order (currently ${orderValue === "desc" ? "descending" : "ascending"})`}
                className="h-11 w-11 rounded-xl border-ink-200 p-0"
              >
                <ArrowUpDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    orderValue === "desc" && "rotate-180 text-orange-600",
                  )}
                  aria-hidden="true"
                />
              </Button>
            )}
          </div>
        )}

        {/* Mobile filter trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 gap-2 rounded-xl border-ink-200 px-4 lg:hidden"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
              {computedActive > 0 && (
                <Badge className="bg-orange-600 text-[10px] font-bold uppercase tracking-wider text-white">
                  {computedActive}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88%] max-w-[360px] overflow-y-auto p-0">
            <SheetHeader className="border-b border-ink-200 p-5">
              <SheetTitle className="text-left font-display text-base font-extrabold text-ink-900">
                Filters
              </SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <FilterPanel
                filters={filters}
                values={filterValues}
                onChange={onFilterChange}
                onReset={onReset}
                activeCount={computedActive}
                className="border-0 shadow-none"
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop layout: sidebar filters + main content */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-[148px]">
            <FilterPanel
              filters={filters}
              values={filterValues}
              onChange={onFilterChange}
              onReset={onReset}
              activeCount={computedActive}
              className={filterClassName}
            />
            {computedActive > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="mt-2 w-full gap-1.5 rounded-lg text-xs text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Clear all {computedActive} filter{computedActive === 1 ? "" : "s"}
              </Button>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {/* Caller provides the result grid as children via the wrapping page */}
          <ListOfActiveChips
            filters={filters}
            values={filterValues}
            onRemove={onFilterChange}
            searchValue={searchValue}
            onClearSearch={() => onSearchChange("")}
          />
        </div>
      </div>
    </>
  );
}

// ─── Active-filter chip strip ────────────────────────────────────────

interface ListOfActiveChipsProps {
  filters: FilterDefinition[];
  values: FilterValues;
  onRemove: (name: string, value: FilterValues[string]) => void;
  searchValue?: string;
  onClearSearch?: () => void;
}

function ListOfActiveChips({
  filters,
  values,
  onRemove,
  searchValue,
  onClearSearch,
}: ListOfActiveChipsProps) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (searchValue) {
    chips.push({
      label: `Search: “${searchValue}”`,
      onRemove: () => onClearSearch?.(),
    });
  }

  for (const f of filters) {
    const v = values[f.name];
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      if (typeof v[0] === "number") {
        const [min, max] = v as number[];
        chips.push({
          label: `${f.label}: ${min}–${max}`,
          onRemove: () => onRemove(f.name, null),
        });
      } else {
        for (const single of v as string[]) {
          const opt = f.options?.find((o) => o.value === single);
          chips.push({
            label: opt?.label ?? single,
            onRemove: () => {
              const next = (v as string[]).filter((x) => x !== single);
              onRemove(f.name, next.length === 0 ? null : next);
            },
          });
        }
      }
    } else if (typeof v === "boolean") {
      chips.push({
        label: f.label,
        onRemove: () => onRemove(f.name, null),
      });
    } else {
      const opt = f.options?.find((o) => o.value === v);
      chips.push({
        label: opt?.label ?? String(v),
        onRemove: () => onRemove(f.name, null),
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      {chips.map((c, idx) => (
        <Badge
          key={`${c.label}-${idx}`}
          className="gap-1 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200"
        >
          <span className="truncate max-w-[160px]">{c.label}</span>
          <button
            type="button"
            onClick={c.onRemove}
            aria-label={`Remove filter ${c.label}`}
            className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-blue-200"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
