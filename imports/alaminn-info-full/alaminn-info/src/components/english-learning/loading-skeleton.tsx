/**
 * LoadingSkeleton — skeleton loaders for English Learning cards.
 */
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type SkeletonType =
  | "course"
  | "lesson"
  | "test"
  | "tutor"
  | "resource";

export interface LoadingSkeletonProps {
  type?: SkeletonType;
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  type = "course",
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
    <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
        <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>

      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-5/6 rounded-md" />
        {type === "course" || type === "tutor" || type === "resource" ? (
          <Skeleton className="h-3 w-3/4 rounded-md" />
        ) : null}
      </div>

      {type === "course" || type === "tutor" ? (
        <Skeleton className="mt-4 h-12 w-full rounded-xl" />
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Skeleton className="h-9 rounded-xl" />
        <Skeleton className="h-9 rounded-xl" />
      </div>
    </div>
  );
}
