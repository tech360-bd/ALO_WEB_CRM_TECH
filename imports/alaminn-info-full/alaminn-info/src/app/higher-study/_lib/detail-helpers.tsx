/**
 * Shared helpers for Higher Study detail pages.
 *
 * Pure server-side utilities + small presentational React components
 * (no hooks). Used by every detail page (university / course /
 * scholarship / research / supervisor / resource / subject / intake)
 * to keep the page files focused on entity-specific content.
 *
 * Conventions:
 *  - JSON columns are parsed with `safeParseJsonArray` / `safeParseJsonObject`
 *    so malformed data never throws.
 *  - Currency uses `Intl.NumberFormat` with the stored currency code.
 *  - Dates use `date-fns` `format` for consistent locale + format.
 *  - The sticky sidebar layout follows a 12-col grid (1fr main, 320px sidebar)
 *    on desktop and stacks on mobile.
 */
import Link from "next/link";
import { format, formatDistanceToNow, isValid } from "date-fns";
import {
  Calendar,
  Clock,
  ExternalLink,
  type LucideIcon,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  VerificationBadge,
} from "@/components/higher-study/verification-badge";
import type {
  BreadcrumbItem,
} from "@/components/higher-study/breadcrumb";
import type { VerificationStatus } from "@/lib/higher-study/types";

// ─── JSON parsers (silent on malformed data) ────────────────────────

/**
 * Parse a JSON column that's expected to be an array. Returns `[]`
 * if the value is missing, not an array, or fails to parse.
 */
export function safeParseJsonArray<T = unknown>(raw?: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * Parse a JSON column that's expected to be an object. Returns `{}`
 * if the value is missing or invalid.
 */
export function safeParseJsonObject<T = Record<string, unknown>>(
  raw?: string | null,
): T {
  if (!raw) return {} as T;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as T)
      : ({} as T);
  } catch {
    return {} as T;
  }
}

/**
 * Parse a comma-separated string field (e.g. `eligibleStudyLevels`,
 * `researchInterests`) into a clean string[] of trimmed values.
 */
export function parseCommaList(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── Formatters ──────────────────────────────────────────────────────

/**
 * Format a numeric tuition fee with the given currency code.
 * Falls back to `<currency> <number>` if Intl fails.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string,
): string | null {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || "USD"} ${amount.toLocaleString()}`;
  }
}

/**
 * Format a date with `date-fns`. Returns `null` for missing/invalid.
 */
export function formatDate(
  date: Date | string | null | undefined,
  pattern = "d MMM yyyy",
): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return null;
  return format(d, pattern);
}

/**
 * Format a date as a relative distance ("in 12 days", "3 days ago").
 * Returns `null` for missing/invalid dates.
 */
export function formatRelative(
  date: Date | string | null | undefined,
): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return null;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Return the number of days from today to a deadline. Negative or
 * missing deadlines return `null` (so the UI can hide the countdown).
 */
export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return null;
  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

/**
 * Build a "CountdownBadge" descriptor: returns `{ label, urgent }`
 * for a deadline. `urgent=true` when ≤30 days away.
 */
export function deadlineCountdown(
  date: Date | string | null | undefined,
): { label: string; urgent: boolean; days: number } | null {
  const days = daysUntil(date);
  if (days === null) return null;
  if (days === 0) return { label: "Closes today!", urgent: true, days };
  if (days === 1) return { label: "1 day left", urgent: true, days };
  if (days <= 30) return { label: `${days} days left`, urgent: true, days };
  return { label: `${days} days left`, urgent: false, days };
}

// ─── Small presentational primitives ────────────────────────────────

export interface DetailShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Page wrapper used by every detail page. Pads the main column and
 * constrains the max width. The sticky sidebar is composed inside.
 */
export function DetailShell({ children, className }: DetailShellProps) {
  return (
    <div className={cn("mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12", className)}>
      {children}
    </div>
  );
}

export interface DetailLayoutProps {
  /** Main content column. */
  children: React.ReactNode;
  /** Sticky sidebar (Apply / Save / Compare / Consultation). */
  sidebar: React.ReactNode;
  className?: string;
}

