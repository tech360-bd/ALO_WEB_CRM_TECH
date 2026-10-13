"use client";

/**
 * CourseFilters — client-side filter sidebar for the course list page.
 *
 * Renders level checkboxes, test-type filter, price-range slider, and a
 * "Featured only" toggle. Updates the URL `?level=...&maxPriceUsd=...`
 * on change so the server component re-renders with the filtered data.
 */
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  COURSE_LEVELS,
} from "@/lib/english-learning/constants";

const TEST_PREP_LEVELS = ["ielts", "toefl", "pte", "det", "gre", "gmat"];
const GENERAL_LEVELS = ["beginner", "intermediate", "advanced"];

export interface CourseFiltersProps {
  className?: string;
  /** Maximum price cap for the slider. */
  maxPriceCap?: number;
}

export function CourseFilters({
  className,
  maxPriceCap = 500,
}: CourseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedLevels = (searchParams.get("level") || "")
    .split(",")
    .filter(Boolean);
  const maxPrice = Number(searchParams.get("maxPriceUsd") || "0");
  const featuredOnly = searchParams.get("isFeatured") === "true";

  const updateParams = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      // Reset to page 1 when filters change.
      params.delete("page");
      startTransition(() => {
        router.push(`/english-learning/courses?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  const toggleLevel = (level: string) => {
    const next = selectedLevels.includes(level)
      ? selectedLevels.filter((l) => l !== level)
      : [...selectedLevels, level];
    updateParams({ level: next.join(",") });
  };

  const clearAll = () => {
    updateParams({ level: null, maxPriceUsd: null, isFeatured: null });
  };

  const hasFilters =
    selectedLevels.length > 0 || maxPrice > 0 || featuredOnly;

  return (
    <aside
      className={cn(
        "rounded-2xl border border-ink-200 bg-white p-5 shadow-soft",
        className,
      )}
      aria-label="Course filters"
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-ink-900">
          <Filter className="h-4 w-4 text-blue-600" aria-hidden="true" />
          Filters
        </h2>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] font-semibold text-blue-700 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* General level */}
      <div className="mt-5 space-y-2">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink-600">
          General Level
        </h3>
        {GENERAL_LEVELS.map((level) => {
          const option = COURSE_LEVELS.find((l) => l.value === level);
          if (!option) return null;
          const checked = selectedLevels.includes(level);
          return (
            <label
              key={level}
              htmlFor={`level-${level}`}
              className="flex cursor-pointer items-start gap-2 text-sm text-ink-700 hover:text-ink-900"
            >
              <Checkbox
                id={`level-${level}`}
                checked={checked}
                onCheckedChange={() => toggleLevel(level)}
                className="mt-0.5"
              />
              <span>
                <span className="font-semibold">{option.label}</span>
                <span className="block text-[11px] text-ink-500">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {/* Test prep */}
      <div className="mt-5 space-y-2">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink-600">
          Test Prep
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {TEST_PREP_LEVELS.map((level) => {
            const option = COURSE_LEVELS.find((l) => l.value === level);
            if (!option) return null;
            const checked = selectedLevels.includes(level);
            return (
              <button
                key={level}
                type="button"
                onClick={() => toggleLevel(level)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  checked
                    ? "border-orange-300 bg-orange-50 text-orange-700"
                    : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Max price */}
      <div className="mt-5 space-y-3">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink-600">
          Max Price
        </h3>
        <Slider
          defaultValue={[maxPrice || maxPriceCap]}
          max={maxPriceCap}
          min={0}
          step={25}
          onValueCommit={(value) => {
            const v = value[0];
            updateParams({
              maxPriceUsd: v >= maxPriceCap ? null : String(v),
            });
          }}
          aria-label="Maximum price in USD"
        />
        <div className="flex items-center justify-between text-[11px] text-ink-500">
          <span>$0</span>
          <span>
            {maxPrice > 0 ? (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
              >
                Up to ${maxPrice}
              </Badge>
            ) : (
              "Any price"
            )}
          </span>
          <span>${maxPriceCap}+</span>
        </div>
      </div>

      {/* Featured only */}
      <div className="mt-5">
        <label
          htmlFor="featured-only"
          className="flex cursor-pointer items-center gap-2 text-sm text-ink-700"
        >
          <Checkbox
            id="featured-only"
            checked={featuredOnly}
            onCheckedChange={(v) =>
              updateParams({ isFeatured: v === true ? "true" : null })
            }
          />
          <span>Featured courses only</span>
        </label>
      </div>

      {hasFilters && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearAll}
          className="mt-5 w-full gap-1.5 rounded-xl border-ink-200 text-ink-700"
          disabled={isPending}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear all filters
        </Button>
      )}
    </aside>
  );
}
