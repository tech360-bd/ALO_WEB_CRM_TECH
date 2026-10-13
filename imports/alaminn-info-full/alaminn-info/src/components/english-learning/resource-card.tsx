/**
 * ResourceCard — server component rendering a study resource.
 */
import Link from "next/link";
import {
  FileText,
  Video,
  Image as ImageIcon,
  Headphones,
  Download,
  Clock,
  ArrowRight,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RESOURCE_TYPE_MAP } from "@/lib/english-learning/constants";
import type { Resource } from "@/lib/english-learning/types";

const RESOURCE_ICONS: Record<string, typeof FileText> = {
  article: FileText,
  video: Video,
  infographic: ImageIcon,
  audio: Headphones,
  pdf: Download,
};

interface ResourceCardProps {
  resource: Resource;
  className?: string;
}

export function ResourceCard({ resource, className }: ResourceCardProps) {
  const detailHref = `/english-learning/resources/${resource.slug}`;
  const typeLabel = RESOURCE_TYPE_MAP[resource.resourceType as string] ?? "Resource";
  const Icon = RESOURCE_ICONS[resource.resourceType as string] ?? FileText;

  return (
    <Card
      className={cn(
        "group relative gap-4 overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg",
        className,
      )}
    >
      {resource.isFeatured && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-orange-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-orange">
          Featured
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <Badge
            variant="outline"
            className="mb-1.5 gap-1 border-cyan-200 bg-cyan-50 text-[11px] font-semibold text-cyan-700"
          >
            {typeLabel}
          </Badge>
          <h3 className="font-display text-base font-bold leading-snug text-ink-900">
            <Link href={detailHref} className="hover-underline line-clamp-2">
              {resource.title}
            </Link>
          </h3>
          {resource.summary && (
            <p className="mt-1 line-clamp-2 text-xs text-ink-600">
              {resource.summary}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-500">
        {resource.authorName && (
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" aria-hidden="true" />
            {resource.authorName}
          </span>
        )}
        {resource.readingTimeMinutes != null && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {resource.readingTimeMinutes} min read
          </span>
        )}
        {resource.durationMinutes != null && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {resource.durationMinutes}m
          </span>
        )}
      </div>

      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-9 gap-1.5 rounded-xl border-cyan-200 text-cyan-700 hover:bg-cyan-50"
      >
        <Link href={detailHref}>
          Read
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </Button>
    </Card>
  );
}
