"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/alo/shared";

// ─────────────────────────────────────────────────────────────────────────────
// DataTable — generic table renderer
// ─────────────────────────────────────────────────────────────────────────────

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = "No records found",
  emptyDescription,
  emptyIcon = "Inbox",
  maxHeight,
  onRowClick,
  rowClassName,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey?: (row: T, index: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: string;
  maxHeight?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T, index: number) => string;
}) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-white px-6 py-10 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0057B8]">
          <Icon name={emptyIcon} className="size-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-[#0F172A]">{emptyTitle}</p>
        {emptyDescription && (
          <p className="mt-1 max-w-md text-xs text-[#64748B]">{emptyDescription}</p>
        )}
      </div>
    );
  }
  const alignClass = (a?: string) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  return (
    <div
      className={cn("overflow-auto alo-scroll rounded-xl border border-[#E2E8F0] bg-white", maxHeight)}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC]">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  "h-10 whitespace-nowrap px-3 text-xs font-bold uppercase tracking-wide text-[#64748B]",
                  alignClass(col.align),
                  col.className
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => {
            const key = rowKey ? rowKey(row, idx) : ((row as { id?: string }).id || `row-${idx}`);
            const extra = rowClassName?.(row, idx);
            return (
              <TableRow
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "cursor-default border-[#E2E8F0] text-sm text-[#0F172A] transition-colors hover:bg-[#F8FAFC]",
                  onRowClick && "cursor-pointer",
                  extra
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn("px-3 py-2.5 align-top text-sm", alignClass(col.align), col.className)}
                  >
                    {col.render
                      ? col.render(row, idx)
                      : ((row as Record<string, unknown>)[col.key] as React.ReactNode) ?? "—"}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline — vertical events feed
// ─────────────────────────────────────────────────────────────────────────────

export interface TimelineItem {
  id: string;
  title: string;
  description?: string | null;
  timestamp?: string | null;
  icon?: string;
  accent?: "blue" | "orange" | "emerald" | "amber" | "violet" | "rose" | "slate";
  meta?: string;
}

const TIMELINE_ACCENTS: Record<string, { dot: string; bg: string; text: string }> = {
  blue: { dot: "bg-[#0057B8]", bg: "bg-[#EFF6FF]", text: "text-[#0057B8]" },
  orange: { dot: "bg-[#C2410C]", bg: "bg-[#FFF7ED]", text: "text-[#C2410C]" },
  emerald: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  amber: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  violet: { dot: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-700" },
  rose: { dot: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700" },
  slate: { dot: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-700" },
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-white px-6 py-10 text-center text-sm text-[#64748B]">
        No events yet.
      </div>
    );
  }
  return (
    <div className="relative pl-2">
      {items.map((item, idx) => {
        const accent = TIMELINE_ACCENTS[item.accent || "blue"];
        const isLast = idx === items.length - 1;
        return (
          <div key={item.id} className="relative flex gap-3 pb-5">
            {/* Vertical line */}
            {!isLast && (
              <span
                className="absolute left-[14px] top-7 h-[calc(100%-12px)] w-px bg-[#E2E8F0]"
                aria-hidden
              />
            )}
            {/* Dot */}
            <div
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
                accent.bg
              )}
            >
              <span className={cn("size-2.5 rounded-full", accent.dot)} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#0F172A]">{item.title}</p>
                {item.timestamp && (
                  <span className="text-[11px] font-medium text-[#64748B]">{item.timestamp}</span>
                )}
              </div>
              {item.description && (
                <p className="mt-1 text-xs text-[#475569]">{item.description}</p>
              )}
              {item.meta && (
                <span
                  className={cn(
                    "mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    accent.bg,
                    accent.text
                  )}
                >
                  {item.meta}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification — info / warning / danger banner
// ─────────────────────────────────────────────────────────────────────────────

export function Notification({
  type = "info",
  title,
  description,
  icon,
  className,
}: {
  type?: "info" | "warning" | "danger" | "success";
  title?: string;
  description?: React.ReactNode;
  icon?: string;
  className?: string;
}) {
  const styles: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    info: { bg: "bg-[#EFF6FF]", border: "border-[#2563EB]/30", text: "text-[#0057B8]", iconBg: "bg-[#2563EB] text-white" },
    warning: { bg: "bg-[#FEF3C7]/60", border: "border-[#FBBF24]/40", text: "text-[#92400E]", iconBg: "bg-[#FBBF24] text-white" },
    danger: { bg: "bg-[#FEE2E2]/50", border: "border-[#DC2626]/30", text: "text-[#991B1B]", iconBg: "bg-[#DC2626] text-white" },
    success: { bg: "bg-[#DCFCE7]/60", border: "border-[#15803D]/30", text: "text-[#166534]", iconBg: "bg-[#15803D] text-white" },
  };
  const s = styles[type];
  const iconDefault = type === "warning" ? "AlertTriangle" : type === "danger" ? "AlertOctagon" : type === "success" ? "CheckCircle2" : "Info";
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3", s.bg, s.border, className)}>
      <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", s.iconBg)}>
        <Icon name={icon || iconDefault} className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        {title && <p className={cn("text-sm font-semibold", s.text)}>{title}</p>}
        {description && <div className={cn("text-xs leading-relaxed", title ? "mt-0.5 text-[#475569]" : s.text)}>{description}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SearchInput — input with leading search icon
// ─────────────────────────────────────────────────────────────────────────────

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-9 text-sm"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusDot — small colored dot
// ─────────────────────────────────────────────────────────────────────────────

export function StatusDot({ color, label }: { color: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", color)} />
      {label && <span className="text-xs font-medium text-[#475569]">{label}</span>}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pill — small label badge
// ─────────────────────────────────────────────────────────────────────────────

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card section wrapper
// ─────────────────────────────────────────────────────────────────────────────

export function SimpleCard({
  title,
  description,
  icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cn("rounded-2xl border border-[#E2E8F0] bg-white alo-shadow", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] px-5 py-3">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#0057B8]">
                <Icon name={icon} className="size-4" />
              </div>
            )}
            <div>
              {title && <p className="crm-section-title text-[#0F172A]">{title}</p>}
              {description && <p className="text-xs text-[#64748B]">{description}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <CardContent className={cn("p-5", bodyClassName)}>{children}</CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch helper
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Channel & platform metadata (shared across views)
// ─────────────────────────────────────────────────────────────────────────────

export const CHANNEL_META: Record<
  string,
  { label: string; icon: string; brandColor: string; bg: string; text: string }
> = {
  WHATSAPP: { label: "WhatsApp", icon: "MessageCircle", brandColor: "#16a34a", bg: "bg-green-50", text: "text-green-700" },
  EMAIL: { label: "Email", icon: "Mail", brandColor: "#7c3aed", bg: "bg-violet-50", text: "text-violet-700" },
  SMS: { label: "SMS", icon: "MessageSquare", brandColor: "#0057B8", bg: "bg-[#EFF6FF]", text: "text-[#0057B8]" },
  PHONE: { label: "Phone", icon: "Phone", brandColor: "#C2410C", bg: "bg-orange-50", text: "text-orange-700" },
  PORTAL: { label: "Portal", icon: "LayoutDashboard", brandColor: "#E8501A", bg: "bg-[#FFF7ED]", text: "text-[#C2410C]" },
  WEBSITE_CHAT: { label: "Website Chat", icon: "Globe", brandColor: "#0057B8", bg: "bg-[#EFF6FF]", text: "text-[#0057B8]" },
  FACEBOOK: { label: "Facebook", icon: "Facebook", brandColor: "#1877f2", bg: "bg-blue-50", text: "text-blue-700" },
  INSTAGRAM: { label: "Instagram", icon: "Instagram", brandColor: "#e1306c", bg: "bg-pink-50", text: "text-pink-700" },
  MESSENGER: { label: "Messenger", icon: "Send", brandColor: "#0084ff", bg: "bg-sky-50", text: "text-sky-700" },
};

export function channelMeta(c: string) {
  return (
    CHANNEL_META[c] || {
      label: c,
      icon: "MessageSquare",
      brandColor: "#64748b",
      bg: "bg-slate-100",
      text: "text-slate-700",
    }
  );
}

// The 8 channels expected on the command center channel grid
export const COMMAND_CENTER_CHANNELS = [
  "WHATSAPP",
  "EMAIL",
  "SMS",
  "PHONE",
  "PORTAL",
  "WEBSITE_CHAT",
  "FACEBOOK",
  "INSTAGRAM",
] as const;

// Platform metadata for social dashboard
export const PLATFORM_META: Record<
  string,
  { label: string; icon: string; brandColor: string; bg: string; text: string }
> = {
  WHATSAPP: { label: "WhatsApp", icon: "MessageCircle", brandColor: "#16a34a", bg: "bg-green-50", text: "text-green-700" },
  FACEBOOK: { label: "Facebook", icon: "Facebook", brandColor: "#1877f2", bg: "bg-blue-50", text: "text-blue-700" },
  INSTAGRAM: { label: "Instagram", icon: "Instagram", brandColor: "#e1306c", bg: "bg-pink-50", text: "text-pink-700" },
  GMAIL: { label: "Gmail", icon: "Mail", brandColor: "#7c3aed", bg: "bg-violet-50", text: "text-violet-700" },
  OUTLOOK: { label: "Outlook", icon: "Mail", brandColor: "#0057B8", bg: "bg-[#EFF6FF]", text: "text-[#0057B8]" },
  SMS_GATEWAY: { label: "SMS Gateway", icon: "MessageSquare", brandColor: "#15803D", bg: "bg-emerald-50", text: "text-emerald-700" },
  CALL_CENTER: { label: "Call Center", icon: "Phone", brandColor: "#C2410C", bg: "bg-orange-50", text: "text-orange-700" },
  TELEGRAM: { label: "Telegram", icon: "Send", brandColor: "#0088cc", bg: "bg-sky-50", text: "text-sky-700" },
  LINKEDIN: { label: "LinkedIn", icon: "Linkedin", brandColor: "#0a66c2", bg: "bg-blue-50", text: "text-blue-700" },
  TWITTER: { label: "Twitter / X", icon: "Twitter", brandColor: "#0f172a", bg: "bg-slate-100", text: "text-slate-700" },
};

export function platformMeta(p: string) {
  return (
    PLATFORM_META[p] || {
      label: p,
      icon: "Radio",
      brandColor: "#64748b",
      bg: "bg-slate-100",
      text: "text-slate-700",
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLA helpers
// ─────────────────────────────────────────────────────────────────────────────

export const SLA_STATUS_COLORS: Record<string, string> = {
  OK: "bg-emerald-100 text-emerald-700",
  WARNING: "bg-amber-100 text-amber-700",
  URGENT: "bg-orange-100 text-orange-700",
  OVERDUE: "bg-rose-100 text-rose-700",
  ESCALATED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
};

export const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-rose-100 text-rose-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  NORMAL: "bg-blue-100 text-blue-700",
  LOW: "bg-slate-100 text-slate-700",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-slate-100 text-slate-700",
};

// ─────────────────────────────────────────────────────────────────────────────
// Time format helpers
// ─────────────────────────────────────────────────────────────────────────────

export function fmtTime(d?: string | Date | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDateTime(d?: string | Date | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDuration(seconds?: number | null) {
  if (!seconds || seconds < 1) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function fmtMinutes(seconds?: number | null) {
  if (!seconds || seconds < 1) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

export function timeAgoShort(d?: string | Date | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  if (isNaN(diff)) return "—";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// Countdown timer for SLA — returns a colored, human-readable countdown
export function slaCountdown(deadline?: string | Date | null): {
  text: string;
  status: "OK" | "WARNING" | "URGENT" | "OVERDUE";
  color: string;
} {
  if (!deadline) return { text: "No SLA", status: "OK", color: "text-slate-500" };
  const date = typeof deadline === "string" ? new Date(deadline) : deadline;
  if (isNaN(date.getTime())) return { text: "—", status: "OK", color: "text-slate-500" };
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return { text: "Overdue", status: "OVERDUE", color: "text-rose-600" };
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  const text =
    mins >= 60
      ? `${Math.floor(mins / 60)}h ${mins % 60}m`
      : `${mins}m ${String(secs).padStart(2, "0")}s`;
  const status =
    mins <= 5 ? "URGENT" : mins <= 15 ? "WARNING" : "OK";
  const color =
    status === "URGENT" ? "text-rose-600" : status === "WARNING" ? "text-amber-600" : "text-emerald-600";
  return { text, status, color };
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm dialog helper (simple inline)
// ─────────────────────────────────────────────────────────────────────────────

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-10 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
        <Icon name="AlertTriangle" className="size-5" />
      </div>
      <p className="mt-3 text-sm font-semibold text-[#991B1B]">Failed to load data</p>
      <p className="mt-1 text-xs text-[#64748B]">Please try again. If the issue persists, contact support.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-lg bg-[#0057B8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#003a7a]"
        >
          Retry
        </button>
      )}
    </div>
  );
}
