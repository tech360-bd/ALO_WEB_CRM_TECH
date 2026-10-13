/**
 * LoadingSkeleton — skeleton loaders for Higher Study cards.
 *
 * Renders a stack of `count` skeleton cards matching the visual
 * shape of the real card (image + 3 text lines + button row) so the
 * layout doesn't shift when real data arrives.
 */
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type SkeletonType =
  | "university"
  | "course"
  | "scholarship"
  | "research"
  | "supervisor"
  | "resource";

export interface LoadingSkeletonProps {
  type?: SkeletonType;
  count?: number;
  className?: string;
}

/**
 * Render `count` skeleton cards.
 */
export function LoadingSkeleton({
  type = "university",
  count = 3,
  className,
}: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
      aria-label={`Loading ${type} results`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} type={type} />
      ))}
    </div>
  );
}

function SkeletonCard({ type }: { type: SkeletonType }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-200 bg-white p-5 shadow-soft",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
        <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
      </div>

      {/* Meta chips */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>

      {/* Body rows */}
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-5/6 rounded-md" />
        {type === "scholarship" || type === "research" ? (
          <Skeleton className="h-3 w-3/4 rounded-md" />
        ) : null}
      </div>

      {/* Highlighted box (tuition / funding / stipend) */}
      <Skeleton className="mt-4 h-12 w-full rounded-xl" />

      {/* Action row */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Skeleton className="h-9 rounded-xl" />
        <Skeleton className="h-9 rounded-xl" />
      </div>
    </div>
  );
}
