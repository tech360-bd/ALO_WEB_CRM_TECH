'use client';

import React, { useMemo } from 'react';
import { COLORS, DIAGRAM_CONSTRAINTS, type FlowchartConfig, type DiagramNode, type StepStatus } from '@/lib/design-system';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FlowchartProps {
  /** Flowchart configuration */
  config?: FlowchartConfig;
  /** Override nodes directly */
  steps?: Array<{
    id: string;
    label: string;
    description?: string;
    status?: StepStatus;
  }>;
  /** Which step is currently active (by id) */
  currentStepId?: string;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Custom class */
  className?: string;
}

// ─── Default Student Application Flow ────────────────────────────────────────

const DEFAULT_STEPS = [
  { id: 'inquiry', label: 'Inquiry', description: 'Initial consultation' },
  { id: 'registration', label: 'Registration', description: 'Create your profile' },
  { id: 'documents', label: 'Document Upload', description: 'Submit required docs' },
  { id: 'application', label: 'Application', description: 'Apply to universities' },
  { id: 'offer', label: 'Offer', description: 'Receive admission offer' },
  { id: 'visa', label: 'Visa', description: 'Visa application & approval' },
  { id: 'enrolment', label: 'Enrolment', description: 'Confirm your place' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNodeColors(status?: StepStatus, isCurrent?: boolean) {
  if (isCurrent || status === 'current') {
    return {
      fill: COLORS.coral,
      stroke: COLORS.coral,
      text: COLORS.white,
      desc: COLORS.coralLight,
    };
  }
  if (status === 'completed') {
    return {
      fill: COLORS.ink,
      stroke: COLORS.ink,
      text: COLORS.white,
      desc: COLORS.grayGhost,
    };
  }
  return {
    fill: COLORS.white,
    stroke: COLORS.grayLight,
    text: COLORS.ink,
    desc: COLORS.gray,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Flowchart({
  config,
  steps,
  currentStepId = 'application',
  direction = 'horizontal',
  className = '',
}: FlowchartProps) {
  const nodeSteps = useMemo(() => {
    if (steps) return steps;
    if (config?.nodes) {
      return config.nodes.map(n => ({
        id: n.id,
        label: n.label,
        description: n.description,
        status: n.status,
      }));
    }
    return DEFAULT_STEPS;
  }, [config, steps]);

  const activeId = config?.currentStepId ?? currentStepId;
  const layoutDir = config?.direction ?? direction;

  // Assign statuses based on current step
  const currentIndex = nodeSteps.findIndex(s => s.id === activeId);
  const enrichedSteps = nodeSteps.map((step, i) => ({
    ...step,
    status: step.status ?? (i < currentIndex ? 'completed' as StepStatus : i === currentIndex ? 'current' as StepStatus : 'upcoming' as StepStatus),
  }));

  // Layout constants
  const nodeW = 140;
  const nodeH = 56;
  const gap = DIAGRAM_CONSTRAINTS.nodeGap;
  const padding = 32;

  if (layoutDir === 'vertical') {
    const totalW = nodeW + padding * 2;
    const totalH = enrichedSteps.length * (nodeH + gap) - gap + padding * 2;

    return (
      <div className={`w-full overflow-x-auto ${className}`}>
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          className="w-full max-w-md mx-auto"
          style={{ minHeight: 200 }}
        >
          {enrichedSteps.map((step, i) => {
            const x = padding;
            const y = padding + i * (nodeH + gap);
            const colors = getNodeColors(step.status, step.id === activeId);
            const isLast = i === enrichedSteps.length - 1;

            return (
              <React.Fragment key={step.id}>
                {/* Node rectangle */}
                <rect
                  x={x}
                  y={y}
                  width={nodeW}
                  height={nodeH}
                  rx={DIAGRAM_CONSTRAINTS.minNodeHeight / 2}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={DIAGRAM_CONSTRAINTS.strokeWidth}
                />
                {/* Node label */}
                <text
                  x={x + nodeW / 2}
                  y={y + nodeH / 2 - (step.description ? 4 : 0)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={colors.text}
                  fontSize={14}
                  fontWeight={600}
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {step.label}
                </text>
                {/* Description */}
                {step.description && (
                  <text
                    x={x + nodeW / 2}
                    y={y + nodeH / 2 + 12}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={colors.desc || colors.text}
                    fontSize={10}
                    fontWeight={400}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    opacity={0.8}
                  >
                    {step.description}
                  </text>
                )}
                {/* Connector arrow */}
                {!isLast && (
                  <>
                    <line
                      x1={x + nodeW / 2}
                      y1={y + nodeH}
                      x2={x + nodeW / 2}
                      y2={y + nodeH + gap}
                      stroke={COLORS.grayLight}
                      strokeWidth={DIAGRAM_CONSTRAINTS.strokeWidth}
                    />
                    <polygon
                      points={`${x + nodeW / 2 - 5},${y + nodeH + gap - 6} ${x + nodeW / 2 + 5},${y + nodeH + gap - 6} ${x + nodeW / 2},${y + nodeH + gap}`}
                      fill={COLORS.grayLight}
                    />
                  </>
                )}
                {/* Current step indicator */}
                {step.status === 'current' && (
                  <circle
                    cx={x - 12}
                    cy={y + nodeH / 2}
                    r={5}
                    fill={COLORS.coral}
                  />
                )}
              </React.Fragment>
            );
          })}
        </svg>
      </div>
    );
  }

  // Horizontal layout
  const totalW = enrichedSteps.length * (nodeW + gap) - gap + padding * 2;
  const totalH = nodeH + padding * 2;

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        className="w-full min-w-[600px]"
        style={{ minHeight: 120 }}
      >
        {enrichedSteps.map((step, i) => {
          const x = padding + i * (nodeW + gap);
          const y = padding;
          const colors = getNodeColors(step.status, step.id === activeId);
          const isLast = i === enrichedSteps.length - 1;

          return (
            <React.Fragment key={step.id}>
              {/* Node pill */}
              <rect
                x={x}
                y={y}
                width={nodeW}
                height={nodeH}
                rx={DIAGRAM_CONSTRAINTS.minNodeHeight / 2}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={DIAGRAM_CONSTRAINTS.strokeWidth}
              />
              {/* Label */}
              <text
                x={x + nodeW / 2}
                y={y + nodeH / 2 - (step.description ? 4 : 0)}
                textAnchor="middle"
                dominantBaseline="central"
                fill={colors.text}
                fontSize={13}
                fontWeight={600}
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {step.label}
              </text>
              {/* Description */}
              {step.description && (
                <text
                  x={x + nodeW / 2}
                  y={y + nodeH / 2 + 12}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={colors.desc || colors.text}
                  fontSize={9}
                  fontWeight={400}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  opacity={0.75}
                >
                  {step.description}
                </text>
              )}
              {/* Connector arrow */}
              {!isLast && (
                <>
                  <line
                    x1={x + nodeW}
                    y1={y + nodeH / 2}
                    x2={x + nodeW + gap}
                    y2={y + nodeH / 2}
                    stroke={COLORS.grayLight}
                    strokeWidth={DIAGRAM_CONSTRAINTS.strokeWidth}
                  />
                  <polygon
                    points={`${x + nodeW + gap - 6},${y + nodeH / 2 - 5} ${x + nodeW + gap - 6},${y + nodeH / 2 + 5} ${x + nodeW + gap},${y + nodeH / 2}`}
                    fill={COLORS.grayLight}
                  />
                </>
              )}
              {/* Current step indicator dot */}
              {step.status === 'current' && (
                <circle
                  cx={x + nodeW / 2}
                  cy={y - 8}
                  r={5}
                  fill={COLORS.coral}
                />
              )}
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Convenience: Student Application Flowchart ──────────────────────────────

export function StudentApplicationFlow({ currentStepId = 'application', className }: { currentStepId?: string; className?: string }) {
  return (
    <Flowchart
      currentStepId={currentStepId}
      direction="horizontal"
      className={className}
    />
  );
}
