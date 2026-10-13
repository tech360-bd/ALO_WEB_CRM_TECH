'use client';

import React from 'react';
import { COLORS, RADIUS, type PyramidTier } from '@/lib/design-system';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PyramidChartProps {
  /** Pyramid tiers (top to bottom) */
  tiers?: PyramidTier[];
  /** Custom class */
  className?: string;
}

// ─── Default Service Tiers ────────────────────────────────────────────────────

const DEFAULT_TIERS: PyramidTier[] = [
  { id: 'premium', label: 'Premium', value: 15, description: 'Full-service counseling, VIP university access, priority support' },
  { id: 'standard', label: 'Standard', value: 35, description: 'Comprehensive counseling, document support, regular check-ins' },
  { id: 'basic', label: 'Basic', value: 35, description: 'Essential guidance, application review, email support' },
  { id: 'free', label: 'Free', value: 15, description: 'Self-service resources, community forums, FAQ access' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function PyramidChart({
  tiers,
  className = '',
}: PyramidChartProps) {
  const data = tiers ?? DEFAULT_TIERS;
  const maxValue = Math.max(...data.map(t => t.value));

  const barH = 56;
  const gap = 8;
  const padding = 32;
  const svgW = 500;
  const totalH = data.length * (barH + gap) - gap + padding * 2;
  const centerX = svgW / 2;

  // Color interpolation from coral (top) to ink (bottom)
  const getTierColor = (index: number) => {
    const ratio = index / Math.max(data.length - 1, 1);
    const r1 = parseInt(COLORS.coral.slice(1, 3), 16);
    const g1 = parseInt(COLORS.coral.slice(3, 5), 16);
    const b1 = parseInt(COLORS.coral.slice(5, 7), 16);
    const r2 = parseInt(COLORS.ink.slice(1, 3), 16);
    const g2 = parseInt(COLORS.ink.slice(3, 5), 16);
    const b2 = parseInt(COLORS.ink.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <svg viewBox={`0 0 ${svgW} ${totalH}`} className="w-full max-w-lg mx-auto" style={{ minHeight: 250 }}>
        {data.map((tier, i) => {
          const y = padding + i * (barH + gap);
          const widthRatio = tier.value / maxValue;
          const barW = (svgW - padding * 2) * widthRatio;
          const x = centerX - barW / 2;
          const color = getTierColor(i);

          return (
            <React.Fragment key={tier.id}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={RADIUS.md}
                fill={color}
                opacity={0.9}
              />
              {/* Label */}
              <text
                x={centerX}
                y={y + barH / 2 - (tier.description ? 6 : 0)}
                textAnchor="middle"
                dominantBaseline="central"
                fill={COLORS.white}
                fontSize={14}
                fontWeight={700}
                fontFamily="system-ui, sans-serif"
              >
                {tier.label}
              </text>
              {/* Percentage */}
              <text
                x={centerX}
                y={y + barH / 2 + (tier.description ? 8 : 0)}
                textAnchor="middle"
                dominantBaseline="central"
                fill={COLORS.white}
                fontSize={11}
                fontWeight={400}
                fontFamily="system-ui, sans-serif"
                opacity={0.85}
              >
                {tier.value}%
              </text>
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Convenience: Service Tier Pyramid ───────────────────────────────────────

export function ServiceTierPyramid({ className }: { className?: string }) {
  return <PyramidChart className={className} />;
}
