/**
 * EmptyState — friendly empty-result placeholder.
 *
 * Renders an icon (or default), title, description, and optional
 * action button / link.
 */
import Link from "next/link";
import { SearchX, ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: EmptyStateAction;
  className?: string;
  /** Render size — `default` is for full-page, `compact` for in-card. */
  size?: "default" | "compact";
}

/**
 * Render an empty-state placeholder.
 */
export function EmptyState({
  title,
  description,
  icon: Icon = SearchX,
  action,
  className,
  size = "default",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 text-center",
        size === "default" ? "px-6 py-16" : "px-4 py-8",
        className,
      )}
      role="status"
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-white shadow-soft",
          size === "default" ? "h-16 w-16" : "h-12 w-12",
        )}
      >
        <Icon
          className={cn(
            "text-ink-400",
            size === "default" ? "h-8 w-8" : "h-6 w-6",
          )}
          aria-hidden="true"
        />
      </div>
      <h3
        className={cn(
          "font-display font-bold text-ink-900",
          size === "default" ? "mt-4 text-lg" : "mt-3 text-base",
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "mt-1.5 max-w-md text-ink-600",
            size === "default" ? "text-sm" : "text-xs",
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <Button
              asChild
              variant={action.variant ?? "default"}
              className="gap-1.5 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
            >
              <Link href={action.href}>
                {action.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant={action.variant ?? "default"}
              onClick={action.onClick}
              className="gap-1.5 rounded-xl bg-orange-600 text-white shadow-orange hover:bg-orange-700"
            >
              {action.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
