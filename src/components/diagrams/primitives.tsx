/**
 * Core SVG primitives for the ALO diagram system.
 *
 * Grammar carried over from cathrynlavery/diagram-design (primitives-core.md):
 *  - Three arrow markers, always defined: default (muted), accent, link.
 *  - Orthogonal connectors with rounded quarter-arc bends (r = 8).
 *    Diagonal connectors are an automatic fail — never draw them.
 *  - Arrows render before boxes so lines sit behind nodes (z-order).
 *  - Labels never sit on their arrow: 6–10px gap, always.
 */

import React from 'react';
import { diagramTokens as T } from './tokens';

export type DiagramPoint = { x: number; y: number };
export type DiagramRect = { x: number; y: number; w: number; h: number };

export function rectCenter(r: DiagramRect): DiagramPoint {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** Point on the segment a→b at distance `len` from a. */
function pointAlong(a: DiagramPoint, b: DiagramPoint, len: number): DiagramPoint {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const t = len / d;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * Build an SVG path through `pts` with rounded corners of radius `r`.
 * All bends must be orthogonal (90°) — callers pass axis-aligned vertices.
 * The radius is clamped to half the shortest adjoining segment so tight
 * layouts never produce self-intersecting arcs.
 */
export function roundedOrthoPath(pts: DiagramPoint[], r = 8): string {
  if (pts.length < 2) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (pts.length === 2) {
    return `M ${first.x} ${first.y} L ${last.x} ${last.y}`;
  }
  const segLens = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const maxR = Math.max(0, Math.min(...segLens) / 2);
  const rr = Math.min(r, maxR);
  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const p = pts[i];
    const pin = pointAlong(p, pts[i - 1], rr);
    const pout = pointAlong(p, pts[i + 1], rr);
    d += ` L ${pin.x} ${pin.y}`;
    // Screen coords (y down): cross > 0 → clockwise turn → sweep = 1.
    const cross = (p.x - pin.x) * (pout.y - p.y) - (p.y - pin.y) * (pout.x - p.x);
    const sweep = cross > 0 ? 1 : 0;
    d += ` A ${rr} ${rr} 0 0 ${sweep} ${pout.x} ${pout.y}`;
  }
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export type ArrowTone = 'default' | 'accent' | 'link';

/**
 * One connector. `pts` are the polyline vertices (axis-aligned). The final
 * vertex should stop short of the target edge so the arrowhead lands on it.
 */
export function DiagramConnector({
  pts,
  tone = 'default',
  dashed = false,
  markerId,
  label,
  labelAt,
}: {
  pts: DiagramPoint[];
  tone?: ArrowTone;
  dashed?: boolean;
  markerId: string;
  label?: string;
  /** Place the label at this point (offset applied by caller). */
  labelAt?: DiagramPoint;
}) {
  const stroke = tone === 'accent' ? T.accent : tone === 'link' ? T.link : T.muted;
  const d = roundedOrthoPath(pts, 8);
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={tone === 'accent' ? 1.75 : 1.25}
        strokeDasharray={dashed ? '5,4' : undefined}
        markerEnd={`url(#${markerId})`}
      />
      {label && labelAt ? (
        <g>
          {/* Opaque mask keeps the connector visible behind the label */}
          <rect
            x={labelAt.x - 14}
            y={labelAt.y - 7}
            width={label.length * 5.2 + 8}
            height={12}
            fill={T.paper}
          />
          <text
            x={labelAt.x}
            y={labelAt.y + 3}
            textAnchor="middle"
            className="font-mono text-[11px] uppercase tracking-[0.06em]"
            fill={tone === 'accent' ? T.accent : T.muted}
          >
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
}

/** Arrowhead marker defs — define all three in every diagram, always. */
export function DiagramArrowDefs({ idPrefix }: { idPrefix: string }) {
  const markers: { id: string; fill: string }[] = [
    { id: `${idPrefix}-arrow`, fill: T.muted },
    { id: `${idPrefix}-arrow-accent`, fill: T.accent },
    { id: `${idPrefix}-arrow-link`, fill: T.link },
  ];
  return (
    <defs>
      {markers.map((m) => (
        <marker
          key={m.id}
          id={m.id}
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill={m.fill} />
        </marker>
      ))}
    </defs>
  );
}

export type DiagramNodeTone = 'default' | 'focal' | 'soft' | 'success';

/**
 * Standard node box: paper fill, hairline stroke, sans name + mono sublabel.
 * `focal` renders the accent border + tint (max one per diagram).
 */
export function DiagramNode({
  rect,
  name,
  nameLines,
  sub,
  chip,
  tone = 'default',
  accentName = false,
}: {
  rect: DiagramRect;
  name?: string;
  /** Explicit line break control — preferred over `name` for long titles. */
  nameLines?: string[];
  sub?: string;
  /** Small mono chip pinned top-right (lane key, code, port). */
  chip?: string;
  tone?: DiagramNodeTone;
  /** Name in accent instead of ink (used sparingly, with focal). */
  accentName?: boolean;
}) {
  const lines = nameLines ?? (name ? [name] : []);
  const isFocal = tone === 'focal';
  const fill = isFocal ? T.accentTint : tone === 'soft' ? T.paper2 : T.paper;
  const stroke = isFocal ? T.accent : T.ruleSolid;
  const nameY = rect.y + (sub ? 26 : rect.h / 2 + 4);
  return (
    <g>
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.w}
        height={rect.h}
        rx={6}
        fill={fill}
        stroke={stroke}
        strokeWidth={isFocal ? 1.5 : 1}
      />
      {lines.map((line, i) => (
        <text
          key={line + i}
          x={rect.x + rect.w / 2}
          y={nameY + i * 14 - (lines.length > 1 ? 7 : 0)}
          textAnchor="middle"
          className="font-sans text-[12px] font-semibold"
          fill={accentName ? T.accent : T.ink}
        >
          {line}
        </text>
      ))}
      {sub ? (
        <text
          x={rect.x + rect.w / 2}
          y={rect.y + rect.h - 10}
          textAnchor="middle"
          className="font-mono text-[11px]"
          fill={T.muted}
        >
          {sub}
        </text>
      ) : null}
      {chip ? (
        <text
          x={rect.x + rect.w - 6}
          y={rect.y + 11}
          textAnchor="end"
          className="font-mono text-[11px] uppercase tracking-[0.12em]"
          fill={T.soft}
        >
          {chip}
        </text>
      ) : null}
    </g>
  );
}

/** Eyebrow label — mono 8px uppercase tracked, muted or accent. */
export function DiagramEyebrow({
  at,
  children,
  tone = 'muted',
  anchor = 'start',
}: {
  at: DiagramPoint;
  children: React.ReactNode;
  tone?: 'muted' | 'accent' | 'link';
  anchor?: 'start' | 'middle' | 'end';
}) {
  const fill = tone === 'accent' ? T.accent : tone === 'link' ? T.link : T.muted;
  return (
    <text
      x={at.x}
      y={at.y}
      textAnchor={anchor}
      className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]"
      fill={fill}
    >
      {children}
    </text>
  );
}

/** Hairline rule across the diagram. */
export function DiagramRule({
  from,
  to,
  solid = false,
}: {
  from: DiagramPoint;
  to: DiagramPoint;
  /** Stronger `ruleSolid` stroke for baselines and dividers */
  solid?: boolean;
}) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={solid ? T.ruleSolid : T.rule}
      strokeWidth={1}
    />
  );
}

/**
 * Root <svg> wrapper: paper background, unique marker defs, accessible role.
 * Diagrams sit directly on the page — no secondary container background.
 */
export function DiagramRoot({
  idPrefix,
  width,
  height,
  label,
  children,
  className,
}: {
  idPrefix: string;
  width: number;
  height: number;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-labelledby={`${idPrefix}-title`} aria-describedby={`${idPrefix}-desc`}
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      <title id={`${idPrefix}-title`}>{label}</title>
      <desc id={`${idPrefix}-desc`}>ALO Education process diagram. Labels and annotations describe each stage and connection.</desc>
      <DiagramArrowDefs idPrefix={idPrefix} />
      <rect width="100%" height="100%" fill={T.paper} rx={12} />
      {children}
    </svg>
  );
}
