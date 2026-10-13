"use client";

/**
 * TutorFilters — filter sidebar for the tutor directory.
 */
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const COMMON_SPECIALTIES = [
  "IELTS Speaking",
  "IELTS Writing",
  "TOEFL",
  "PTE",
  "Academic Writing",
  "Business English",
  "Conversation",
  "Grammar",
];

const MAX_RATE_CAP = 100;

export interface TutorFiltersProps {
  className?: string;
}

export function TutorFilters({ className }: TutorFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const specialty = searchParams.get("specialty") || "";
  const maxRate = Number(searchParams.get("maxHourlyRate") || "0");
  const minRating = Number(searchParams.get("minRating") || "0");
  const availableOnly = searchParams.get("isAvailable") === "true";

  const updateParams = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/english-learning/tutors?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  const clearAll = () => {
    updateParams({
      specialty: null,
      maxHourlyRate: null,
      minRating: null,
      isAvailable: null,
    });
  };

  const hasFilters = Boolean(specialty) || maxRate > 0 || minRating > 0 || availableOnly;

  return (
    <aside
      className={cn(
        "rounded-2xl border border-ink-200 bg-white p-5 shadow-soft",
        className,
      )}
      aria-label="Tutor filters"
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

      {/* Specialty search */}
      <div className="mt-5 space-y-2">
        <Label
          htmlFor="tutor-specialty"
          className="text-[11px] font-bold uppercase tracking-widest text-ink-600"
        >
          Specialty
        </Label>
        <Input
          id="tutor-specialty"
          type="text"
          placeholder="e.g. IELTS Speaking"
          defaultValue={specialty}
          onBlur={(e) => updateParams({ specialty: e.target.value || null })}
          className="h-9 rounded-xl border-ink-200 text-sm"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {COMMON_SPECIALTIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateParams({ specialty: s })}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors",
                specialty === s
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Max rate */}
      <div className="mt-5 space-y-3">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink-600">
          Max Hourly Rate
        </h3>
        <Slider
          defaultValue={[maxRate || MAX_RATE_CAP]}
          max={MAX_RATE_CAP}
          min={10}
          step={5}
          onValueCommit={(value) => {
            const v = value[0];
            updateParams({
              maxHourlyRate: v >= MAX_RATE_CAP ? null : String(v),
            });
          }}
          aria-label="Maximum hourly rate in USD"
        />
        <div className="flex items-center justify-between text-[11px] text-ink-500">
          <span>$10</span>
          <span>
            {maxRate > 0 ? (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
              >
                Up to ${maxRate}/hr
              </Badge>
            ) : (
              "Any rate"
            )}
          </span>
          <span>${MAX_RATE_CAP}+</span>
        </div>
      </div>

      {/* Min rating */}
      <div className="mt-5 space-y-2">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink-600">
          Min Rating
        </h3>
        <div className="flex gap-1.5">
          {[4.5, 4.0, 3.5, 0].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() =>
                updateParams({ minRating: r > 0 ? String(r) : null })
              }
              className={cn(
                "rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors",
                (minRating === r || (r === 0 && minRating === 0))
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
              )}
            >
              {r === 0 ? "Any" : `${r}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Available only */}
      <div className="mt-5">
        <label
          htmlFor="tutor-available"
          className="flex cursor-pointer items-center gap-2 text-sm text-ink-700"
        >
          <Checkbox
            id="tutor-available"
            checked={availableOnly}
            onCheckedChange={(v) =>
              updateParams({ isAvailable: v === true ? "true" : null })
            }
          />
          <span>Available now only</span>
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
