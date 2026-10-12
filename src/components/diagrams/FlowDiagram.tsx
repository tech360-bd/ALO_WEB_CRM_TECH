/**
 * Flowchart — decision logic with branches.
 *
 * Grammar from cathrynlavery/diagram-design → references/type-flowchart.md:
 * shape carries type, not color — pill (rx=20) for start/end, rect (rx=6)
 * for steps, diamond for decisions (≤3 exits), small filled ink dot for
 * merge points. Flow runs top→down; every outgoing arrow is labeled.
 * Accent marks the happy path (or one consequential decision) — never all.
 */

import React from 'react';
import { diagramTokens as T } from './tokens';
import {
  DiagramConnector,
  DiagramRoot,
  type ArrowTone,
  type DiagramPoint,
  type DiagramRect,
} from './primitives';

export type FlowNodeKind = 'start' | 'process' | 'decision' | 'end' | 'end-muted' | 'merge';

export type FlowNode = {
  id: string;
  kind: FlowNodeKind;
  rect: DiagramRect;
  titleLines: string[];
  sub?: string;
};

export type FlowSide = 'left' | 'right' | 'top' | 'bottom';

export type FlowLink = {
  from: string;
  to: string;
  fromSide?: FlowSide;
  toSide?: FlowSide;
  label?: string;
  tone?: ArrowTone;
  dashed?: boolean;
};

function anchor(rect: DiagramRect, side: FlowSide): DiagramPoint {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  switch (side) {
    case 'left':
      return { x: rect.x, y: cy };
    case 'right':
      return { x: rect.x + rect.w, y: cy };
    case 'top':
      return { x: cx, y: rect.y };
    case 'bottom':
      return { x: cx, y: rect.y + rect.h };
  }
}

/** Orthogonal pts + label anchor for a link between two side anchors. */
function linkGeometry(
  a: DiagramRect,
  b: DiagramRect,
  fromSide: FlowSide,
  toSide: FlowSide,
): { pts: DiagramPoint[]; labelAt: DiagramPoint } {
  const p1 = anchor(a, fromSide);
  const p2 = anchor(b, toSide);
  if (fromSide === 'right' && toSide === 'left') {
    const midX = (p1.x + p2.x) / 2;
    return {
      pts: [
        p1,
        { x: midX, y: p1.y },
        { x: midX, y: p2.y },
        p2,
      ],
      labelAt: { x: (p1.x + midX) / 2, y: p1.y - 7 },
    };
  }
  if (fromSide === 'bottom' && toSide === 'top') {
    const midY = (p1.y + p2.y) / 2;
    return {
      pts: [
        p1,
        { x: p1.x, y: midY },
        { x: p2.x, y: midY },
        p2,
      ],
      labelAt: { x: p1.x + 16, y: midY - 4 },
    };
  }
  if (fromSide === 'bottom' && toSide === 'left') {
    const midY = (p1.y + p2.y) / 2;
    return {
      pts: [p1, { x: p1.x, y: midY }, { x: p2.x, y: midY }, p2],
      labelAt: { x: p1.x + 16, y: midY - 4 },
    };
  }
  if (fromSide === 'right' && toSide === 'top') {
    const midX = (p1.x + p2.x) / 2;
    return {
      pts: [p1, { x: midX, y: p1.y }, { x: midX, y: p2.y }, p2],
      labelAt: { x: (p1.x + midX) / 2, y: p1.y - 7 },
    };
  }
  // Fallback: straight line (shared axis) or simple L.
  if (p1.x === p2.x || p1.y === p2.y) {
    return { pts: [p1, p2], labelAt: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 - 7 } };
  }
  return {
    pts: [p1, { x: p2.x, y: p1.y }, p2],
    labelAt: { x: (p1.x + p2.x) / 2, y: p1.y - 7 },
  };
}

export default function FlowDiagram({
  idPrefix: requestedPrefix,
  title,
  eyebrow,
  width,
  height,
  nodes,
  links,
}: {
  idPrefix: string;
  title: string;
  eyebrow?: string;
  width: number;
  height: number;
  nodes: FlowNode[];
  links: FlowLink[];
}) {
  const idPrefix = `${requestedPrefix}-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <figcaption className="mb-4 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2563EB]">{eyebrow}</p>
          ) : null}
          <h2 className="mt-1 text-base font-bold text-slate-900">{title}</h2>
        </div>
        <span className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500">
          decision logic
        </span>
      </figcaption>
      <div className="overflow-x-auto">
        <DiagramRoot idPrefix={idPrefix} width={width} height={height} label={title} className="min-w-[560px]">
          {/* Links first — lines sit behind nodes */}
          {links.map((link, i) => {
            const a = byId.get(link.from);
            const b = byId.get(link.to);
            if (!a || !b) return null;
            const fromSide = link.fromSide ?? 'bottom';
            const toSide = link.toSide ?? 'top';
            const { pts, labelAt } = linkGeometry(a.rect, b.rect, fromSide, toSide);
            const tone = link.tone ?? 'default';
            const markerId =
              tone === 'accent'
                ? `${idPrefix}-arrow-accent`
                : tone === 'link'
                  ? `${idPrefix}-arrow-link`
                  : `${idPrefix}-arrow`;
            return (
              <DiagramConnector
                key={`link-${i}`}
                pts={pts}
                tone={tone}
                dashed={link.dashed}
                markerId={markerId}
                label={link.label}
                labelAt={link.label ? labelAt : undefined}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const { rect, kind } = node;
            const cx = rect.x + rect.w / 2;
            const cy = rect.y + rect.h / 2;
            if (kind === 'merge') {
              return <circle key={node.id} cx={cx} cy={cy} r={4} fill={T.ink} />;
            }
            if (kind === 'decision') {
              return (
                <g key={node.id}>
                  <polygon
                    points={`${cx},${rect.y} ${rect.x + rect.w},${cy} ${cx},${rect.y + rect.h} ${rect.x},${cy}`}
                    fill={T.paper}
                    stroke={T.ruleSolid}
                    strokeWidth={1}
                  />
                  {node.titleLines.map((line, i) => (
                    <text
                      key={line + i}
                      x={cx}
                      y={cy - (node.titleLines.length > 1 ? 6 : 4) + i * 13}
                      textAnchor="middle"
                      className="font-sans text-[11px] font-semibold"
                      fill={T.ink}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
            }
            const isEnd = kind === 'end';
            const isEndMuted = kind === 'end-muted';
            const isStart = kind === 'start';
            return (
              <g key={node.id}>
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.w}
                  height={rect.h}
                  rx={isStart || isEnd || isEndMuted ? rect.h / 2 : 6}
                  fill={isEnd ? T.accentTint : T.paper2}
                  stroke={isEnd ? T.accent : isEndMuted ? T.ruleSolid : T.ruleSolid}
                  strokeWidth={isEnd ? 1.5 : 1}
                />
                {node.titleLines.map((line, i) => (
                  <text
                    key={line + i}
                    x={cx}
                    y={cy - (node.titleLines.length > 1 ? 6 : 4) + i * 13}
                    textAnchor="middle"
                    className="font-sans text-[12px] font-semibold"
                    fill={isEnd ? T.accent : T.ink}
                  >
                    {line}
                  </text>
                ))}
                {node.sub ? (
                  <text
                    x={cx}
                    y={rect.y + rect.h - 8}
                    textAnchor="middle"
                    className="font-mono text-[8px]"
                    fill={T.muted}
                  >
                    {node.sub}
                  </text>
                ) : null}
              </g>
            );
          })}
        </DiagramRoot>
      </div>
    </figure>
  );
}