/**
 * Two-column detail layout: main (1fr) + sticky sidebar (320px).
 * Stacks to single column on mobile (sidebar appears below main).
 */
export function DetailLayout({ children, sidebar, className }: DetailLayoutProps) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1fr_320px]", className)}>
      <div className="min-w-0 space-y-6">{children}</div>
      <aside className="lg:relative">
        <div className="lg:sticky lg:top-[148px] space-y-3">
          {sidebar}
        </div>
      </aside>
    </div>
  );
}

export interface SectionTitleProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Section heading for detail pages. Renders an icon chip + title +
 * optional description + optional action.
 */
export function SectionTitle({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: SectionTitleProps) {
  return (
    <header className={cn("flex items-start justify-between gap-3", className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink-900">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-ink-600">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}

export interface DetailCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Card used to group related content on detail pages. Has an optional
 * header (icon + title + description + actions) and a body.
 */
export function DetailCard({
  title,
  description,
  icon,
  actions,
  children,
  className,
}: DetailCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-ink-200 bg-white p-5 shadow-soft sm:p-6",
        className,
      )}
    >
      {(title || actions) && (
        <SectionTitle
          title={title ?? ""}
          description={description}
          icon={icon}
          actions={actions}
          className="mb-4"
        />
      )}
      {children}
    </section>
  );
}

/**
 * Render a list of paragraphs from a long text field (splits on
 * double-newlines). Used for fields like `overview` that may have
 * paragraph breaks but no other markdown.
 */
export function ProseParagraphs({
  content,
  className,
}: {
  content?: string | null;
  className?: string;
}) {
  if (!content) return null;
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;
  return (
    <div className={cn("space-y-3 text-sm leading-relaxed text-ink-700 sm:text-base", className)}>
      {paragraphs.map((p, idx) => (
        <p key={idx}>{p}</p>
      ))}
    </div>
  );
}

export interface MetaItemProps {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
}

/**
 * Single meta cell: small label + value, often with an icon. Used
 * for compact display of `duration`, `study mode`, `tuition`, etc.
 */
export function MetaItem({ icon: Icon, label, value }: MetaItemProps) {
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">
        {Icon && <Icon className="h-3 w-3 text-ink-400" aria-hidden="true" />}
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium text-ink-800">{value}</div>
    </div>
  );
}

export interface MetaGridProps {
  items: MetaItemProps[];
  className?: string;
}

/**
 * Grid of MetaItem cells (2 columns on mobile, 3+ on desktop).
 */
export function MetaGrid({ items, className }: MetaGridProps) {
  if (items.length === 0) return null;
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
      {items.map((item, idx) => (
        <MetaItem key={`${item.label}-${idx}`} {...item} />
      ))}
    </div>
  );
}

export interface ChipListProps {
  items: string[];
  variant?: "blue" | "orange" | "emerald" | "amber" | "purple";
  className?: string;
}

const CHIP_VARIANTS: Record<NonNullable<ChipListProps["variant"]>, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  purple: "bg-purple-50 text-purple-700 ring-purple-200",
};

/**
 * Render a list of chips (for research interests, eligible study
 * levels, etc.).
 */
