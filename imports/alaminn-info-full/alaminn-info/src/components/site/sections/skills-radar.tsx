"use client";

import { motion } from "framer-motion";
import { useState } from "react";

/**
 * SkillsRadar — a custom SVG radar chart visualizing Al Aminn's core
 * expertise areas. Pure SVG + framer-motion, no external chart dependency.
 *
 * The values are self-declared competency levels (0–100), not fabricated
 * performance metrics. They reflect depth of operational experience, not
 * quantified outcomes.
 */

type Skill = {
  label: string;
  value: number; // 0–100, self-declared depth of experience
  description: string;
};

const SKILLS: Skill[] = [
  { label: "Operations", value: 92, description: "Operating systems, stage gates, accountability, reporting cadences." },
  { label: "Sales Strategy", value: 88, description: "Pipeline architecture, qualification, SLAs, conversion workflows." },
  { label: "Education Ops", value: 85, description: "Student journeys, counselling, admissions, compliance workflows." },
  { label: "Partnerships", value: 80, description: "University & institutional collaboration, due-diligence, approval stages." },
  { label: "AI Automation", value: 86, description: "Governed AI workflows, approval routing, sensitivity tagging, audit." },
  { label: "CRM & Digital", value: 84, description: "Relationship infrastructure, source attribution, digital transformation." },
];

const SIZE = 320;
const CENTER = SIZE / 2;
const MAX_RADIUS = 120;
const RINGS = [0.2, 0.4, 0.6, 0.8, 1.0]; // 5 concentric rings

function polarToCartesian(angle: number, radius: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

function axisPoint(index: number, total: number, valueFraction: number) {
  const angle = (360 / total) * index;
  return polarToCartesian(angle, MAX_RADIUS * valueFraction);
}

export function SkillsRadar() {
  const [hovered, setHovered] = useState<number | null>(null);

  // Build the polygon points for the data shape
  const dataPoints = SKILLS.map((s, i) => {
    const p = axisPoint(i, SKILLS.length, s.value / 100);
    return `${p.x},${p.y}`;
  }).join(" ");

  // Build grid ring polygons
  const rings = RINGS.map((ring) => {
    const pts = SKILLS.map((_, i) => {
      const p = axisPoint(i, SKILLS.length, ring);
      return `${p.x},${p.y}`;
    }).join(" ");
    return pts;
  });

  // Axis lines
  const axes = SKILLS.map((_, i) => {
    const p = axisPoint(i, SKILLS.length, 1.0);
    return { x1: CENTER, y1: CENTER, x2: p.x, y2: p.y };
  });

  return (
    <div className="rounded-2xl border border-ink-200 bg-gradient-to-br from-white to-blue-50/30 p-5 shadow-soft sm:p-6">
      <div className="mb-1 flex items-center justify-between">
        <div className="eyebrow text-blue-600">Expertise radar</div>
        <span className="text-[10px] font-medium text-ink-400">
          Self-declared depth · 0–100
        </span>
      </div>
      <p className="mb-4 text-[11px] text-ink-500">
        Hover an axis to see the focus area. Values reflect operational experience depth, not quantified outcomes.
      </p>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        {/* SVG radar chart */}
        <div className="relative shrink-0">
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="max-w-full"
            role="img"
            aria-label="Expertise radar chart showing six core skill areas"
          >
            <defs>
              <linearGradient id="radar-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F26113" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0B63CE" stopOpacity="0.35" />
              </linearGradient>
              <linearGradient id="radar-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F26113" />
                <stop offset="100%" stopColor="#0B63CE" />
              </linearGradient>
              <filter id="radar-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background rings */}
            {rings.map((pts, i) => (
              <polygon
                key={`ring-${i}`}
                points={pts}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth={1}
                strokeDasharray={i === rings.length - 1 ? "0" : "2,3"}
              />
            ))}

            {/* Axis lines */}
            {axes.map((axis, i) => (
              <line
                key={`axis-${i}`}
                x1={axis.x1}
                y1={axis.y1}
                x2={axis.x2}
                y2={axis.y2}
                stroke={hovered === i ? "#F26113" : "#E5E7EB"}
                strokeWidth={hovered === i ? 1.5 : 1}
                className="transition-colors duration-200"
              />
            ))}

            {/* Data polygon */}
            <motion.polygon
              points={dataPoints}
              fill="url(#radar-fill)"
              stroke="url(#radar-stroke)"
              strokeWidth={2}
              filter="url(#radar-glow)"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
            />

            {/* Data points */}
            {SKILLS.map((s, i) => {
              const p = axisPoint(i, SKILLS.length, s.value / 100);
              return (
                <motion.circle
                  key={`pt-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={hovered === i ? 6 : 4}
                  fill="#fff"
                  stroke={i % 2 === 0 ? "#F26113" : "#0B63CE"}
                  strokeWidth={2}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.05, type: "spring", stiffness: 200 }}
                />
              );
            })}

            {/* Axis labels */}
            {SKILLS.map((s, i) => {
              const p = axisPoint(i, SKILLS.length, 1.18);
              const isActive = hovered === i;
              return (
                <text
                  key={`label-${i}`}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`cursor-pointer select-none text-[10px] font-bold transition-colors duration-200 ${
                    isActive ? "fill-orange-600" : "fill-ink-600"
                  }`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {s.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Detail panel */}
        <div className="min-w-0 flex-1">
          {hovered !== null ? (
            <motion.div
              key={hovered}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-orange-200 bg-orange-50/40 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold text-ink-900">
                  {SKILLS[hovered].label}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {SKILLS[hovered].value}/100
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-600">
                {SKILLS[hovered].description}
              </p>
              {/* Mini progress bar */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${SKILLS[hovered].value}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full rounded-full grad-momentum"
                />
              </div>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Focus areas
              </div>
              {SKILLS.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="group flex w-full items-center justify-between rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-ink-200 hover:bg-ink-50/60"
                >
                  <span className="text-xs font-semibold text-ink-700 group-hover:text-ink-900">
                    {s.label}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-1 w-16 overflow-hidden rounded-full bg-ink-100">
                      <span
                        className="block h-full rounded-full grad-momentum"
                        style={{ width: `${s.value}%` }}
                      />
                    </span>
                    <span className="text-[10px] font-bold tabular text-ink-500">
                      {s.value}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-[10px] text-ink-400">
        No fabricated metrics · self-declared experience depth only · evidence available on request.
      </p>
    </div>
  );
}
