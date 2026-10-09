/**
 * User Journey Map — what a person does across stages and how it feels.
 *
 * Grammar from cathrynlavery/diagram-design → references/type-journey.md:
 * the sentiment curve is the load-bearing element. Ordinal named levels
 * (never numeric), hairline references, trough dot + incoming segment in
 * accent, pain markers only where sentiment drops (max 2), horizontal row
 * labels in the left margin (never rotated), one legend naming the trough.
 */

import React from 'react';
import { diagramTokens as T } from './tokens';
import { DiagramEyebrow, DiagramRoot, DiagramRule, type DiagramPoint } from './primitives';

export type JourneySentiment = 'HIGH' | 'MED-HIGH' | 'NEUTRAL' | 'MED-LOW' | 'LOW';

export type JourneyStage = {
  name: string;
  sentiment: JourneySentiment;
  /** 1–2 short lines: what the student does at this stage */
  actions: string[];
  /** mono: the surface the action happens on */
  touchpoints: string;
  /** Pain marker label — max 2 across the whole diagram */
  pain?: string;
};

const SENTIMENT_ORDER: JourneySentiment[] = ['LOW', 'MED-LOW', 'NEUTRAL', 'MED-HIGH', 'HIGH'];

const LEFT_MARGIN = 64;
const COL_W = 200;
const GUTTER = 24;
const HEADER_H = 44;
const SENTIMENT_TOP = 48;
const SENTIMENT_H = 150;
const ACTIONS_H = 64;
const TOUCH_H = 44;
const LEGEND_H = 44;
const RIGHT_PAD = 12;

function levelY(level: JourneySentiment): number {
  const idx = SENTIMENT_ORDER.indexOf(level); // 0 = LOW … 4 = HIGH
  // HIGH near the top of the band, LOW near the bottom.
  return SENTIMENT_TOP + SENTIMENT_H - 15 - idx * 30;
}

function colCenter(stageIndex: number): number {
  return LEFT_MARGIN + stageIndex * (COL_W + GUTTER) + COL_W / 2;
}

