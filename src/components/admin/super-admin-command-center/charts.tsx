"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/** Conic-gradient donut chart. Lightweight — no chart library. */
export function Donut({
  segments,
  size = 200,
  thickness = 22,
  center,
}: {
  segments: Segment[];
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcs = segments.map((seg, i) => {
    const fraction = seg.value / total;
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const offset =
      -segments.slice(0, i).reduce((a, s) => a + s.value / total, 0) * circumference;
    return { ...seg, dash, gap, offset, fraction };
  });
  return (
    <div className="flex items-center gap-4">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--cc-bg-2)" strokeWidth={thickness} />
          {arcs.map((a, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={a.color}
              strokeWidth={thickness}
              strokeDasharray={`${a.dash} ${a.gap}`}
              strokeDashoffset={a.offset}
            />
          ))}
        </svg>
        {center && <div className="absolute inset-0 flex items-center justify-center">{center}</div>}
      </div>
      <div className="space-y-1.5 text-xs">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-[var(--cc-text-2)]">{s.label}</span>
            <span className="ml-auto font-semibold text-[var(--cc-text)]">
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface Series {
  label: string;
  color: string;
  values: number[];
}

/** Multi-line sparkline/area chart drawn as SVG. */
export function LineChart({
  series,
  labels,
  height = 160,
  area = true,
}: {
  series: Series[];
  labels: string[];
  height?: number;
  area?: boolean;
}) {
  const width = 560;
  const pad = 8;
  const all = series.flatMap((s) => s.values);
  const max = Math.max(1, ...all);
  const min = Math.min(0, ...all);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / Math.max(1, (labels.length || 1) - 1);
  const toPath = (values: number[]) =>
    values
      .map((v, i) => {
        const x = pad + i * stepX;
        const y = pad + (height - pad * 2) * (1 - (v - min) / range);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`ccArea${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {area &&
          series.map((s, i) => {
            const pts = s.values
              .map((v, j) => {
                const x = pad + j * stepX;
                const y = pad + (height - pad * 2) * (1 - (v - min) / range);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ");
            return <polygon key={i} points={`${pad},${height - pad} ${pts} ${pad + (s.values.length - 1) * stepX},${height - pad}`} fill={`url(#ccArea${i})`} />;
          })}
        {series.map((s, i) => (
          <path key={i} d={toPath(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
      {labels.length > 0 && (
        <div className="flex justify-between text-[11px] text-[var(--cc-text-3)] px-1 mt-1">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-3 mt-2">
        {series.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs text-[var(--cc-text-2)]">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BarChart({ segments, height = 180 }: { segments: Segment[]; height?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {segments.map((s, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
          <div className="text-[11px] text-[var(--cc-text-2)]">{s.value}</div>
          <div
            className="w-full rounded-t-md transition-all"
            style={{ height: `${Math.max(4, (s.value / Math.max(...segments.map((x) => x.value))) * 100)}%`, background: s.color }}
          />
        </div>
      ))}
    </div>
  );
}

export function TabButton({
  active,
  onClick,
  children,
  tone = "blue",
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  tone?: string;
}) {
  const colors: Record<string, [string, string]> = {
    blue: ["#3b82f6", "rgba(59,130,246,0.15)"],
    green: ["#10b981", "rgba(16,185,129,0.15)"],
    purple: ["#8b5cf6", "rgba(139,92,246,0.15)"],
    orange: ["#f59e0b", "rgba(245,158,11,0.15)"],
    cyan: ["#06b6d4", "rgba(6,182,212,0.15)"],
    red: ["#ef4444", "rgba(239,68,68,0.15)"],
  };
  const [fg, bg] = colors[tone] ?? colors.blue;
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs rounded-lg transition-colors font-medium whitespace-nowrap",
        active ? "text-white" : "text-[var(--cc-text-2)] hover:text-[var(--cc-text)]",
      )}
      style={active ? { background: fg } : { background: "var(--cc-card)", border: "1px solid var(--cc-border)" }}
    >
      {children}
    </button>
  );
}
