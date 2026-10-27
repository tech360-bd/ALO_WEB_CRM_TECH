"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { DccLevel } from "./catalog";

/** Tone → CSS token class helpers. Colours live in globals.css (.cc-*). */
export const TONE: Record<string, string> = {
  blue: "text-[var(--cc-blue)]",
  cyan: "text-[var(--cc-cyan)]",
  green: "text-[var(--cc-green)]",
  orange: "text-[var(--cc-orange)]",
  red: "text-[var(--cc-red)]",
  purple: "text-[var(--cc-purple)]",
  pink: "text-[var(--cc-pink)]",
  gold: "text-[var(--cc-gold)]",
  silver: "text-[var(--cc-silver)]",
  bronze: "text-[var(--cc-bronze)]",
  slate: "text-[var(--cc-text-2)]",
  muted: "text-[var(--cc-text-3)]",
};

export const TONE_BG: Record<string, string> = {
  blue: "bg-[var(--cc-blue)]/15",
  cyan: "bg-[var(--cc-cyan)]/15",
  green: "bg-[var(--cc-green)]/15",
  orange: "bg-[var(--cc-orange)]/15",
  red: "bg-[var(--cc-red)]/15",
  purple: "bg-[var(--cc-purple)]/15",
  pink: "bg-[var(--cc-pink)]/15",
  gold: "bg-[var(--cc-gold)]/15",
  silver: "bg-[var(--cc-silver)]/15",
  bronze: "bg-[var(--cc-bronze)]/15",
};

export function dccBadgeClass(level: DccLevel): string {
  switch (level) {
    case "Platinum": return "cc-badge cc-badge-platinum";
    case "Gold": return "cc-badge cc-badge-gold";
    case "Silver": return "cc-badge cc-badge-silver";
    case "Bronze": return "cc-badge cc-badge-bronze";
    case "Pending": return "cc-badge cc-badge-pending";
  }
}

export function ringClass(level: DccLevel): string {
  switch (level) {
    case "Platinum": return "cc-ring cc-ring-platinum";
    case "Gold": return "cc-ring cc-ring-gold";
    case "Silver": return "cc-ring cc-ring-silver";
    case "Bronze": return "cc-ring cc-ring-bronze";
    case "Pending": return "cc-ring cc-ring-pending";
  }
}

export function healthColor(health: number): string {
  if (health >= 97) return "text-[var(--cc-green)]";
  if (health >= 93) return "text-[var(--cc-orange)]";
  return "text-[var(--cc-red)]";
}

export function healthBarColor(health: number): string {
  if (health >= 97) return "bg-[var(--cc-green)]";
  if (health >= 93) return "bg-[var(--cc-orange)]";
  return "bg-[var(--cc-red)]";
}

export function statusBadgeClass(status: string): string {
  if (status === "operational") return "cc-badge cc-badge-operational";
  if (status === "degraded") return "cc-badge cc-badge-degraded";
  return "cc-badge cc-badge-offline";
}

export function SectionTitle({
  children,
  right,
  className,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <h3 className="text-sm font-semibold text-[var(--cc-text)]">{children}</h3>
      {right}
    </div>
  );
}

export function Card({
  children,
  className,
  glow,
  onClick,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: "blue" | "green" | "orange" | "purple";
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const glowClass = glow
    ? {
        blue: "shadow-[0_0_24px_rgba(59,130,246,0.12)]",
        green: "shadow-[0_0_24px_rgba(16,185,129,0.12)]",
        orange: "shadow-[0_0_24px_rgba(245,158,11,0.12)]",
        purple: "shadow-[0_0_24px_rgba(139,92,246,0.12)]",
      }[glow]
    : "";
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        "cc-card rounded-xl p-5 transition-colors",
        glowClass,
        onClick && "cursor-pointer hover:border-[var(--cc-blue)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  caption,
  valueClass,
  glow,
  className,
  style,
}: {
  label: string;
  value: React.ReactNode;
  caption?: React.ReactNode;
  valueClass?: string;
  glow?: "blue" | "green" | "orange" | "purple";
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "rounded-2xl p-5 border border-[var(--cc-border)]",
        "bg-gradient-to-br from-[var(--cc-card)] to-[var(--cc-bg-2)]",
        {
          "shadow-[0_0_24px_rgba(59,130,246,0.14)]": glow === "blue",
          "shadow-[0_0_24px_rgba(16,185,129,0.14)]": glow === "green",
          "shadow-[0_0_24px_rgba(245,158,11,0.14)]": glow === "orange",
          "shadow-[0_0_24px_rgba(139,92,246,0.14)]": glow === "purple",
        },
        className,
      )}
    >
      <div className="text-[11px] uppercase tracking-wider text-[var(--cc-text-3)] mb-1">{label}</div>
      <div className={cn("text-3xl font-bold", valueClass ?? "cc-gradient-text")}>{value}</div>
      {caption && <div className="text-xs text-[var(--cc-text-2)] mt-1">{caption}</div>}
    </div>
  );
}

export function ProgressBar({ value, tone = "green", className }: { value: number; tone?: string; className?: string }) {
  return (
    <div className={cn("cc-progress w-full", className)}>
      <div className={cn("cc-progress-fill", TONE_BG[tone] ?? "bg-[var(--cc-green)]")} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function CertRing({ level, children }: { level: DccLevel; children?: React.ReactNode }) {
  return (
    <span className={ringClass(level)}>
      <span>{children ?? level[0]}</span>
    </span>
  );
}

/** Circular SVG gauge, matching the blueprint's System Health ring. */
export function Gauge({ value, size = 160, label }: { value: number; size?: number; label?: string }) {
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--cc-bg-2)" strokeWidth={12} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ccGaugeGrad)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <defs>
          <linearGradient id="ccGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--cc-green)" />
            <stop offset="100%" stopColor="var(--cc-cyan)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={cn("text-3xl font-bold", healthColor(value))}>{value}%</div>
        {label && <div className="text-xs text-[var(--cc-text-3)]">{label}</div>}
      </div>
    </div>
  );
}

export function MiniStat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="p-3 rounded-xl bg-[var(--cc-bg-2)] text-center">
      <div className={cn("text-xl font-bold", tone ? TONE[tone] : "text-[var(--cc-text)]")}>{value}</div>
      <div className="text-xs text-[var(--cc-text-3)]">{label}</div>
    </div>
  );
}
