/**
 * Conversion funnel — funnel orientation of the pyramid/funnel type.
 *
 * Grammar from cathrynlavery/diagram-design → references/type-pyramid.md:
 * 4–6 trapezoid layers, widths honest (proportional to real counts),
 * drop-off % as a side annotation, accent on ONE layer only (the
 * conversion layer), hairline dividers, no coral on the base layer.
 *
 * Values must be real — this project removed all invented metrics, so
 * callers pass live counts (see the marketing-automation page, which
 * fetches them from the CRM APIs).
 */

import React from 'react';
import { diagramTokens as T } from './tokens';
import { DiagramEyebrow, DiagramRoot, DiagramRule } from './primitives';

export type FunnelStage = {
  label: string;
  /** Real count at this stage — widths are proportional to these values */
  value: number;
  /** mono sublabel, e.g. "of enquiries" */
  sublabel?: string;
};

const LAYER_H = 64;
const LAYER_GAP = 6;
const HEADER_H = 40;
const LEGEND_H = 40;
const MAX_W = 380;

const CX = 250;
const LABEL_X = 560;

export default function FunnelDiagram({
  idPrefix: requestedPrefix,
  title,
  eyebrow,
  stages,
}: {
  idPrefix: string;
  title: string;
  eyebrow?: string;
  stages: FunnelStage[];
}) {
  const idPrefix = `${requestedPrefix}-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const invalid = stages.some((stage) => !Number.isFinite(stage.value) || stage.value < 0);
  const maximum = Math.max(0, ...stages.map((stage) => stage.value));
  if (!stages.length || invalid) {
    return <figure className="rounded-2xl border border-slate-200 bg-white p-6"><figcaption className="font-semibold">{title}</figcaption><p className="mt-2 text-sm text-slate-500">{invalid ? 'Counts unavailable: each stage needs a finite, non-negative value.' : 'No funnel counts available yet.'}</p></figure>;
  }
  // Scale to the largest stage, not the first. Zero really has zero width.
  const widths = stages.map((stage) => maximum > 0 ? MAX_W * (stage.value / maximum) : 0);
  // Last layer bottom matches its own top (honest rectangle, no fake taper).
  const bottomWidths = [...widths.slice(1), widths[widths.length - 1]];
  const bodyH = stages.length * LAYER_H + (stages.length - 1) * LAYER_GAP;
  const width = 680;
  const height = HEADER_H + bodyH + LEGEND_H;
  const focalIndex = stages.length - 1;

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
          supplied counts
        </span>
      </figcaption>
      <div className="overflow-x-auto">
        <DiagramRoot idPrefix={idPrefix} width={width} height={height} label={title} className="min-w-[560px]">
          {/* Left axis: drop-off direction */}
          <line
            x1={40}
            y1={HEADER_H + 8}
            x2={40}
            y2={HEADER_H + bodyH - 8}
            stroke={T.ruleSolid}
            strokeWidth={1}
            markerEnd={`url(#${idPrefix}-arrow)`}
          />
          <text
            x={28}
            y={HEADER_H + bodyH / 2}
            textAnchor="middle"
            className="font-mono text-[8px] uppercase tracking-[0.14em]"
            fill={T.soft}
          >
            drop-off
          </text>

          {stages.map((stage, i) => {
            const yTop = HEADER_H + i * (LAYER_H + LAYER_GAP);
            const yBot = yTop + LAYER_H;
            const wTop = widths[i];
            const wBot = bottomWidths[i];
            const isFocal = i === focalIndex;
            const points = [
              `${CX - wTop / 2},${yTop}`,
              `${CX + wTop / 2},${yTop}`,
              `${CX + wBot / 2},${yBot}`,
              `${CX - wBot / 2},${yBot}`,
            ].join(' ');
            const drop =
              i > 0 && stages[i - 1].value > 0
                ? Math.round((1 - stage.value / stages[i - 1].value) * 100)
                : null;
            const nameInside = wTop >= 150;
            const midY = (yTop + yBot) / 2;
            return (
              <g key={`layer-${i}`}>
                <polygon
                  points={points}
                  fill={isFocal ? T.accentTint : T.paper2}
                  stroke={isFocal ? T.accent : T.ruleSolid}
                  strokeWidth={isFocal ? 1.5 : 1}
                />
                {nameInside ? (
                  <g>
                    <text
                      x={CX}
                      y={midY - (stage.sublabel ? 6 : 4)}
                      textAnchor="middle"
                      className="font-sans text-[13px] font-semibold"
                      fill={isFocal ? T.accent : T.ink}
                    >
                      {stage.label}
                    </text>
                    {stage.sublabel ? (
                      <text
                        x={CX}
                        y={midY + 12}
                        textAnchor="middle"
                        className="font-mono text-[9px]"
                        fill={T.muted}
                      >
                        {stage.value.toLocaleString()} · {stage.sublabel}
                      </text>
                    ) : (
                      <text
                        x={CX}
                        y={midY + 12}
                        textAnchor="middle"
                        className="font-mono text-[9px]"
                        fill={T.muted}
                      >
                        {stage.value.toLocaleString()}
                      </text>
                    )}
                  </g>
                ) : (
                  <g>
                    {/* Narrow layer: label + value sit beside, joined by a hairline */}
                    <DiagramRule
                      from={{ x: CX + wTop / 2 + 4, y: midY }}
                      to={{ x: LABEL_X - 8, y: midY }}
                    />
                    <text
                      x={LABEL_X}
                      y={midY - 2}
                      className="font-sans text-[12px] font-semibold"
                      fill={isFocal ? T.accent : T.ink}
                    >
                      {stage.label}
                    </text>
                    <text
                      x={LABEL_X}
                      y={midY + 12}
                      className="font-mono text-[9px]"
                      fill={T.muted}
                    >
                      {stage.value.toLocaleString()}
                      {stage.sublabel ? ` · ${stage.sublabel}` : ''}
                    </text>
                  </g>
                )}
                {drop !== null && Number.isFinite(drop) ? (
                  <text
                    x={CX + wTop / 2 + 12}
                    y={yTop + 14}
                    className="font-mono text-[8px]"
                    fill={T.soft}
                  >
                    {drop >= 0 ? `−${drop}%` : `+${-drop}%`}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* Legend */}
          <DiagramRule
            from={{ x: 8, y: height - LEGEND_H }}
            to={{ x: width - 12, y: height - LEGEND_H }}
          />
          <DiagramEyebrow at={{ x: 8, y: height - 15 }}>Legend</DiagramEyebrow>
          <polygon
            points={`${CX - 40},${height - 27} ${CX - 26},${height - 27} ${CX - 26},${height - 15} ${CX - 40},${height - 15}`}
            fill={T.accentTint}
            stroke={T.accent}
            strokeWidth={1.25}
          />
          <text x={CX - 18} y={height - 15} className="font-mono text-[8px]" fill={T.muted}>
            conversion stage
          </text>
          <text x={CX + 60} y={height - 15} className="font-mono text-[8px]" fill={T.soft}>
            stage-edge widths proportional to counts · −% = drop-off vs previous stage
          </text>
        </DiagramRoot>
      </div>
      <table className="sr-only"><caption>{title} — stage counts</caption><thead><tr><th scope="col">Stage</th><th scope="col">Count</th></tr></thead><tbody>{stages.map((stage, i) => <tr key={i}><th scope="row">{stage.label}</th><td>{stage.value}</td></tr>)}</tbody></table>
    </figure>
  );
}
