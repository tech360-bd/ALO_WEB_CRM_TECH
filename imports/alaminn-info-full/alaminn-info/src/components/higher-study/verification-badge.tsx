"use client";

/**
 * VerificationBadge — small visual badge + tooltip explaining the
 * editorial verification status of a Higher Study entity.
 *
 * Statuses (matching `VerificationStatus` in types.ts):
 *  - draft           → grey, "Draft"
 *  - pending-review  → amber, "Pending review"
 *  - verified        → emerald, "Verified"
 *  - published       → blue, "Published"
 *  - needs-update    → orange, "Needs update"
 *  - archived        → ink-400, "Archived"
 */
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Archive,
  FileEdit,
  ExternalLink,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/lib/higher-study/types";

interface VerificationBadgeProps {
  status: VerificationStatus;
  lastVerifiedAt?: Date | string | null;
  sourceUrl?: string | null;
  className?: string;
  /** Show the verification source link inline (default false). */
  showSource?: boolean;
}

const STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; icon: typeof ShieldCheck; className: string; dot: string }
> = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    className:
      "border-ink-200 bg-ink-50 text-ink-600",
    dot: "bg-ink-400",
  },
  "pending-review": {
    label: "Pending review",
    icon: Clock,
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  verified: {
    label: "Verified",
    icon: ShieldCheck,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  published: {
    label: "Published",
    icon: CheckCircle2,
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  "needs-update": {
    label: "Needs update",
    icon: AlertTriangle,
    className:
      "border-orange-200 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    className:
      "border-ink-200 bg-ink-50 text-ink-500",
    dot: "bg-ink-400",
  },
};

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "not yet verified";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "not yet verified";
  return `last verified ${date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
}

/**
 * Render a small status badge with an explanatory tooltip. The tooltip
 * shows the verification status, last-verified date and a link to the
 * official source (when available).
 */
export function VerificationBadge({
  status,
  lastVerifiedAt,
  sourceUrl,
  className,
  showSource = false,
}: VerificationBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.verified;
  const Icon = config.icon;
  const tooltipText = `${config.label} — ${formatDate(lastVerifiedAt)}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`Verification: ${tooltipText}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-1",
            config.className,
            className,
          )}
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
          <span>{config.label}</span>
          <span
            className={cn("h-1.5 w-1.5 rounded-full", config.dot)}
            aria-hidden="true"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[260px] border border-ink-200 bg-white px-3 py-2 text-ink-800 shadow-soft"
      >
        <div className="flex items-center gap-1.5 font-semibold text-ink-900">
          <Icon className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          {config.label}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-ink-600">
          {formatDate(lastVerifiedAt)}.
        </p>
        {showSource && sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
          >
            View official source
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