export default function JourneyMapDiagram({
  idPrefix,
  title,
  eyebrow,
  stages,
}: {
  idPrefix: string;
  title: string;
  eyebrow?: string;
  stages: JourneyStage[];
}) {
  const width = LEFT_MARGIN + stages.length * COL_W + (stages.length - 1) * GUTTER + RIGHT_PAD;
  const height = SENTIMENT_TOP + SENTIMENT_H + ACTIONS_H + TOUCH_H + LEGEND_H;

  // Trough = lowest sentiment stage (first one wins ties).
  let troughIndex = 0;
  stages.forEach((stage, i) => {
    if (SENTIMENT_ORDER.indexOf(stage.sentiment) < SENTIMENT_ORDER.indexOf(stages[troughIndex].sentiment)) {
      troughIndex = i;
    }
  });

  const dots: DiagramPoint[] = stages.map((stage, i) => ({
    x: colCenter(i),
    y: levelY(stage.sentiment),
  }));

  const curvePath = dots
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Trough highlight: the dot + its incoming segment render in accent.
  const troughIncoming =
    troughIndex > 0
      ? `M ${dots[troughIndex - 1].x} ${dots[troughIndex - 1].y} L ${dots[troughIndex].x} ${dots[troughIndex].y}`
      : null;

  const actionsTop = SENTIMENT_TOP + SENTIMENT_H;
  const touchTop = actionsTop + ACTIONS_H;
  const legendTop = touchTop + TOUCH_H;

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
          sentiment by stage
        </span>
      </figcaption>
      <div className="overflow-x-auto">
        <DiagramRoot idPrefix={idPrefix} width={width} height={height} label={title} className="min-w-[720px]">
          {/* Row separators span from the left margin edge to the last stage */}
          <DiagramRule from={{ x: 8, y: actionsTop }} to={{ x: width - RIGHT_PAD, y: actionsTop }} />
          <DiagramRule from={{ x: 8, y: touchTop }} to={{ x: width - RIGHT_PAD, y: touchTop }} />
          <DiagramRule from={{ x: 8, y: legendTop }} to={{ x: width - RIGHT_PAD, y: legendTop }} />

          {/* Sentiment reference hairlines + level labels (left margin, horizontal) */}
          {(['HIGH', 'NEUTRAL', 'LOW'] as const).map((level) => (
            <g key={`level-${level}`}>
              <DiagramRule
                from={{ x: LEFT_MARGIN, y: levelY(level) }}
                to={{ x: width - RIGHT_PAD, y: levelY(level) }}
              />
              <text
                x={LEFT_MARGIN - 8}
                y={levelY(level) + 3}
                textAnchor="end"
                className="font-mono text-[8px] uppercase tracking-[0.12em]"
                fill={T.soft}
              >
                {level}
              </text>
            </g>
          ))}

          {/* Stage headers */}
          {stages.map((stage, i) => (
            <g key={`stage-${i}`}>
              <DiagramEyebrow at={{ x: colCenter(i), y: 14 }} anchor="middle">
                Stage {i + 1}
              </DiagramEyebrow>
              <text
                x={colCenter(i)}
                y={32}
                textAnchor="middle"
                className="font-sans text-[12px] font-semibold"
                fill={i === troughIndex ? T.accent : T.ink}
              >
                {stage.name}
              </text>
            </g>
          ))}

          {/* Sentiment curve (a data curve — exempt from connector rules) */}
          <path d={curvePath} fill="none" stroke={T.muted} strokeWidth={1.5} />
          {troughIncoming ? (
            <path d={troughIncoming} fill="none" stroke={T.accent} strokeWidth={1.75} />
          ) : null}
          {dots.map((dot, i) => (
            <circle
              key={`dot-${i}`}
              cx={dot.x}
              cy={dot.y}
              r={i === troughIndex ? 5 : 4}
              fill={i === troughIndex ? T.accent : T.paper}
              stroke={i === troughIndex ? T.accent : T.muted}
              strokeWidth={1.25}
            />
          ))}

          {/* Row labels — left margin, never rotated */}
          <DiagramEyebrow at={{ x: 8, y: actionsTop + 18 }}>Actions</DiagramEyebrow>
          <DiagramEyebrow at={{ x: 8, y: touchTop + 18 }}>Touchpoints</DiagramEyebrow>

          {/* Content rows */}
          {stages.map((stage, i) => (
            <g key={`row-${i}`}>
              {stage.actions.map((action, j) => (
                <text
                  key={action + j}
                  x={colCenter(i)}
                  y={actionsTop + 26 + j * 15}
                  textAnchor="middle"
                  className="font-sans text-[11px]"
                  fill={T.ink}
                >
                  {action}
                </text>
              ))}
              {/* Pain marker: dashed accent tag, only where sentiment drops */}
              {stage.pain ? (
                <g>
                  <rect
                    x={colCenter(i) - 62}
                    y={actionsTop + 46}
                    width={124}
                    height={16}
                    rx={2}
                    fill={T.accentTint}
                    stroke={T.accent}
                    strokeOpacity={0.5}
                    strokeWidth={1}
                    strokeDasharray="3,3"
                  />
                  <text
                    x={colCenter(i)}
                    y={actionsTop + 57}
                    textAnchor="middle"
                    className="font-mono text-[8px] uppercase tracking-[0.08em]"
                    fill={T.accent}
                  >
                    {stage.pain}
                  </text>
                </g>
              ) : null}
              <text
                x={colCenter(i)}
                y={touchTop + 26}
                textAnchor="middle"
                className="font-mono text-[9px]"
                fill={T.muted}
              >
                {stage.touchpoints}
              </text>
            </g>
          ))}

          {/* Legend — the trough key is not optional */}
          <DiagramEyebrow at={{ x: 8, y: legendTop + 26 }}>Legend</DiagramEyebrow>
          <line
            x1={64}
            y1={legendTop + 22}
            x2={96}
            y2={legendTop + 22}
            stroke={T.muted}
            strokeWidth={1.5}
          />
          <circle cx={80} cy={legendTop + 22} r={4} fill={T.paper} stroke={T.muted} strokeWidth={1.25} />
          <text x={104} y={legendTop + 25} className="font-mono text-[8px]" fill={T.muted}>
            sentiment
          </text>
          <circle cx={190} cy={legendTop + 22} r={5} fill={T.accent} stroke={T.accent} strokeWidth={1.25} />
          <text x={202} y={legendTop + 25} className="font-mono text-[8px]" fill={T.muted}>
            trough — {stages[troughIndex]?.name}
          </text>
          <rect
            x={300}
            y={legendTop + 15}
            width={14}
            height={14}
            rx={2}
            fill={T.accentTint}
            stroke={T.accent}
            strokeOpacity={0.5}
            strokeDasharray="3,3"
          />
          <text x={320} y={legendTop + 25} className="font-mono text-[8px]" fill={T.muted}>
            pain point
          </text>
        </DiagramRoot>
      </div>
    </figure>
  );
}
