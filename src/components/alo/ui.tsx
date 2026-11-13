"use client";

/**
 * ALO Education Design System — Primitives & Display Components
 * ============================================================
 * A unified component language used across every dashboard and surface.
 *
 * References (principles only, not clones):
 *   Linear (clarity), Stripe (color hierarchy), Notion (flexible cards),
 *   HubSpot (status badges), Salesforce (density), Asana (warmth),
 *   Monday (organization), Intercom (AI surfaces), Slack (channels),
 *   Zoho (forms), Dynamics (workspaces).
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { NamedIcon } from "@/components/ui/named-icon";
import { format, type Locale } from "date-fns";

/** Re-exported from the single canonical resolver (Master §10). */
export function Icon({ name, className }: { name: string; className?: string }) {
  return <NamedIcon name={name} className={className} />;
}

/* ─── Accent color tokens (shared) ─── */
export type AccentColor =
  | "blue"
  | "orange"
  | "emerald"
  | "amber"
  | "violet"
  | "rose"
  | "sky"
  | "slate";

export const ACCENT_CLASSES: Record<AccentColor, { bg: string; text: string; border: string; dot: string }> = {
  blue:    { bg: "bg-[var(--alo-blue-soft)]",    text: "text-[var(--alo-blue-strong)]",    border: "border-[var(--alo-blue)]",    dot: "bg-[var(--alo-blue)]" },
  orange:  { bg: "bg-[var(--alo-orange-soft)]",  text: "text-[var(--alo-orange-strong)]", border: "border-[var(--alo-orange)]",  dot: "bg-[var(--alo-orange)]" },
  emerald: { bg: "bg-[var(--alo-success-soft)]", text: "text-[var(--alo-success-strong)]",border: "border-[var(--alo-success)]", dot: "bg-[var(--alo-success)]" },
  amber:   { bg: "bg-[var(--alo-warning-soft)]", text: "text-[var(--alo-warning-strong)]",border: "border-[var(--alo-warning)]", dot: "bg-[var(--alo-warning)]" },
  violet:  { bg: "bg-[var(--alo-brand-pale)]",                 text: "text-[var(--alo-brand)]",                  border: "border-[var(--alo-border)]",            dot: "bg-[var(--alo-brand-pale)]0" },
  rose:    { bg: "bg-[var(--alo-danger-soft)]",  text: "text-[var(--alo-danger-strong)]", border: "border-[var(--alo-danger)]",  dot: "bg-[var(--alo-danger)]" },
  sky:     { bg: "bg-[var(--alo-info-soft)]",    text: "text-[var(--alo-info-strong)]",   border: "border-[var(--alo-info)]",    dot: "bg-[var(--alo-info)]" },
  slate:   { bg: "bg-[var(--alo-surface-muted)]",text: "text-[var(--alo-text-secondary)]",border: "border-[var(--alo-border)]",  dot: "bg-[var(--alo-muted)]" },
};

/* ════════════════════════════════════════════════════════════════════════
   1. IconButton
   ════════════════════════════════════════════════════════════════════════ */
export interface IconButtonProps extends Omit<React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>, "size"> {
  icon: string;
  size?: "sm" | "default" | "lg";
  label: string; // accessible label, also used as tooltip
}

export function IconButton({ icon, label, size = "default", variant = "ghost", className, ...props }: IconButtonProps) {
  const sz = size === "sm" ? "icon-sm" : size === "lg" ? "icon-lg" : "icon";
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
            variant={variant}
            size={sz as any}
            aria-label={label}
            className={cn("size-8", className)}
            {...props}
          >
            <Icon name={icon} className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   2. SearchInput
   ════════════════════════════════════════════════════════════════════════ */
export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  onClear?: () => void;
  size?: "sm" | "default" | "lg";
}

