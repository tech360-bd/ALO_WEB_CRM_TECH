"use client";

/**
 * ALO Education Design System — Domain Cards
 * ===========================================
 * Specialized card components for the ALO Education platform.
 * Each card follows the unified ALO design language.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Icon, ACCENT_CLASSES, type AccentColor } from "./ui";

/* ════════════════════════════════════════════════════════════════════════
   1. ApprovalCard — approval workflow item with approve/reject
   ════════════════════════════════════════════════════════════════════════ */
export interface ApprovalCardProps {
  title: string;
  description?: string;
  requester?: { name: string; avatar?: string; role?: string };
  amount?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  metadata?: { label: string; value: string }[];
  onApprove?: () => void;
  onReject?: () => void;
  onView?: () => void;
  className?: string;
}

export function ApprovalCard({
  title, description, requester, amount, dueDate, priority = "medium",
  metadata, onApprove, onReject, onView, className,
}: ApprovalCardProps) {
  const priorityMap: Record<string, AccentColor> = { low: "slate", medium: "sky", high: "amber", urgent: "rose" };
  const pAccent = ACCENT_CLASSES[priorityMap[priority]];
  return (
    <Card className={cn("rounded-2xl border-l-4 bg-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)]", pAccent.border, className)}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="card-title text-[var(--alo-text)]">{title}</h3>
              <Badge variant={priorityMap[priority] === "rose" ? "danger" : priorityMap[priority] === "amber" ? "warning" : priorityMap[priority] === "sky" ? "info" : "neutral"} className="capitalize">
                {priority}
              </Badge>
            </div>
            {description && <p className="mt-1 body-text text-[var(--alo-text-secondary)]">{description}</p>}
          </div>
          {amount && (
            <div className="shrink-0 text-right">
              <p className="text-lg font-bold text-[var(--alo-text)] tabular-nums">{amount}</p>
            </div>
          )}
        </div>

        {requester && (
          <div className="mt-3 flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarImage src={requester.avatar} />
              <AvatarFallback className="bg-[var(--alo-blue-soft)] text-xs font-semibold text-[var(--alo-blue-strong)]">
                {requester.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs">
              <span className="font-medium text-[var(--alo-text)]">{requester.name}</span>
              {requester.role && <span className="text-[var(--alo-muted)]"> · {requester.role}</span>}
            </div>
          </div>
        )}

        {metadata && metadata.length > 0 && (
          <dl className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-[var(--alo-surface-muted)] p-3">
            {metadata.map((m, i) => (
              <div key={i}>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-muted)]">{m.label}</dt>
                <dd className="text-sm font-medium text-[var(--alo-text)]">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {dueDate && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--alo-muted)]">
            <Icon name="Clock" className="size-3.5" />
            Due {dueDate}
          </div>
        )}
      </CardContent>
      {(onApprove || onReject || onView) && (
        <CardFooter className="gap-2 border-t border-[var(--alo-border)] pt-4">
          {onView && <Button variant="ghost" size="sm" onClick={onView}><Icon name="Eye" className="size-3.5" />View</Button>}
          {onReject && <Button variant="outline" size="sm" onClick={onReject} className="text-[var(--alo-danger-strong)] border-[var(--alo-danger)]/40 hover:bg-[var(--alo-danger-soft)]"><Icon name="X" className="size-3.5" />Reject</Button>}
          {onApprove && <Button variant="cta" size="sm" onClick={onApprove} className="ml-auto"><Icon name="Check" className="size-3.5" />Approve</Button>}
        </CardFooter>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   2. AISuggestionCard — AI recommendation with confidence & apply
   ════════════════════════════════════════════════════════════════════════ */
export interface AISuggestionCardProps {
  title: string;
  suggestion: string;
  reasoning?: string;
  confidence?: number; // 0-100
  category?: string;
  onApply?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function AISuggestionCard({
  title, suggestion, reasoning, confidence, category, onApply, onDismiss, className,
}: AISuggestionCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden rounded-2xl border-[var(--alo-blue)]/20 bg-gradient-to-br from-[var(--alo-blue-soft)]/60 to-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)]",
      className
    )}>
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[var(--alo-blue)]/8 blur-2xl" />
      <CardContent className="relative pt-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-alo-gradient text-white shadow-[var(--alo-shadow-blue)]">
            <Icon name="Sparkles" className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="caption-text text-[var(--alo-blue-strong)]">AI Suggestion</p>
              {category && <Badge variant="blue">{category}</Badge>}
            </div>
            <h4 className="mt-0.5 text-sm font-semibold text-[var(--alo-text)]">{title}</h4>
          </div>
          {confidence !== undefined && (
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-muted)]">Confidence</p>
              <p className={cn(
                "text-sm font-bold",
                confidence >= 80 ? "text-[var(--alo-success-strong)]" : confidence >= 50 ? "text-[var(--alo-warning-strong)]" : "text-[var(--alo-danger-strong)]"
              )}>
                {confidence}%
              </p>
            </div>
          )}
        </div>
        <p className="mt-3 body-text text-[var(--alo-text)]">{suggestion}</p>
        {reasoning && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-[var(--alo-text-secondary)]">
            <Icon name="Brain" className="mt-0.5 size-3.5 shrink-0 text-[var(--alo-blue)]" />
            <span>{reasoning}</span>
          </div>
        )}
      </CardContent>
      {(onApply || onDismiss) && (
        <CardFooter className="gap-2 border-t border-[var(--alo-border)]/60 pt-3">
          {onDismiss && <Button variant="ghost" size="sm" onClick={onDismiss}>Dismiss</Button>}
          {onApply && <Button variant="alo" size="sm" onClick={onApply} className="ml-auto"><Icon name="Check" className="size-3.5" />Apply</Button>}
        </CardFooter>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   3. AIAgentCard — AI agent status card
   ════════════════════════════════════════════════════════════════════════ */
export interface AIAgentCardProps {
  name: string;
  role: string;
  department?: string;
  status: "active" | "idle" | "paused" | "error";
  avatar?: string;
  icon?: string;
  accent?: AccentColor;
  tasksCompleted?: number;
  successRate?: number;
  lastActive?: string;
  onConfigure?: () => void;
  onView?: () => void;
  className?: string;
}

export function AIAgentCard({
  name, role, department, status, avatar, icon = "Bot", accent = "blue",
  tasksCompleted, successRate, lastActive, onConfigure, onView, className,
}: AIAgentCardProps) {
  const a = ACCENT_CLASSES[accent];
  const statusMap = {
    active: { color: "bg-[var(--alo-success)]", label: "Active" },
    idle: { color: "bg-[var(--alo-muted)]", label: "Idle" },
    paused: { color: "bg-[var(--alo-warning)]", label: "Paused" },
    error: { color: "bg-[var(--alo-danger)]", label: "Error" },
  } as const;
  const s = statusMap[status];
  return (
    <Card className={cn("rounded-2xl border-[var(--alo-border)] bg-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)] transition-all hover:shadow-[var(--alo-shadow-md)]", className)}>
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className={cn("flex size-12 items-center justify-center rounded-2xl", a.bg, a.text)}>
              {avatar ? (
                <Avatar className="size-12"><AvatarImage src={avatar} /><AvatarFallback>{name.charAt(0)}</AvatarFallback></Avatar>
              ) : (
                <Icon name={icon} className="size-6" />
              )}
            </div>
            <span className={cn("absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full ring-2 ring-[var(--alo-surface)]", s.color, status === "active" && "pulse-dot")} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-[var(--alo-text)]">{name}</h4>
            <p className="text-xs text-[var(--alo-text-secondary)]">{role}</p>
            {department && <Badge variant="neutral" className="mt-1">{department}</Badge>}
          </div>
          <Badge variant={status === "active" ? "success" : status === "error" ? "danger" : status === "paused" ? "warning" : "neutral"} className="shrink-0">
            {s.label}
          </Badge>
        </div>

        {(tasksCompleted !== undefined || successRate !== undefined) && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {tasksCompleted !== undefined && (
              <div className="rounded-lg bg-[var(--alo-surface-muted)] p-2.5">
                <p className="caption-text">Tasks</p>
                <p className="mt-0.5 text-lg font-bold text-[var(--alo-text)] tabular-nums">{tasksCompleted}</p>
              </div>
            )}
            {successRate !== undefined && (
              <div className="rounded-lg bg-[var(--alo-surface-muted)] p-2.5">
                <p className="caption-text">Success</p>
                <p className="mt-0.5 text-lg font-bold text-[var(--alo-success-strong)] tabular-nums">{successRate}%</p>
              </div>
            )}
          </div>
        )}
        {lastActive && (
          <p className="mt-3 text-xs text-[var(--alo-muted)]">Last active {lastActive}</p>
        )}
      </CardContent>
      {(onView || onConfigure) && (
        <CardFooter className="gap-2 border-t border-[var(--alo-border)] pt-3">
          {onView && <Button variant="ghost" size="sm" onClick={onView}><Icon name="Eye" className="size-3.5" />View</Button>}
          {onConfigure && <Button variant="outline" size="sm" onClick={onConfigure} className="ml-auto"><Icon name="Settings2" className="size-3.5" />Configure</Button>}
        </CardFooter>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   4. SourceEvidenceCard — verified source reference
   ════════════════════════════════════════════════════════════════════════ */
export interface SourceEvidenceCardProps {
  sourceUrl?: string;
  sourceTitle?: string;
  lastVerifiedAt?: string | Date;
  verificationStatus?: "VERIFIED" | "NEEDS_REVIEW" | "UNVERIFIED";
  verificationNotes?: string;
  className?: string;
}

export function SourceEvidenceCard({
  sourceUrl, sourceTitle, lastVerifiedAt, verificationStatus = "VERIFIED", verificationNotes, className,
}: SourceEvidenceCardProps) {
  const statusConfig = {
    VERIFIED: { icon: "ShieldCheck", accent: "emerald" as AccentColor, label: "Verified" },
    NEEDS_REVIEW: { icon: "AlertCircle", accent: "amber" as AccentColor, label: "Needs review" },
    UNVERIFIED: { icon: "ShieldAlert", accent: "slate" as AccentColor, label: "Unverified" },
  };
  const cfg = statusConfig[verificationStatus];
  const a = ACCENT_CLASSES[cfg.accent];
  return (
    <div className={cn("rounded-xl border bg-[var(--alo-surface-muted)] p-4", a.border, className)}>
      <div className="flex items-center gap-2">
        <div className={cn("flex size-8 items-center justify-center rounded-lg", a.bg, a.text)}>
          <Icon name={cfg.icon} className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold", a.text)}>{cfg.label}</p>
          {lastVerifiedAt && (
            <p className="text-xs text-[var(--alo-muted)]">
              Verified {typeof lastVerifiedAt === "string" ? lastVerifiedAt : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(lastVerifiedAt))}
            </p>
          )}
        </div>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center gap-1 text-xs font-medium hover:underline", a.text)}>
            <Icon name="ExternalLink" className="size-3.5" />
            Source
          </a>
        )}
      </div>
      {sourceTitle && <p className="mt-2 text-xs text-[var(--alo-text-secondary)]">{sourceTitle}</p>}
      {verificationNotes && <p className="mt-1 text-xs italic text-[var(--alo-muted)]">{verificationNotes}</p>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   5. DocumentCard — file/document preview
   ════════════════════════════════════════════════════════════════════════ */
export interface DocumentCardProps {
  name: string;
  type?: string;
  size?: string;
  uploadedAt?: string;
  uploadedBy?: { name: string; avatar?: string };
  status?: "pending" | "verified" | "rejected" | "expired";
  thumbnail?: string;
  onDownload?: () => void;
  onPreview?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function DocumentCard({
  name, type, size, uploadedAt, uploadedBy, status, thumbnail,
  onDownload, onPreview, onDelete, className,
}: DocumentCardProps) {
  const ext = type || name.split(".").pop()?.toUpperCase() || "FILE";
  const iconMap: Record<string, string> = {
    PDF: "FileText", DOC: "FileText", DOCX: "FileText",
    JPG: "Image", JPEG: "Image", PNG: "Image", WEBP: "Image",
    XLS: "Sheet", XLSX: "Sheet", CSV: "Sheet",
    MP4: "Video", MOV: "Video",
    ZIP: "Archive", RAR: "Archive",
  };
  const fileIcon = iconMap[ext] || "File";
  const statusMap = {
    pending: { variant: "warning" as const, label: "Pending" },
    verified: { variant: "success" as const, label: "Verified" },
    rejected: { variant: "danger" as const, label: "Rejected" },
    expired: { variant: "neutral" as const, label: "Expired" },
  };

  return (
    <Card className={cn("group overflow-hidden rounded-2xl border-[var(--alo-border)] bg-[var(--alo-surface)] shadow-[var(--alo-shadow-xs)] transition-all hover:shadow-[var(--alo-shadow-md)]", className)}>
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--alo-surface-muted)]">
        {thumbnail ? (
          <img src={thumbnail} alt={name} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Icon name={fileIcon} className="size-12 text-[var(--alo-muted)]/40" />
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onPreview && (
            <button onClick={onPreview} aria-label="Preview" className="flex size-7 items-center justify-center rounded-md bg-white/90 text-[var(--alo-text)] shadow-[var(--alo-shadow-sm)] hover:bg-white">
              <Icon name="Eye" className="size-3.5" />
            </button>
          )}
          {onDownload && (
            <button onClick={onDownload} aria-label="Download" className="flex size-7 items-center justify-center rounded-md bg-white/90 text-[var(--alo-text)] shadow-[var(--alo-shadow-sm)] hover:bg-white">
              <Icon name="Download" className="size-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} aria-label="Delete" className="flex size-7 items-center justify-center rounded-md bg-white/90 text-[var(--alo-danger)] shadow-[var(--alo-shadow-sm)] hover:bg-white">
              <Icon name="Trash2" className="size-3.5" />
            </button>
          )}
        </div>
        <Badge variant="neutral" className="absolute left-2 top-2 bg-white/90 font-mono text-[11px]">{ext}</Badge>
      </div>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--alo-text)]" title={name}>{name}</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--alo-muted)]">
              {size && <span>{size}</span>}
              {size && uploadedAt && <span>·</span>}
              {uploadedAt && <span>{uploadedAt}</span>}
            </div>
          </div>
          {status && <Badge variant={statusMap[status].variant}>{statusMap[status].label}</Badge>}
        </div>
        {uploadedBy && (
          <div className="mt-2 flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarImage src={uploadedBy.avatar} />
              <AvatarFallback className="text-[11px]">{uploadedBy.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-[var(--alo-muted)]">{uploadedBy.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   6. UniversityCard — university display
   ════════════════════════════════════════════════════════════════════════ */
export interface UniversityCardProps {
  name: string;
  country: string;
  flag?: string;
  city?: string;
  logo?: string;
  ranking?: number | string;
  coursesCount?: number;
  tuitionFrom?: string;
  acceptanceRate?: number;
  tags?: string[];
  featured?: boolean;
  onView?: () => void;
  className?: string;
}

export function UniversityCard({
  name, country, flag, city, logo, ranking, coursesCount, tuitionFrom,
  acceptanceRate, tags, featured, onView, className,
}: UniversityCardProps) {
  return (
    <Card className={cn(
      "group overflow-hidden rounded-2xl border-[var(--alo-border)] bg-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--alo-shadow-lg)]",
      featured && "ring-2 ring-[var(--alo-orange)]/40",
      className
    )}>
      <div className="relative h-24 bg-alo-gradient overflow-hidden">
        {featured && (
          <Badge variant="orange" className="absolute right-2 top-2 z-10 gap-1 bg-white">
            <Icon name="Star" className="size-3 fill-[var(--alo-orange)] text-[var(--alo-orange)]" />
            Featured
          </Badge>
        )}
        {flag && <span className="absolute left-3 top-3 text-2xl">{flag}</span>}
        <div className="absolute -bottom-6 left-4">
          {logo ? (
            <img src={logo} alt={name} className="size-12 rounded-xl border-2 border-white bg-white object-contain shadow-[var(--alo-shadow-sm)]" />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-xl border-2 border-white bg-[var(--alo-surface)] font-bold text-[var(--alo-blue)] shadow-[var(--alo-shadow-sm)]">
              {name.charAt(0)}
            </div>
          )}
        </div>
      </div>
      <CardContent className="pt-8">
        <h3 className="card-title text-[var(--alo-text)]">{name}</h3>
        <p className="mt-0.5 flex items-center gap-1 body-text text-[var(--alo-muted)]">
          <Icon name="MapPin" className="size-3.5" />
          {city ? `${city}, ` : ""}{country}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {ranking && (
            <div className="rounded-lg bg-[var(--alo-surface-muted)] p-2">
              <p className="caption-text">Ranking</p>
              <p className="mt-0.5 text-sm font-bold text-[var(--alo-text)]">#{ranking}</p>
            </div>
          )}
          {coursesCount !== undefined && (
            <div className="rounded-lg bg-[var(--alo-surface-muted)] p-2">
              <p className="caption-text">Courses</p>
              <p className="mt-0.5 text-sm font-bold text-[var(--alo-text)]">{coursesCount}</p>
            </div>
          )}
          {tuitionFrom && (
            <div className="rounded-lg bg-[var(--alo-surface-muted)] p-2">
              <p className="caption-text">Tuition from</p>
              <p className="mt-0.5 text-sm font-bold text-[var(--alo-text)]">{tuitionFrom}</p>
            </div>
          )}
          {acceptanceRate !== undefined && (
            <div className="rounded-lg bg-[var(--alo-surface-muted)] p-2">
              <p className="caption-text">Acceptance</p>
              <p className="mt-0.5 text-sm font-bold text-[var(--alo-text)]">{acceptanceRate}%</p>
            </div>
          )}
        </div>

        {tags && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t, i) => (
              <Badge key={i} variant="neutral" className="text-[11px]">{t}</Badge>
            ))}
          </div>
        )}

        {onView && (
          <Button variant="outline" size="sm" onClick={onView} className="mt-4 w-full">
            View university
            <Icon name="ArrowRight" className="size-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   7. CourseCard — course display
   ════════════════════════════════════════════════════════════════════════ */
export interface CourseCardProps {
  title: string;
  university: string;
  level?: string;
  duration?: string;
  tuition?: string;
  intake?: string[];
  matchScore?: number;
  tags?: string[];
  onView?: () => void;
  onShortlist?: () => void;
  shortlisted?: boolean;
  className?: string;
}

export function CourseCard({
  title, university, level, duration, tuition, intake, matchScore, tags,
  onView, onShortlist, shortlisted, className,
}: CourseCardProps) {
  return (
    <Card className={cn("group flex flex-col rounded-2xl border-[var(--alo-border)] bg-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--alo-shadow-lg)]", className)}>
      <CardContent className="flex-1 pt-5">
        <div className="flex items-start justify-between gap-2">
          {level && <Badge variant="blue">{level}</Badge>}
          {matchScore !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[var(--alo-surface-muted)]">
                <div className="h-full rounded-full bg-alo-gradient" style={{ width: `${matchScore}%` }} />
              </div>
              <span className="text-xs font-bold text-[var(--alo-blue-strong)]">{matchScore}%</span>
            </div>
          )}
        </div>
        <h3 className="mt-2 card-title text-[var(--alo-text)] line-clamp-2">{title}</h3>
        <p className="mt-1 flex items-center gap-1 body-text text-[var(--alo-muted)]">
          <Icon name="Building2" className="size-3.5" />
          {university}
        </p>

        <div className="mt-3 space-y-1.5">
          {duration && (
            <div className="flex items-center gap-2 text-xs text-[var(--alo-text-secondary)]">
              <Icon name="Clock" className="size-3.5 text-[var(--alo-muted)]" />
              <span>{duration}</span>
            </div>
          )}
          {tuition && (
            <div className="flex items-center gap-2 text-xs text-[var(--alo-text-secondary)]">
              <Icon name="Wallet" className="size-3.5 text-[var(--alo-muted)]" />
              <span>{tuition}</span>
            </div>
          )}
          {intake && intake.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-[var(--alo-text-secondary)]">
              <Icon name="Calendar" className="size-3.5 text-[var(--alo-muted)]" />
              <span>Intake: {intake.join(", ")}</span>
            </div>
          )}
        </div>

        {tags && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t, i) => (
              <Badge key={i} variant="neutral" className="text-[11px]">{t}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      {(onView || onShortlist) && (
        <CardFooter className="gap-2 border-t border-[var(--alo-border)] pt-3">
          {onShortlist && (
            <Button
              variant={shortlisted ? "cta" : "outline"}
              size="sm"
              onClick={onShortlist}
            >
              <Icon name={shortlisted ? "BookmarkCheck" : "Bookmark"} className="size-3.5" />
              {shortlisted ? "Saved" : "Save"}
            </Button>
          )}
          {onView && (
            <Button variant="alo" size="sm" onClick={onView} className="ml-auto">
              View
              <Icon name="ArrowRight" className="size-3.5" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   8. ScholarshipCard — scholarship display
   ════════════════════════════════════════════════════════════════════════ */
export interface ScholarshipCardProps {
  name: string;
  provider: string;
  amount: string;
  coverage?: string; // "Full tuition", "50% tuition", etc.
  eligibility?: string;
  deadline?: string;
  level?: string;
  countries?: string[];
  tags?: string[];
  onView?: () => void;
  onApply?: () => void;
  className?: string;
}

export function ScholarshipCard({
  name, provider, amount, coverage, eligibility, deadline, level, countries, tags,
  onView, onApply, className,
}: ScholarshipCardProps) {
  return (
    <Card className={cn("group overflow-hidden rounded-2xl border-[var(--alo-border)] bg-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)] transition-all hover:shadow-[var(--alo-shadow-lg)]", className)}>
      <div className="relative h-20 bg-gradient-to-br from-[var(--alo-orange)] to-[var(--alo-orange-strong)] p-4">
        <Icon name="Award" className="absolute right-3 top-3 size-10 text-white/30" />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Scholarship</p>
          <p className="mt-0.5 text-2xl font-bold text-white">{amount}</p>
        </div>
      </div>
      <CardContent className="pt-4">
        <h3 className="card-title text-[var(--alo-text)] line-clamp-2">{name}</h3>
        <p className="mt-0.5 flex items-center gap-1 body-text text-[var(--alo-muted)]">
          <Icon name="Building2" className="size-3.5" />
          {provider}
        </p>

        <div className="mt-3 space-y-1.5">
          {coverage && (
            <div className="flex items-center gap-2 text-xs">
              <Icon name="Percent" className="size-3.5 text-[var(--alo-success)]" />
              <span className="text-[var(--alo-text-secondary)]">{coverage}</span>
            </div>
          )}
          {level && (
            <div className="flex items-center gap-2 text-xs">
              <Icon name="GraduationCap" className="size-3.5 text-[var(--alo-blue)]" />
              <span className="text-[var(--alo-text-secondary)]">{level}</span>
            </div>
          )}
          {deadline && (
            <div className="flex items-center gap-2 text-xs">
              <Icon name="CalendarClock" className="size-3.5 text-[var(--alo-danger)]" />
              <span className="font-medium text-[var(--alo-danger-strong)]">Deadline: {deadline}</span>
            </div>
          )}
        </div>

        {countries && countries.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1">
            {countries.slice(0, 4).map((c, i) => (
              <Badge key={i} variant="neutral" className="text-[11px]">{c}</Badge>
            ))}
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t, i) => (
              <Badge key={i} variant="blue" className="text-[11px]">{t}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      {(onView || onApply) && (
        <CardFooter className="gap-2 border-t border-[var(--alo-border)] pt-3">
          {onView && <Button variant="ghost" size="sm" onClick={onView}>Details</Button>}
          {onApply && <Button variant="cta" size="sm" onClick={onApply} className="ml-auto">Apply now</Button>}
        </CardFooter>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   9. SocialPostCard — social media post preview
   ════════════════════════════════════════════════════════════════════════ */
export interface SocialPostCardProps {
  platform: "facebook" | "instagram" | "linkedin" | "twitter" | "youtube";
  author: { name: string; avatar?: string; handle?: string };
  content: string;
  media?: string;
  postedAt?: string;
  stats?: { likes?: number; comments?: number; shares?: number };
  status?: "draft" | "scheduled" | "published" | "failed";
  onEdit?: () => void;
  onSchedule?: () => void;
  className?: string;
}

export function SocialPostCard({
  platform, author, content, media, postedAt, stats, status,
  onEdit, onSchedule, className,
}: SocialPostCardProps) {
  const platformMap = {
    facebook: { icon: "Facebook", color: "bg-[#1877F2]" },
    instagram: { icon: "Instagram", color: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045]" },
    linkedin: { icon: "Linkedin", color: "bg-[#0A66C2]" },
    twitter: { icon: "Twitter", color: "bg-[#1DA1F2]" },
    youtube: { icon: "Youtube", color: "bg-[#FF0000]" },
  };
  const p = platformMap[platform];
  const statusMap = {
    draft: { variant: "neutral" as const, label: "Draft" },
    scheduled: { variant: "info" as const, label: "Scheduled" },
    published: { variant: "success" as const, label: "Published" },
    failed: { variant: "danger" as const, label: "Failed" },
  };

  return (
    <Card className={cn("overflow-hidden rounded-2xl border-[var(--alo-border)] bg-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)]", className)}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={cn("flex size-9 items-center justify-center rounded-lg text-white", p.color)}>
              <Icon name={p.icon} className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--alo-text)] truncate">{author.name}</p>
              <p className="text-xs text-[var(--alo-muted)]">
                {author.handle || `@${author.name.toLowerCase().replace(/\s+/g, "_")}`}
                {postedAt && ` · ${postedAt}`}
              </p>
            </div>
          </div>
          {status && <Badge variant={statusMap[status].variant}>{statusMap[status].label}</Badge>}
        </div>

        <p className="mt-3 body-text text-[var(--alo-text)] line-clamp-3">{content}</p>

        {media && (
          <div className="mt-3 overflow-hidden rounded-lg">
            <img src={media} alt="Post media" className="aspect-video w-full object-cover" />
          </div>
        )}

        {stats && (
          <div className="mt-3 flex items-center gap-4 border-t border-[var(--alo-border)] pt-3 text-xs text-[var(--alo-muted)]">
            {stats.likes !== undefined && (
              <span className="flex items-center gap-1">
                <Icon name="Heart" className="size-3.5" />
                {stats.likes}
              </span>
            )}
            {stats.comments !== undefined && (
              <span className="flex items-center gap-1">
                <Icon name="MessageCircle" className="size-3.5" />
                {stats.comments}
              </span>
            )}
            {stats.shares !== undefined && (
              <span className="flex items-center gap-1">
                <Icon name="Share2" className="size-3.5" />
                {stats.shares}
              </span>
            )}
          </div>
        )}
      </CardContent>
      {(onEdit || onSchedule) && (
        <CardFooter className="gap-2 border-t border-[var(--alo-border)] pt-3">
          {onEdit && <Button variant="ghost" size="sm" onClick={onEdit}><Icon name="Pencil" className="size-3.5" />Edit</Button>}
          {onSchedule && <Button variant="alo" size="sm" onClick={onSchedule} className="ml-auto"><Icon name="CalendarClock" className="size-3.5" />Schedule</Button>}
        </CardFooter>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   10. CampaignCard — marketing campaign
   ════════════════════════════════════════════════════════════════════════ */
export interface CampaignCardProps {
  name: string;
  channel: string;
  status: "draft" | "active" | "paused" | "completed" | "scheduled";
  startDate?: string;
  endDate?: string;
  budget?: string;
  spent?: string;
  metrics?: { impressions?: number; clicks?: number; conversions?: number; ctr?: number };
  onView?: () => void;
  onEdit?: () => void;
  className?: string;
}

export function CampaignCard({
  name, channel, status, startDate, endDate, budget, spent, metrics,
  onView, onEdit, className,
}: CampaignCardProps) {
  const statusMap = {
    draft: { variant: "neutral" as const, label: "Draft" },
    active: { variant: "success" as const, label: "Active" },
    paused: { variant: "warning" as const, label: "Paused" },
    completed: { variant: "info" as const, label: "Completed" },
    scheduled: { variant: "blue" as const, label: "Scheduled" },
  };
  const s = statusMap[status];
  const spentPct = budget && spent ? Math.min(100, (parseFloat(spent.replace(/[^0-9.]/g, "")) / parseFloat(budget.replace(/[^0-9.]/g, ""))) * 100) : 0;

  return (
    <Card className={cn("rounded-2xl border-[var(--alo-border)] bg-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)] transition-all hover:shadow-[var(--alo-shadow-md)]", className)}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="card-title text-[var(--alo-text)] line-clamp-1">{name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--alo-muted)]">
              <Icon name="Megaphone" className="size-3.5" />
              {channel}
            </p>
          </div>
          <Badge variant={s.variant}>{s.label}</Badge>
        </div>

        {(startDate || endDate) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--alo-text-secondary)]">
            <Icon name="CalendarRange" className="size-3.5 text-[var(--alo-muted)]" />
            <span>
              {startDate || "—"}
              {endDate && ` → ${endDate}`}
            </span>
          </div>
        )}

        {budget && spent && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--alo-muted)]">Budget: <span className="font-semibold text-[var(--alo-text)]">{budget}</span></span>
              <span className="text-[var(--alo-muted)]">Spent: <span className="font-semibold text-[var(--alo-orange-strong)]">{spent}</span></span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--alo-surface-muted)]">
              <div className="h-full rounded-full bg-alo-gradient-orange" style={{ width: `${spentPct}%` }} />
            </div>
          </div>
        )}

        {metrics && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {metrics.impressions !== undefined && (
              <div><span className="text-[var(--alo-muted)]">Impressions:</span> <span className="font-semibold text-[var(--alo-text)]">{metrics.impressions.toLocaleString()}</span></div>
            )}
            {metrics.clicks !== undefined && (
              <div><span className="text-[var(--alo-muted)]">Clicks:</span> <span className="font-semibold text-[var(--alo-text)]">{metrics.clicks.toLocaleString()}</span></div>
            )}
            {metrics.conversions !== undefined && (
              <div><span className="text-[var(--alo-muted)]">Conversions:</span> <span className="font-semibold text-[var(--alo-success-strong)]">{metrics.conversions}</span></div>
            )}
            {metrics.ctr !== undefined && (
              <div><span className="text-[var(--alo-muted)]">CTR:</span> <span className="font-semibold text-[var(--alo-blue-strong)]">{metrics.ctr}%</span></div>
            )}
          </div>
        )}
      </CardContent>
      {(onView || onEdit) && (
        <CardFooter className="gap-2 border-t border-[var(--alo-border)] pt-3">
          {onView && <Button variant="ghost" size="sm" onClick={onView}><Icon name="BarChart3" className="size-3.5" />Insights</Button>}
          {onEdit && <Button variant="outline" size="sm" onClick={onEdit} className="ml-auto"><Icon name="Pencil" className="size-3.5" />Edit</Button>}
        </CardFooter>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   11. ReviewCard — customer review
   ════════════════════════════════════════════════════════════════════════ */
export interface ReviewCardProps {
  author: { name: string; avatar?: string; role?: string };
  rating: number; // 1-5
  title?: string;
  content: string;
  date?: string;
  source?: "google" | "facebook" | "internal";
  verified?: boolean;
  onReply?: () => void;
  className?: string;
}

export function ReviewCard({
  author, rating, title, content, date, source, verified, onReply, className,
}: ReviewCardProps) {
  const sourceMap = {
    google: { icon: "Star", label: "Google" },
    facebook: { icon: "Facebook", label: "Facebook" },
    internal: { icon: "MessageSquare", label: "Internal" },
  };
  const src = source ? sourceMap[source] : null;

  return (
    <Card className={cn("rounded-2xl border-[var(--alo-border)] bg-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)]", className)}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={author.avatar} />
              <AvatarFallback className="bg-alo-gradient text-sm font-semibold text-white">
                {author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-[var(--alo-text)]">{author.name}</p>
                {verified && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-[var(--alo-success-soft)] text-[var(--alo-success)]" title="Verified">
                    <Icon name="BadgeCheck" className="size-3.5" />
                  </span>
                )}
              </div>
              {author.role && <p className="text-xs text-[var(--alo-muted)]">{author.role}</p>}
            </div>
          </div>
          {src && (
            <Badge variant="neutral" className="gap-1 text-[11px]">
              <Icon name={src.icon} className="size-3" />
              {src.label}
            </Badge>
          )}
        </div>

        <div className="mt-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Icon
              key={star}
              name="Star"
              className={cn(
                "size-4",
                star <= rating ? "fill-[var(--alo-sunshine)] text-[var(--alo-sunshine)]" : "text-[var(--alo-border-strong)]"
              )}
            />
          ))}
          {date && <span className="ml-2 text-xs text-[var(--alo-muted)]">{date}</span>}
        </div>

        {title && <h4 className="mt-2 text-sm font-semibold text-[var(--alo-text)]">{title}</h4>}
        <p className="mt-1 body-text text-[var(--alo-text-secondary)] line-clamp-4">{content}</p>
      </CardContent>
      {onReply && (
        <CardFooter className="border-t border-[var(--alo-border)] pt-3">
          <Button variant="ghost" size="sm" onClick={onReply} className="ml-auto">
            <Icon name="MessageCircle" className="size-3.5" />
            Reply
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   12. AuditCard — audit log entry
   ════════════════════════════════════════════════════════════════════════ */
export interface AuditCardProps {
  actor: { name: string; avatar?: string; role?: string };
  action: string;
  entity?: string;
  entityId?: string;
  timestamp: string | Date;
  severity?: "info" | "warning" | "critical";
  changes?: { field: string; from: string; to: string }[];
  ip?: string;
  className?: string;
}

export function AuditCard({
  actor, action, entity, entityId, timestamp, severity = "info", changes, ip, className,
}: AuditCardProps) {
  const sevMap = {
    info: { variant: "info" as const, icon: "Info" },
    warning: { variant: "warning" as const, icon: "AlertTriangle" },
    critical: { variant: "danger" as const, icon: "AlertOctagon" },
  };
  const sev = sevMap[severity];
  const ts = typeof timestamp === "string" ? timestamp : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));

  return (
    <Card className={cn("rounded-xl border-l-4 bg-[var(--alo-surface)] shadow-[var(--alo-shadow-xs)]", className)}>
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={actor.avatar} />
            <AvatarFallback className="bg-[var(--alo-surface-muted)] text-xs font-semibold text-[var(--alo-text-secondary)]">
              {actor.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold text-[var(--alo-text)]">{actor.name}</span>
              {actor.role && <span className="text-xs text-[var(--alo-muted)]">({actor.role})</span>}
              <span className="text-sm text-[var(--alo-text-secondary)]">{action}</span>
              {entity && <Badge variant="neutral" className="text-[11px]">{entity}{entityId ? `#${entityId.slice(-6)}` : ""}</Badge>}
              <Badge variant={sev.variant} className="gap-0.5 text-[11px]">
                <Icon name={sev.icon} className="size-2.5" />
                {severity}
              </Badge>
            </div>
            {changes && changes.length > 0 && (
              <div className="mt-2 space-y-1 rounded-lg bg-[var(--alo-surface-muted)] p-2">
                {changes.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-[var(--alo-blue-strong)]">{c.field}:</span>
                    <span className="text-[var(--alo-muted)] line-through">{c.from}</span>
                    <Icon name="ArrowRight" className="size-3 text-[var(--alo-muted)]" />
                    <span className="font-medium text-[var(--alo-success-strong)]">{c.to}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-1.5 flex items-center gap-3 text-xs text-[var(--alo-muted)]">
              <span>{ts}</span>
              {ip && <span className="flex items-center gap-1"><Icon name="Globe" className="size-3" />{ip}</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
