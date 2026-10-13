"use client";

/**
 * PaginationClient — accessible client-side pagination control for
 * Higher Study list pages. Updates URL search params on the client
 * (pushState) so the page can re-fetch server-side without a full
 * reload.
 *
 * Uses the standard Higher Study pagination shape:
 *   { page, limit, total, totalPages, hasNext, hasPrev }
 */
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationClientProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  /** Additional search params to preserve (e.g. exclude page). */
  preserveParams?: string[];
  className?: string;
}

/**
 * Build a small range of page numbers around the current page for
 * the pagination control. Always shows 1, last, current ±1.
 */
function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("...");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("...");
  out.push(total);
  return out;
}

/**
 * Render a Higher Study pagination control.
 */
export function PaginationClient({
  page,
  limit,
  total,
  totalPages,
  hasNext,
  hasPrev,
  preserveParams = [],
  className,
}: PaginationClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goTo = useCallback(
    (nextPage: number) => {
      if (nextPage < 1 || nextPage > totalPages) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (nextPage <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(nextPage));
      }
      // Optionally preserve other params
      void preserveParams;
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, totalPages, preserveParams],
  );

  const pages = useMemo(() => buildPageRange(page, totalPages), [page, totalPages]);

  if (total === 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-soft sm:flex-row",
        className,
      )}
    >
      <p className="text-xs text-ink-600 sm:text-sm" aria-live="polite">
        Showing <span className="font-bold text-ink-900">{startItem.toLocaleString()}</span>–
        <span className="font-bold text-ink-900">{endItem.toLocaleString()}</span> of{" "}
        <span className="font-bold text-ink-900">{total.toLocaleString()}</span> results
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          onClick={() => goTo(1)}
          aria-label="Go to first page"
          className="h-8 w-8 rounded-lg p-0 border-ink-200"
        >
          <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          onClick={() => goTo(page - 1)}
          aria-label="Go to previous page"
          className="h-8 w-8 rounded-lg p-0 border-ink-200"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>

        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 text-sm text-ink-400"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              type="button"
              variant={p === page ? "default" : "outline"}
              size="sm"
              onClick={() => goTo(p)}
              aria-label={`Go to page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "h-8 min-w-8 rounded-lg px-2.5 text-xs font-semibold",
                p === page
                  ? "bg-blue-600 text-white shadow-blue hover:bg-blue-700"
                  : "border-ink-200 text-ink-700 hover:border-blue-200 hover:bg-blue-50",
              )}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => goTo(page + 1)}
          aria-label="Go to next page"
          className="h-8 w-8 rounded-lg p-0 border-ink-200"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => goTo(totalPages)}
          aria-label="Go to last page"
          className="h-8 w-8 rounded-lg p-0 border-ink-200"
        >
          <ChevronsRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
