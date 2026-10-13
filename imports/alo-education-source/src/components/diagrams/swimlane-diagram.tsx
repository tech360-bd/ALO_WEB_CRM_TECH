'use client';

import React from 'react';
import { COLORS, RADIUS, DIAGRAM_CONSTRAINTS, type SwimlaneActor, type SwimlaneStep, type StepStatus } from '@/lib/design-system';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SwimlaneDiagramProps {
  /** Actors (lanes) */
  actors?: SwimlaneActor[];
  /** Process steps within lanes */
  steps?: SwimlaneStep[];
  /** Custom class */
  className?: string;
}

// ─── Default Multi-Actor Workflow ─────────────────────────────────────────────

const DEFAULT_ACTORS: SwimlaneActor[] = [
  { id: 'student', label: 'Student', color: COLORS.ink },
  { id: 'counselor', label: 'Counselor', color: COLORS.coral },
  { id: 'university', label: 'University', color: '#4a7c59' },
  { id: 'visa', label: 'Visa Office', color: '#7c6a4a' },
];

const DEFAULT_STEPS: SwimlaneStep[] = [
  { id: 's1', actorId: 'student', label: 'Submit Inquiry', order: 1, status: 'completed' },
  { id: 's2', actorId: 'counselor', label: 'Assess Profile', order: 2, status: 'completed' },
  { id: 's3', actorId: 'student', label: 'Upload Documents', order: 3, status: 'completed' },
  { id: 's4', actorId: 'counselor', label: 'Review & Advise', order: 4, status: 'completed' },
  { id: 's5', actorId: 'student', label: 'Submit Application', order: 5, status: 'current' },
  { id: 's6', actorId: 'university', label: 'Evaluate Application', order: 6, status: 'upcoming' },
  { id: 's7', actorId: 'university', label: 'Issue Offer', order: 7, status: 'upcoming' },
  { id: 's8', actorId: 'student', label: 'Accept Offer', order: 8, status: 'upcoming' },
  { id: 's9', actorId: 'student', label: 'Apply for Visa', order: 9, status: 'upcoming' },
  { id: 's10', actorId: 'visa', label: 'Process Visa', order: 10, status: 'upcoming' },
  { id: 's11', actorId: 'visa', label: 'Grant Visa', order: 11, status: 'upcoming' },
  { id: 's12', actorId: 'student', label: 'Confirm Enrolment', order: 12, status: 'upcoming' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function SwimlaneDiagram({
  actors,
  steps,
  className = '',
}: SwimlaneDiagramProps) {
  const actorData = actors ?? DEFAULT_ACTORS;
  const stepData = steps ?? DEFAULT_STEPS;

  const laneH = 80;
  const headerH = 40;
  const stepW = 120;
  const stepH = 44;
  const gapX = 16;
  const padding = 20;

  // Calculate positions
  const maxOrder = Math.max(...stepData.map(s => s.order));
  const totalCols = maxOrder;
  const svgW = padding * 2 + headerH + totalCols * (stepW + gapX);
  const svgH = headerH + actorData.length * laneH + padding;

  // Get step position
  const getStepPos = (step: SwimlaneStep) => {
    const actorIndex = actorData.findIndex(a => a.id === step.actorId);
    const x = padding + headerH + (step.order - 1) * (stepW + gapX) + stepW / 2;
    const y = headerH + actorIndex * laneH + laneH / 2;
    return { x, y, actorIndex };
  };

  // Build handoff arrows (between consecutive steps)
  const arrows = stepData.slice(0, -1).map((step, i) => {
    const from = getStepPos(step);
    const to = getStepPos(stepData[i + 1]);
    return { from, to };
  });

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full min-w-[800px]"
        style={{ minHeight: 300 }}
      >
        {/* Actor lane headers (left side) */}
        {actorData.map((actor, i) => {
          const y = headerH + i * laneH;
          return (
            <React.Fragment key={actor.id}>
              {/* Lane background (alternating) */}
              <rect
                x={0}
                y={y}
                width={svgW}
                height={laneH}
                fill={i % 2 === 0 ? COLORS.paper : COLORS.white}
              />
              {/* Lane divider */}
              <line
                x1={0}
                y1={y}
                x2={svgW}
                y2={y}
                stroke={COLORS.grayLight}
                strokeWidth={1}
              />
              {/* Actor label background */}
              <rect
                x={padding}
                y={y + (laneH - 32) / 2}
                width={headerH + 60}
                height={32}
                rx={RADIUS.sm}
                fill={actor.color || COLORS.ink}
                opacity={0.1}
              />
              {/* Actor label */}
              <text
                x={padding + (headerH + 60) / 2}
                y={y + laneH / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill={actor.color || COLORS.ink}
                fontSize={12}
                fontWeight={700}
                fontFamily="system-ui, sans-serif"
              >
                {actor.label}
              </text>
            </React.Fragment>
          );
        })}

        {/* Top border */}
        <line
          x1={0}
          y1={headerH}
          x2={svgW}
          y2={headerH}
          stroke={COLORS.grayLight}
          strokeWidth={1}
        />

        {/* Process steps */}
        {stepData.map((step) => {
          const { x, y, actorIndex } = getStepPos(step);
          const actor = actorData[actorIndex];
          const isCurrent = step.status === 'current';
          const isCompleted = step.status === 'completed';

          const fillColor = isCurrent
            ? COLORS.coral
            : isCompleted
              ? (actor.color || COLORS.ink)
              : COLORS.white;
          const strokeColor = isCurrent
            ? COLORS.coral
            : isCompleted
              ? (actor.color || COLORS.ink)
              : COLORS.grayLight;
          const textColor = (isCurrent || isCompleted) ? COLORS.white : COLORS.ink;

          return (
            <React.Fragment key={step.id}>
              <rect
                x={x - stepW / 2}
                y={y - stepH / 2}
                width={stepW}
                height={stepH}
                rx={RADIUS.md}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={DIAGRAM_CONSTRAINTS.strokeWidth}
                opacity={isCompleted ? 0.85 : 1}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={textColor}
                fontSize={10}
                fontWeight={600}
                fontFamily="system-ui, sans-serif"
              >
                {step.label.length > 16 ? step.label.slice(0, 15) + '…' : step.label}
              </text>
              {/* Current pulse */}
              {isCurrent && (
                <rect
                  x={x - stepW / 2 - 3}
                  y={y - stepH / 2 - 3}
                  width={stepW + 6}
                  height={stepH + 6}
                  rx={RADIUS.md + 2}
                  fill="none"
                  stroke={COLORS.coral}
                  strokeWidth={1.5}
                  opacity={0.3}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Handoff arrows */}
        {arrows.map((arrow, i) => {
          const { from, to } = arrow;
          const isCrossLane = from.actorIndex !== to.actorIndex;

          if (isCrossLane) {
            // Curved path for cross-lane handoff
            const midX = (from.x + to.x) / 2;
            const midY = from.y + (to.y - from.y) * 0.3;
            return (
              <path
                key={`arrow-${i}`}
                d={`M${from.x + stepW / 2},${from.y} C${midX},${midY} ${midX},${to.y} ${to.x - stepW / 2},${to.y}`}
                fill="none"
                stroke={COLORS.grayLight}
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
            );
          }

          // Straight arrow for same lane
          return (
            <React.Fragment key={`arrow-${i}`}>
              <line
                x1={from.x + stepW / 2}
                y1={from.y}
                x2={to.x - stepW / 2 - 4}
                y2={to.y}
                stroke={COLORS.grayLight}
                strokeWidth={1.5}
              />
              <polygon
                points={`${to.x - stepW / 2 - 4},${to.y - 4} ${to.x - stepW / 2 - 4},${to.y + 4} ${to.x - stepW / 2},${to.y}`}
                fill={COLORS.grayLight}
              />
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Convenience: Application Workflow Swimlane ──────────────────────────────

export function ApplicationWorkflowSwimlane({ className }: { className?: string }) {
  return <SwimlaneDiagram className={className} />;
}