export function SearchInput({ className, onClear, size = "default", value, ...props }: SearchInputProps) {
  const h = size === "sm" ? "h-8" : size === "lg" ? "h-11" : "h-9";
  return (
    <div className={cn("relative flex items-center", h, className)}>
      <Icon name="Search" className="pointer-events-none absolute left-3 size-4 text-[var(--alo-muted)]" />
      <Input
        type="search"
        value={value}
        className={cn("pl-9 pr-9", h)}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-2.5 flex size-5 items-center justify-center rounded-full text-[var(--alo-muted)] hover:bg-[var(--alo-surface-muted)] hover:text-[var(--alo-text)]"
        >
          <Icon name="X" className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   3. MultiSelect — lightweight badge-based multi-select
   ════════════════════════════════════════════════════════════════════════ */
export interface MultiSelectOption {
  label: string;
  value: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  maxBadges?: number;
}

export function MultiSelect({ options, value, onChange, placeholder = "Select...", className, maxBadges = 3 }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  const selected = options.filter((o) => value.includes(o.value));
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface)] px-3 py-2 text-sm shadow-[var(--alo-shadow-xs)] hover:border-[var(--alo-border-strong)] focus:border-[var(--alo-blue)] focus:outline-none focus:ring-[3px] focus:ring-[var(--alo-blue)]/20",
            className
          )}
        >
          <span className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
            {selected.length === 0 ? (
              <span className="text-[var(--alo-muted)]">{placeholder}</span>
            ) : (
              <>
                {selected.slice(0, maxBadges).map((s) => (
                  <Badge key={s.value} variant="blue" className="gap-1">
                    {s.label}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); toggle(s.value); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggle(s.value); } }}
                      className="ml-0.5 rounded-full hover:bg-[var(--alo-blue)]/20"
                    >
                      <Icon name="X" className="size-2.5" />
                    </span>
                  </Badge>
                ))}
                {selected.length > maxBadges && (
                  <Badge variant="neutral">+{selected.length - maxBadges}</Badge>
                )}
              </>
            )}
          </span>
          <Icon name="ChevronsUpDown" className="size-3.5 shrink-0 text-[var(--alo-muted)]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[14rem] p-0" align="start">
        <div className="border-b border-[var(--alo-border)] p-2">
          <SearchInput
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery("")}
            size="sm"
          />
        </div>
        <ScrollArea className="max-h-60">
          <div className="p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-[var(--alo-muted)]">No options found</p>
            ) : (
              filtered.map((o) => {
                const checked = value.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggle(o.value)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-[var(--alo-surface-muted)]",
                      checked && "bg-[var(--alo-blue-soft)]"
                    )}
                  >
                    <span className={cn(
                      "flex size-4 items-center justify-center rounded border",
                      checked ? "border-[var(--alo-blue)] bg-[var(--alo-blue)] text-white" : "border-[var(--alo-border-strong)]"
                    )}>
                      {checked && <Icon name="Check" className="size-3" />}
                    </span>
                    <span className="flex-1 text-left text-[var(--alo-text)]">{o.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   4. DatePicker — Calendar + Popover wrapper
   ════════════════════════════════════════════════════════════════════════ */
export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  locale?: Locale;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", className, disabled, locale }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const formatted = value ? format(value, "PPP", { locale }) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface)] px-3 py-2 text-left text-sm shadow-[var(--alo-shadow-xs)] hover:border-[var(--alo-border-strong)] focus:border-[var(--alo-blue)] focus:outline-none focus:ring-[3px] focus:ring-[var(--alo-blue)]/20 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <Icon name="Calendar" className="size-4 text-[var(--alo-muted)]" />
          <span className={cn("flex-1 truncate", !formatted && "text-[var(--alo-muted)]")}>
            {formatted || placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => { onChange?.(d); setOpen(false); }}
          initialFocus
          locale={locale}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   5. FileUploader — drag & drop
   ════════════════════════════════════════════════════════════════════════ */
export interface FileUploaderProps {
  onFiles?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  className?: string;
  hint?: string;
}

export function FileUploader({ onFiles, accept, multiple = true, maxSizeMB = 10, className, hint }: FileUploaderProps) {
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.size <= maxSizeMB * 1024 * 1024);
    onFiles?.(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        drag
          ? "border-[var(--alo-blue)] bg-[var(--alo-blue-soft)]"
          : "border-[var(--alo-border-strong)] bg-[var(--alo-surface-muted)] hover:border-[var(--alo-blue)] hover:bg-[var(--alo-blue-soft)]",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--alo-blue-soft)] text-[var(--alo-blue)]">
        <Icon name="Upload" className="size-6" />
      </div>
      <p className="mt-3 text-sm font-medium text-[var(--alo-text)]">
        {drag ? "Drop files here" : "Drag & drop or click to upload"}
      </p>
      {hint && <p className="mt-1 text-xs text-[var(--alo-muted)]">{hint}</p>}
      <p className="mt-1 text-xs text-[var(--alo-muted)]">Max {maxSizeMB}MB per file</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   6. RichTextEditor — lightweight contentEditable (no heavy deps)
   ════════════════════════════════════════════════════════════════════════ */
export interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder = "Write something...", className, minHeight = 160 }: RichTextEditorProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (ref.current) onChange?.(ref.current.innerHTML);
  };

  const tools = [
    { cmd: "bold", icon: "Bold", label: "Bold" },
    { cmd: "italic", icon: "Italic", label: "Italic" },
    { cmd: "underline", icon: "Underline", label: "Underline" },
    { cmd: "insertUnorderedList", icon: "List", label: "Bullet list" },
    { cmd: "insertOrderedList", icon: "ListOrdered", label: "Numbered list" },
    { cmd: "formatBlock", val: "h2", icon: "Heading2", label: "Heading" },
    { cmd: "formatBlock", val: "blockquote", icon: "Quote", label: "Quote" },
    { cmd: "createLink", icon: "Link", label: "Insert link" },
  ];

  return (
    <div className={cn("overflow-hidden rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface)]", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-1">
        {tools.map((t) => (
          <button 
            key={t.label}
            type="button"
            title={t.label}
            onMouseDown={(e) => {
              e.preventDefault();
              if (t.cmd === "createLink") {
                const url = prompt("Enter URL:");
                if (url) exec(t.cmd, url);
              } else {
                exec(t.cmd, t.val);
              }
            }}
            className="flex size-8 items-center justify-center rounded-md text-[var(--alo-text-secondary)] hover:bg-[var(--alo-surface)] hover:text-[var(--alo-text)]"
          >
            <Icon name={t.icon} className="size-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange?.((e.target as HTMLDivElement).innerHTML)}
        data-placeholder={placeholder}
        className="alo-rich-text px-3 py-2 text-sm outline-none"
        style={{ minHeight }}
      />
      <style>{`
        .alo-rich-text:empty:before {
          content: attr(data-placeholder);
          color: var(--alo-muted);
          pointer-events: none;
        }
        .alo-rich-text h2 { font-size: 1.25rem; font-weight: 600; margin: 0.5rem 0; }
        .alo-rich-text blockquote { border-left: 3px solid var(--alo-blue); padding-left: 0.75rem; color: var(--alo-text-secondary); margin: 0.5rem 0; }
        .alo-rich-text ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .alo-rich-text ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .alo-rich-text a { color: var(--alo-blue); text-decoration: underline; }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   7. KpiCard — enhanced metric card with trend & sparkline
   ════════════════════════════════════════════════════════════════════════ */
export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  icon: string;
  accent?: AccentColor;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  sparkline?: number[];
  action?: React.ReactNode;
}

export function KpiCard({ label, value, icon, accent = "blue", hint, trend, sparkline, action }: KpiCardProps) {
  const a = ACCENT_CLASSES[accent];
  const maxSpark = sparkline ? Math.max(...sparkline) : 1;

  return (
    <Card className="rounded-2xl border-[var(--alo-border)] bg-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)] transition-all hover:shadow-[var(--alo-shadow-lg)]">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="caption-text">{label}</p>
            <p className="mt-1.5 text-2xl font-bold text-[var(--alo-text)] tabular-nums">{value}</p>
            {hint && <p className="mt-1 body-text text-[var(--alo-muted)]">{hint}</p>}
          </div>
          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", a.bg, a.text)}>
            <Icon name={icon} className="size-5" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1.5 body-text">
            <Icon
              name={trend.direction === "up" ? "TrendingUp" : trend.direction === "down" ? "TrendingDown" : "Minus"}
              className={cn(
                "size-3.5",
                trend.direction === "up" && "text-[var(--alo-success)]",
                trend.direction === "down" && "text-[var(--alo-danger)]",
                trend.direction === "flat" && "text-[var(--alo-muted)]"
              )}
            />
            <span className={cn(
              "font-medium",
              trend.direction === "up" && "text-[var(--alo-success-strong)]",
              trend.direction === "down" && "text-[var(--alo-danger-strong)]",
              trend.direction === "flat" && "text-[var(--alo-muted)]"
            )}>
              {trend.value}
            </span>
          </div>
        )}
        {sparkline && sparkline.length > 1 && (
          <div className="mt-3 flex h-8 items-end gap-0.5">
            {sparkline.map((v, i) => (
              <div
                key={i}
                className={cn("flex-1 rounded-sm", a.dot)}
                style={{ height: `${(v / maxSpark) * 100}%`, opacity: 0.4 + (i / sparkline.length) * 0.6 }}
              />
            ))}
          </div>
        )}
        {action && <div className="mt-3">{action}</div>}
      </CardContent>
    </Card>
  );
}

/* ─── Legacy StatCard (alias, kept for backward compat) ─── */
export function StatCard({ label, value, icon, accent = "blue", hint, trend }: KpiCardProps) {
  return <KpiCard label={label} value={value} icon={icon} accent={accent} hint={hint} trend={trend ? { ...trend, value: trend.value } : undefined} />;
}

/* ════════════════════════════════════════════════════════════════════════
   8. StatusBadge — semantic status pill
   ════════════════════════════════════════════════════════════════════════ */
export function StatusBadge({
  status,
  colorMap,
  labels,
}: {
  status: string;
  colorMap?: Record<string, AccentColor>;
  labels?: Record<string, string>;
}) {
  const accent = colorMap?.[status] || "slate";
  const label = labels?.[status] || status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const a = ACCENT_CLASSES[accent];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize", a.bg, a.text, a.border)}>
      <span className={cn("size-1.5 rounded-full", a.dot)} />
      {label}
    </span>
  );
}

/* ─── SemanticBadge (typed variant) ─── */
export function SemanticBadge({ type, children }: { type: "success" | "warning" | "danger" | "info" | "blue" | "orange"; children: React.ReactNode }) {
  const map: Record<string, AccentColor> = {
    success: "emerald", warning: "amber", danger: "rose",
    info: "sky", blue: "blue", orange: "orange",
  };
  const a = ACCENT_CLASSES[map[type]];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", a.bg, a.text, a.border)}>
      {children}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   9. SectionCard
   ════════════════════════════════════════════════════════════════════════ */
export function SectionCard({
  title,
  description,
  icon,
  action,
  className,
  accent = "blue",
  children,
}: {
  title?: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
  accent?: AccentColor;
  children: React.ReactNode;
}) {
  const a = ACCENT_CLASSES[accent];
  return (
    <Card className={cn("rounded-2xl border-[var(--alo-border)] bg-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)]", className)}>
      {(title || action) && (
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className={cn("flex size-8 items-center justify-center rounded-lg", a.bg, a.text)}>
                <Icon name={icon} className="size-4" />
              </div>
            )}
            <div>
              {title && <CardTitle className="crm-section-title text-[var(--alo-text)]">{title}</CardTitle>}
              {description && <CardDescription className="body-text text-[var(--alo-muted)]">{description}</CardDescription>}
            </div>
          </div>
          {action}
        </CardHeader>
      )}
      <CardContent className={cn(!title && "pt-6")}>{children}</CardContent>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   10. EmptyState
   ════════════════════════════════════════════════════════════════════════ */
export function EmptyState({
  icon = "Inbox",
  title,
  description,
  action,
  accent = "blue",
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  accent?: AccentColor;
}) {
  const a = ACCENT_CLASSES[accent];
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--alo-border-strong)] bg-[var(--alo-surface)] px-6 py-12 text-center">
      <div className={cn("flex size-14 items-center justify-center rounded-2xl", a.bg, a.text)}>
        <Icon name={icon} className="size-7" />
      </div>
      <p className="mt-4 card-title text-[var(--alo-text)]">{title}</p>
      {description && <p className="mt-1 max-w-sm body-text text-[var(--alo-muted)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   11. ErrorState
   ════════════════════════════════════════════════════════════════════════ */
export function ErrorState({
  title = "Something went wrong",
  description,
  error,
  onRetry,
  action,
}: {
  title?: string;
  description?: string;
  error?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--alo-danger)]/20 bg-[var(--alo-danger-soft)]/40 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--alo-danger-soft)] text-[var(--alo-danger)]">
        <Icon name="AlertTriangle" className="size-7" />
      </div>
      <p className="mt-4 card-title text-[var(--alo-text)]">{title}</p>
      {description && <p className="mt-1 max-w-sm body-text text-[var(--alo-text-secondary)]">{description}</p>}
      {error && (
        <pre className="mt-3 max-w-md overflow-x-auto rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface)] p-3 text-left text-xs text-[var(--alo-danger-strong)]">
          {error}
        </pre>
      )}
      <div className="mt-4 flex items-center gap-2">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <Icon name="RotateCw" className="size-3.5" /> Try again
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   12. LoadingGrid & Skeleton helpers
   ════════════════════════════════════════════════════════════════════════ */
export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="rounded-2xl border-[var(--alo-border)] bg-[var(--alo-surface)]">
          <CardContent className="pt-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LoadingSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === 0 ? "w-1/2" : i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   13. InfoRow
   ════════════════════════════════════════════════════════════════════════ */
export function InfoRow({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--alo-border)] py-2 last:border-0">
      <span className="body-text font-medium text-[var(--alo-muted)]">{label}</span>
      <span className={cn("text-right body-text font-medium text-[var(--alo-text)]", mono && "font-mono")}>
        {value || "—"}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   14. CompletionRing
   ════════════════════════════════════════════════════════════════════════ */
export function CompletionRing({ value, size = 64, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 80 ? "var(--alo-success)" : value >= 50 ? "var(--alo-orange)" : "var(--alo-warning)";
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--alo-border)" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} className="transition-all duration-500" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center body-text font-bold" style={{ fontSize: size / 4 }}>
        {value}%
      </span>
      {label && <span className="mt-1 badge-text text-[var(--alo-muted)]">{label}</span>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   15. MiniBar
   ════════════════════════════════════════════════════════════════════════ */
export function MiniBar({ value, max, color = "var(--alo-blue)", className }: { value: number; max: number; color?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--alo-surface-muted)]", className)}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   16. PageHeader
   ════════════════════════════════════════════════════════════════════════ */
export function PageHeader({ title, subtitle, icon, action }: { title: string; subtitle?: string; icon?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex size-11 items-center justify-center rounded-2xl bg-alo-gradient text-white shadow-[var(--alo-shadow-blue)]">
            <Icon name={icon} className="size-6" />
          </div>
        )}
        <div>
          <h1 className="crm-page-title text-[var(--alo-text)]">{title}</h1>
          {subtitle && <p className="body-text text-[var(--alo-muted)]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   17. Stepper — horizontal progress steps
   ════════════════════════════════════════════════════════════════════════ */
export interface StepperStep {
  label: string;
  description?: string;
  icon?: string;
}

export function Stepper({
  steps,
  current,
  onStepClick,
  className,
}: {
  steps: StepperStep[];
  current: number;
  onStepClick?: (index: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, i) => {
        const isComplete = i < current;
        const isCurrent = i === current;
        const isClickable = onStepClick && i <= current;
        return (
          <React.Fragment key={i}>
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(i)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-1 text-left transition-colors",
                isClickable && "hover:bg-[var(--alo-surface-muted)] cursor-pointer",
                !isClickable && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                  isComplete && "border-[var(--alo-success)] bg-[var(--alo-success)] text-white",
                  isCurrent && "border-[var(--alo-blue)] bg-[var(--alo-blue)] text-white shadow-[var(--alo-shadow-blue)]",
                  !isComplete && !isCurrent && "border-[var(--alo-border-strong)] bg-[var(--alo-surface)] text-[var(--alo-muted)]"
                )}
              >
                {isComplete ? <Icon name="Check" className="size-4" /> : step.icon ? <Icon name={step.icon} className="size-4" /> : i + 1}
              </span>
              <div className="hidden min-w-0 sm:block">
                <p className={cn(
                  "text-sm font-semibold leading-tight",
                  isCurrent ? "text-[var(--alo-blue)]" : isComplete ? "text-[var(--alo-text)]" : "text-[var(--alo-muted)]"
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-[var(--alo-muted)] leading-tight">{step.description}</p>
                )}
              </div>
            </button>
            {i < steps.length - 1 && (
              <div className="mx-1 h-0.5 flex-1 min-w-[1rem] rounded-full bg-[var(--alo-border)]">
                <div
                  className="h-full rounded-full bg-[var(--alo-success)] transition-all duration-500"
                  style={{ width: isComplete ? "100%" : "0%" }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   18. Timeline — vertical event timeline
   ════════════════════════════════════════════════════════════════════════ */
export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string | Date;
  icon?: string;
  accent?: AccentColor;
  actor?: { name: string; avatar?: string };
}

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <div className={cn("relative space-y-1", className)}>
      {items.map((item, i) => {
        const a = ACCENT_CLASSES[item.accent || "blue"];
        const isLast = i === items.length - 1;
        return (
          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-[var(--alo-surface)]", a.bg, a.text)}>
                <Icon name={item.icon || "Circle"} className="size-4" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-[var(--alo-border)]" />}
            </div>
            <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--alo-text)]">{item.title}</p>
                  {item.description && <p className="mt-0.5 body-text text-[var(--alo-text-secondary)]">{item.description}</p>}
                  {item.actor && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Avatar className="size-5">
                        <AvatarImage src={item.actor.avatar} />
                        <AvatarFallback className="text-[11px]">{item.actor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-[var(--alo-muted)]">{item.actor.name}</span>
                    </div>
                  )}
                </div>
                {item.timestamp && (
                  <span className="shrink-0 text-xs text-[var(--alo-muted)]">
                    {typeof item.timestamp === "string" ? item.timestamp : format(item.timestamp, "MMM d, HH:mm")}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   19. ActivityFeed — recent activity list
   ════════════════════════════════════════════════════════════════════════ */
export interface ActivityItem {
  id: string;
  actor: { name: string; avatar?: string };
  action: string;
  target?: string;
  timestamp: string;
  icon?: string;
  accent?: AccentColor;
}

export function ActivityFeed({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <ScrollArea className={cn("alo-scroll", className)}>
      <div className="space-y-1">
        {items.map((item) => {
          const a = ACCENT_CLASSES[item.accent || "blue"];
          return (
            <div key={item.id} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-[var(--alo-surface-muted)]">
              <div className="relative">
                <Avatar className="size-8">
                  <AvatarImage src={item.actor.avatar} />
                  <AvatarFallback className="bg-[var(--alo-blue-soft)] text-xs font-semibold text-[var(--alo-blue-strong)]">
                    {item.actor.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className={cn("absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full ring-2 ring-[var(--alo-surface)]", a.bg, a.text)}>
                  <Icon name={item.icon || "Activity"} className="size-2.5" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-[var(--alo-text)]">
                  <span className="font-semibold">{item.actor.name}</span>{" "}
                  <span className="text-[var(--alo-text-secondary)]">{item.action}</span>{" "}
                  {item.target && <span className="font-medium text-[var(--alo-blue-strong)]">{item.target}</span>}
                </p>
                <p className="mt-0.5 text-xs text-[var(--alo-muted)]">{item.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   20. Notification — inline notification banner
   ════════════════════════════════════════════════════════════════════════ */
export function Notification({
  type = "info",
  title,
  message,
  action,
  onDismiss,
  className,
}: {
  type?: "success" | "warning" | "danger" | "info";
  title?: string;
  message: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const accentMap: Record<string, AccentColor> = { success: "emerald", warning: "amber", danger: "rose", info: "sky" };
  const a = ACCENT_CLASSES[accentMap[type]];
  const iconMap = { success: "CheckCircle2", warning: "AlertTriangle", danger: "AlertOctagon", info: "Info" };
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-4", a.border, a.bg, className)}>
      <Icon name={iconMap[type]} className={cn("mt-0.5 size-5 shrink-0", a.text)} />
      <div className="min-w-0 flex-1">
        {title && <p className={cn("text-sm font-semibold", a.text)}>{title}</p>}
        <div className={cn("body-text", title && "mt-0.5", a.text, "opacity-90")}>{message}</div>
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={cn("shrink-0 rounded-md p-1 hover:bg-[var(--alo-navy)]/5", a.text)}
        >
          <Icon name="X" className="size-4" />
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   21. AvatarGroup — stacked avatars
   ════════════════════════════════════════════════════════════════════════ */
export function AvatarGroup({
  avatars,
  max = 4,
  size = 32,
  className,
}: {
  avatars: { name: string; avatar?: string }[];
  max?: number;
  size?: number;
  className?: string;
}) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;
  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {visible.map((a, i) => (
          <Avatar
            key={i}
            style={{ width: size, height: size }}
            className="ring-2 ring-[var(--alo-surface)]"
          >
            <AvatarImage src={a.avatar} />
            <AvatarFallback className="bg-[var(--alo-blue-soft)] text-xs font-semibold text-[var(--alo-blue-strong)]" style={{ fontSize: size * 0.35 }}>
              {a.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ))}
        {overflow > 0 && (
          <div
            style={{ width: size, height: size }}
            className="flex items-center justify-center rounded-full bg-[var(--alo-surface-muted)] text-xs font-semibold text-[var(--alo-text-secondary)] ring-2 ring-[var(--alo-surface)]"
          >
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   22. DataTable — sortable, paginated table
   ════════════════════════════════════════════════════════════════════════ */
export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
  className?: string;
  width?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  pageSize = 10,
  emptyMessage = "No records found",
  className,
  onRowClick,
}: {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(0);

  const sorted = React.useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortAccessor) return data;
    const arr = [...data].sort((a, b) => {
      const av = col.sortAccessor!(a);
      const bv = col.sortAccessor!(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-[var(--alo-border)] bg-[var(--alo-surface)]", className)}>
      <div className="overflow-x-auto alo-scroll-thin">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--alo-border)] bg-[var(--alo-surface-muted)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[var(--alo-muted)]",
                    col.sortable && "cursor-pointer select-none hover:text-[var(--alo-text)]",
                    col.className
                  )}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <Icon
                        name={sortKey === col.key ? (sortDir === "asc" ? "ChevronUp" : "ChevronDown") : "ChevronsUpDown"}
                        className={cn("size-3", sortKey === col.key ? "text-[var(--alo-blue)]" : "text-[var(--alo-muted)]")}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--alo-border)]">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12 text-center text-[var(--alo-muted)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors hover:bg-[var(--alo-surface-muted)]",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-3 py-2.5 text-[var(--alo-text)]", col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--alo-border)] bg-[var(--alo-surface-muted)] px-3 py-2">
          <p className="text-xs text-[var(--alo-muted)]">
            Page {page + 1} of {totalPages} · {sorted.length} records
          </p>
          <div className="flex items-center gap-1">
            <IconButton icon="ChevronLeft" label="Previous page" size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)} />
            <IconButton icon="ChevronRight" label="Next page" size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   23. Breadcrumb (ALO)
   ════════════════════════════════════════════════════════════════════════ */
export function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--alo-muted)]" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {item.onClick ? (
            <button onClick={item.onClick} className="font-medium transition-colors hover:text-[var(--alo-blue)]">
              {item.label}
            </button>
          ) : (
            <span className={cn(i === items.length - 1 && "font-semibold text-[var(--alo-blue)]")}>{item.label}</span>
          )}
          {i < items.length - 1 && <Icon name="ChevronRight" className="size-3 shrink-0 text-[var(--alo-muted)]/60" />}
        </React.Fragment>
      ))}
    </nav>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Exports — re-export common primitives for convenience
   ════════════════════════════════════════════════════════════════════════ */
export {
  Button, Input, Textarea, Label, Badge,
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
  Progress, Skeleton,
};
