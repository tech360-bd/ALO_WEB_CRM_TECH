'use client';

import React from 'react';
import { COLORS, RADIUS, type FunnelStage, type FunnelConfig } from '@/lib/design-system';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FunnelChartProps {
  /** Funnel configuration */
  config?: FunnelConfig;
  /** Override stages directly */
  stages?: FunnelStage[];
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Show percentage labels */
  showPercentage?: boolean;
  /** Custom class */
  className?: string;
}

// ─── Default Lead Conversion Funnel ──────────────────────────────────────────

const DEFAULT_STAGES: FunnelStage[] = [
  { id: 'leads', label: 'Leads', value: 1000, percentage: 100 },
  { id: 'qualified', label: 'Qualified', value: 600, percentage: 60 },
  { id: 'applied', label: 'Applied', value: 350, percentage: 35 },
  { id: 'offered', label: 'Offered', value: 200, percentage: 20 },
  { id: 'enrolled', label: 'Enrolled', value: 120, percentage: 12 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function FunnelChart({
  config,
  stages,
  direction = 'vertical',
  showPercentage = true,
  className = '',
}: FunnelChartProps) {
  const data = stages ?? config?.stages ?? DEFAULT_STAGES;
  const dir = config?.direction ?? direction;
  const showPct = config?.showPercentage ?? showPercentage;

  const maxValue = Math.max(...data.map(s => s.value));

  if (dir === 'horizontal') {
    const barH = 48;
    const gap = 12;
    const padding = 24;
    const totalH = data.length * (barH + gap) - gap + padding * 2;
    const chartW = 600;
    const labelW = 100;
    const pctW = 60;

    return (
      <div className={`w-full overflow-x-auto ${className}`}>
        <svg viewBox={`0 0 ${chartW} ${totalH}`} className="w-full" style={{ minHeight: 200 }}>
          {data.map((stage, i) => {
            const y = padding + i * (barH + gap);
            const barW = ((stage.value / maxValue) * (chartW - labelW - pctW - padding * 2));
            const barX = labelW;
            const ratio = i / Math.max(data.length - 1, 1);

            const r1 = parseInt(COLORS.ink.slice(1, 3), 16);
            const g1 = parseInt(COLORS.ink.slice(3, 5), 16);
            const b1 = parseInt(COLORS.ink.slice(5, 7), 16);
            const r2 = parseInt(COLORS.coral.slice(1, 3), 16);
            const g2 = parseInt(COLORS.coral.slice(3, 5), 16);
            const b2 = parseInt(COLORS.coral.slice(5, 7), 16);
            const r = Math.round(r1 + (r2 - r1) * ratio);
            const g = Math.round(g1 + (g2 - g1) * ratio);
            const b = Math.round(b1 + (b2 - b1) * ratio);
            const color = `rgb(${r},${g},${b})`;

            return (
              <React.Fragment key={stage.id}>
                <text
                  x={labelW - 8}
                  y={y + barH / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill={COLORS.ink}
                  fontSize={13}
                  fontWeight={600}
                  fontFamily="system-ui, sans-serif"
                >
                  {stage.label}
                </text>
                <rect
                  x={barX}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={RADIUS.md}
                  fill={color}
                  opacity={0.9}
                />
                <text
                  x={barX + barW / 2}
                  y={y + barH / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={COLORS.white}
                  fontSize={14}
                  fontWeight={700}
                  fontFamily="system-ui, sans-serif"
                >
                  {stage.value.toLocaleString()}
                </text>
                {showPct && stage.percentage !== undefined && (
                  <text
                    x={barX + barW + 12}
                    y={y + barH / 2}
                    textAnchor="start"
                    dominantBaseline="central"
                    fill={COLORS.gray}
                    fontSize={12}
                    fontWeight={500}
                    fontFamily="system-ui, sans-serif"
                  >
                    {stage.percentage}%
                  </text>
                )}
              </React.Fragment>
            );
          })}
        </svg>
      </div>
    );
  }

  // Vertical funnel (trapezoid style)
  const svgW = 500;
  const stageH = 64;
  const gap = 8;
  const padding = 32;
  const totalH = data.length * (stageH + gap) - gap + padding * 2;
  const centerX = svgW / 2;

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <svg viewBox={`0 0 ${svgW} ${totalH}`} className="w-full max-w-lg mx-auto" style={{ minHeight: 300 }}>
        {data.map((stage, i) => {
          const y = padding + i * (stageH + gap);
          const widthRatio = stage.value / maxValue;
          const topW = svgW * widthRatio * 0.85;
          const nextRatio = i < data.length - 1 ? data[i + 1].value / maxValue : widthRatio * 0.85;
          const bottomW = svgW * nextRatio * 0.85;
          const ratio = i / Math.max(data.length - 1, 1);

          const r1 = parseInt(COLORS.ink.slice(1, 3), 16);
          const g1 = parseInt(COLORS.ink.slice(3, 5), 16);
          const b1 = parseInt(COLORS.ink.slice(5, 7), 16);
          const r2 = parseInt(COLORS.coral.slice(1, 3), 16);
          const g2 = parseInt(COLORS.coral.slice(3, 5), 16);
          const b2 = parseInt(COLORS.coral.slice(5, 7), 16);
          const r = Math.round(r1 + (r2 - r1) * ratio);
          const g = Math.round(g1 + (g2 - g1) * ratio);
          const b = Math.round(b1 + (b2 - b1) * ratio);
          const color = `rgb(${r},${g},${b})`;

          const tl = centerX - topW / 2;
          const tr = centerX + topW / 2;
          const bl = centerX - bottomW / 2;
          const br = centerX + bottomW / 2;

          return (
            <React.Fragment key={stage.id}>
              <path
                d={`M${tl},${y} L${tr},${y} L${br},${y + stageH} L${bl},${y + stageH} Z`}
                fill={color}
                opacity={0.9}
              />
              <text
                x={centerX}
                y={y + stageH / 2 - 8}
                textAnchor="middle"
                dominantBaseline="central"
                fill={COLORS.white}
                fontSize={14}
                fontWeight={700}
                fontFamily="system-ui, sans-serif"
              >
                {stage.label}
              </text>
              <text
                x={centerX}
                y={y + stageH / 2 + 10}
                textAnchor="middle"
                dominantBaseline="central"
                fill={COLORS.white}
                fontSize={12}
                fontWeight={400}
                fontFamily="system-ui, sans-serif"
                opacity={0.85}
              >
                {stage.value.toLocaleString()}{showPct && stage.percentage !== undefined ? ` (${stage.percentage}%)` : ''}
              </text>
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Convenience: Lead Conversion Funnel ─────────────────────────────────────

export function LeadConversionFunnel({ className }: { className?: string }) {
  return <FunnelChart direction="vertical" showPercentage className={className} />;
}
