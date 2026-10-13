"use client";

import { useEffect, useRef, useState } from "react";

const NODES = [
  { id: "operations", label: "Operations", angle: -90 },
  { id: "sales", label: "Sales", angle: -45 },
  { id: "education", label: "Education", angle: 0 },
  { id: "partnerships", label: "Partnerships", angle: 45 },
  { id: "ai", label: "AI", angle: 90 },
  { id: "crm", label: "CRM", angle: 135 },
  { id: "marketing", label: "Marketing", angle: 180 },
  { id: "teams", label: "Teams", angle: 225 },
];

const STATUS = [
  { label: "active", color: "#FF751F" },
  { label: "linked", color: "#1677E8" },
  { label: "approved", color: "#12825C" },
  { label: "ready", color: "#3B91F5" },
];

export function OperatingConstellation() {
  const [mounted, setMounted] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // entrance animation triggers after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    setReducedMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // size of the svg viewport
  const SIZE = 560;
  const CENTER = SIZE / 2;
  const RADIUS = 200;

  const nodePos = (angle: number, r = RADIUS) => {
    const rad = (angle * Math.PI) / 180;
    return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
  };

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto aspect-square w-full max-w-[560px]"
      aria-label="The Operating Constellation — Al Aminn at the center of an integrated operating model"
    >
      {/* ambient glow */}
      <div
        className="absolute inset-0 rounded-full opacity-70 blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(11,99,206,0.35), transparent 60%)",
        }}
      />
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="relative h-full w-full"
        role="img"
      >
        <defs>
          <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1677E8" />
            <stop offset="60%" stopColor="#0B63CE" />
            <stop offset="100%" stopColor="#06162F" />
          </radialGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1677E8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#3B91F5" stopOpacity="0.2" />
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* outer rings */}
        {[RADIUS + 40, RADIUS + 18, RADIUS - 6].map((r, i) => (
          <circle
            key={i}
            cx={CENTER}
            cy={CENTER}
            r={r}
            fill="none"
            stroke="rgba(117,181,255,0.18)"
            strokeWidth="1"
            strokeDasharray={i === 2 ? "2 6" : undefined}
          />
        ))}

        {/* rotating dashed orbit */}
        <g
          style={
            reducedMotion
              ? undefined
              : { transformOrigin: `${CENTER}px ${CENTER}px`, animation: "orbit 40s linear infinite" }
          }
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS + 60}
            fill="none"
            stroke="rgba(11,99,206,0.25)"
            strokeWidth="1"
            strokeDasharray="3 12"
          />
        </g>

        {/* connection lines from center to each node */}
        {NODES.map((n) => {
          const p = nodePos(n.angle);
          const isActive = activeNode === n.id;
          return (
            <g key={`line-${n.id}`}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={p.x}
                y2={p.y}
                stroke="url(#lineGrad)"
                strokeWidth={isActive ? 2 : 1}
                className={reducedMotion ? "" : "signal-line"}
                style={isActive ? { stroke: "#FF751F" } : undefined}
              />
            </g>
          );
        })}

        {/* inter-node arcs (constellation feel) */}
        {NODES.map((n, i) => {
          const next = NODES[(i + 2) % NODES.length];
          const p1 = nodePos(n.angle);
          const p2 = nodePos(next.angle);
          return (
            <line
              key={`arc-${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="rgba(117,181,255,0.12)"
              strokeWidth="0.75"
            />
          );
        })}

        {/* center node — Al Aminn */}
        <g filter="url(#softGlow)">
          <circle
            cx={CENTER}
            cy={CENTER}
            r={mounted ? 44 : 0}
            fill="url(#centerGrad)"
            style={{ transition: "r 700ms cubic-bezier(0.16,1,0.3,1)" }}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={50}
            fill="none"
            stroke="rgba(255,117,31,0.5)"
            strokeWidth="1.5"
            className={reducedMotion ? "" : "node-active"}
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          />
        </g>
        <text
          x={CENTER}
          y={CENTER - 4}
          textAnchor="middle"
          className="font-display"
          fill="#FFFFFF"
          fontSize="13"
          fontWeight="700"
        >
          Al Aminn
        </text>
        <text
          x={CENTER}
          y={CENTER + 12}
          textAnchor="middle"
          fill="#B7D9FF"
          fontSize="8"
          letterSpacing="1.5"
        >
          CENTER
        </text>

        {/* surrounding nodes */}
        {NODES.map((n, i) => {
          const p = nodePos(n.angle);
          const isActive = activeNode === n.id;
          const delay = i * 0.08;
          return (
            <g
              key={n.id}
              onMouseEnter={() => setActiveNode(n.id)}
              onMouseLeave={() => setActiveNode(null)}
              style={{ cursor: "pointer" }}
            >
              {/* pulse ring */}
              {!reducedMotion && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 22 : 16}
                  fill="none"
                  stroke={isActive ? "#FF751F" : "#3B91F5"}
                  strokeOpacity="0.4"
                  strokeWidth="1"
                  className="node-active"
                  style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                />
              )}
              {/* node core */}
              <circle
                cx={p.x}
                cy={p.y}
                r={mounted ? (isActive ? 13 : 10) : 0}
                fill={isActive ? "#FF751F" : "#0B63CE"}
                stroke="#FFFFFF"
                strokeWidth="2"
                style={{
                  transition: "r 420ms cubic-bezier(0.16,1,0.3,1)",
                  transitionDelay: `${delay}s`,
                }}
              />
              {/* label */}
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="8"
                fontWeight="600"
              >
                {n.label.charAt(0)}
              </text>
              <text
                x={p.x}
                y={p.y + (Math.sin((n.angle * Math.PI) / 180) >= 0 ? 28 : -18)}
                textAnchor="middle"
                fill={isActive ? "#FF751F" : "#1D2939"}
                fontSize="11"
                fontWeight="600"
                className="font-display"
              >
                {n.label}
              </text>
            </g>
          );
        })}

        {/* scattered organizing dots (background texture) */}
        {Array.from({ length: 18 }).map((_, i) => {
          const a = (i * 137.5) % 360;
          const r = 90 + ((i * 13) % 80);
          const p = nodePos(a, r);
          return (
            <circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r="1.2"
              fill="rgba(117,181,255,0.4)"
            />
          );
        })}
      </svg>

      {/* status legend */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full glass border border-blue-900/10 px-4 py-1.5 shadow-soft">
        {STATUS.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-[10px] font-medium text-ink-600">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