export function ChipList({ items, variant = "blue", className }: ChipListProps) {
  if (items.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((item, idx) => (
        <span
          key={`${item}-${idx}`}
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1",
            CHIP_VARIANTS[variant],
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export interface ChecklistProps {
  items: string[];
  /** When true, render as a checklist with empty circles. */
  variant?: "bullet" | "check";
  className?: string;
}

/**
 * Render a list of strings as a styled bullet/check list. Used for
 * `requiredDocuments`, `applicationProcess`, etc.
 */
export function Checklist({ items, variant = "bullet", className }: ChecklistProps) {
  if (items.length === 0) return null;
  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 text-sm text-ink-700">
          {variant === "check" ? (
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
              aria-hidden="true"
            />
          ) : (
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
              aria-hidden="true"
            />
          )}
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  /** When true, value is rendered as a boolean Yes/No badge. */
  boolean?: boolean;
}

/**
 * Single labelled row (label left, value right). Used inside
 * "requirements" tables and detail sidebars.
 */
export function InfoRow({ label, value, boolean }: InfoRowProps) {
  let display: React.ReactNode = value;
  if (boolean) {
    const v = Boolean(value);
    display = (
      <Badge
        variant="outline"
        className={cn(
          "text-[11px] font-semibold",
          v
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-ink-200 bg-ink-50 text-ink-600",
        )}
      >
        {v ? "Yes" : "No"}
      </Badge>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink-100 py-2 last:border-b-0">
      <span className="text-xs font-medium text-ink-500">{label}</span>
      <span className="text-sm font-medium text-ink-900 text-right">{display}</span>
    </div>
  );
}

// ─── Sidebar primitives ──────────────────────────────────────────────

export interface SidebarCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Small card used to group sidebar content (e.g. "Quick actions",
 * "Key facts", "Verification").
 */
export function SidebarCard({ title, children, className }: SidebarCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-200 bg-white p-4 shadow-soft",
        className,
      )}
    >
      {title && (
        <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-ink-500">
          {title}
        </h3>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export interface SidebarActionLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  external?: boolean;
}

/**
 * Sidebar action rendered as a link button (used for "Check Eligibility",
 * "Book Consultation", "View courses at this university", etc.).
 */
export function SidebarActionLink({
  href,
  icon: Icon,
  label,
  description,
  external,
}: SidebarActionLinkProps) {
  return (
    <Button
      asChild
      variant="outline"
      className="h-auto w-full justify-start gap-2.5 rounded-xl border-ink-200 px-3 py-2.5 text-left"
    >
      <Link
        href={href}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        <Icon className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink-900">{label}</span>
          {description && (
            <span className="block text-[11px] leading-snug text-ink-500">
              {description}
            </span>
          )}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
      </Link>
    </Button>
  );
}

// ─── Verification footer block ───────────────────────────────────────

export interface VerificationFooterProps {
  status: VerificationStatus;
  lastVerifiedAt?: Date | string | null;
  sourceUrl?: string | null;
  lastVerifiedBy?: string | null;
}

/**
 * Footer card showing the verification badge, last-verified date and
 * a link to the official source. Used at the bottom of every detail
 * page so visitors can verify the source of the information.
 */
export function VerificationFooter({
  status,
  lastVerifiedAt,
  sourceUrl,
  lastVerifiedBy,
}: VerificationFooterProps) {
  const dateStr = formatDate(lastVerifiedAt, "d MMM yyyy");
  return (
    <section
      aria-label="Verification"
      className="rounded-2xl border border-ink-200 bg-gradient-to-br from-blue-50/60 to-orange-50/60 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <VerificationBadge
            status={status}
            lastVerifiedAt={lastVerifiedAt}
            sourceUrl={sourceUrl}
            showSource
          />
          <div className="text-xs text-ink-600">
            <div className="font-semibold text-ink-800">
              Last verified {dateStr ?? "—"}
            </div>
            {lastVerifiedBy && (
              <div className="text-ink-500">by {lastVerifiedBy}</div>
            )}
          </div>
        </div>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
          >
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            View official source
          </a>
        )}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
        Alaminn.info Higher Study data is editorially verified. Programmes,
        fees and requirements may change — always confirm details with the
        official source before applying.
      </p>
    </section>
  );
}

// ─── Related entities grid ───────────────────────────────────────────

export interface RelatedSectionProps {
  title: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Section showing related entities (e.g. "Related universities",
 * "Other courses in this subject"). Renders a header with an optional
 * "View all" link and a responsive grid of cards.
 */
export function RelatedSection({
  title,
  description,
  viewAllHref,
  viewAllLabel = "View all",
  children,
  className,
}: RelatedSectionProps) {
  return (
    <section className={cn("", className)}>
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold text-ink-900">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-ink-600">{description}</p>
          )}
        </div>
        {viewAllHref && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
          >
            <Link href={viewAllHref}>
              {viewAllLabel}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </header>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

// ─── Hero header for detail pages ────────────────────────────────────

export interface DetailHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  badges?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: "default" | "warm" | "split";
  className?: string;
}

/**
 * Hero header for a detail page. Renders an eyebrow, title, optional
 * description, optional badge row and optional meta row (e.g. country +
 * city + established year + type).
 */
export function DetailHero({
  eyebrow,
  title,
  description,
  badges,
  meta,
  actions,
  variant = "default",
  className,
}: DetailHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        variant === "default" && "bg-gradient-to-br from-blue-50 via-white to-orange-50",
        variant === "warm" && "bg-gradient-to-br from-orange-50 via-white to-blue-50",
        variant === "split" && "grad-intelligence text-white",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        {eyebrow && (
          <div
            className={cn(
              "eyebrow",
              variant === "split" ? "text-white/80" : "text-blue-600",
            )}
          >
            {eyebrow}
          </div>
        )}
        <h1
          className={cn(
            "mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl",
            variant === "split" ? "text-white" : "text-ink-900",
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "mt-3 max-w-3xl text-sm leading-relaxed sm:text-base",
              variant === "split" ? "text-white/90" : "text-ink-600",
            )}
          >
            {description}
          </p>
        )}
        {badges && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">{badges}</div>
        )}
        {meta && (
          <div
            className={cn(
              "mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs",
              variant === "split" ? "text-white/80" : "text-ink-600",
            )}
          >
            {meta}
          </div>
        )}
        {actions && <div className="mt-5 flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </section>
  );
}

// ─── Hero meta helpers ───────────────────────────────────────────────

export function HeroMetaItem({
  icon: Icon,
  children,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}

// ─── Quick badge presets ─────────────────────────────────────────────

export function FeaturedBadge() {
  return (
    <Badge className="gap-1 bg-orange-600 text-[10px] font-bold uppercase tracking-wider text-white shadow-orange">
      Featured
    </Badge>
  );
}

export function DeadlineBadge({
  date,
  label = "Deadline",
}: {
  date: Date | string | null | undefined;
  label?: string;
}) {
  const countdown = deadlineCountdown(date);
  const dateStr = formatDate(date, "d MMM yyyy");
  if (!dateStr) return null;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        countdown?.urgent
          ? "border-orange-200 bg-orange-50 text-orange-700"
          : "border-ink-200 bg-ink-50 text-ink-700",
      )}
    >
      <Calendar className="h-3 w-3" aria-hidden="true" />
      <span>
        {label}: {dateStr}
      </span>
      {countdown && (
        <span
          className={cn(
            "ml-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            countdown.urgent ? "bg-orange-600 text-white" : "bg-emerald-100 text-emerald-700",
          )}
        >
          <Clock className="h-2.5 w-2.5" aria-hidden="true" />
          {countdown.label}
        </span>
      )}
    </div>
  );
}

// ─── Breadcrumb helpers ──────────────────────────────────────────────

/**
 * Build the breadcrumb items for a Higher Study detail page, prepending
 * "Home" + "Higher Study" automatically (the HigherStudyBreadcrumb
 * component does this for us). The page passes only the entity-specific
 * items.
 */
export function detailBreadcrumbs(
  ...items: BreadcrumbItem[]
): BreadcrumbItem[] {
  return items;
}

// ─── JSON-LD script tag ──────────────────────────────────────────────

/**
 * Render a `<script type="application/ld+json">` tag with the given
 * JSON-LD object (or array of objects, wrapped in a @graph).
 */
export function JsonLdScript({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  const html = Array.isArray(data)
    ? data.length === 1
      ? JSON.stringify(data[0])
      : JSON.stringify({ "@context": "https://schema.org", "@graph": data })
    : JSON.stringify(data);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Empty data card ─────────────────────────────────────────────────

export function EmptyDataNote({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-6 text-center text-xs text-ink-500",
        className,
      )}
    >
      {label}
    </p>
  );
}
