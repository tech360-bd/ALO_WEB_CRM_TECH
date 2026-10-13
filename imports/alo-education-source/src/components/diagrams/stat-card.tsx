'use client';

import React, { useEffect, useState, useRef } from 'react';
import { COLORS, RADIUS, type StatChipConfig } from '@/lib/design-system';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Animated Counter Hook ────────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration = 1500, enabled = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<number>(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!enabled || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      ref.current = Math.round(eased * target);
      setCount(ref.current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [target, duration, enabled]);

  return count;
}

// ─── Format Value ─────────────────────────────────────────────────────────────

function formatValue(value: number, format?: 'number' | 'currency' | 'percent', prefix?: string, suffix?: string): string {
  const p = prefix ?? (format === 'currency' ? '$' : '');
  const s = suffix ?? (format === 'percent' ? '%' : '');

  if (format === 'currency') {
    return `${p}${value.toLocaleString()}`;
  }
  return `${p}${value.toLocaleString()}${s}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatCardProps extends StatChipConfig {
  /** Enable animation */
  animate?: boolean;
  /** Custom class */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  prefix,
  suffix,
  icon,
  trend,
  format,
  animate = true,
  className = '',
}: StatCardProps) {
  const displayValue = useAnimatedCounter(value, 1500, animate);
  const formatted = formatValue(animate ? displayValue : value, format, prefix, suffix);

  const TrendIcon = trend
    ? trend.direction === 'up'
      ? TrendingUp
      : trend.direction === 'down'
        ? TrendingDown
        : Minus
    : null;

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 border rounded-[6px] ${className}`}
      style={{
        backgroundColor: COLORS.white,
        borderColor: COLORS.grayLight,
      }}
    >
      {/* Icon placeholder */}
      {icon && (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-3 text-lg"
          style={{ backgroundColor: COLORS.coralGhost, color: COLORS.coral }}
        >
          {icon}
        </div>
      )}

      {/* Value */}
      <span
        className="text-3xl font-bold tabular-nums"
        style={{ color: COLORS.ink }}
      >
        {formatted}
      </span>

      {/* Label */}
      <span
        className="text-sm mt-1 text-center"
        style={{ color: COLORS.gray }}
      >
        {label}
      </span>

      {/* Trend */}
      {trend && TrendIcon && (
        <div
          className="flex items-center gap-1 mt-2 text-xs font-semibold"
          style={{
            color: trend.direction === 'up' ? COLORS.success
              : trend.direction === 'down' ? COLORS.error
              : COLORS.gray,
          }}
        >
          <TrendIcon className="w-3.5 h-3.5" />
          <span>{trend.value}%</span>
          {trend.label && <span style={{ color: COLORS.gray }}>({trend.label})</span>}
        </div>
      )}
    </div>
  );
}

// ─── Stat Chip (compact version) ─────────────────────────────────────────────

interface StatChipProps extends StatChipConfig {
  animate?: boolean;
  className?: string;
}

export function StatChip({
  label,
  value,
  prefix,
  suffix,
  trend,
  format,
  animate = true,
  className = '',
}: StatChipProps) {
  const displayValue = useAnimatedCounter(value, 1200, animate);
  const formatted = formatValue(animate ? displayValue : value, format, prefix, suffix);

  const TrendIcon = trend
    ? trend.direction === 'up'
      ? TrendingUp
      : trend.direction === 'down'
        ? TrendingDown
        : Minus
    : null;

  return (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2.5 border rounded-[6px] ${className}`}
      style={{
        backgroundColor: COLORS.white,
        borderColor: COLORS.grayLight,
      }}
    >
      <span className="text-xl font-bold tabular-nums" style={{ color: COLORS.ink }}>
        {formatted}
      </span>
      <span className="text-xs" style={{ color: COLORS.gray }}>{label}</span>
      {trend && TrendIcon && (
        <span
          className="flex items-center gap-0.5 text-xs font-semibold"
          style={{
            color: trend.direction === 'up' ? COLORS.success
              : trend.direction === 'down' ? COLORS.error
              : COLORS.gray,
          }}
        >
          <TrendIcon className="w-3 h-3" />
          {trend.value}%
        </span>
      )}
    </div>
  );
}

// ─── Convenience: Default Stats Grid ─────────────────────────────────────────

export function StatsGrid({ className }: { className?: string }) {
  const stats: StatCardProps[] = [
    { label: 'Students Enrolled', value: 2500, format: 'number', trend: { value: 18, direction: 'up', label: 'vs last year' } },
    { label: 'University Partners', value: 350, format: 'number', trend: { value: 12, direction: 'up' } },
    { label: 'Visa Success Rate', value: 96, suffix: '%', trend: { value: 2, direction: 'up' } },
    { label: 'Countries Served', value: 28, format: 'number', trend: { value: 0, direction: 'flat' } },
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
