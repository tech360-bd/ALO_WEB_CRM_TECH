/**
 * ResourceCard — server component rendering a study resource / guide card.
 *
 * Shows: title, category badge, summary, reading time, and a "Read"
 * button.
 */
import Link from "next/link";
import { BookOpen, Clock, ArrowRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VerificationBadge } from "./verification-badge";
import { cn } from "@/lib/utils";
import type { Resource } from "@/lib/higher-study/types";

interface ResourceCardProps {
  resource: Resource;
  className?: string;
}

/** Capitalize + prettify a category slug for display. */
function prettifyCategory(category?: string | null): string {
  if (!category) return "Resource";
  return category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Render a single study resource card.
 */
export function ResourceCard({ resource, className }: ResourceCardProps) {
  const detailHref = `/higher-study/resources/${resource.slug}`;
  const category = prettifyCategory(resource.category);
  const publishedDate = resource.publishedAt
    ? new Date(resource.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Card
      className={cn(
        "group relative gap-4 overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="gap-1 border-blue-200 bg-blue-50 text-[11px] font-semibold capitalize text-blue-700"
            >
              <FileText className="h-3 w-3" aria-hidden="true" />
              {category}
            </Badge>
            {resource.featured && (
              <Badge
                variant="outline"
                className="border-orange-200 bg-orange-50 text-[11px] font-semibold text-orange-700"
              >
                Featured
              </Badge>
            )}
          </div>
          <h3 className="font-display text-base font-bold leading-snug text-ink-900">
            <Link href={detailHref} className="hover-underline line-clamp-2">
              {resource.title}
            </Link>
          </h3>
        </div>
        <VerificationBadge
          status={resource.verificationStatus}
          lastVerifiedAt={resource.lastVerifiedAt}
          sourceUrl={resource.officialSourceUrl}
          className="shrink-0"
        />
      </div>

      {/* Summary */}
      {resource.summary && (
        <p className="line-clamp-3 text-sm leading-relaxed text-ink-600">
          {resource.summary}
        </p>
      )}

      {/* Footer: author + reading time + read button */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink-100 pt-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
          {resource.author && (
            <span className="font-medium text-ink-700">By {resource.author}</span>
          )}
          {resource.readingTimeMinutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {resource.readingTimeMinutes} min read
            </span>
          )}
          {publishedDate && (
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              {publishedDate}
            </span>
          )}
        </div>
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="h-8 gap-1 rounded-lg px-3 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
        >
          <Link href={detailHref}>
            Read
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
