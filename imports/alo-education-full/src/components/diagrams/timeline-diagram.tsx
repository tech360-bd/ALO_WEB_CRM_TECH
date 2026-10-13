'use client';

import React from 'react';
import { COLORS, RADIUS, type TimelineEvent, type StepStatus } from '@/lib/design-system';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TimelineDiagramProps {
  /** Timeline events */
  events?: TimelineEvent[];
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Custom class */
  className?: string;
}

// ─── Default Student Journey Timeline ────────────────────────────────────────

const DEFAULT_EVENTS: TimelineEvent[] = [
  { id: '1', date: 'Jan 2025', title: 'Initial Inquiry', description: 'Contact ALO Education and express interest in studying abroad', status: 'completed' },
  { id: '2', date: 'Feb 2025', title: 'Registration & Profile', description: 'Complete your student profile with academic and personal details', status: 'completed' },
  { id: '3', date: 'Mar 2025', title: 'Document Preparation', description: 'Gather and upload transcripts, test scores, and recommendations', status: 'completed' },
  { id: '4', date: 'Apr 2025', title: 'University Applications', description: 'Submit applications to shortlisted universities with counselor guidance', status: 'current' },
  { id: '5', date: 'Jun 2025', title: 'Offer Decision', description: 'Receive and evaluate admission offers from universities', status: 'upcoming' },
  { id: '6', date: 'Jul 2025', title: 'Visa Application', description: 'Apply for student visa with document support from ALO', status: 'upcoming' },
  { id: '7', date: 'Sep 2025', title: 'Pre-Departure & Enrolment', description: 'Complete enrolment, attend orientation, and prepare for departure', status: 'upcoming' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusColors(status: StepStatus) {
  switch (status) {
    case 'completed':
      return { dot: COLORS.ink, line: COLORS.ink, text: COLORS.ink, label: COLORS.ink, opacity: 1 };
    case 'current':
      return { dot: COLORS.coral, line: COLORS.coral, text: COLORS.coral, label: COLORS.coral, opacity: 1 };
    case 'upcoming':
      return { dot: COLORS.grayLight, line: COLORS.grayLight, text: COLORS.gray, label: COLORS.gray, opacity: 0.7 };
    case 'error':
      return { dot: COLORS.error, line: COLORS.error, text: COLORS.error, label: COLORS.error, opacity: 1 };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TimelineDiagram({
  events,
  direction = 'horizontal',
  className = '',
}: TimelineDiagramProps) {
  const data = events ?? DEFAULT_EVENTS;

  if (direction === 'vertical') {
    return (
      <div className={`w-full ${className}`}>
        <div className="relative pl-8">
          {/* Vertical line */}
          <div
            className="absolute left-3 top-2 bottom-2 w-0.5"
            style={{ backgroundColor: COLORS.grayLight }}
          />
          {data.map((event, i) => {
            const colors = getStatusColors(event.status);
            const isLast = i === data.length - 1;

            return (
              <div key={event.id} className={`relative pb-8 ${isLast ? 'pb-0' : ''}`}>
                {/* Dot on the line */}
                <div
                  className="absolute -left-5 top-1 w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: event.status === 'current' ? colors.dot : COLORS.white,
                    borderColor: colors.dot,
                  }}
                />
                {/* Content */}
                <div style={{ opacity: colors.opacity }}>
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: colors.label, letterSpacing: '0.08em' }}
                  >
                    {event.date}
                  </span>
                  <h4
                    className="text-base font-semibold mt-1"
                    style={{ color: colors.text }}
                  >
                    {event.title}
                  </h4>
                  {event.description && (
                    <p
                      className="text-sm mt-1"
                      style={{ color: COLORS.gray }}
                    >
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Horizontal layout
  const nodeW = 160;
  const gap = 40;
  const padding = 32;
  const svgW = data.length * (nodeW + gap) - gap + padding * 2;
  const lineY = 60;
  const dotR = 8;

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <svg
        viewBox={`0 0 ${svgW} 160`}
        className="w-full min-w-[700px]"
        style={{ minHeight: 160 }}
      >
        {/* Horizontal line */}
        <line
          x1={padding}
          y1={lineY}
          x2={svgW - padding}
          y2={lineY}
          stroke={COLORS.grayLight}
          strokeWidth={2}
        />

        {data.map((event, i) => {
          const cx = padding + i * (nodeW + gap) + nodeW / 2;
          const colors = getStatusColors(event.status);

          return (
            <React.Fragment key={event.id}>
              {/* Connector segment (colored for completed) */}
              {i > 0 && event.status === 'completed' && (
                <line
                  x1={cx - nodeW - gap + nodeW / 2}
                  y1={lineY}
                  x2={cx}
                  y2={lineY}
                  stroke={COLORS.ink}
                  strokeWidth={2}
                />
              )}
              {/* Dot */}
              <circle
                cx={cx}
                cy={lineY}
                r={dotR}
                fill={event.status === 'current' ? colors.dot : COLORS.white}
                stroke={colors.dot}
                strokeWidth={2.5}
              />
              {/* Current step pulse ring */}
              {event.status === 'current' && (
                <circle
                  cx={cx}
                  cy={lineY}
                  r={dotR + 4}
                  fill="none"
                  stroke={colors.dot}
                  strokeWidth={1.5}
                  opacity={0.3}
                />
              )}
              {/* Date label above */}
              <text
                x={cx}
                y={lineY - dotR - 12}
                textAnchor="middle"
                dominantBaseline="central"
                fill={colors.label}
                fontSize={10}
                fontWeight={600}
                fontFamily="system-ui, sans-serif"
                letterSpacing="0.06em"
              >
                {event.date}
              </text>
              {/* Title below */}
              <text
                x={cx}
                y={lineY + dotR + 16}
                textAnchor="middle"
                dominantBaseline="central"
                fill={colors.text}
                fontSize={12}
                fontWeight={600}
                fontFamily="system-ui, sans-serif"
              >
                {event.title}
              </text>
              {/* Description below title */}
              {event.description && (
                <text
                  x={cx}
                  y={lineY + dotR + 32}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={COLORS.gray}
                  fontSize={9}
                  fontWeight={400}
                  fontFamily="system-ui, sans-serif"
                  opacity={0.8}
                >
                  {event.description.length > 30 ? event.description.slice(0, 30) + '…' : event.description}
                </text>
              )}
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Convenience: Student Journey Timeline ───────────────────────────────────

export function StudentJourneyTimeline({ className }: { className?: string }) {
  return <TimelineDiagram direction="horizontal" className={className} />;
}
