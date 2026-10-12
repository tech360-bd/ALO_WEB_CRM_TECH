/**
 * Process diagram — sequential multi-actor process ("who does what").
 *
 * Layout grammar from cathrynlavery/diagram-design → references/type-process.md:
 * horizontal lanes (actors) × vertical step columns, explicit per-cell nodes,
 * orthogonal connectors, exactly ONE focal step header + ONE focal node.
 * Connectors leave/enter perpendicular to the edge they touch.
 */

import React from 'react';
import { diagramTokens as T } from './tokens';
import {
  DiagramConnector,
  DiagramEyebrow,
  DiagramNode,
  DiagramRect as _Rect,
  DiagramRoot,
  DiagramRule,
  type DiagramPoint,
  type DiagramRect,
  type ArrowTone,
} from './primitives';

export type ProcessLane = {
  /** 3-letter badge shown as a chip inside every node of the lane */
  key: string;
  /** 1–2 line lane label, uppercase mono */
  name: string[];
};

export type ProcessStep = {
  number: string;
  label: string;
  /** Exactly one step may be focal — header chip renders in accent */
  focal?: boolean;
};

export type ProcessNodeSpec = {
  lane: number;
  step: number;
  titleLines: string[];
  sub?: string;
  focal?: boolean;
  soft?: boolean;
};

export type ProcessArrow = {
  from: { lane: number; step: number };
  to: { lane: number; step: number };
  tone?: ArrowTone;
  dashed?: boolean;
  label?: string;
};

const LABEL_COL_W = 150;
const STEP_SLOT_W = 156;
const NODE_W = 140;
const NODE_H = 68;
const HEADER_H = 56;
const LANE_H = 92;
const RIGHT_PAD = 24;
const LEGEND_H = 40;

export function processDiagramSize(steps: number, lanes: number) {
  return {
    width: LABEL_COL_W + steps * STEP_SLOT_W + RIGHT_PAD,
    height: HEADER_H + lanes * LANE_H + LEGEND_H,
  };
}

function nodeRect(step: number, lane: number): DiagramRect {
  return {
    x: LABEL_COL_W + step * STEP_SLOT_W + (STEP_SLOT_W - NODE_W) / 2,
    y: HEADER_H + lane * LANE_H + 12,
    w: NODE_W,
    h: NODE_H,
  };
}

