"use client";

/**
 * TestFilters — filter sidebar for the practice-test list.
 */
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TEST_TYPES } from "@/lib/english-learning/constants";

const GROUPS = ["IELTS", "TOEFL", "PTE", "Duolingo", "GRE", "GMAT"] as const;

export interface TestFiltersProps {
  className?: string;
}

export function TestFilters({ className }: TestFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedTestType = searchParams.get("testType") || "";
  const selectedLevel = searchParams.get("level") || "";

  const updateParams = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/english-learning/practice-tests?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  const clearAll = () => updateParams({ testType: null, level: null });
  const hasFilters = Boolean(selectedTestType) || Boolean(selectedLevel);

  return (
    <aside
      className={cn(
        "rounded-2xl border border-ink-200 bg-white p-5 shadow-soft",
        className,
      )}
      aria-label="Practice test filters"
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-ink-900">
          <Filter className="h-4 w-4 text-purple-600" aria-hidden="true" />
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

      {GROUPS.map((group) => {
        const types = TEST_TYPES.filter((t) => t.group === group);
        if (types.length === 0) return null;
        return (
          <div key={group} className="mt-5 space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink-600">
              {group}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {types.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    updateParams({
                      testType:
                        selectedTestType === t.value ? null : t.value,
                    })
                  }
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    selectedTestType === t.value
                      ? "border-purple-300 bg-purple-50 text-purple-700"
                      : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}

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
