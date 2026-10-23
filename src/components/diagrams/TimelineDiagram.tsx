/**
 * Timeline — events positioned in time.
 *
 * Grammar from cathrynlavery/diagram-design → references/type-timeline.md:
 * horizontal hairline baseline, tick + mono date label per event, dots
 * alternate above/below to prevent collision, major milestones get an
 * accent dot (r=6) + bold label, and spacing is honest — positions are a
 * caller-supplied fraction of real elapsed time, never faked equal.
 */

import React from 'react';
import { diagramTokens as T } from './tokens';
import { DiagramEyebrow, DiagramRoot, DiagramRule, type DiagramPoint } from './primitives';

export type TimelineEvent = {
  /** Short name — sans 12px 600 */
  label: string;
  /** Mono date/period label under the tick */
  date: string;
  /** 0..1 fraction of the total elapsed time — spacing stays honest */
  position: number;
  /** Major milestone: accent dot r=6 + accent label */
  milestone?: boolean;
  /** Force label side; otherwise alternates above/below */
  side?: 'above' | 'below';
};

const WIDTH = 1100;
const BASELINE_Y = 120;
const PLOT_X0 = 48;
const PLOT_X1 = WIDTH - 48;
const HEIGHT = 230;

export default function TimelineDiagram({
  idPrefix: requestedPrefix,
  title,
  eyebrow,
  events,
  startLabel,
  endLabel,
}: {
  idPrefix: string;
  title: string;
  eyebrow?: string;
  events: TimelineEvent[];
  startLabel?: string;
  endLabel?: string;
}) {
  const idPrefix = `${requestedPrefix}-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <figure className="rounded-2xl border border-[var(--alo-border)] bg-white p-4 sm:p-6">
      <figcaption className="mb-4 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--alo-brand)]">{eyebrow}</p>
          ) : null}
          <h2 className="mt-1 text-base font-bold text-[var(--alo-text)]">{title}</h2>
        </div>
        <span className="rounded-full border border-[var(--alo-border)] px-2 py-1 text-[11px] font-semibold text-[var(--alo-text-muted)]">
          to scale
        </span>
      </figcaption>
      <div className="overflow-x-auto">
        <DiagramRoot idPrefix={idPrefix} width={WIDTH} height={HEIGHT} label={title} className="min-w-[720px]">
          {/* Baseline */}
          <DiagramRule
            from={{ x: PLOT_X0, y: BASELINE_Y }}
            to={{ x: PLOT_X1, y: BASELINE_Y }}
            solid
          />
          {startLabel ? (
            <text x={PLOT_X0} y={BASELINE_Y + 22} className="font-mono text-[11px] uppercase tracking-[0.1em]" fill={T.soft}>
              {startLabel}
            </text>
          ) : null}
          {endLabel ? (
            <text x={PLOT_X1} y={BASELINE_Y + 22} textAnchor="end" className="font-mono text-[11px] uppercase tracking-[0.1em]" fill={T.soft}>
              {endLabel}
            </text>
          ) : null}

          {events.map((event, i) => {
            const x = PLOT_X0 + Math.min(1, Math.max(0, event.position)) * (PLOT_X1 - PLOT_X0);
            const side = event.side ?? (i % 2 === 0 ? 'above' : 'below');
            const labelY = side === 'above' ? BASELINE_Y - 34 : BASELINE_Y + 52;
            const dropFrom: DiagramPoint = { x, y: side === 'above' ? BASELINE_Y - 8 : BASELINE_Y + 8 };
            const dropTo: DiagramPoint = { x, y: side === 'above' ? labelY + 8 : labelY - 10 };
            return (
              <g key={`event-${i}`}>
                {/* Tick */}
                <line
                  x1={x}
                  y1={BASELINE_Y - 4}
                  x2={x}
                  y2={BASELINE_Y + 4}
                  stroke={T.ruleSolid}
                  strokeWidth={1}
                />
                {/* Dot on the baseline */}
                <circle
                  cx={x}
                  cy={BASELINE_Y}
                  r={event.milestone ? 6 : 4}
                  fill={event.milestone ? T.accent : T.paper}
                  stroke={event.milestone ? T.accent : T.muted}
                  strokeWidth={1.25}
                />
                {/* Hairline drop to the label */}
                <DiagramRule from={dropFrom} to={dropTo} />
                {/* Label */}
                <text
                  x={x}
                  y={labelY}
                  textAnchor="middle"
                  className="font-sans text-[12px] font-semibold"
                  fill={event.milestone ? T.accent : T.ink}
                >
                  {event.label}
                </text>
                {/* Date under the tick — always directly under, mono */}
                <text
                  x={x}
                  y={BASELINE_Y + 18}
                  textAnchor="middle"
                  className="font-mono text-[11px] uppercase tracking-[0.08em]"
                  fill={T.muted}
                >
                  {event.date}
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <DiagramRule from={{ x: 8, y: HEIGHT - 30 }} to={{ x: WIDTH - 12, y: HEIGHT - 30 }} />
          <DiagramEyebrow at={{ x: 8, y: HEIGHT - 7 }}>Legend</DiagramEyebrow>
          <circle cx={70} cy={HEIGHT - 11} r={4} fill={T.paper} stroke={T.muted} strokeWidth={1.25} />
          <text x={80} y={HEIGHT - 7} className="font-mono text-[11px]" fill={T.muted}>
            stage
          </text>
          <circle cx={130} cy={HEIGHT - 11} r={6} fill={T.accent} stroke={T.accent} strokeWidth={1.25} />
          <text x={142} y={HEIGHT - 7} className="font-mono text-[11px]" fill={T.muted}>
            milestone
          </text>
        </DiagramRoot>
      </div>
    </figure>
  );
}