export default function ProcessDiagram({
  idPrefix: requestedPrefix,
  title,
  eyebrow,
  lanes,
  steps,
  nodes,
  arrows,
}: {
  idPrefix: string;
  title: string;
  eyebrow?: string;
  lanes: ProcessLane[];
  steps: ProcessStep[];
  nodes: ProcessNodeSpec[];
  arrows: ProcessArrow[];
}) {
  const idPrefix = `${requestedPrefix}-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { width, height } = processDiagramSize(steps.length, lanes.length);
  const rects = new Map<string, DiagramRect>();
  nodes.forEach((n) => rects.set(`${n.lane}:${n.step}`, nodeRect(n.step, n.lane)));

  const connectors = arrows.map((arrow, i) => {
    const a = rects.get(`${arrow.from.lane}:${arrow.from.step}`);
    const b = rects.get(`${arrow.to.lane}:${arrow.to.step}`);
    if (!a || !b) return null;
    let pts: DiagramPoint[];
    let labelAt: DiagramPoint | undefined;
    if (arrow.from.lane === arrow.to.lane) {
      // same lane, forward: straight horizontal, right edge → left edge
      const y = a.y + a.h / 2;
      pts = [
        { x: a.x + a.w, y },
        { x: b.x, y },
      ];
    } else if (arrow.from.step === arrow.to.step) {
      // same column: straight vertical. Downward when the target lane is
      // below, upward when it is above — exit/enter perpendicular always.
      const x = a.x + a.w / 2;
      pts =
        arrow.to.lane > arrow.from.lane
          ? [
              { x, y: a.y + a.h },
              { x, y: b.y },
            ]
          : [
              { x, y: a.y },
              { x, y: b.y + b.h },
            ];
    } else if (arrow.to.step > arrow.from.step) {
      // forward + lane change: Z-elbow, exit right → mid corridor → enter left
      const y1 = a.y + a.h / 2;
      const y2 = b.y + b.h / 2;
      const midX = (a.x + a.w + b.x) / 2;
      pts = [
        { x: a.x + a.w, y: y1 },
        { x: midX, y: y1 },
        { x: midX, y: y2 },
        { x: b.x, y: y2 },
      ];
      labelAt = { x: midX, y: (y1 + y2) / 2 };
    } else {
      return null; // backward arrows are not used in ALO compositions
    }
    const tone = arrow.tone ?? 'default';
    const markerId =
      tone === 'accent'
        ? `${idPrefix}-arrow-accent`
        : tone === 'link'
          ? `${idPrefix}-arrow-link`
          : `${idPrefix}-arrow`;
    return (
      <DiagramConnector
        key={`arrow-${i}`}
        pts={pts}
        tone={tone}
        dashed={arrow.dashed}
        markerId={markerId}
        label={arrow.label}
        labelAt={labelAt}
      />
    );
  });

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
          who does what
        </span>
      </figcaption>
      <div className="overflow-x-auto">
        <DiagramRoot idPrefix={idPrefix} width={width} height={height} label={title} className="min-w-[720px]">
          {/* Lane separators + label column divider */}
          {lanes.map((_, laneIndex) => (
            <DiagramRule
              key={`lane-rule-${laneIndex}`}
              from={{ x: 0, y: HEADER_H + laneIndex * LANE_H }}
              to={{ x: width - RIGHT_PAD, y: HEADER_H + laneIndex * LANE_H }}
            />
          ))}
          <DiagramRule
            from={{ x: LABEL_COL_W - 12, y: 0 }}
            to={{ x: LABEL_COL_W - 12, y: HEADER_H + lanes.length * LANE_H }}
            solid
          />
          <DiagramRule
            from={{ x: 0, y: HEADER_H + lanes.length * LANE_H }}
            to={{ x: width - RIGHT_PAD, y: HEADER_H + lanes.length * LANE_H }}
            solid
          />

          {/* Connectors render before nodes (z-order: lines behind boxes) */}
          {connectors}

          {/* Lane labels */}
          {lanes.map((lane, laneIndex) => {
            const y = HEADER_H + laneIndex * LANE_H + LANE_H / 2;
            return (
              <g key={`lane-${laneIndex}`}>
                {lane.name.map((line, i) => (
                  <text
                    key={line + i}
                    x={12}
                    y={y - (lane.name.length > 1 ? 6 : 0) + i * 11}
                    className="font-mono text-[8px] font-medium uppercase tracking-[0.14em]"
                    fill={T.ink}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* Step headers */}
          {steps.map((step, stepIndex) => {
            const cx = LABEL_COL_W + stepIndex * STEP_SLOT_W + STEP_SLOT_W / 2;
            return (
              <g key={`step-${stepIndex}`}>
                <circle
                  cx={cx - 34}
                  cy={22}
                  r={10}
                  fill={step.focal ? T.accent : T.paper2}
                  stroke={step.focal ? T.accent : T.ruleSolid}
                  strokeWidth={1}
                />
                <text
                  x={cx - 34}
                  y={25.5}
                  textAnchor="middle"
                  className="font-mono text-[9px] font-semibold"
                  fill={step.focal ? '#FFFFFF' : T.muted}
                >
                  {step.number}
                </text>
                <text
                  x={cx - 18}
                  y={25.5}
                  className="font-sans text-[12px] font-semibold"
                  fill={step.focal ? T.accent : T.ink}
                >
                  {step.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const rect = nodeRect(node.step, node.lane);
            const lane = lanes[node.lane];
            return (
              <DiagramNode
                key={`node-${node.lane}-${node.step}`}
                rect={rect}
                nameLines={node.titleLines}
                sub={node.sub}
                chip={lane?.key}
                tone={node.focal ? 'focal' : node.soft ? 'soft' : 'default'}
                accentName={node.focal}
              />
            );
          })}

          {/* Legend */}
          <DiagramRule
            from={{ x: 0, y: height - LEGEND_H }}
            to={{ x: width - RIGHT_PAD, y: height - LEGEND_H }}
          />
          <DiagramEyebrow at={{ x: 12, y: height - 15 }}>Legend</DiagramEyebrow>
          <line
            x1={70}
            y1={height - 19}
            x2={98}
            y2={height - 19}
            stroke={T.muted}
            strokeWidth={1.25}
            markerEnd={`url(#${idPrefix}-arrow)`}
          />
          <text x={104} y={height - 15} className="font-mono text-[8px]" fill={T.muted}>
            handoff
          </text>
          <rect
            x={160}
            y={height - 27}
            width={14}
            height={14}
            rx={3}
            fill={T.accentTint}
            stroke={T.accent}
            strokeWidth={1.25}
          />
          <text x={180} y={height - 15} className="font-mono text-[8px]" fill={T.muted}>
            focal step
          </text>
        </DiagramRoot>
      </div>
    </figure>
  );
}
