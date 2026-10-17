"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as LucideIcons from "lucide-react";

export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = (LucideIcons as any)[name] as React.ComponentType<{ className?: string }>;
  if (!Cmp) return <LucideIcons.Circle className={className} />;
  return <Cmp className={className} />;
}

// ─── StatCard — Enterprise design with semantic accent colors ───────────────
export function StatCard({
  label,
  value,
  icon,
  accent = "blue",
  hint,
  trend,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  accent?: "blue" | "orange" | "emerald" | "amber" | "violet" | "rose";
  hint?: string;
  trend?: string;
}) {
  const accentMap: Record<string, string> = {
    blue: "bg-[#EFF6FF] text-[#0057B8]",
    orange: "bg-[#FFF7ED] text-[#C93D13]",
    emerald: "bg-[#DCFCE7] text-[#047857]",
    amber: "bg-[#FEF3C7] text-[#92400E]",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-[#FEE2E2] text-[#991B1B]",
  };
  return (
    <Card className="alo-card rounded-2xl border border-[#E2E8F0] bg-white alo-shadow transition-all hover:alo-shadow-lg">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="badge-text uppercase tracking-wide text-[#64748B]">{label}</p>
            <p className="mt-1.5 text-2xl font-bold text-[#0F172A] tabular-nums">{value}</p>
            {hint && <p className="mt-1 body-text text-[#64748B]">{hint}</p>}
          </div>
          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", accentMap[accent])}>
            <Icon name={icon} className="size-5" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1.5 body-text">
            <Icon name="TrendingUp" className="size-3.5 text-[#047857]" />
            <span className="font-medium text-[#047857]">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── StatusBadge — Semantic status colors (not branding) ────────────────────
export function StatusBadge({ status, colorMap, labels }: { status: string; colorMap: Record<string, string>; labels?: Record<string, string> }) {
  const cls = colorMap[status] || "bg-slate-100 text-slate-700 border border-slate-200";
  const label = labels?.[status] || status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 badge-text capitalize", cls)}>{label}</span>;
}

// ─── SemanticBadge — Standard success/warning/danger badges ─────────────────
export function SemanticBadge({ type, children }: { type: "success" | "warning" | "danger" | "info"; children: React.ReactNode }) {
  const cls = {
    success: "badge-success",
    warning: "badge-warning",
    danger: "badge-danger",
    info: "bg-[#EFF6FF] text-[#0057B8] border border-[#0057B8]",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 badge-text", cls[type])}>{children}</span>;
}

export function SectionCard({
  title,
  description,
  icon,
  action,
  className,
  children,
}: {
  title?: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("rounded-2xl border border-[#E2E8F0] bg-white alo-shadow", className)}>
      {(title || action) && (
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#0057B8]">
                <Icon name={icon} className="size-4" />
              </div>
            )}
            <div>
              {title && <CardTitle className="crm-section-title text-[#0F172A]">{title}</CardTitle>}
              {description && <CardDescription className="body-text text-[#64748B]">{description}</CardDescription>}
            </div>
          </div>
          {action}
        </CardHeader>
      )}
      <CardContent className={cn(!title && "pt-6")}>{children}</CardContent>
    </Card>
  );
}

export function EmptyState({ icon = "Inbox", title, description, action }: { icon?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#0057B8]">
        <Icon name={icon} className="size-7" />
      </div>
      <p className="mt-4 card-title text-[#0F172A]">{title}</p>
      {description && <p className="mt-1 max-w-sm body-text text-[#64748B]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="rounded-2xl border border-[#E2E8F0] bg-white">
          <CardContent className="pt-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function InfoRow({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] py-2 last:border-0">
      <span className="body-text font-medium text-[#64748B]">{label}</span>
      <span className={cn("text-right body-text font-medium text-[#0F172A]", mono && "font-mono")}>{value || "—"}</span>
    </div>
  );
}

export function CompletionRing({ value, size = 64, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 80 ? "#047857" : value >= 50 ? "#C93D13" : "#FBBF24";
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center body-text font-bold" style={{ fontSize: size / 4 }}>
        {value}%
      </span>
      {label && <span className="mt-1 badge-text text-[#64748B]">{label}</span>}
    </div>
  );
}

export function MiniBar({ value, max, color = "#0057B8" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export function PageHeader({ title, subtitle, icon, action }: { title: string; subtitle?: string; icon?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex size-11 items-center justify-center rounded-2xl bg-alo-gradient text-white alo-shadow">
            <Icon name={icon} className="size-6" />
          </div>
        )}
        <div>
          <h1 className="crm-page-title text-[#0F172A]">{title}</h1>
          {subtitle && <p className="body-text text-[#64748B]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Progress };
