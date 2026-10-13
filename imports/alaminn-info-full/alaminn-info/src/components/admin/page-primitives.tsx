"use client";

import { cn } from "@/lib/utils";

/** Standard page header — title, subtitle, optional right-side actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6", className)}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Loading skeleton matching the dashboard table shape. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-muted rounded animate-pulse" />
      ))}
    </div>
  );
}

/** Empty state. */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

/** Error state. */
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-4 text-sm text-destructive">
      {message}
    </div>
  );
}
